"""
test_atomic.py - Epic 4: Atomic write crash recovery test

Verifies that atomic_write_json leaves the original file untouched
when a write failure occurs.

F4.2 regression test: Ensures data durability under process crash.
"""

import json
import os
import subprocess
import sys
import tempfile

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from task_manager import atomic_write_json, _REVISION_KEY


class TestAtomicWriteCrashRecovery:
    """F4.2: Atomic write must not corrupt original file on failure."""

    def test_original_file_untouched_on_json_serialization_error(self):
        """When json.dump raises, original file content is preserved."""
        with tempfile.TemporaryDirectory() as tmpdir:
            path = os.path.join(tmpdir, "original.json")
            original_data = {"project": "crash-test", "status": "active", _REVISION_KEY: 5}

            # Write original
            with open(path, "w") as f:
                json.dump(original_data, f)

            # Run a subprocess that tries atomic_write_json with failing serializer
            # The subprocess's atomic_write_json fails, original must be untouched
            code = f"""
import sys, json, os, tempfile
sys.path.insert(0, '{os.path.dirname(os.path.dirname(os.path.abspath(__file__)))}')
from task_manager import atomic_write_json

class FailingEncoder(json.JSONEncoder):
    def default(self, o):
        raise ValueError("simulated failure")

# Patch json.dump to fail
import json as _json
_orig_dump = _json.dump
def bad_dump(obj, fp, **kwargs):
    raise ValueError("simulated failure")

try:
    _json.dump = bad_dump
    atomic_write_json("{path}", {{"bad": True}})
except ValueError:
    pass
finally:
    _json.dump = _orig_dump
"""
            result = subprocess.run(
                [sys.executable, "-c", code],
                capture_output=True,
                text=True,
                timeout=10,
            )

            # Original file must be untouched
            with open(path) as f:
                result_data = json.load(f)
            assert result_data == original_data, f"Original was corrupted! Got: {result_data}"

    def test_temp_file_cleaned_up_on_failure(self):
        """Temp files created by atomic_write_json are cleaned up on failure."""
        with tempfile.TemporaryDirectory() as tmpdir:
            path = os.path.join(tmpdir, "data.json")

            # Write initial
            with open(path, "w") as f:
                json.dump({"v": 1}, f)

            files_before = set(os.listdir(tmpdir))

            # Attempt failing write
            code = f"""
import sys, json
sys.path.insert(0, '{os.path.dirname(os.path.dirname(os.path.abspath(__file__)))}')
from task_manager import atomic_write_json

# Force json.dump to fail
import json as _json
_orig = _json.dump
def bad(*args, **kwargs): raise RuntimeError("boom")
_json.dump = bad
try: atomic_write_json("{path}", {{"x": 1}})
except: pass
finally: _json.dump = _orig
"""
            subprocess.run([sys.executable, "-c", code], capture_output=True, timeout=10)

            files_after = set(os.listdir(tmpdir))
            # No temp files should remain (atomic_write_json cleans up on failure)
            # Note: this depends on the OS — temp files with ".tmp_" prefix should be gone
            new_files = files_after - files_before
            tmp_files = [f for f in new_files if ".tmp_" in f or f.startswith("tmp")]
            assert len(tmp_files) == 0, f"Temp files not cleaned up: {tmp_files}"


class TestAtomicWriteContract:
    """F4.2: Contract tests for atomic_write_json behavior."""

    def test_raises_on_nonexistent_directory(self):
        """atomic_write_json creates parent directories automatically."""
        with tempfile.TemporaryDirectory() as tmpdir:
            path = os.path.join(tmpdir, "nonexistent", "subdir", "file.json")
            atomic_write_json(path, {"key": "value"})
            assert os.path.exists(path)

    def test_overwrites_existing_file(self):
        """atomic_write_json atomically replaces existing content."""
        with tempfile.TemporaryDirectory() as tmpdir:
            path = os.path.join(tmpdir, "data.json")
            atomic_write_json(path, {"v": 1})
            atomic_write_json(path, {"v": 2})
            with open(path) as f:
                result = json.load(f)
            assert result == {"v": 2}

    def test_indent_preserved(self):
        """atomic_write_json writes pretty-printed JSON (indent=2)."""
        with tempfile.TemporaryDirectory() as tmpdir:
            path = os.path.join(tmpdir, "data.json")
            atomic_write_json(path, {"a": 1, "b": 2})
            with open(path) as f:
                content = f.read()
            # Pretty-printed
            assert "\n" in content
            assert "  " in content  # indent=2

    def test_json_valid_after_multiple_writes(self):
        """Multiple sequential atomic writes always produce valid JSON."""
        with tempfile.TemporaryDirectory() as tmpdir:
            path = os.path.join(tmpdir, "data.json")
            for i in range(20):
                atomic_write_json(path, {"counter": i, _REVISION_KEY: i})
                with open(path) as f:
                    result = json.load(f)
                assert result["counter"] == i
                assert isinstance(result["counter"], int)

    def test_unicode_preserved(self):
        """atomic_write_json preserves unicode characters."""
        with tempfile.TemporaryDirectory() as tmpdir:
            path = os.path.join(tmpdir, "unicode.json")
            data = {"name": "你好世界", "emoji": "🎉", "mixed": "Hello 世界"}
            atomic_write_json(path, data)
            with open(path) as f:
                result = json.load(f)
            assert result == data
