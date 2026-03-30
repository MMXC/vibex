"""F2: False completion detection — scans team-tasks/ directory structure."""
import json
import os
from pathlib import Path


TEAM_TASKS_DIR = "/root/.openclaw/workspace-coord/team-tasks"


def detect_false_completions(tasks_dir: str = None) -> dict:
    """Detect tasks marked done but whose output file doesn't exist.
    
    Scans:
    - team-tasks/<name>.json  (legacy root-level files)
    - team-tasks/projects/<name>/tasks.json  (new per-project layout)
    """
    base = tasks_dir or TEAM_TASKS_DIR

    if not os.path.isdir(base):
        return {"count": 0, "items": [], "error": f"Directory not found: {base}"}

    project_files = []

    try:
        for fname in os.listdir(base):
            if fname.endswith(".json") and not fname.startswith("."):
                project_files.append(os.path.join(base, fname))
    except OSError as e:
        return {"count": 0, "items": [], "error": str(e)}

    projects_subdir = os.path.join(base, "projects")
    if os.path.isdir(projects_subdir):
        try:
            for subdir in os.listdir(projects_subdir):
                tpath = os.path.join(projects_subdir, subdir, "tasks.json")
                if os.path.isfile(tpath):
                    project_files.append(tpath)
        except OSError:
            pass

    items = []
    for fpath in project_files:
        try:
            with open(fpath) as f:
                data = json.load(f)
        except (json.JSONDecodeError, OSError, UnicodeDecodeError):
            continue

        project_name = data.get("project", os.path.basename(fpath).replace(".json", ""))
        for stage_name, stage_info in data.get("stages", {}).items():
            if stage_info.get("status") != "done":
                continue
            output = stage_info.get("output", "")
            if not output:
                continue

            # Skip outputs that look like command output/content (not file paths)
            # e.g., "Epic4 sessionId 链路验证完成\n\n## 验证结果..."
            if "\n" in output or len(output) > 512:
                continue

            # Resolve: absolute or relative to workspace-coord root
            if os.path.isabs(output):
                output_path = Path(output)
            else:
                output_path = Path("/root/.openclaw/workspace-coord") / output

            if not output_path.exists():
                items.append({
                    "project": project_name,
                    "task": stage_name,
                    "output": output,
                    "resolved_path": str(output_path),
                })

    return {"count": len(items), "items": items, "error": None}
