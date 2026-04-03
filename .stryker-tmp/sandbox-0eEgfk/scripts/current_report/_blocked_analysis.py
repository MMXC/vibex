"""F2: Blocked root cause analysis — detect tasks that are pending due to unmet dependencies.

Epic2 for coord-decision-report.
"""
import json
import os
from datetime import datetime
from typing import List, Dict, Optional

TEAM_TASKS_DIR = "/root/.openclaw/workspace-coord/team-tasks"


def get_blocked_tasks(tasks_dir: str = None) -> dict:
    """Detect blocked tasks (pending but dependencies are not all done).
    
    Returns:
        {
            "count": int,
            "blocked": [
                {
                    "project": str,
                    "task_id": str,
                    "agent": str,
                    "depends_on": List[str],
                    "blocked_by": List[str],  # dependencies that are not done
                    "blocked_duration_seconds": Optional[float],
                    "root_cause": str  # first non-done dependency
                }
            ],
            "error": Optional[str]
        }
    """
    base = tasks_dir or TEAM_TASKS_DIR

    if not os.path.isdir(base):
        return {"count": 0, "blocked": [], "error": f"Directory not found: {base}"}

    # Load all project files
    projects = {}
    try:
        # Scan root level json files
        for fname in os.listdir(base):
            if not fname.endswith(".json") or fname.startswith("."):
                continue
            fpath = os.path.join(base, fname)
            try:
                with open(fpath) as f:
                    data = json.load(f)
                project_name = data.get("project", fname.replace(".json", ""))
                projects[project_name] = data
            except (json.JSONDecodeError, OSError, UnicodeDecodeError):
                continue

        # Scan projects/ subdirectory
        projects_subdir = os.path.join(base, "projects")
        if os.path.isdir(projects_subdir):
            for subdir in os.listdir(projects_subdir):
                tpath = os.path.join(projects_subdir, subdir, "tasks.json")
                if not os.path.isfile(tpath):
                    continue
                try:
                    with open(tpath) as f:
                        data = json.load(f)
                    project_name = data.get("project", subdir)
                    projects[project_name] = data
                except (json.JSONDecodeError, OSError, UnicodeDecodeError):
                    continue
    except OSError as e:
        return {"count": 0, "blocked": [], "error": str(e)}

    # Build task status map
    task_status = {}
    for project_name, project in projects.items():
        stages = project.get("stages", {})
        for stage_name, stage_info in stages.items():
            key = f"{project_name}/{stage_name}"
            task_status[key] = {
                "status": stage_info.get("status", "pending"),
                "completed_at": stage_info.get("completed_at")
            }

    blocked = []
    now = datetime.now().timestamp()

    for project_name, project in projects.items():
        stages = project.get("stages", {})
        for stage_name, stage_info in stages.items():
            if stage_info.get("status") != "pending":
                continue  # only pending tasks can be blocked

            depends_on = stage_info.get("dependsOn", [])
            if not depends_on:
                continue  # no dependencies = not blocked (it's ready)

            blocked_by = []
            completed_times = []
            for dep in depends_on:
                # Resolve dependency: can be "stage_name" (same project) or "project/stage_name"
                if "/" in dep:
                    dep_key = dep
                else:
                    dep_key = f"{project_name}/{dep}"

                dep_info = task_status.get(dep_key, {"status": "pending"})
                if dep_info["status"] != "done":
                    blocked_by.append(dep_key)
                else:
                    if "completed_at" in dep_info and isinstance(dep_info["completed_at"], (int, float)):
                        completed_times.append(dep_info["completed_at"])

            if blocked_by:
                # Task is blocked
                root_cause = blocked_by[0]
                blocked_duration = None
                if completed_times:
                    latest_completed = max(completed_times)
                    blocked_duration = now - latest_completed

                blocked.append({
                    "project": project_name,
                    "task_id": stage_name,
                    "agent": stage_info.get("agent", "unknown"),
                    "depends_on": depends_on,
                    "blocked_by": blocked_by,
                    "blocked_duration_seconds": blocked_duration,
                    "blocked_duration_str": _fmt_duration(blocked_duration),
                    "root_cause": root_cause
                })

    return {
        "count": len(blocked),
        "blocked": blocked,
        "error": None
    }


def _fmt_duration(seconds: Optional[float]) -> str:
    """Format duration as human-readable string."""
    if seconds is None or seconds < 0:
        return "unknown"
    days = int(seconds // 86400)
    hours = int((seconds % 86400) // 3600)
    mins = int((seconds % 3600) // 60)
    if days > 0:
        return f"{days}d {hours}h"
    if hours > 0:
        return f"{hours}h {mins}m"
    return f"{mins}m"
