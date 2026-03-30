"""F1: Active projects status from team-tasks/*.json files."""
import json
import os
from pathlib import Path

TEAM_TASKS_DIR = "/root/.openclaw/workspace-coord/team-tasks"


def get_active_projects(tasks_path: str = None) -> dict:
    """Read team-tasks/*.json and return active projects summary."""
    tasks_dir = TEAM_TASKS_DIR
    if tasks_path:
        # tasks_path is interpreted as the team-tasks directory
        tasks_dir = str(Path(tasks_path).parent) if Path(tasks_path).name == "tasks.json" else tasks_path

    if not os.path.isdir(tasks_dir):
        return {"count": 0, "projects": [], "error": f"Directory not found: {tasks_dir}"}

    projects = []
    errors = []

    # Scan *.json files in team-tasks/
    try:
        files = [f for f in os.listdir(tasks_dir) if f.endswith(".json") and not f.startswith(".")]
    except OSError as e:
        return {"count": 0, "projects": [], "error": str(e)}

    for fname in files:
        fpath = os.path.join(tasks_dir, fname)
        try:
            with open(fpath) as f:
                data = json.load(f)
        except (json.JSONDecodeError, OSError) as e:
            errors.append(f"{fname}: {e}")
            continue

        if data.get("status") != "active":
            continue

        project_name = data.get("project", fname.replace(".json", ""))
        stages = data.get("stages", {})
        current_stage = _get_current_stage(stages)
        pending_count = _count_pending(stages)

        projects.append({
            "name": project_name,
            "goal": data.get("goal", ""),
            "stage": current_stage,
            "pending": pending_count,
            "total": len(stages),
        })

    error_msg = None
    if errors:
        error_msg = f"Failed to load {len(errors)} files: {errors[0]}"

    return {"count": len(projects), "projects": projects, "error": error_msg}


def _get_current_stage(stages: dict) -> str:
    """Get the currently in-progress stage name, or last non-done stage."""
    for name, info in stages.items():
        if info.get("status") == "in-progress":
            return name
    for name, info in reversed(list(stages.items())):
        if info.get("status") not in ("done",):
            return name
    return "completed"


def _count_pending(stages: dict) -> int:
    """Count pending tasks."""
    return sum(1 for info in stages.values() if info.get("status") == "pending")
