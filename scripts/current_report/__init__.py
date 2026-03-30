"""current-report CLI command: active projects + false completion + server info."""
from ._active_projects import get_active_projects
from ._false_completion import detect_false_completions
from ._server_info import get_server_info
from ._ready_decision import get_ready_tasks, rank_ready_tasks
from ._output import format_text, format_json

__all__ = [
    "get_active_projects",
    "detect_false_completions",
    "get_server_info",
    "get_ready_tasks",
    "rank_ready_tasks",
    "format_text",
    "format_json",
]
