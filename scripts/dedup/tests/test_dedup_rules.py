"""
test_dedup_rules.py - 规则过滤器测试

覆盖:
- test_exact_name_match
- test_prefix_date_match
- test_high_risk_term_match
- test_rule_filter
"""

import pytest
import sys
import os
from datetime import datetime, timedelta

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dedup_rules import (
    exact_name_match,
    prefix_date_match,
    high_risk_term_match,
    rule_filter,
    check_with_rules,
    parse_date,
    HIGH_RISK_TERMS,
)


class TestExactNameMatch:
    """规则1: 精确匹配测试"""
    
    def test_exact_match(self):
        """测试精确匹配"""
        existing = [
            {"name": "test-project", "goal": "测试", "status": "active"},
            {"name": "other-project", "goal": "其他", "status": "active"},
        ]
        result = exact_name_match("test-project", existing)
        assert len(result) == 1
        assert result[0]["name"] == "test-project"
        assert result[0]["rule"] == "exact-name"
        assert result[0]["severity"] == "high"
    
    def test_no_match(self):
        """测试无匹配"""
        existing = [
            {"name": "test-project", "goal": "测试", "status": "active"},
        ]
        result = exact_name_match("different-project", existing)
        assert len(result) == 0
    
    def test_skip_inactive(self):
        """测试跳过非活跃项目"""
        existing = [
            {"name": "test-project", "goal": "测试", "status": "terminated"},
        ]
        result = exact_name_match("test-project", existing)
        assert len(result) == 0


class TestPrefixDateMatch:
    """规则2: 前缀+日期测试"""
    
    def test_same_prefix(self):
        """测试相同前缀"""
        existing = [
            {"name": "vibex-homepage-fix", "goal": "修复", "status": "active", "created": "2024-01-01"},
            {"name": "vibex-api-fix", "goal": "API", "status": "active", "created": "2024-01-01"},
        ]
        result = prefix_date_match("vibex-homepage-new", datetime(2024, 1, 3), existing)
        assert len(result) == 1
        assert result[0]["name"] == "vibex-homepage-fix"
    
    def test_date_within_7_days(self):
        """测试7天内日期"""
        new_date = datetime(2024, 1, 10)
        existing = [
            {"name": "vibex-project", "goal": "测试", "status": "active", "created": "2024-01-05"},
        ]
        result = prefix_date_match("vibex-new", new_date, existing)
        assert len(result) == 1
    
    def test_date_outside_7_days(self):
        """测试超过7天"""
        new_date = datetime(2024, 1, 20)
        existing = [
            {"name": "vibex-project", "goal": "测试", "status": "active", "created": "2024-01-01"},
        ]
        result = prefix_date_match("vibex-new", new_date, existing)
        assert len(result) == 0
    
    def test_no_prefix(self):
        """测试无前缀"""
        existing = [
            {"name": "random-name", "goal": "测试", "status": "active"},
        ]
        result = prefix_date_match("random-name", datetime.now(), existing)
        # 无前缀匹配，应该返回所有包含该名称的项目（相同名称）
        # 这个测试根据实现可能需要调整


class TestHighRiskTermMatch:
    """规则3: 高风险词测试"""
    
    def test_high_risk_overlap(self):
        """测试高风险词重叠（使用英文：len>=3 + 非停用词）"""
        existing = [
            {"name": "homepage-fix", "goal": "fix homepage bug test", "status": "active"},
        ]
        result = high_risk_term_match("fix homepage review", existing)
        assert len(result) >= 1
        assert result[0]["name"] == "homepage-fix"
        assert result[0]["rule"] == "high-risk-term"
    
    def test_no_overlap(self):
        """测试无重叠"""
        existing = [
            {"name": "api-project", "goal": "API开发", "status": "active"},
        ]
        result = high_risk_term_match("数据分析", existing)
        assert len(result) == 0
    
    def test_single_overlap(self):
        """测试单次重叠（不触发）"""
        existing = [
            {"name": "test-project", "goal": "测试功能", "status": "active"},
        ]
        result = high_risk_term_match("修复一个问题", existing)
        # 只有"修复"是高风险词，但现有项目只有"测试"，重叠=1 < 2
        # 应该不触发
        assert len(result) == 0


class TestRuleFilter:
    """综合规则过滤器测试"""
    
    def test_exact_match_first(self):
        """测试精确匹配优先"""
        existing = [
            {"name": "test", "goal": "测试", "status": "active"},
            {"name": "test-api", "goal": "API开发", "status": "active"},
        ]
        new_project = {"name": "test", "goal": "新测试"}
        result = rule_filter(new_project, existing)
        
        assert result[0]["name"] == "test"
        assert result[0]["rule"] == "exact-name"
        assert result[0]["severity"] == "high"
    
    def test_deduplication(self):
        """测试去重：同一项目不应出现多次"""
        existing = [
            {"name": "test", "goal": "测试修复", "status": "active"},
        ]
        new_project = {"name": "test", "goal": "修复Bug"}
        result = rule_filter(new_project, existing)
        
        names = [r["name"] for r in result]
        assert len(names) == len(set(names))  # 无重复
    
    def test_severity_order(self):
        """测试按 severity 排序"""
        existing = [
            {"name": "low-risk", "goal": "数据分析", "status": "active"},
            {"name": "test-fix", "goal": "修复Bug", "status": "active"},
        ]
        new_project = {"name": "test-fix", "goal": "修复问题"}
        result = rule_filter(new_project, existing)
        
        # high 应在 low 之前
        severity_order = [r.get("severity") for r in result]
        assert severity_order == sorted(severity_order, key=lambda x: {"high": 0, "medium": 1, "low": 2}.get(x, 3))


class TestParseDate:
    """日期解析测试"""
    
    def test_parse_standard_format(self):
        """测试标准格式"""
        assert parse_date("2024-01-15") is not None
        assert parse_date("2024/01/15") is not None
    
    def test_parse_iso_format(self):
        """测试 ISO 格式"""
        result = parse_date("2024-01-15T10:30:00")
        assert result is not None
    
    def test_parse_invalid(self):
        """测试无效日期"""
        assert parse_date("") is None
        assert parse_date("invalid") is None


class TestCheckWithRules:
    """规则检查主入口测试"""
    
    def test_no_match(self):
        """测试无匹配"""
        existing = [
            {"name": "unrelated", "goal": "数据分析", "status": "active"},
        ]
        # Mock load_existing_projects
        import dedup
        original = dedup.load_existing_projects
        dedup.load_existing_projects = lambda w=None: existing
        
        try:
            result = check_with_rules("new-project", "新项目目标")
            assert result["has_match"] is False
        finally:
            dedup.load_existing_projects = original


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
