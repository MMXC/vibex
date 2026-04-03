"""Tests for current_report module."""
import json
import os
import sys
import tempfile
from pathlib import Path

# Import the module via sys.modules simulation
# current_report/ is at scripts/ level, tests/ is at scripts/tests/
_script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, _script_dir)

import importlib.util

def _load_mod(name, rel_path):
    """Load a module from scripts/current_report/."""
    full_path = os.path.join(_script_dir, rel_path)
    spec = importlib.util.spec_from_file_location(name, full_path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod

_active = _load_mod("current_report._active_projects", "current_report/_active_projects.py")
_false_comp = _load_mod("current_report._false_completion", "current_report/_false_completion.py")
_server = _load_mod("current_report._server_info", "current_report/_server_info.py")
_output = _load_mod("current_report._output", "current_report/_output.py")


class TestActiveProjects:
    """F1: active projects from tasks.json"""

    def test_no_dir(self, tmp_path):
        # nonexistent directory returns error
        result = _active.get_active_projects(str(tmp_path / "nonexistent_dir"))
        assert result["count"] == 0
        assert result["error"] is not None

    def test_empty_projects(self, tmp_path):
        # Empty directory has no active projects
        result = _active.get_active_projects(str(tmp_path))
        assert result["count"] == 0
        assert result["projects"] == []

    def test_active_filtered(self, tmp_path):
        # Per-file format: two files in directory
        p1 = tmp_path / "p1.json"
        p2 = tmp_path / "p2.json"
        p1.write_text(json.dumps({"project": "p1", "status": "active", "stages": {}}))
        p2.write_text(json.dumps({"project": "p2", "status": "completed", "stages": {}}))
        result = _active.get_active_projects(str(tmp_path))  # pass directory
        assert result["count"] == 1
        assert result["projects"][0]["name"] == "p1"

    def test_stage_resolution(self, tmp_path):
        p1 = tmp_path / "p1.json"
        p1.write_text(json.dumps({
            "project": "p1",
            "status": "active",
            "stages": {
                "s1": {"status": "done"},
                "s2": {"status": "in-progress"},
                "s3": {"status": "pending"},
            },
        }))
        result = _active.get_active_projects(str(tmp_path))  # pass directory
        assert result["projects"][0]["stage"] == "s2"
        assert result["projects"][0]["pending"] == 1
        assert result["projects"][0]["total"] == 3


class TestFalseCompletion:
    """F2: false completion detection"""

    def test_no_dir(self, tmp_path):
        # nonexistent dir returns error
        result = _false_comp.detect_false_completions(str(tmp_path / "nonexistent_dir"))
        assert result["count"] == 0
        assert result["error"] is not None

    def test_empty_output_allowed(self, tmp_path):
        # Per-file format, pass directory
        tasks = {
            "project": "p1",
            "stages": {
                "task1": {"status": "done", "output": ""},
            },
        }
        f = tmp_path / "p1.json"
        f.write_text(json.dumps(tasks))
        result = _false_comp.detect_false_completions(str(tmp_path))
        assert result["count"] == 0
        assert result["count"] == 0

    def test_missing_file_detected(self, tmp_path):
        # Per-file format (no 'projects' wrapper), pass directory
        tasks = {
            "project": "p1",
            "stages": {
                "design": {"status": "done", "output": "docs/missing.md"},
            },
        }
        f = tmp_path / "p1.json"
        f.write_text(json.dumps(tasks))
        result = _false_comp.detect_false_completions(str(tmp_path))
        assert result["count"] == 1
        assert result["items"][0]["project"] == "p1"
        assert result["items"][0]["task"] == "design"

    def test_existing_file_ok(self, tmp_path):
        doc = tmp_path / "exists.md"
        doc.write_text("content")
        # New format: file per project, no 'projects' wrapper
        tasks = {
            "project": "p1",
            "stages": {
                "design": {"status": "done", "output": str(doc)},
            },
        }
        f = tmp_path / "p1.json"
        f.write_text(json.dumps(tasks))
        # Pass directory path (new API)
        result = _false_comp.detect_false_completions(str(tmp_path))
        assert result["count"] == 0


class TestServerInfo:
    """F3: server info via psutil"""

    def test_returns_valid_types(self):
        result = _server.get_server_info()
        assert isinstance(result["psutil_available"], bool)
        if result["psutil_available"]:
            assert isinstance(result["cpu_percent"], (float, type(None)))
            assert isinstance(result["memory_percent"], (float, type(None)))
            assert isinstance(result["disk_percent"], (float, type(None)))


class TestOutput:
    """Output formatting"""

    def test_text_no_projects(self):
        active = {"count": 0, "projects": [], "error": None}
        fc = {"count": 0, "items": [], "error": None}
        srv = {"psutil_available": False}
        text = _output.format_text(active, fc, srv)
        assert "Active Projects (0)" in text
        assert "No false completions" in text

    def test_text_with_project(self):
        active = {"count": 1, "projects": [{"name": "p1", "stage": "dev", "pending": 2, "total": 5}], "error": None}
        fc = {"count": 0, "items": [], "error": None}
        srv = {"psutil_available": False}
        text = _output.format_text(active, fc, srv)
        assert "p1" in text
        assert "stage=dev" in text
        assert "pending=2" in text

    def test_text_false_completion_found(self):
        active = {"count": 0, "projects": [], "error": None}
        fc = {"count": 1, "items": [{"project": "p1", "task": "design", "output": "docs/a.md"}], "error": None}
        srv = {"psutil_available": False}
        text = _output.format_text(active, fc, srv)
        assert "p1/design" in text
        assert "docs/a.md" in text

    def test_json_format(self):
        active = {"count": 0, "projects": [], "error": None}
        fc = {"count": 0, "items": [], "error": None}
        srv = {"psutil_available": False}
        data = json.loads(_output.format_json(active, fc, srv))
        assert "active_projects" in data
        assert "false_completions" in data
        assert "server_info" in data
        assert "generated_at" in data


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
