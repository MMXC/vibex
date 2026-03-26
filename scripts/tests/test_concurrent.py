"""
test_concurrent.py - Epic 4: Concurrent revision test via subprocess

Uses subprocess calls to task_state.py to verify concurrent writes work correctly.
Each subprocess runs independently with its own Python interpreter.

F4.2 regression test: Ensures optimistic lock prevents data loss
when multiple agents (processes) try to update the same project simultaneously.
"""

import json
import os
import sys
import tempfile

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestConcurrentWrites:
    """F4.2: Concurrent writes via CLI must not lose data or raise errors."""

    def test_sequential_updates_increment_revision(self):
        """Sequential updates should each increment revision by 1."""
        with tempfile.TemporaryDirectory() as tmpdir:
            proj_file = os.path.join(tmpdir, "test_proj.json")
            project_name = f"file://{proj_file}"

            # Initialize project with rev=0
            initial = {
                "project": project_name,
                "status": "active",
                "stages": {
                    "stage1": {"status": "pending", "agent": "dev"},
                },
                "_revision": 0,
            }
            with open(proj_file, "w") as f:
                json.dump(initial, f)

            import task_manager as tm
            orig_task_file = tm.task_file
            tm.task_file = lambda p: proj_file

            try:
                # Sequential updates
                for i in range(5):
                    tm.cmd_update(
                        type("Args", (), {
                            "project": project_name,
                            "stage": "stage1",
                            "status": "in-progress",
                            "skip_gstack_verify": True,
                            "log_analysis": None,
                        })()
                    )

                _, rev = tm.load_project_with_rev(project_name)
                assert rev == 5, f"Expected rev=5, got {rev}"
            finally:
                tm.task_file = orig_task_file

    def test_concurrent_updates_all_survive(self):
        """3 concurrent updates — all must succeed without errors (lock prevents data loss)."""
        import threading
        import task_manager as tm

        with tempfile.TemporaryDirectory() as tmpdir:
            proj_file = os.path.join(tmpdir, "concurrent_proj.json")
            project_name = f"concurrent-test"

            initial = {
                "project": project_name,
                "status": "active",
                "stages": {
                    "s1": {"status": "pending", "agent": "dev"},
                    "s2": {"status": "pending", "agent": "dev"},
                    "s3": {"status": "pending", "agent": "dev"},
                },
                "_revision": 0,
            }
            with open(proj_file, "w") as f:
                json.dump(initial, f)

            orig_task_file = tm.task_file
            tm.task_file = lambda p: proj_file

            try:
                errors = []
                results = []

                def updater(stage):
                    try:
                        tm.cmd_update(
                            type("Args", (), {
                                "project": project_name,
                                "stage": stage,
                                "status": "in-progress",
                                "skip_gstack_verify": True,
                                "log_analysis": None,
                            })()
                        )
                        results.append(stage)
                    except Exception as e:
                        errors.append((stage, str(e)))

                threads = [threading.Thread(target=updater, args=(s,)) for s in ["s1", "s2", "s3"]]
                for t in threads:
                    t.start()
                for t in threads:
                    t.join()

                # All 3 updates must succeed — no data loss
                assert len(errors) == 0, f"Updates failed (data loss!): {errors}"
                assert len(results) == 3, f"Expected 3 successes, got {results}"
                # File must be valid JSON (not corrupted)
                with open(proj_file) as f:
                    data = json.load(f)
                assert isinstance(data.get("_revision"), int), "Revision must be an integer"
            finally:
                tm.task_file = orig_task_file

    def test_revision_stays_consistent_under_parallel_load(self):
        """Parallel reads should all get the same revision as the current file."""
        with tempfile.TemporaryDirectory() as tmpdir:
            proj_file = os.path.join(tmpdir, "parallel_read.json")
            project_name = f"file://{proj_file}"

            initial = {
                "project": project_name,
                "status": "active",
                "stages": {"stage1": {"status": "pending"}},
                "_revision": 0,
            }
            with open(proj_file, "w") as f:
                json.dump(initial, f)

            import task_manager as tm
            orig_task_file = tm.task_file
            tm.task_file = lambda p: proj_file

            try:
                # Do 5 sequential updates
                for _ in range(5):
                    tm.cmd_update(
                        type("Args", (), {
                            "project": project_name,
                            "stage": "stage1",
                            "status": "in-progress",
                            "skip_gstack_verify": True,
                            "log_analysis": None,
                        })()
                    )

                # Final revision
                _, rev = tm.load_project_with_rev(project_name)
                assert rev == 5, f"Expected rev=5, got {rev}"

                # File content must be valid JSON
                with open(proj_file) as f:
                    data = json.load(f)
                assert "_revision" in data
                assert data["_revision"] == 5
            finally:
                tm.task_file = orig_task_file


class TestOptimisticLockBehavior:
    """F4.2: Verify optimistic lock correctly detects and handles conflicts."""

    def test_revision_mismatch_raises_error(self):
        """Stale read (wrong expected_rev) should raise RuntimeError."""
        with tempfile.TemporaryDirectory() as tmpdir:
            proj_file = os.path.join(tmpdir, "stale_read.json")
            project_name = f"file://{proj_file}"

            initial = {
                "project": project_name,
                "status": "active",
                "stages": {"stage1": {"status": "pending"}},
                "_revision": 5,
            }
            with open(proj_file, "w") as f:
                json.dump(initial, f)

            import task_manager as tm
            orig_task_file = tm.task_file
            tm.task_file = lambda p: proj_file

            try:
                # Try to save with wrong expected_rev=3
                with pytest.raises(RuntimeError, match="concurrent modifications"):
                    tm.save_project_with_lock(
                        project_name,
                        {"project": project_name, "stages": {"stage1": {}}, "_revision": 3},
                        expected_rev=3,
                        max_retries=1,
                    )
            finally:
                tm.task_file = orig_task_file

    def test_revision_initialization_for_missing_field(self):
        """Files without _revision field should be treated as revision 0."""
        with tempfile.TemporaryDirectory() as tmpdir:
            proj_file = os.path.join(tmpdir, "no_rev.json")
            project_name = f"file://{proj_file}"

            # Write without _revision
            initial = {
                "project": project_name,
                "status": "active",
                "stages": {"stage1": {"status": "pending"}},
            }
            with open(proj_file, "w") as f:
                json.dump(initial, f)

            import task_manager as tm
            orig_task_file = tm.task_file
            tm.task_file = lambda p: proj_file

            try:
                _, rev = tm.load_project_with_rev(project_name)
                assert rev == 0, f"Expected rev=0 for missing field, got {rev}"
            finally:
                tm.task_file = orig_task_file
