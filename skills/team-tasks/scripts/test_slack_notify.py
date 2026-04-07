#!/usr/bin/env python3
"""
test_slack_notify.py — E4 通知去重测试

测试 _should_send(message_key) 的核心逻辑：
1. 首次发送 → skipped: False
2. 5 分钟内重复调用 → skipped: True
3. 5 分钟后再次调用 → skipped: False

用法: pytest test_slack_notify.py -v
"""
import json
import sys
import time
import pytest
import tempfile
from pathlib import Path
from unittest.mock import patch

# 确保能 import slack_notify_templates
SCRIPT_DIR = Path("/root/.openclaw/skills/team-tasks/scripts")
sys.path.insert(0, str(SCRIPT_DIR))

import slack_notify_templates as snt


# ---------------------------------------------------------------------------
# 辅助
# ---------------------------------------------------------------------------

def _tmp_state_file(tmp_path: Path) -> Path:
    """在 tmp_path 下创建临时 state 文件并 patch 模块常量。"""
    f = tmp_path / "slack_notify_last_send.json"
    # 直接修改模块中的常量（更可靠）
    snt._SEND_STATE_FILE = f
    return f


# ---------------------------------------------------------------------------
# 核心测试：_should_send(message_key)
# ---------------------------------------------------------------------------

class TestShouldSendCore:
    """测试 E4 核心去重逻辑。"""

    def test_first_send_not_skipped(self, tmp_path):
        """首次发送 message_key → skipped=False。"""
        _tmp_state_file(tmp_path)
        result = snt._should_send("test:first")
        assert result["skipped"] is False
        assert result["remaining_seconds"] == 0.0

    def test_repeat_within_5min_skipped(self, tmp_path):
        """5 分钟内重复调用 → skipped=True，remaining > 0。"""
        _tmp_state_file(tmp_path)
        snt._record_send("test:repeat")
        result = snt._should_send("test:repeat")
        assert result["skipped"] is True
        assert 0 < result["remaining_seconds"] <= 300

    def test_after_5min_not_skipped(self, tmp_path):
        """5 分钟后再次调用 → skipped=False。"""
        _tmp_state_file(tmp_path)
        base = time.time()
        # 直接写入旧时间戳（模拟 5 分钟前）
        state = {"test:after": base - 301}
        snt._SEND_STATE_FILE.write_text(json.dumps(state))
        result = snt._should_send("test:after")
        assert result["skipped"] is False
        assert result["remaining_seconds"] == 0.0


# ---------------------------------------------------------------------------
# 边界测试
# ---------------------------------------------------------------------------

class TestShouldSendEdgeCases:
    """边界条件测试。"""

    def test_different_keys_no_interference(self, tmp_path):
        """不同 message_key 互不干扰。"""
        _tmp_state_file(tmp_path)
        snt._record_send("key:a")
        result = snt._should_send("key:b")
        assert result["skipped"] is False

    def test_expired_entries_cleaned_on_save(self, tmp_path):
        """保存时清理过期 entry。"""
        f = _tmp_state_file(tmp_path)
        base = time.time()
        # 写入一个已过期（5分钟前）的 entry
        f.write_text(json.dumps({"old_key": base - 400}))
        # 记录新 key（会触发清理）
        snt._record_send("new_key")
        state = json.loads(f.read_text())
        assert "old_key" not in state
        assert "new_key" in state

    def test_record_send_updates_existing_key(self, tmp_path):
        """_record_send 对已存在 key 更新时间戳。"""
        f = _tmp_state_file(tmp_path)
        ts1 = time.time()
        ts2 = ts1 + 10
        # 先写入 ts1，记录后再写入 ts2
        f.write_text(json.dumps({"key:update": ts1}))
        import slack_notify_templates as snt
        # 用 load + save 模拟 record_send 更新
        state = snt._load_send_state()
        state["key:update"] = ts2
        snt._save_send_state(state)
        result = json.loads(f.read_text())
        assert abs(result["key:update"] - ts2) < 1

    def test_empty_state_no_crash(self, tmp_path):
        """空/损坏的 state 文件不崩溃。"""
        f = _tmp_state_file(tmp_path)
        f.write_text("not valid json{{{")
        # 不应抛出
        result = snt._should_send("any_key")
        assert result["skipped"] is False


# ---------------------------------------------------------------------------
# send_slack 集成测试
# ---------------------------------------------------------------------------

class TestSendSlackIntegration:
    """集成测试：send_slack 函数去重行为。"""

    def test_first_call_not_skipped(self, tmp_path):
        """首次调用 send_slack → ok=True, skipped=False。"""
        _tmp_state_file(tmp_path)
        with patch.object(snt, 'slack_post', return_value=True) as mock_post:
            result = snt.send_slack(
                channel_id="C0AP3CPJL8N",
                token="fake-token",
                message_key="slack:integrate1",
                text="Hello",
            )
        assert result["ok"] is True
        assert result["skipped"] is False
        assert result["remaining_seconds"] == 0.0
        assert result["error"] is None
        mock_post.assert_called_once()

    def test_repeat_within_window_skipped(self, tmp_path):
        """5 分钟内再次调用 send_slack → ok=False, skipped=True。"""
        _tmp_state_file(tmp_path)
        with patch.object(snt, 'slack_post', return_value=True) as mock_post:
            r1 = snt.send_slack(
                channel_id="C0AP3CPJL8N",
                token="fake-token",
                message_key="slack:integrate2",
                text="Hello",
            )
            r2 = snt.send_slack(
                channel_id="C0AP3CPJL8N",
                token="fake-token",
                message_key="slack:integrate2",
                text="Hello again",
            )
        assert r1["skipped"] is False
        assert r2["skipped"] is True
        assert r2["remaining_seconds"] > 0
        # slack_post 只被调用一次
        assert mock_post.call_count == 1

    def test_after_window_can_send_again(self, tmp_path):
        """5 分钟后同一 message_key 可再次发送。"""
        _tmp_state_file(tmp_path)
        base = time.time()
        # 模拟 5 分钟前的状态
        snt._SEND_STATE_FILE.write_text(json.dumps({"slack:old": base - 301}))

        with patch.object(snt, 'slack_post', return_value=True) as mock_post:
            result = snt.send_slack(
                channel_id="C0AP3CPJL8N",
                token="fake-token",
                message_key="slack:old",
                text="Hello again",
            )
        assert result["skipped"] is False
        assert result["ok"] is True
        mock_post.assert_called_once()

    def test_slack_post_failure_returns_error(self, tmp_path):
        """slack_post 失败时返回错误信息。"""
        _tmp_state_file(tmp_path)
        with patch.object(snt, 'slack_post', return_value=False) as mock_post:
            result = snt.send_slack(
                channel_id="C0AP3CPJL8N",
                token="fake-token",
                message_key="slack:fail",
                text="Hello",
            )
        assert result["ok"] is False
        assert result["skipped"] is False
        assert result["error"] == "slack_post failed"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
