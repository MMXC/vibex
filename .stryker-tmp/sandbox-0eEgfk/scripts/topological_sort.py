#!/usr/bin/env python3
"""
topological_sort.py — Kahn's algorithm implementation for DAG topological sorting.
Used by heartbeat scripts to scan tasks in dependency order.
"""

import sys
from collections import deque
from typing import Optional


def topological_sort(tasks: dict[str, dict]) -> list[str] | None:
    """
    Sort tasks by dependency order using Kahn's algorithm.

    Args:
        tasks: Dict mapping task_id -> {dependsOn: [dep_ids], status: str, ...}

    Returns:
        List of task IDs in topological order, or None if cycle detected.
    """
    # Build in-degree map and adjacency list
    in_degree: dict[str, int] = {tid: 0 for tid in tasks}
    adjacency: dict[str, list[str]] = {tid: [] for tid in tasks}

    for tid, task in tasks.items():
        deps = task.get("dependsOn", [])
        if not isinstance(deps, list):
            deps = []
        # Only count deps that exist in the tasks graph
        valid_deps = [d for d in deps if d in tasks]
        in_degree[tid] = len(valid_deps)
        for dep in valid_deps:
            adjacency[dep].append(tid)

    # Start with all nodes that have no dependencies
    queue: deque[str] = deque([tid for tid, deg in in_degree.items() if deg == 0])
    result: list[str] = []

    while queue:
        node = queue.popleft()
        result.append(node)
        for neighbor in adjacency[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    # Cycle detected if not all nodes are in result
    if len(result) != len(tasks):
        return None

    return result


def sort_tasks_by_status(
    tasks: dict[str, dict],
    target_statuses: list[str] | None = None
) -> list[str]:
    """
    Sort tasks by dependency order, optionally filtered by status.

    Args:
        tasks: Dict mapping task_id -> {dependsOn: [...], status: str, ...}
        target_statuses: Only include tasks with these statuses (e.g. ["pending","ready"])

    Returns:
        Task IDs sorted by topological order, filtered by status.
    """
    if target_statuses:
        filtered = {
            tid: t for tid, t in tasks.items()
            if t.get("status") in target_statuses
        }
    else:
        filtered = tasks

    sorted_ids = topological_sort(filtered)
    if sorted_ids is None:
        # Fallback: return sorted alphabetically on cycle
        return sorted(filtered.keys())

    # Within same "level", sort alphabetically for determinism
    return sorted_ids


def get_ready_tasks_topological(tasks: dict[str, dict]) -> list[str]:
    """Get pending/ready tasks in topological order (no upstream blocking)."""
    return sort_tasks_by_status(tasks, ["pending", "ready"])


def detect_cycle(tasks: dict[str, dict]) -> bool:
    """Return True if tasks contain a cycle."""
    return topological_sort(tasks) is None


if __name__ == "__main__":
    # Demo / CLI usage
    if len(sys.argv) > 1 and sys.argv[1] == "--demo":
        # Simple demo
        demo_tasks = {
            "a": {"dependsOn": []},
            "b": {"dependsOn": ["a"]},
            "c": {"dependsOn": ["a"]},
            "d": {"dependsOn": ["b", "c"]},
        }
        sorted_ids = topological_sort(demo_tasks)
        print("Topological order:", sorted_ids)
        print("Has cycle:", detect_cycle(demo_tasks))

        cycle_tasks = {
            "a": {"dependsOn": ["b"]},
            "b": {"dependsOn": ["a"]},
        }
        print("Cycle detection:", detect_cycle(cycle_tasks))
    else:
        print("Usage: python3 topological_sort.py --demo")
        print("       import topological_sort as ts; ts.topological_sort(tasks)")
