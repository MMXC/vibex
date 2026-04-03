"""Tests for _ready_decision.py — F1 Ready Decision Engine.

F1.1 Ready 任务判定: pending + dependsOn 全部 done → ready
F1.2 等待时长计算: now - MAX(dependsOn.completedAt)
F1.3 执行者匹配: agent 字段读取
F1.4 优先级排序: P0/P1 优先 + 最长等待优先
"""
import json
import os
import sys
import tempfile
import time
from pathlib import Path

_script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, _script_dir)

from current_report._ready_decision import (
    get_ready_tasks,
    rank_ready_tasks,
    _extract_priority,
    _get_completed_at,
    _parse_timestamp,
)

TEAM_TASKS_DIR_ORIG = "/root/.openclaw/workspace-coord/team-tasks"


class TestF11ReadyTaskDetection:
    """F1.1: pending + dependsOn all done → ready"""

    def test_pending_without_deps_is_ready(self, tmp_path):
        """Task with no dependsOn and status=pending is ready."""
        proj = {
            "project": "test-project",
            "status": "active",
            "stages": {
                "task-1": {
                    "status": "pending",
                    "agent": "dev",
                    "dependsOn": [],
                    "task": "Do something",
                }
            }
        }
        p = tmp_path / "test-project.json"
        p.write_text(json.dumps(proj))

        result = get_ready_tasks(str(tmp_path))
        assert result["count"] == 1
        assert result["ready"][0]["task_id"] == "task-1"

    def test_pending_with_done_deps_is_ready(self, tmp_path):
        """Task pending with all dependsOn done is ready."""
        proj = {
            "project": "test-project",
            "status": "active",
            "stages": {
                "dep-task": {"status": "done", "agent": "dev", "dependsOn": []},
                "ready-task": {
                    "status": "pending",
                    "agent": "tester",
                    "dependsOn": ["dep-task"],
                    "task": "Ready task",
                },
            }
        }
        p = tmp_path / "test-project.json"
        p.write_text(json.dumps(proj))

        result = get_ready_tasks(str(tmp_path))
        assert result["count"] == 1
        assert result["ready"][0]["task_id"] == "ready-task"

    def test_pending_with_incomplete_deps_not_ready(self, tmp_path):
        """Task pending with some dependsOn not done is NOT ready."""
        proj = {
            "project": "test-project",
            "status": "active",
            "stages": {
                "incomplete-task": {
                    "status": "in-progress",
                    "agent": "dev",
                    "dependsOn": [],
                },
                "blocked-task": {
                    "status": "pending",
                    "agent": "tester",
                    "dependsOn": ["incomplete-task"],
                    "task": "Blocked",
                },
            }
        }
        p = tmp_path / "test-project.json"
        p.write_text(json.dumps(proj))

        result = get_ready_tasks(str(tmp_path))
        assert result["count"] == 0

    def test_done_task_not_ready(self, tmp_path):
        """Task with status=done is not included."""
        proj = {
            "project": "test-project",
            "status": "active",
            "stages": {
                "completed-task": {
                    "status": "done",
                    "agent": "dev",
                    "dependsOn": [],
                    "task": "Done",
                }
            }
        }
        p = tmp_path / "test-project.json"
        p.write_text(json.dumps(proj))

        result = get_ready_tasks(str(tmp_path))
        assert result["count"] == 0

    def test_multiple_ready_tasks_detected(self, tmp_path):
        """Multiple ready tasks all appear in result."""
        proj = {
            "project": "test-project",
            "status": "active",
            "stages": {
                "dep1": {"status": "done", "agent": "dev", "dependsOn": []},
                "task-a": {
                    "status": "pending",
                    "agent": "tester",
                    "dependsOn": ["dep1"],
                    "task": "Task A",
                },
                "task-b": {
                    "status": "pending",
                    "agent": "reviewer",
                    "dependsOn": ["dep1"],
                    "task": "Task B",
                },
            }
        }
        p = tmp_path / "test-project.json"
        p.write_text(json.dumps(proj))

        result = get_ready_tasks(str(tmp_path))
        assert result["count"] == 2
        task_ids = [t["task_id"] for t in result["ready"]]
        assert "task-a" in task_ids
        assert "task-b" in task_ids


class TestF12WaitDuration:
    """F1.2: wait_duration = now - MAX(dependsOn.completedAt)"""

    def test_wait_duration_computed(self, tmp_path):
        """wait_duration_seconds is populated."""
        now = time.time()
        dep_time = now - 3600  # 1 hour ago

        proj = {
            "project": "test-project",
            "status": "active",
            "stages": {
                "dep-task": {
                    "status": "done",
                    "completedAt": time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime(dep_time)),
                    "agent": "dev",
                    "dependsOn": [],
                },
                "ready-task": {
                    "status": "pending",
                    "agent": "tester",
                    "dependsOn": ["dep-task"],
                    "task": "Ready",
                },
            }
        }
        p = tmp_path / "test-project.json"
        p.write_text(json.dumps(proj))

        result = get_ready_tasks(str(tmp_path))
        assert result["count"] == 1
        wd = result["ready"][0]["wait_seconds"]
        # Should be approximately 3600 seconds (within 5 second tolerance)
        assert 3595 < wd < 3605

    def test_wait_duration_zero_when_no_deps(self, tmp_path):
        """Task with no dependsOn has wait_seconds = 0."""
        proj = {
            "project": "test-project",
            "status": "active",
            "stages": {
                "no-dep-task": {
                    "status": "pending",
                    "agent": "dev",
                    "dependsOn": [],
                    "task": "No deps",
                }
            }
        }
        p = tmp_path / "test-project.json"
        p.write_text(json.dumps(proj))

        result = get_ready_tasks(str(tmp_path))
        assert result["ready"][0]["wait_seconds"] == 0.0

    def test_wait_duration_uses_max_completed_at(self, tmp_path):
        """With multiple deps, uses MAX(completedAt) not MIN."""
        now = time.time()
        dep1_time = now - 7200  # 2 hours ago
        dep2_time = now - 3600  # 1 hour ago

        proj = {
            "project": "test-project",
            "status": "active",
            "stages": {
                "dep-old": {
                    "status": "done",
                    "completedAt": time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime(dep1_time)),
                    "agent": "dev",
                    "dependsOn": [],
                },
                "dep-new": {
                    "status": "done",
                    "completedAt": time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime(dep2_time)),
                    "agent": "dev",
                    "dependsOn": ["dep-old"],
                },
                "ready-task": {
                    "status": "pending",
                    "agent": "tester",
                    "dependsOn": ["dep-old", "dep-new"],
                    "task": "Ready",
                },
            }
        }
        p = tmp_path / "test-project.json"
        p.write_text(json.dumps(proj))

        result = get_ready_tasks(str(tmp_path))
        wd = result["ready"][0]["wait_seconds"]
        # Should be ~3600 (newest dep completed 1h ago), not 7200
        assert 3595 < wd < 3605


class TestF13AgentMatching:
    """F1.3: agent field is correctly read from task info."""

    def test_agent_field_populated(self, tmp_path):
        """agent field is correctly extracted."""
        proj = {
            "project": "test-project",
            "status": "active",
            "stages": {
                "task-1": {
                    "status": "pending",
                    "agent": "tester",
                    "dependsOn": [],
                    "task": "Tester task",
                }
            }
        }
        p = tmp_path / "test-project.json"
        p.write_text(json.dumps(proj))

        result = get_ready_tasks(str(tmp_path))
        assert result["ready"][0]["agent"] == "tester"

    def test_agent_unknown_when_missing(self, tmp_path):
        """agent field defaults to 'unknown' when not set."""
        proj = {
            "project": "test-project",
            "status": "active",
            "stages": {
                "task-1": {
                    "status": "pending",
                    "dependsOn": [],
                    "task": "No agent field",
                }
            }
        }
        p = tmp_path / "test-project.json"
        p.write_text(json.dumps(proj))

        result = get_ready_tasks(str(tmp_path))
        assert result["ready"][0]["agent"] == "unknown"

    def test_multiple_agents_detected(self, tmp_path):
        """Different agents appear correctly in ready list."""
        proj = {
            "project": "test-project",
            "status": "active",
            "stages": {
                "done1": {"status": "done", "agent": "dev", "dependsOn": []},
                "tester-task": {
                    "status": "pending",
                    "agent": "tester",
                    "dependsOn": ["done1"],
                    "task": "Test",
                },
                "done2": {"status": "done", "agent": "tester", "dependsOn": []},
                "reviewer-task": {
                    "status": "pending",
                    "agent": "reviewer",
                    "dependsOn": ["done2"],
                    "task": "Review",
                },
            }
        }
        p = tmp_path / "test-project.json"
        p.write_text(json.dumps(proj))

        result = get_ready_tasks(str(tmp_path))
        agents = [t["agent"] for t in result["ready"]]
        assert "tester" in agents
        assert "reviewer" in agents


class TestF14PrioritySorting:
    """F1.4: P0/P1 priority first, then longest wait."""

    def test_p0_before_p1_before_default(self, tmp_path):
        """Tasks sorted by priority_rank ascending."""
        now = time.time()

        def make_proj(name: str, priority: str):
            dep_time = now - 100
            return {
                "project": f"{name}-P{priority}",
                "status": "active",
                "stages": {
                    f"dep-{name}": {
                        "status": "done",
                        "completedAt": time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime(dep_time)),
                        "agent": "dev",
                        "dependsOn": [],
                    },
                    f"task-{name}": {
                        "status": "pending",
                        "agent": "tester",
                        "dependsOn": [f"dep-{name}"],
                        "task": f"Task {name}",
                    },
                }
            }

        for name, priority in [("b", "P1"), ("a", "P0"), ("c", "P2")]:
            p = tmp_path / f"{name}.json"
            p.write_text(json.dumps(make_proj(name, priority)))

        result = get_ready_tasks(str(tmp_path))
        task_ids = [t["task_id"] for t in result["ready"]]
        # P0 should come before P1 and P2
        p0_idx = task_ids.index("task-a")
        p1_idx = task_ids.index("task-b")
        p2_idx = task_ids.index("task-c")
        assert p0_idx < p1_idx < p2_idx

    def test_longer_wait_before_same_priority(self, tmp_path):
        """Within same priority, longer wait comes first."""
        now = time.time()

        def make_proj(name: str, hours_ago: float):
            dep_time = now - hours_ago * 3600
            return {
                "project": f"test-{name}",
                "status": "active",
                "stages": {
                    f"dep-{name}": {
                        "status": "done",
                        "completedAt": time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime(dep_time)),
                        "agent": "dev",
                        "dependsOn": [],
                    },
                    f"task-{name}": {
                        "status": "pending",
                        "agent": "tester",
                        "dependsOn": [f"dep-{name}"],
                        "task": f"Task {name}",
                    },
                }
            }

        p1 = tmp_path / "long-wait.json"
        p1.write_text(json.dumps(make_proj("long", 5.0)))  # 5 hours ago

        p2 = tmp_path / "short-wait.json"
        p2.write_text(json.dumps(make_proj("short", 1.0)))  # 1 hour ago

        result = get_ready_tasks(str(tmp_path))
        task_ids = [t["task_id"] for t in result["ready"]]
        # Longer wait should come first (within same default priority)
        assert task_ids.index("task-long") < task_ids.index("task-short")
        # Verify wait times
        long_wd = [t for t in result["ready"] if t["task_id"] == "task-long"][0]["wait_seconds"]
        short_wd = [t for t in result["ready"] if t["task_id"] == "task-short"][0]["wait_seconds"]
        assert long_wd > short_wd

    def test_priority_rank_in_output(self, tmp_path):
        """priority_rank field is included in ready task output."""
        proj = {
            "project": "P0-test",
            "status": "active",
            "stages": {
                "dep": {"status": "done", "agent": "dev", "dependsOn": []},
                "task": {
                    "status": "pending",
                    "agent": "tester",
                    "dependsOn": ["dep"],
                    "task": "Test",
                },
            }
        }
        p = tmp_path / "test.json"
        p.write_text(json.dumps(proj))

        result = get_ready_tasks(str(tmp_path))
        assert "priority_rank" in result["ready"][0]
