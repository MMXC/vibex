#!/usr/bin/env python3
"""test_topological_sort.py — Tests for topological sort utility."""

import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from topological_sort import (
    topological_sort,
    sort_tasks_by_status,
    get_ready_tasks_topological,
    detect_cycle,
)


class TestTopologicalSort:
    def test_empty(self):
        assert topological_sort({}) == []

    def test_single_node(self):
        tasks = {"a": {"dependsOn": []}}
        assert topological_sort(tasks) == ["a"]

    def test_linear_chain(self):
        tasks = {
            "a": {"dependsOn": []},
            "b": {"dependsOn": ["a"]},
            "c": {"dependsOn": ["b"]},
            "d": {"dependsOn": ["c"]},
        }
        order = topological_sort(tasks)
        assert order == ["a", "b", "c", "d"]
        # Verify order constraints
        for tid in ["b", "c", "d"]:
            idx = order.index(tid)
            deps = tasks[tid].get("dependsOn", [])
            for dep in deps:
                assert order.index(dep) < idx

    def test_parallel_tasks(self):
        """b and c both depend on a, d depends on both b and c."""
        tasks = {
            "a": {"dependsOn": []},
            "b": {"dependsOn": ["a"]},
            "c": {"dependsOn": ["a"]},
            "d": {"dependsOn": ["b", "c"]},
        }
        order = topological_sort(tasks)
        assert order[0] == "a"
        assert set(order[1:3]) == {"b", "c"}
        assert order[3] == "d"

    def test_complex_dag(self):
        """Real-world heartbeat pipeline: dev -> tester -> reviewer -> reviewer-push"""
        tasks = {
            "analyze-requirements": {"dependsOn": []},
            "create-prd": {"dependsOn": ["analyze-requirements"]},
            "design-architecture": {"dependsOn": ["create-prd"]},
            "dev-epic1": {"dependsOn": ["design-architecture"]},
            "tester-epic1": {"dependsOn": ["dev-epic1"]},
            "reviewer-epic1": {"dependsOn": ["tester-epic1"]},
            "reviewer-push-epic1": {"dependsOn": ["reviewer-epic1"]},
            "dev-epic2": {"dependsOn": ["design-architecture", "reviewer-push-epic1"]},
            "tester-epic2": {"dependsOn": ["dev-epic2"]},
        }
        order = topological_sort(tasks)
        # Verify all dependency constraints
        for tid, task in tasks.items():
            idx = order.index(tid)
            for dep in task.get("dependsOn", []):
                assert order.index(dep) < idx, f"{dep} must come before {tid}"

    def test_cycle_detection_simple(self):
        """a -> b -> a cycle"""
        tasks = {
            "a": {"dependsOn": ["b"]},
            "b": {"dependsOn": ["a"]},
        }
        assert topological_sort(tasks) is None

    def test_cycle_detection_long(self):
        """a -> b -> c -> d -> b (cycle back to b)"""
        tasks = {
            "a": {"dependsOn": []},
            "b": {"dependsOn": ["a"]},
            "c": {"dependsOn": ["b"]},
            "d": {"dependsOn": ["c", "b"]},  # d depends on c, but also b; no cycle here
        }
        # This is not a cycle, should pass
        assert topological_sort(tasks) is not None

        cycle_tasks = {
            "a": {"dependsOn": []},
            "b": {"dependsOn": ["a", "d"]},
            "c": {"dependsOn": ["b"]},
            "d": {"dependsOn": ["c"]},
        }
        # a->b->c->d->b forms a cycle
        assert topological_sort(cycle_tasks) is None

    def test_detect_cycle(self):
        tasks = {
            "a": {"dependsOn": ["b"]},
            "b": {"dependsOn": ["a"]},
        }
        assert detect_cycle(tasks) is True
        assert detect_cycle({"a": {"dependsOn": []}}) is False

    def test_no_depends_on(self):
        """Tasks with no dependsOn field should be treated as roots."""
        tasks = {
            "a": {},  # no dependsOn
            "b": {"dependsOn": ["a"]},
        }
        order = topological_sort(tasks)
        assert order == ["a", "b"]

    def test_missing_dependency(self):
        """If a dep points to a non-existent task, it should be ignored (treated as already satisfied)."""
        tasks = {
            "a": {"dependsOn": ["nonexistent"]},  # nonexistent ignored
            "b": {"dependsOn": []},
        }
        order = topological_sort(tasks)
        # b has no deps, a has no valid deps → both roots
        assert order == ["a", "b"]


class TestSortByStatus:
    def test_filter_pending_ready(self):
        tasks = {
            "a": {"dependsOn": [], "status": "done"},
            "b": {"dependsOn": ["a"], "status": "pending"},
            "c": {"dependsOn": ["b"], "status": "ready"},
        }
        order = sort_tasks_by_status(tasks, ["pending", "ready"])
        assert "a" not in order
        assert order == ["b", "c"]

    def test_empty_status_filter(self):
        tasks = {"a": {"dependsOn": []}}
        order = sort_tasks_by_status(tasks, [])
        assert order == ["a"]

    def test_fallback_on_cycle(self):
        tasks = {
            "a": {"dependsOn": ["b"], "status": "pending"},
            "b": {"dependsOn": ["a"], "status": "pending"},
        }
        order = sort_tasks_by_status(tasks, ["pending"])
        # Should fallback to alphabetical
        assert set(order) == {"a", "b"}


class TestGetReadyTasks:
    def test_only_pending_ready(self):
        tasks = {
            "a": {"dependsOn": [], "status": "done"},
            "b": {"dependsOn": ["a"], "status": "pending"},
            "c": {"dependsOn": ["b"], "status": "ready"},
            "d": {"dependsOn": [], "status": "in-progress"},
        }
        order = get_ready_tasks_topological(tasks)
        assert order == ["b", "c"]
        assert "d" not in order


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
