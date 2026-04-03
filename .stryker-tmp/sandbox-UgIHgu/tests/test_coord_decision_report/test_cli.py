"""CLI tests for coord_decision_report"""

import pytest
import json
import sys
from pathlib import Path
from io import StringIO
from unittest.mock import patch, MagicMock

# 添加 src 到 path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))


def test_get_idle_count(tmp_path):
    """测试获取空转计数"""
    count_file = tmp_path / ".heartbeat_count"
    count_file.write_text("5")
    
    from coord_decision_report import get_idle_count
    
    result = get_idle_count(str(tmp_path))
    assert result == 5


def test_get_idle_count_not_exists(tmp_path):
    """测试计数文件不存在时返回 0"""
    from coord_decision_report import get_idle_count
    
    result = get_idle_count(str(tmp_path))
    assert result == 0


def test_get_idle_count_invalid_content(tmp_path):
    """测试计数文件内容无效时返回 0"""
    count_file = tmp_path / ".heartbeat_count"
    count_file.write_text("invalid number")
    
    from coord_decision_report import get_idle_count
    
    result = get_idle_count(str(tmp_path))
    assert result == 0


def test_generate_full_report_with_mocks(
    tmp_path
):
    """测试生成完整报告（使用 sys.modules 注入 mock）"""
    import sys
    from unittest.mock import MagicMock

    # Create mock modules
    mock_ready_mod = MagicMock()
    mock_ready_mod.get_ready_tasks.return_value = {"count": 2, "ready": []}
    mock_ready_mod.get_blocked_tasks.return_value = {"count": 1, "blocked": []}
    mock_ready_mod.get_active_projects.return_value = {"count": 1, "projects": []}
    mock_ready_mod.detect_false_completions.return_value = {"count": 0, "items": []}
    mock_ready_mod.get_server_info.return_value = {"psutil_available": True}

    # Inject mock
    old_mod = sys.modules.get("current_report")
    sys.modules["current_report"] = mock_ready_mod

    try:
        from coord_decision_report import generate_full_report
        
        report = generate_full_report(str(tmp_path), 3, "proposals")
        
        assert report["ready_tasks"]["count"] == 2
        assert report["blocked_tasks"]["count"] == 1
        assert report["idle_count"] == 3
        assert report["should_create_new_project"] == True  # idle=3 >=3 and ready=2 <3
    finally:
        if old_mod is not None:
            sys.modules["current_report"] = old_mod
        elif "current_report" in sys.modules:
            del sys.modules["current_report"]


def test_generate_full_report_no_new_project(tmp_path):
    """测试不需要创建新项目的情况（ready >= 3）"""
    import sys
    from unittest.mock import MagicMock

    mock_mod = MagicMock()
    mock_mod.get_ready_tasks.return_value = {"count": 5, "ready": []}
    mock_mod.get_blocked_tasks.return_value = {"count": 0, "blocked": []}
    mock_mod.get_active_projects.return_value = {"count": 0, "projects": []}
    mock_mod.detect_false_completions.return_value = {"count": 0, "items": []}
    mock_mod.get_server_info.return_value = {"psutil_available": False}

    old_mod = sys.modules.get("current_report")
    sys.modules["current_report"] = mock_mod

    try:
        from coord_decision_report import generate_full_report
        report = generate_full_report(str(tmp_path), 3, "proposals")
        assert report["should_create_new_project"] == False  # ready=5 >= 3
    finally:
        if old_mod is not None:
            sys.modules["current_report"] = old_mod
        elif "current_report" in sys.modules:
            del sys.modules["current_report"]


def test_format_report_text():
    """测试文本格式化"""
    report = {
        "ready_tasks": {"count": 1, "ready": [{
            "agent": "dev",
            "project": "test-project",
            "task_id": "task1",
            "wait_str": "1h",
            "priority_rank": 0,
            "task_desc": "Test task"
        }]},
        "blocked_tasks": {"count": 0, "blocked": []},
        "active_projects": {"count": 1, "projects": [{
            "name": "test-project",
            "stage": "dev-task1",
            "pending": 1,
            "total": 3
        }]},
        "false_completions": {"count": 0, "items": []},
        "server_info": {"psutil_available": True},
        "idle_count": 1,
        "should_create_new_project": False,
        "generated_at": "2026-03-30T16:00:00Z"
    }
    
    from coord_decision_report import format_report_text
    
    output = format_report_text(report)
    assert "=== 🤖 Coord Decision Report ===" in output
    assert "Ready to Execute (1)" in output
    assert "test-project/task1" in output
    assert "Blocked Tasks (0)" in output
    assert "✓ No blocked tasks" in output
    assert "Active Projects (1)" in output
    assert "test-project: stage=dev-task1, pending=1/3" in output


def test_cli_help():
    """测试 CLI 帮助输出"""
    from coord_decision_report import main
    
    with patch("sys.argv", ["coord_decision_report.py", "--help"]):
        with pytest.raises(SystemExit) as excinfo:
            main()
        assert excinfo.value.code == 0


def test_cli_json_output():
    """测试 JSON 输出"""
    from coord_decision_report import main
    
    with patch("coord_decision_report.generate_full_report") as mock_generate:
        mock_generate.return_value = {
            "ready_tasks": {"count": 0, "ready": []},
            "blocked_tasks": {"count": 0, "blocked": []},
            "active_projects": {"count": 0, "projects": []},
            "false_completions": {"count": 0, "items": []},
            "server_info": {},
            "idle_count": 0,
            "should_create_new_project": False,
            "generated_at": "2026-03-30T16:00:00Z"
        }
        
        with patch("sys.argv", ["coord_decision_report.py", "--json"]):
            with patch("sys.stdout", new_callable=StringIO) as mock_stdout:
                with pytest.raises(SystemExit) as excinfo:
                    main()
                assert excinfo.value.code == 0
                output = mock_stdout.getvalue()
                data = json.loads(output)
                assert data["idle_count"] == 0
                assert data["should_create_new_project"] == False
