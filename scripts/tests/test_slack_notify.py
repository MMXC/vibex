"""
Unit tests for task_manager.py Slack notification module.
Tests _curl_slack, notify_new_task, notify_stage_done,
notify_stage_rejected, _get_downstream.
"""
import sys
import unittest
import os
import tempfile
import json
from unittest.mock import patch, MagicMock

sys.path.insert(0, "/root/.openclaw/vibex/scripts")


class TestCurlSlack(unittest.TestCase):
    """Story 1.2: _curl_slack function"""

    @patch("urllib.request.urlopen")
    def test_sends_message_successfully(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.read.return_value = b'{"ok": true}'
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        import importlib
        spec = importlib.util.spec_from_file_location(
            "task_manager", "/root/.openclaw/skills/team-tasks/scripts/task_manager.py"
        )
        tm = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(tm)

        result = tm._curl_slack("C0AP92ZGC68", "xoxp-test-token", "Hello")
        self.assertTrue(result)
        mock_urlopen.assert_called_once()
        call_args = mock_urlopen.call_args
        req = call_args[0][0]
        self.assertEqual(req.full_url, "https://slack.com/api/chat.postMessage")

    @patch("urllib.request.urlopen")
    def test_returns_false_on_slack_error(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.read.return_value = b'{"ok": false, "error": "channel_not_found"}'
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        import importlib
        spec = importlib.util.spec_from_file_location(
            "task_manager", "/root/.openclaw/skills/team-tasks/scripts/task_manager.py"
        )
        tm = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(tm)

        result = tm._curl_slack("C0INVALID", "xoxp-test-token", "Hello")
        self.assertFalse(result)

    @patch("urllib.request.urlopen")
    def test_returns_false_on_exception(self, mock_urlopen):
        mock_urlopen.side_effect = Exception("network error")

        import importlib
        spec = importlib.util.spec_from_file_location(
            "task_manager", "/root/.openclaw/skills/team-tasks/scripts/task_manager.py"
        )
        tm = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(tm)

        result = tm._curl_slack("C0AP92ZGC68", "xoxp-test-token", "Hello")
        self.assertFalse(result)

    def test_returns_false_when_no_token(self):
        import importlib
        spec = importlib.util.spec_from_file_location(
            "task_manager", "/root/.openclaw/skills/team-tasks/scripts/task_manager.py"
        )
        tm = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(tm)

        result = tm._curl_slack("C0AP92ZGC68", "", "Hello")
        self.assertFalse(result)


class TestNotifyNewTask(unittest.TestCase):
    """Story 1.3: notify_new_task"""

    @patch.dict(os.environ, {"SLACK_TOKEN_dev": "xoxp-test-token"})
    @patch("urllib.request.urlopen")
    def test_calls_curl_with_correct_channel_and_text(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.read.return_value = b'{"ok": true}'
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        # Re-import to pick up patched env
        import importlib
        spec = importlib.util.spec_from_file_location(
            "task_manager2", "/root/.openclaw/skills/team-tasks/scripts/task_manager.py"
        )
        tm = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(tm)

        tm.notify_new_task("my-project", "dev-epic1", "dev", "实现某功能")

        mock_urlopen.assert_called_once()
        call_args = mock_urlopen.call_args
        req = call_args[0][0]
        body = json.loads(req.data)
        self.assertIn("my-project", body["text"])
        self.assertIn("dev-epic1", body["text"])
        self.assertIn("实现某功能", body["text"])

    def test_no_crash_when_token_missing(self):
        # Ensure missing token doesn't raise
        import importlib
        spec = importlib.util.spec_from_file_location(
            "task_manager3", "/root/.openclaw/skills/team-tasks/scripts/task_manager.py"
        )
        tm = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(tm)

        # Should not raise, just prints warning
        tm.notify_new_task("my-project", "dev-epic1", "dev", "实现某功能")


class TestGetDownstream(unittest.TestCase):
    """Story 2.4: _get_downstream function"""

    @patch("urllib.request.urlopen")
    def test_finds_direct_downstream(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.read.return_value = b'{"ok": true}'
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        import importlib
        spec = importlib.util.spec_from_file_location(
            "task_manager4", "/root/.openclaw/skills/team-tasks/scripts/task_manager.py"
        )
        tm = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(tm)

        # Patch task_file to return a temp file
        tasks_data = {
            "stages": {
                "analyze-requirements": {"agent": "analyst", "dependsOn": []},
                "create-prd": {"agent": "pm", "dependsOn": ["analyze-requirements"]},
            }
        }
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(tasks_data, f)
            tmp_path = f.name
        try:
            with patch.object(tm, "task_file", return_value=tmp_path):
                result = tm._get_downstream("test-project", "analyze-requirements")
                self.assertEqual(result, ("create-prd", "pm"))
        finally:
            os.unlink(tmp_path)

    @patch("urllib.request.urlopen")
    def test_returns_none_when_no_downstream(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.read.return_value = b'{"ok": true}'
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        import importlib
        spec = importlib.util.spec_from_file_location(
            "task_manager5", "/root/.openclaw/skills/team-tasks/scripts/task_manager.py"
        )
        tm = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(tm)

        tasks_data = {
            "stages": {
                "analyze-requirements": {"agent": "analyst", "dependsOn": []},
            }
        }
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(tasks_data, f)
            tmp_path = f.name
        try:
            with patch.object(tm, "task_file", return_value=tmp_path):
                result = tm._get_downstream("test-project", "analyze-requirements")
                self.assertIsNone(result)
        finally:
            os.unlink(tmp_path)


if __name__ == "__main__":
    unittest.main(verbosity=2)
