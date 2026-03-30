"""F1: Active projects status — scans team-tasks/ directory structure."""
import json
import os
from pathlib import Path


TEAM_TASKS_DIR = "/root/.openclaw/workspace-coord/team-tasks"


def get_active_projects(tasks_dir: str = None) -> dict:
    """Scan team-tasks/ and return active projects summary.
    
    Scans:
    - team-tasks/<name>.json  (legacy root-level files)
    - team-tasks/projects/<name>/tasks.json  (new per-project layout)
    """
    base = tasks_dir or TEAM_TASKS_DIR

    if not os.path.isdir(base):
        return {"count": 0, "projects": [], "error": f"Directory not found: {base}"}

    project_files = []

    # Scan root-level *.json files
    try:
        for fname in os.listdir(base):
            if fname.endswith(".json") and not fname.startswith("."):
                project_files.append(os.path.join(base, fname))
    except OSError as e:
        return {"count": 0, "projects": [], "error": str(e)}

    # Scan projects/ subdirectories
    projects_subdir = os.path.join(base, "projects")
    if os.path.isdir(projects_subdir):
        try:
            for subdir in os.listdir(projects_subdir):
                tpath = os.path.join(projects_subdir, subdir, "tasks.json")
                if os.path.isfile(tpath):
                    project_files.append(tpath)
        except OSError:
            pass

    active = []
    errors = []

    for fpath in project_files:
        try:
            if len(fpath) > 4096:
                # Skip extremely long paths (malformed filenames with newlines)
                basename = os.path.basename(fpath).split("\n")[0][:80]
                errors.append(f"path too long ({len(fpath)} bytes), skipped: {basename}")
                continue
            with open(fpath) as f:
                data = json.load(f)
        except (json.JSONDecodeError, OSError, UnicodeDecodeError) as e:
            basename = os.path.basename(fpath).split("\n")[0][:80]
            errors.append(f"{basename}: {e}")
            continue

        if data.get("status") != "active":
            continue

        stages = data.get("stages", {})
        active.append({
            "name": data.get("project", os.path.basename(fpath).replace(".json", "")),
            "goal": data.get("goal", ""),
            "stage": _get_current_stage(stages),
            "pending": _count_pending(stages),
            "total": len(stages),
        })

    err_msg = None
    if errors:
        err_msg = f"Failed to load {len(errors)} file(s)"

    return {"count": len(active), "projects": active, "error": err_msg}


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
