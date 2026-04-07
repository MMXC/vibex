"""Tests for _blocked_analysis.py — F2 Blocked Root Cause Analysis.

Epic2 for coord-decision-report.

F2.1: 阻塞任务检测 (pending + incomplete deps)
F2.2: 根因分类 (agent_down vs dep_pending)
"""
import json
import os
import sys
import tempfile
from pathlib import Path

_script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, _script_dir)

from current_report._blocked_analysis import get_blocked_tasks


class TestF21BlockedTaskDetection:
    """F2.1: pending + incomplete deps → blocked"""

    def test_pending_no_deps_not_blocked(self, tmp_path):
        """Task pending with no dependsOn is NOT blocked (it's ready)."""
        proj = {
            "project": "test-project",
            "status": "active",
            "stages": {
                "task-1": {
                    "status": "pending",
                    "agent": "dev",
                    "dependsOn": [],
                    "task": "Ready task",
                }
            }
        }
        p = tmp_path / "test.json"
        p.write_text(json.dumps(proj))

        result = get_blocked_tasks(str(tmp_path))
        assert result["count"] == 0
        assert result["blocked"] == []

    def test_pending_with_incomplete_dep_is_blocked(self, tmp_path):
        """Task pending with an incomplete dependency is blocked."""
        proj = {
            "project": "test-project",
            "status": "active",
            "stages": {
                "dep-incomplete": {
                    "status": "in-progress",
                    "agent": "dev",
                    "dependsOn": [],
                },
                "blocked-task": {
                    "status": "pending",
                    "agent": "tester",
                    "dependsOn": ["dep-incomplete"],
                    "task": "Blocked task",
                },
            }
        }
        p = tmp_path / "test.json"
        p.write_text(json.dumps(proj))

        result = get_blocked_tasks(str(tmp_path))
        assert result["count"] == 1
        assert result["blocked"][0]["task_id"] == "blocked-task"
        assert "test-project/dep-incomplete" in result["blocked"][0]["blocked_by"]

    def test_pending_with_all_done_deps_not_blocked(self, tmp_path):
        """Task pending with all deps done is NOT blocked (it's ready)."""
        proj = {
            "project": "test-project",
            "status": "active",
            "stages": {
                "dep-done": {
                    "status": "done",
                    "agent": "dev",
                    "completedAt": "2026-03-30T10:00:00+00:00",
                    "dependsOn": [],
                },
                "ready-task": {
                    "status": "pending",
                    "agent": "tester",
                    "dependsOn": ["dep-done"],
                    "task": "Ready",
                },
            }
        }
        p = tmp_path / "test.json"
        p.write_text(json.dumps(proj))

        result = get_blocked_tasks(str(tmp_path))
        assert result["count"] == 0

    def test_done_task_not_blocked(self, tmp_path):
        """Task with status=done is not included."""
        proj = {
            "project": "test-project",
            "status": "active",
            "stages": {
                "done-task": {
                    "status": "done",
                    "agent": "dev",
                    "dependsOn": [],
                    "task": "Done",
                }
            }
        }
        p = tmp_path / "test.json"
        p.write_text(json.dumps(proj))

        result = get_blocked_tasks(str(tmp_path))
        assert result["count"] == 0

    def test_multiple_blocked_tasks(self, tmp_path):
        """Multiple blocked tasks all appear in result."""
        proj = {
            "project": "test-project",
            "status": "active",
            "stages": {
                "incomplete-a": {"status": "in-progress", "agent": "dev", "dependsOn": []},
                "incomplete-b": {"status": "pending", "agent": "dev", "dependsOn": []},
                "blocked-a": {
                    "status": "pending",
                    "agent": "tester",
                    "dependsOn": ["incomplete-a"],
                    "task": "A",
                },
                "blocked-b": {
                    "status": "pending",
                    "agent": "reviewer",
                    "dependsOn": ["incomplete-b"],
                    "task": "B",
                },
            }
        }
        p = tmp_path / "test.json"
        p.write_text(json.dumps(proj))

        result = get_blocked_tasks(str(tmp_path))
        assert result["count"] == 2
        task_ids = [t["task_id"] for t in result["blocked"]]
        assert "blocked-a" in task_ids
        assert "blocked-b" in task_ids


class TestF22RootCauseClassification:
    """F2.2 + F2.3: Root cause classification (agent_down vs dep_pending)"""

    def test_root_cause_is_first_incomplete_dep(self, tmp_path):
        """root_cause field is the first incomplete dependency."""
        proj = {
            "project": "test-project",
            "status": "active",
            "stages": {
                "incomplete-1": {"status": "pending", "agent": "dev", "dependsOn": []},
                "incomplete-2": {"status": "pending", "agent": "tester", "dependsOn": []},
                "blocked-task": {
                    "status": "pending",
                    "agent": "reviewer",
                    "dependsOn": ["incomplete-1", "incomplete-2"],
                    "task": "Blocked",
                },
            }
        }
        p = tmp_path / "test.json"
        p.write_text(json.dumps(proj))

        result = get_blocked_tasks(str(tmp_path))
        assert result["count"] == 1
        # root_cause is first non-done dep
        assert result["blocked"][0]["root_cause"] == "test-project/incomplete-1"
        assert result["blocked"][0]["blocked_by"] == ["test-project/incomplete-1", "test-project/incomplete-2"]

    def test_cross_project_dependency_blocked(self, tmp_path):
        """Cross-project dependency detection works."""
        proj1 = {
            "project": "project-a",
            "status": "active",
            "stages": {
                "done-stage": {"status": "done", "agent": "dev", "dependsOn": []},
            }
        }
        proj2 = {
            "project": "project-b",
            "status": "active",
            "stages": {
                "pending-stage": {
                    "status": "pending",
                    "agent": "tester",
                    "dependsOn": ["project-a/done-stage"],
                    "task": "Waiting on project-a",
                }
            }
        }
        (tmp_path / "a.json").write_text(json.dumps(proj1))
        (tmp_path / "b.json").write_text(json.dumps(proj2))

        result = get_blocked_tasks(str(tmp_path))
        # project-a/done-stage is done, so project-b/pending-stage should NOT be blocked
        assert result["count"] == 0

    def test_cross_project_dependency_blocked_when_not_done(self, tmp_path):
        """Cross-project dependency that is not done causes block."""
        proj1 = {
            "project": "project-a",
            "status": "active",
            "stages": {
                "incomplete": {"status": "in-progress", "agent": "dev", "dependsOn": []},
            }
        }
        proj2 = {
            "project": "project-b",
            "status": "active",
            "stages": {
                "blocked-stage": {
                    "status": "pending",
                    "agent": "tester",
                    "dependsOn": ["project-a/incomplete"],
                    "task": "Blocked by project-a",
                }
            }
        }
        (tmp_path / "a.json").write_text(json.dumps(proj1))
        (tmp_path / "b.json").write_text(json.dumps(proj2))

        result = get_blocked_tasks(str(tmp_path))
        assert result["count"] == 1
        assert result["blocked"][0]["root_cause"] == "project-a/incomplete"

    def test_agent_field_populated(self, tmp_path):
        """Agent field is correctly read from task info."""
        proj = {
            "project": "test-project",
            "status": "active",
            "stages": {
                "incomplete": {"status": "pending", "agent": "dev", "dependsOn": []},
                "blocked-task": {
                    "status": "pending",
                    "agent": "reviewer",
                    "dependsOn": ["incomplete"],
                    "task": "Test",
                },
            }
        }
        p = tmp_path / "test.json"
        p.write_text(json.dumps(proj))

        result = get_blocked_tasks(str(tmp_path))
        assert result["blocked"][0]["agent"] == "reviewer"

    def test_agent_unknown_when_missing(self, tmp_path):
        """Agent field defaults to 'unknown' when not set."""
        proj = {
            "project": "test-project",
            "status": "active",
            "stages": {
                "incomplete": {"status": "pending", "agent": "dev", "dependsOn": []},
                "blocked-task": {
                    "status": "pending",
                    "dependsOn": ["incomplete"],
                    "task": "No agent",
                },
            }
        }
        p = tmp_path / "test.json"
        p.write_text(json.dumps(proj))

        result = get_blocked_tasks(str(tmp_path))
        assert result["blocked"][0]["agent"] == "unknown"


class TestF22CompletedAtBug:
    """Regression: ensure completedAt (camelCase) is handled correctly."""

    def test_uses_completedAt_not_completed_at(self, tmp_path):
        """The code should read completedAt (camelCase) from team-tasks JSON.

        Bug: code used completed_at (snake_case) which doesn't exist.
        """
        import time
        now_ts = time.time()
        dep_time_iso = "2026-03-30T10:00:00+00:00"

        proj = {
            "project": "test-project",
            "status": "active",
            "stages": {
                "done-long-ago": {
                    "status": "done",
                    "completedAt": dep_time_iso,
                    "agent": "dev",
                    "dependsOn": [],
                },
                "blocked-task": {
                    "status": "pending",
                    "agent": "tester",
                    "dependsOn": ["done-long-ago"],
                    "task": "Blocked",
                },
            }
        }
        p = tmp_path / "test.json"
        p.write_text(json.dumps(proj))

        result = get_blocked_tasks(str(tmp_path))
        # done-long-ago is done, so blocked-task should NOT be blocked
        assert result["count"] == 0, f"Expected 0 blocked, got: {result}"
