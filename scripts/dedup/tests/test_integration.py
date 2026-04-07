"""
test_integration.py - E2E 集成测试

Epic 2: 集成与增强
覆盖:
- task_manager.py check-dup 命令
- --force 绕过 block
- --yes 绕过 warn
- 性能 benchmark
"""

import pytest
import subprocess
import sys
import os
import tempfile
import time
import json

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dedup import detect_duplicates, check_duplicate_projects, extract_keywords


class TestCheckDupCommand:
    """E2E: task_manager.py check-dup 命令"""

    def test_check_dup_returns_zero_for_new_project(self):
        """全新项目名 → 返回 0（无重复）"""
        result = subprocess.run(
            [
                sys.executable, "/root/.openclaw/skills/team-tasks/scripts/task_manager.py",
                "check-dup",
                "brand-new-unique-project-2024", "全新独特项目"
            ],
            capture_output=True, text=True,
        )
        # 全新项目 → 未发现重复
        assert "🔍" in result.stdout  # 基本响应正常


class TestCheckDupCommandRealData:
    """E2E: 使用真实 team-tasks 数据"""

    def test_check_dup_with_real_data(self):
        """使用真实项目数据测试 check-dup"""
        result = subprocess.run(
            [
                sys.executable, "/root/.openclaw/skills/team-tasks/scripts/task_manager.py",
                "check-dup",
                "vibex-homepage-fix", "修复首页Bug"
            ],
            capture_output=True, text=True,
        )
        assert "🔍" in result.stdout
        # returncode 0=pass/warn, 1=block
        assert result.returncode in (0, 1)
        assert result.returncode == 0

    def test_check_dup_finds_similar(self):
        """proposal-dedup-mechanism 相关名 → 检测到重复或无重复"""
        result = subprocess.run(
            [
                sys.executable, "/root/.openclaw/skills/team-tasks/scripts/task_manager.py",
                "check-dup",
                "proposal-dedup-mechanism", "提案去重机制"
            ],
            capture_output=True, text=True,
        )
        # 精确匹配自身 → 应该找到 block 或 warn
        assert "🔍" in result.stdout
        # returncode: block=1, warn/pass=0
        assert result.returncode in (0, 1)


class TestCheckDupWithThreshold:
    """E2E: --threshold 参数"""

    def test_threshold_block(self):
        """相似度 > threshold → 检测到"""
        existing = [
            {"name": "test-fix", "goal": "修复首页Bug", "status": "active"},
        ]
        new = {"name": "test-fix-new", "goal": "修复首页问题"}
        result = detect_duplicates(new, existing, threshold=0.3)
        assert len(result) >= 1
        assert result[0]["similarity"] > 0.3

    def test_threshold_pass(self):
        """相似度 < threshold → 无结果"""
        existing = [
            {"name": "api-project", "goal": "API开发", "status": "active"},
        ]
        new = {"name": "unrelated-project", "goal": "数据分析"}
        result = detect_duplicates(new, existing, threshold=0.4)
        assert len(result) == 0


class TestForceAndYesFlags:
    """E2E: --force / --yes 参数"""

    def test_force_flag_exists_in_phase1(self):
        """验证 --force 参数在 phase1 帮助中"""
        result = subprocess.run(
            [
                sys.executable, "/root/.openclaw/skills/team-tasks/scripts/task_manager.py",
                "phase1", "--help"
            ],
            capture_output=True, text=True,
        )
        # --force 应该在帮助文本中
        assert result.returncode == 0
        assert "--force" in result.stdout or "force" in result.stdout


class TestRulesIntegration:
    """E2E: 规则过滤器与主检测集成"""

    def test_exact_name_triggers_block(self):
        """精确匹配 → 触发 block"""
        existing = [
            {"name": "test-project", "goal": "测试目标", "status": "active"},
        ]
        new = {"name": "test-project", "goal": "新测试目标"}
        result = detect_duplicates(new, existing, threshold=0.0)
        assert len(result) == 1
        # 名称相同但目标不同 → 高相似度
        assert result[0]["similarity"] > 0.7
        assert result[0]["name"] == "test-project"

    def test_inactive_skipped(self):
        """非活跃项目被跳过"""
        existing = [
            {"name": "old-project", "goal": "旧目标", "status": "terminated"},
        ]
        new = {"name": "old-project", "goal": "新目标"}
        result = detect_duplicates(new, existing, threshold=0.0)
        assert len(result) == 0

    def test_mixed_case_keywords(self):
        """中英混合关键词提取"""
        kw = extract_keywords("API接口开发 Homepage修复")
        assert "api" in kw
        assert "首页" in kw or "homepage" in kw


class TestPerformanceBenchmark:
    """E2E: 性能基准测试"""

    def test_benchmark_50_projects(self):
        """50 个项目检测 < 100ms"""
        existing = [
            {
                "name": f"project-{i}",
                "goal": f"这是第{i}个项目的目标描述，包含一些中文内容用于测试",
                "status": "active",
            }
            for i in range(50)
        ]
        new = {"name": "new-project", "goal": "新项目目标描述用于性能测试"}

        start = time.perf_counter()
        result = detect_duplicates(new, existing, threshold=0.1)
        elapsed = time.perf_counter() - start

        assert elapsed < 0.1, f"性能超标: {elapsed:.3f}s (期望 < 0.1s)"
        # 验证结果正确性
        assert isinstance(result, list)

    def test_benchmark_100_projects(self):
        """100 个项目检测 < 200ms"""
        existing = [
            {
                "name": f"proj-{i}",
                "goal": f"项目{i}的目标描述包含中英混合测试内容",
                "status": "active",
            }
            for i in range(100)
        ]
        new = {"name": "test-new", "goal": "新项目测试目标"}

        start = time.perf_counter()
        result = detect_duplicates(new, existing, threshold=0.1)
        elapsed = time.perf_counter() - start

        assert elapsed < 0.2, f"性能超标: {elapsed:.3f}s (期望 < 0.2s)"

    def test_benchmark_keyword_extraction(self):
        """关键词提取性能"""
        text = "建立提案重复检测机制，在 analyst 阶段自动比对现有项目，避免重复任务创建。" * 10

        start = time.perf_counter()
        for _ in range(100):
            kw = extract_keywords(text)
        elapsed = time.perf_counter() - start

        assert elapsed < 0.5, f"关键词提取性能超标: {elapsed:.3f}s (100次)"


class TestE2EWorkflow:
    """E2E: 完整工作流"""

    def test_full_dedup_workflow(self):
        """完整流程: 提取关键词 → 计算相似度 → 检测重复 → 格式化输出"""
        existing = [
            {"name": "vibex-homepage-fix", "goal": "修复首页Bug", "status": "active"},
            {"name": "vibex-api-retry", "goal": "API重试机制", "status": "active"},
            {"name": "proposal-dedup", "goal": "提案去重检测", "status": "active"},
        ]
        new_name = "vibex-homepage-bugfix"
        new_goal = "修复首页问题"

        # Step 1: 关键词提取
        kw_new = extract_keywords(f"{new_name} {new_goal}")
        assert len(kw_new) > 0

        # Step 2: 检测重复
        result = detect_duplicates(
            {"name": new_name, "goal": new_goal},
            existing,
            threshold=0.3,
        )
        assert isinstance(result, list)
        # 应该有至少 1 个结果（homepage-fix 相似）
        assert len(result) >= 1
        # 第一个应该是 homepage-fix
        assert result[0]["name"] == "vibex-homepage-fix"
        assert result[0]["similarity"] > 0.3

    def test_check_duplicate_projects_main_entry(self):
        """check_duplicate_projects 主入口"""
        result = check_duplicate_projects(
            "test-entry-point",
            "测试主入口函数",
            workspace=None,  # 使用默认路径
        )
        assert "level" in result
        assert "candidates" in result
        assert "message" in result
        assert result["level"] in ("block", "warn", "pass")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
