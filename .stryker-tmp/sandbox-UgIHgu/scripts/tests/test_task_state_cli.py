"""
test_task_state_cli.py - Epic 2 task_state CLI integration tests

Tests for:
- F2.1: update command (atomic with lock)
- F2.2: claim command (lock-protected)
- F2.3: status command (formatted output)
- F2.4: lock command (TTL)
- F2.5: CLI output formatting
"""

import io
import json
import os
import sys
import tempfile
from unittest import mock

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import task_state


# =============================================================================
# Fixtures
# =============================================================================

@pytest.fixture
def sample_project():
    return {
        "project": "test-project",
        "status": "active",
        "stages": {
            "stage1": {
                "agent": "dev",
                "status": "pending",
            },
            "stage2": {
                "agent": "tester",
                "status": "pending",
            },
            "stage3": {
                "agent": "reviewer",
                "status": "done",
            },
        },
    }


@pytest.fixture
def tmp_project(sample_project):
    """Create a temporary project JSON file."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(sample_project, f)
        path = f.name
    yield path
    os.unlink(path)


# =============================================================================
# Helpers
# =============================================================================

class Args:
    """Simple namespace for CLI args."""

    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)


# =============================================================================
# F2.3: status command
# =============================================================================

class TestStatusCommand:
    def test_status_shows_all_stages(self, tmp_project, sample_project, monkeypatch):
        """F2.3: status outputs all stages with status and agent."""
        import task_manager as tm

        def fake_load_with_rev(p):
            data, _ = tm.load_project_with_rev(p)
            return data, data.get("_revision", 0)

        # Patch to use temp file
        monkeypatch.setattr(tm, "task_file", lambda p: tmp_project)
        monkeypatch.setattr(tm, "load_project_with_rev", fake_load_with_rev)

        args = Args(project="test-project")
        # Capture stdout
        captured = io.StringIO()
        monkeypatch.setattr(sys, "stdout", captured)
        task_state.cmd_status(args)

        output = captured.getvalue()
        assert "test-project" in output
        assert "stage1" in output
        assert "stage2" in output
        assert "stage3" in output
        assert "done" in output

    def test_status_shows_revision(self, tmp_project, sample_project, monkeypatch):
        """F2.3: status shows current revision number."""
        import task_manager as tm

        def fake_load_with_rev(p):
            return sample_project, 42

        monkeypatch.setattr(tm, "task_file", lambda p: tmp_project)
        # Must patch in task_state module since it imports directly from task_manager
        monkeypatch.setattr(task_state, "load_project_with_rev", fake_load_with_rev)

        args = Args(project="test-project")
        captured = io.StringIO()
        monkeypatch.setattr(sys, "stdout", captured)
        task_state.cmd_status(args)

        output = captured.getvalue()
        assert "42" in output


# =============================================================================
# F2.1: update command
# =============================================================================

class TestUpdateCommand:
    def test_update_changes_status(self, tmp_project, sample_project, monkeypatch):
        """F2.1: update command changes stage status atomically."""
        import task_manager as tm

        # Patch task_file to use temp
        monkeypatch.setattr(tm, "task_file", lambda p: tmp_project)

        # Load current rev
        with open(tmp_project) as f:
            data = json.load(f)
        initial_rev = data.get("_revision", 0)

        args = Args(project="test-project", stage="stage1", status="in-progress")
        captured = io.StringIO()
        monkeypatch.setattr(sys, "stdout", captured)

        task_state.cmd_update(args)

        # Verify
        with open(tmp_project) as f:
            result = json.load(f)
        assert result["stages"]["stage1"]["status"] == "in-progress"
        assert result.get("_revision", 0) > initial_rev

    def test_update_nonexistent_stage(self, tmp_project, sample_project, monkeypatch):
        """F2.1: update on nonexistent stage exits with error."""
        import task_manager as tm

        monkeypatch.setattr(tm, "task_file", lambda p: tmp_project)

        args = Args(project="test-project", stage="nonexistent", status="done")
        with pytest.raises(SystemExit):
            task_state.cmd_update(args)


# =============================================================================
# F2.2: claim command
# =============================================================================

class TestClaimCommand:
    def test_claim_changes_status_to_in_progress(self, tmp_project, sample_project, monkeypatch):
        """F2.2: claim command changes stage status to in-progress."""
        import task_manager as tm

        monkeypatch.setattr(tm, "task_file", lambda p: tmp_project)

        args = Args(project="test-project", stage="stage1", agent="dev")
        captured = io.StringIO()
        monkeypatch.setattr(sys, "stdout", captured)

        task_state.cmd_claim(args)

        with open(tmp_project) as f:
            result = json.load(f)
        assert result["stages"]["stage1"]["status"] == "in-progress"
        assert result["stages"]["stage1"]["agent"] == "dev"

    def test_claim_already_claimed_by_other(self, tmp_project, sample_project, monkeypatch):
        """F2.2: cannot claim a stage already claimed by another agent."""
        import task_manager as tm

        # stage1 already has agent=dev and status=pending
        monkeypatch.setattr(tm, "task_file", lambda p: tmp_project)

        args = Args(project="test-project", stage="stage1", agent="other-agent")
        with pytest.raises(SystemExit):
            task_state.cmd_claim(args)

    def test_claim_own_pending_stage(self, tmp_project, sample_project, monkeypatch):
        """F2.2: same agent can claim their own pending stage."""
        import task_manager as tm

        # stage1 has agent=dev but status=pending → should be claimable
        monkeypatch.setattr(tm, "task_file", lambda p: tmp_project)

        args = Args(project="test-project", stage="stage1", agent="dev")
        captured = io.StringIO()
        monkeypatch.setattr(sys, "stdout", captured)

        task_state.cmd_claim(args)

        with open(tmp_project) as f:
            result = json.load(f)
        assert result["stages"]["stage1"]["status"] == "in-progress"


# =============================================================================
# F2.4: lock command
# =============================================================================

class TestLockCommand:
    def test_lock_sets_expiry(self, tmp_project, sample_project, monkeypatch):
        """F2.4: lock command sets expiresAt timestamp."""
        import task_manager as tm

        monkeypatch.setattr(tm, "task_file", lambda p: tmp_project)

        args = Args(project="test-project", stage="stage2", agent="dev", ttl=60)
        captured = io.StringIO()
        monkeypatch.setattr(sys, "stdout", captured)

        task_state.cmd_lock(args)

        with open(tmp_project) as f:
            result = json.load(f)
        lock = result["stages"]["stage2"].get("_lock", {})
        assert "expiresAt" in lock
        assert lock["agent"] == "dev"
        assert 0 < lock["expiresAt"]  # should be a positive timestamp


# =============================================================================
# F2.5: output formatting
# =============================================================================

class TestOutputFormatting:
    def test_color_status_done(self):
        """F2.5: done status is green."""
        result = task_state.color_status("done")
        assert "\033[32m" in result  # green

    def test_color_status_in_progress(self):
        """F2.5: in-progress status is yellow."""
        result = task_state.color_status("in-progress")
        assert "\033[33m" in result  # yellow

    def test_color_status_pending(self):
        """F2.5: pending status is cyan."""
        result = task_state.color_status("pending")
        assert "\033[36m" in result  # cyan

    def test_color_status_blocked(self):
        """F2.5: blocked status is red."""
        result = task_state.color_status("blocked")
        assert "\033[31m" in result  # red
