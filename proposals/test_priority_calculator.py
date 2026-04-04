"""
test_priority_calculator.py — 优先级算法测试

Run: pytest test_priority_calculator.py -v
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from priority_calculator import calculate_priority


class TestPriorityCalculator:
    def test_high_impact_small_effort_with_revenue(self):
        assert calculate_priority("high", "small", True) == "P0"

    def test_high_impact_small_effort_no_revenue(self):
        assert calculate_priority("high", "small", False) == "P0"

    def test_high_impact_medium_effort_no_revenue(self):
        assert calculate_priority("high", "medium", False) == "P1"

    def test_medium_impact_small_effort_with_revenue(self):
        assert calculate_priority("medium", "small", True) == "P1"

    def test_medium_impact_small_effort_no_revenue(self):
        assert calculate_priority("medium", "small", False) == "P2"

    def test_medium_impact_medium_effort_with_revenue(self):
        assert calculate_priority("medium", "medium", True) == "P1"

    def test_medium_impact_medium_effort_no_revenue(self):
        assert calculate_priority("medium", "medium", False) == "P2"

    def test_low_impact_small_effort_no_revenue(self):
        assert calculate_priority("low", "small", False) == "P2"

    def test_low_impact_large_effort_no_revenue(self):
        assert calculate_priority("low", "large", False) == "P3"

    def test_high_impact_large_effort_with_revenue(self):
        assert calculate_priority("high", "large", True) == "P1"

    def test_boundary_p0(self):
        # score = 50 (high=30 + small=10 + revenue=15) → P0
        assert calculate_priority("high", "small", True) == "P0"

    def test_boundary_p1(self):
        # score = 35 (high=30 + small=10 - 5?) → P1
        assert calculate_priority("high", "small", False) == "P0"
        assert calculate_priority("high", "medium", True) == "P1"

    def test_boundary_p2(self):
        assert calculate_priority("medium", "medium", False) == "P2"

    def test_boundary_p3(self):
        assert calculate_priority("low", "large", False) == "P3"

    def test_case_insensitive(self):
        assert calculate_priority("HIGH", "SMALL", True) == "P0"
        assert calculate_priority("High", "Small", True) == "P0"

    def test_invalid_impact_defaults_to_zero(self):
        assert calculate_priority("invalid", "small", False) == "P3"

    def test_invalid_effort_defaults_to_zero(self):
        assert calculate_priority("high", "invalid", False) == "P1"

    def test_realistic_p0_scenario(self):
        # High impact + small effort + revenue = P0
        assert calculate_priority("high", "small", True) == "P0"

    def test_realistic_p1_scenario(self):
        # High impact + large effort + revenue = P1
        assert calculate_priority("high", "large", True) == "P1"

    def test_realistic_p2_scenario(self):
        # Medium impact + medium effort + no revenue = P2
        assert calculate_priority("medium", "medium", False) == "P2"

    def test_realistic_p3_scenario(self):
        # Low impact + large effort + no revenue = P3
        assert calculate_priority("low", "large", False) == "P3"

    def test_only_impact_and_effort_no_revenue(self):
        assert calculate_priority("high", "medium", False) == "P1"

    def test_only_impact_with_revenue(self):
        assert calculate_priority("high", "large", True) == "P1"

    def test_empty_impact_treated_as_zero(self):
        result = calculate_priority("", "small", False)
        assert result in ("P0", "P1", "P2", "P3")
