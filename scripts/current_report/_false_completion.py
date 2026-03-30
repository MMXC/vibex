"""F2: False completion detection — status=done but output file missing."""
import json
import os
from pathlib import Path

TEAM_TASKS_DIR = "/root/.openclaw/workspace-coord/team-tasks"


def detect_false_completions(tasks_path: str = None) -> dict:
    """Detect tasks marked done but whose output file doesn't exist."""
    tasks_dir = TEAM_TASKS_DIR
    if tasks_path:
        tasks_dir = str(Path(tasks_path).parent) if Path(tasks_path).name == "tasks.json" else tasks_path

    if not os.path.isdir(tasks_dir):
        return {"count": 0, "items": [], "error": f"Directory not found: {tasks_dir}"}

    items = []
    errors = []

    try:
        files = [f for f in os.listdir(tasks_dir) if f.endswith(".json") and not f.startswith(".")]
    except OSError as e:
        return {"count": 0, "items": [], "error": str(e)}

    for fname in files:
        fpath = os.path.join(tasks_dir, fname)
        try:
            with open(fpath) as f:
                data = json.load(f)
        except (json.JSONDecodeError, OSError) as e:
            errors.append(f"{fname}: {e}")
            continue

        project_name = data.get("project", fname.replace(".json", ""))
        for stage_name, stage_info in data.get("stages", {}).items():
            if stage_info.get("status") != "done":
                continue
            output = stage_info.get("output", "")
            if not output:
                continue
            # Sanitize: skip if output looks like content rather than a path
            if "\n" in output or len(output) > 512:
                continue
            # Resolve path — output can be absolute or relative to workspace-coord
            try:
                if not os.path.isabs(output):
                    output_path = Path(tasks_dir).parent.parent / output
                else:
                    output_path = Path(output)
            except (OSError, ValueError):
                continue

            if not output_path.exists():
                items.append({
                    "project": project_name,
                    "task": stage_name,
                    "output": output,
                    "resolved_path": str(output_path),
                })

    error_msg = None
    if errors:
        error_msg = f"Failed to load {len(errors)} files"

    return {"count": len(items), "items": items, "error": error_msg}
