"""F1: Ready decision engine — determine which tasks are ready to execute.

Epic 1 for coord-decision-report.

Functions:
- get_ready_tasks(): all pending tasks whose dependsOn are all done
- compute_wait_duration(): now - MAX(dependsOn.completedAt)
- rank_ready_tasks(): sort by priority + wait_duration
"""
import json
import os
import time
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

TEAM_TASKS_DIR = "/root/.openclaw/workspace-coord/team-tasks"

# Priority order: P0 > P1 > P2 > default
PRIORITY_ORDER = {"p0": 0, "p1": 1, "p2": 2}


def _load_all_projects() -> dict:
    """Load all project JSON files from team-tasks directory.

    Silently skips files that cannot be read (e.g., name too long, permission denied).
    """
    projects = {}

    if not os.path.isdir(TEAM_TASKS_DIR):
        return {"projects": projects, "error": f"Directory not found: {TEAM_TASKS_DIR}"}

    try:
        entries = os.listdir(TEAM_TASKS_DIR)
    except OSError:
        return {"projects": projects, "error": f"Cannot list directory: {TEAM_TASKS_DIR}"}

    for fname in entries:
        if not fname.endswith(".json") or fname.startswith("."):
            continue
        fpath = os.path.join(TEAM_TASKS_DIR, fname)
        try:
            with open(fpath) as f:
                data = json.load(f)
            project_name = data.get("project", fname.replace(".json", ""))
            projects[project_name] = data
        except (json.JSONDecodeError, OSError, UnicodeDecodeError):
            # Silently skip unreadable files
            continue

    return {"projects": projects, "error": None}


def _parse_timestamp(ts: Optional[str]) -> float:
    """Parse ISO timestamp to epoch seconds."""
    if not ts:
        return 0.0
    try:
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        return dt.timestamp()
    except (ValueError, TypeError):
        return 0.0


def _get_completed_at(stages: dict, dep_names: list) -> float:
    """Get the latest completedAt among a list of dependency stages."""
    if not dep_names:
        return 0.0
    latest = 0.0
    for dep_name in dep_names:
        info = stages.get(dep_name, {})
        if info.get("status") == "done":
            ts = _parse_timestamp(info.get("completedAt"))
            if ts > latest:
                latest = ts
    return latest


def _extract_priority(project_name: str, project_data: dict) -> int:
    """Extract numeric priority from project. Lower = higher priority."""
    # Check for P0/P1/P2 in project name
    name_lower = project_name.lower()
    for p in ["p0", "p1", "p2"]:
        if p in name_lower:
            return PRIORITY_ORDER.get(p, 99)
    # Default priority
    return 99


def get_ready_tasks(tasks_dir: str = None) -> dict:
    """Return all pending tasks whose dependsOn stages are all done.

    Each ready task includes:
      - project, task_id, agent, dependsOn
      - wait_duration_seconds
      - priority_rank (lower = higher priority)
    """
    if tasks_dir is None:
        tasks_dir = TEAM_TASKS_DIR

    result = _load_all_projects()
    if result.get("error") and not result.get("projects"):
        return {"ready": [], "error": result["error"]}

    now = time.time()
    ready_tasks = []

    for project_name, project_data in result["projects"].items():
        stages = project_data.get("stages", {})
        priority_rank = _extract_priority(project_name, project_data)

        for task_id, task_info in stages.items():
            if task_info.get("status") != "pending":
                continue

            depends_on = task_info.get("dependsOn", [])
            if not isinstance(depends_on, list):
                depends_on = []

            # Check all dependsOn are done
            all_done = True
            for dep_name in depends_on:
                dep_info = stages.get(dep_name, {})
                if dep_info.get("status") != "done":
                    all_done = False
                    break

            if not all_done:
                continue

            # Compute wait duration: now - MAX(completedAt of deps)
            completed_at = _get_completed_at(stages, depends_on)
            wait_seconds = max(0.0, now - completed_at) if completed_at > 0 else 0.0

            # Parse wait duration in human-readable form
            wait_hours = wait_seconds / 3600
            if wait_hours >= 24:
                wait_str = f"{wait_hours/24:.1f}d"
            elif wait_hours >= 1:
                wait_str = f"{wait_hours:.1f}h"
            else:
                wait_str = f"{wait_seconds/60:.0f}m"

            ready_tasks.append({
                "project": project_name,
                "task_id": task_id,
                "agent": task_info.get("agent", "unknown"),
                "depends_on": depends_on,
                "wait_seconds": round(wait_seconds, 1),
                "wait_str": wait_str,
                "priority_rank": priority_rank,
                "task_desc": task_info.get("task", "")[:100],  # First 100 chars
            })

    # Sort: by priority_rank ASC, then wait_seconds DESC (longer waiting first)
    ready_tasks.sort(key=lambda t: (t["priority_rank"], -t["wait_seconds"]))

    return {
        "ready": ready_tasks,
        "count": len(ready_tasks),
        "error": None,
    }


def rank_ready_tasks(ready_data: dict) -> list:
    """Sort ready tasks by priority and urgency.

    Rules:
    1. Priority from project name (P0 > P1 > P2 > default)
    2. Within same priority: longer wait first (avoid starvation)
    """
    tasks = ready_data.get("ready", [])
    return sorted(tasks, key=lambda t: (t["priority_rank"], -t["wait_seconds"]))
