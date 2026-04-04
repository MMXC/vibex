"""
test_priority_calculator.py — 优先级算法测试

Run: pytest test_priority_calculator.py -v
E4-F1: 验证优先级计算器支持 --urgency 和数值模式
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from priority_calculator import calculate_priority


class TestPriorityCalculatorNumeric:
    """数值模式: impact/urgency/effort = 1-10
    E4-F1 acceptance: --impact 9 --urgency 9 --effort 3 → P0
    """

    def test_e4_acceptance_high_impact_high_urgency_low_effort(self):
        """E4-F1: impact=9, urgency=9, effort=3 → P0"""
        # Score = 9 + 9 + (11-3) + 0 = 26 → P0 (>= 25)
        assert calculate_priority("9", "9", "3") == "P0"

    def test_high_impact_high_urgency_small_effort_no_revenue(self):
        # Score = 9 + 9 + 8 = 26 → P0
        assert calculate_priority("9", "9", "3", False) == "P0"

    def test_high_impact_high_urgency_small_effort_with_revenue(self):
        # Score = 9 + 9 + 8 + 15 = 41 → P0
        assert calculate_priority("9", "9", "3", True) == "P0"

    def test_medium_impact_medium_urgency_medium_effort(self):
        # Score = 5 + 5 + 6 = 16 → P2 (>= 10, < 18)
        assert calculate_priority("5", "5", "5") == "P2"

    def test_low_impact_low_urgency_large_effort(self):
        # Score = 2 + 2 + 1 = 5 → P3 (< 10)
        assert calculate_priority("2", "2", "10") == "P3"

    def test_boundary_p0_high(self):
        # Score = 10 + 10 + 10 = 30 → P0
        assert calculate_priority("10", "10", "1") == "P0"

    def test_boundary_p0_minimum(self):
        # Score = 9 + 9 + 7 = 25 → P0 (exactly at threshold)
        assert calculate_priority("9", "9", "4") == "P0"

    def test_boundary_p1(self):
        # Score = 9 + 5 + 4 = 18 → P1 (exactly at threshold)
        assert calculate_priority("9", "5", "7") == "P1"

    def test_boundary_p2(self):
        # Score = 5 + 3 + 2 = 10 → P2 (exactly at threshold)
        assert calculate_priority("5", "3", "9") == "P2"

    def test_p1_with_high_urgency(self):
        # Score = 5 + 9 + 4 = 18 → P1
        assert calculate_priority("5", "9", "7") == "P1"


class TestPriorityCalculatorCategorical:
    """分类模式: impact/urgency/effort = high/medium/low"""

    def test_high_impact_high_urgency_small_effort_no_revenue(self):
        # Score = 30+30+10 = 70 → P0
        assert calculate_priority("high", "high", "small", False) == "P0"

    def test_high_impact_high_urgency_small_effort_with_revenue(self):
        # Score = 30+30+10+15 = 85 → P0
        assert calculate_priority("high", "high", "small", True) == "P0"

    def test_high_impact_medium_urgency_small_effort_no_revenue(self):
        # Score = 30+20+10 = 60 → P0
        assert calculate_priority("high", "medium", "small", False) == "P0"

    def test_high_impact_medium_urgency_medium_effort_no_revenue(self):
        # Score = 30+20+5 = 55 → P0
        assert calculate_priority("high", "medium", "medium", False) == "P0"

    def test_medium_impact_medium_urgency_small_effort_with_revenue(self):
        # Score = 20+20+10+15 = 65 → P0
        assert calculate_priority("medium", "medium", "small", True) == "P0"

    def test_medium_impact_medium_urgency_small_effort_no_revenue(self):
        # Score = 20+20+10 = 50 → P0
        assert calculate_priority("medium", "medium", "small", False) == "P0"

    def test_medium_impact_medium_urgency_medium_effort_no_revenue(self):
        # Score = 20+20+5 = 45 → P1 (>= 35)
        assert calculate_priority("medium", "medium", "medium", False) == "P1"

    def test_low_impact_medium_urgency_small_effort_no_revenue(self):
        # Score = 10+20+10 = 40 → P1
        assert calculate_priority("low", "medium", "small", False) == "P1"

    def test_low_impact_medium_urgency_large_effort_no_revenue(self):
        # Score = 10+20+0 = 30 → P2 (P1 threshold = 35)
        assert calculate_priority("low", "medium", "large", False) == "P2"

    def test_low_impact_low_urgency_large_effort_no_revenue(self):
        # Score = 10+10+0 = 20 → P2 (exactly at P2 threshold)
        assert calculate_priority("low", "low", "large", False) == "P2"

    def test_case_insensitive(self):
        assert calculate_priority("HIGH", "HIGH", "SMALL", True) == "P0"
        assert calculate_priority("High", "High", "Small", True) == "P0"

    def test_invalid_impact_defaults_to_zero(self):
        # Score = 0+20+10 = 30 → P2 (P1 threshold = 35)
        assert calculate_priority("invalid", "medium", "small", False) == "P2"
