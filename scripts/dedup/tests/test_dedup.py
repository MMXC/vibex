"""
test_dedup.py - 提案重复检测核心算法测试

覆盖:
- test_extract_keywords
- test_similarity_score
- test_alert_level
- test_detect_duplicates
- test_check_duplicate_projects
"""

import pytest
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dedup import (
    extract_keywords,
    similarity_score,
    detect_duplicates,
    alert_level,
    check_duplicate_projects,
    format_alert_message,
    ProjectInfo,
    STOPWORDS,
)


class TestExtractKeywords:
    """F1: 关键词提取测试"""
    
    def test_basic_chinese(self):
        """测试基本中文分词"""
        kw = extract_keywords("建立提案重复检测机制")
        assert "提案" in kw
        assert "重复" in kw
        assert "检测" in kw
        assert "机制" in kw
    
    def test_chinese_stopwords_filter(self):
        """测试中文停用词过滤"""
        kw = extract_keywords("这是测试用的中文句子")
        assert "的" not in kw
        assert "是" not in kw
        assert "用" not in kw  # 长度=1
    
    def test_english_stopwords_filter(self):
        """测试英文停用词过滤"""
        kw = extract_keywords("the quick brown fox")
        assert "the" not in kw
        assert "a" not in kw
        assert "quick" in kw
        assert "brown" in kw
        assert "fox" in kw
    
    def test_short_word_filter(self):
        """测试短词过滤（长度 < 2）"""
        kw = extract_keywords("ab cd ef")
        assert "a" not in kw
        assert "ab" in kw
        assert "cd" in kw
        assert "ef" in kw
    
    def test_case_insensitive(self):
        """测试大小写不敏感"""
        kw = extract_keywords("Test PROJECT Name")
        assert "test" in kw
        assert "project" in kw
        assert "name" in kw
        assert "TEST" not in kw  # 已经转为小写
    
    def test_empty_string(self):
        """测试空字符串"""
        kw = extract_keywords("")
        assert kw == set()
    
    def test_none_input(self):
        """测试 None 输入"""
        kw = extract_keywords(None)
        assert kw == set()
    
    def test_mixed_chinese_english(self):
        """测试中英混合"""
        kw = extract_keywords("API接口开发")
        assert "api" in kw
        assert "接口" in kw
        assert "开发" in kw


class TestSimilarityScore:
    """F2: 相似度计算测试"""
    
    def test_identical_projects(self):
        """测试完全相同的项目"""
        p1 = {"name": "test-project", "goal": "修复首页Bug"}
        p2 = {"name": "test-project", "goal": "修复首页Bug"}
        score = similarity_score(p1, p2)
        assert score == 1.0
    
    def test_different_projects(self):
        """测试完全不同的项目"""
        p1 = {"name": "test-project", "goal": "修复首页Bug"}
        p3 = {"name": "diff-project", "goal": "完全不同的功能"}
        score = similarity_score(p1, p3)
        assert score < 0.3
    
    def test_similar_goal(self):
        """测试相似目标"""
        p1 = {"name": "homepage-fix", "goal": "修复首页Bug"}
        p2 = {"name": "homepage-bug-fix", "goal": "修复首页问题"}
        score = similarity_score(p1, p2)
        assert score > 0.3  # 应该有较高相似度
    
    def test_empty_name(self):
        """测试空项目名"""
        p1 = {"name": "", "goal": "修复Bug"}
        p2 = {"name": "test", "goal": "修复Bug"}
        score = similarity_score(p1, p2)
        assert score == 0.0
    
    def test_empty_goal(self):
        """测试空目标（但项目名相同）"""
        p1 = {"name": "test", "goal": ""}
        p2 = {"name": "test", "goal": "修复Bug"}
        score = similarity_score(p1, p2)
        # 项目名相同，所以有相似度
        assert score > 0.0
    
    def test_both_empty(self):
        """测试两者都为空"""
        p1 = {"name": "", "goal": ""}
        p2 = {"name": "", "goal": ""}
        score = similarity_score(p1, p2)
        assert score == 0.0


class TestAlertLevel:
    """F4: 告警机制测试"""
    
    def test_block_high_similarity(self):
        """测试高相似度 → block"""
        assert alert_level(0.8) == "block"
        assert alert_level(0.75) == "block"
        assert alert_level(1.0) == "block"
    
    def test_warn_medium_similarity(self):
        """测试中等相似度 → warn"""
        assert alert_level(0.7) == "warn"
        assert alert_level(0.5) == "warn"
        assert alert_level(0.4) == "warn"
    
    def test_pass_low_similarity(self):
        """测试低相似度 → pass"""
        assert alert_level(0.39) == "pass"
        assert alert_level(0.2) == "pass"
        assert alert_level(0.0) == "pass"


class TestDetectDuplicates:
    """F3: 重复检测测试"""
    
    def test_detect_similar_project(self):
        """测试检测相似项目"""
        existing = [
            {"name": "homepage-fix", "goal": "修复首页Bug", "status": "active"},
            {"name": "api-retry", "goal": "API重试机制", "status": "active"},
        ]
        new = {"name": "homepage-bug-fix", "goal": "修复首页问题"}
        result = detect_duplicates(new, existing, threshold=0.3)
        assert len(result) >= 1
        assert result[0]["name"] == "homepage-fix"
    
    def test_no_duplicates(self):
        """测试无重复"""
        existing = [
            {"name": "homepage-fix", "goal": "修复首页Bug", "status": "active"},
        ]
        new = {"name": "api-retry", "goal": "API重试机制"}
        result = detect_duplicates(new, existing, threshold=0.4)
        assert len(result) == 0
    
    def test_skip_inactive(self):
        """测试跳过非活跃项目"""
        existing = [
            {"name": "old-project", "goal": "旧项目", "status": "terminated"},
            {"name": "homepage-fix", "goal": "修复首页Bug", "status": "active"},
        ]
        new = {"name": "new-project", "goal": "修复首页问题"}
        result = detect_duplicates(new, existing, threshold=0.3)
        assert all(r["name"] != "old-project" for r in result)
    
    def test_sorted_by_similarity(self):
        """测试按相似度降序排列"""
        existing = [
            {"name": "homepage-fix", "goal": "修复首页Bug", "status": "active"},
            {"name": "homepage-other", "goal": "修复其他页面", "status": "active"},
        ]
        new = {"name": "homepage-fix", "goal": "修复首页Bug"}
        result = detect_duplicates(new, existing, threshold=0.1)
        
        if len(result) >= 2:
            assert result[0]["similarity"] >= result[1]["similarity"]
        
        # 第一个应该是完全相同的项目
        assert result[0]["name"] == "homepage-fix"
        assert result[0]["similarity"] == 1.0


class TestFormatAlertMessage:
    """告警消息格式化测试"""
    
    def test_block_message(self):
        """测试 block 消息"""
        candidates = [
            {"name": "test", "goal": "测试目标", "similarity": 0.8}
        ]
        msg = format_alert_message("block", candidates)
        assert "❌" in msg
        assert "test" in msg
        assert "0.80" in msg
    
    def test_warn_message(self):
        """测试 warn 消息"""
        candidates = [
            {"name": "test", "goal": "测试目标", "similarity": 0.5}
        ]
        msg = format_alert_message("warn", candidates)
        assert "⚠️" in msg
        assert "test" in msg
    
    def test_pass_message(self):
        """测试 pass 消息"""
        msg = format_alert_message("pass", [])
        assert "✅" in msg
        assert "未发现" in msg


class TestProjectInfo:
    """数据模型测试"""
    
    def test_to_dict(self):
        """测试转字典"""
        proj = ProjectInfo(
            name="test",
            goal="测试目标",
            status="active",
            created="2024-01-01",
            mode="linear"
        )
        d = proj.to_dict()
        assert d["name"] == "test"
        assert d["goal"] == "测试目标"
        assert d["status"] == "active"
    
    def test_from_dict(self):
        """测试从字典创建"""
        data = {
            "name": "test",
            "goal": "测试目标",
            "status": "active",
        }
        proj = ProjectInfo.from_dict(data)
        assert proj.name == "test"
        assert proj.goal == "测试目标"
        assert proj.status == "active"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
