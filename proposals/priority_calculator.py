#!/usr/bin/env python3
"""
priority_calculator.py — 提案优先级计算器

根据 impact/urgency/effort 计算提案优先级 P0-P3

Usage:
    python3 priority_calculator.py                    # 交互模式
    python3 priority_calculator.py --impact 9 --urgency 9 --effort 3   # 命令行模式（数值 1-10）
    python3 priority_calculator.py --impact high --urgency medium --effort small --revenue  # 分类模式
"""

import argparse
import sys


# 数值模式阈值：impact + urgency + (11 - effort) + revenue_bonus
# impact 1-10, urgency 1-10, effort 1-10
# P0: >= 25, P1: >= 18, P2: >= 10, P3: < 10
NUMERIC_THRESHOLDS = {"P0": 25, "P1": 18, "P2": 10}

# 分类模式分数
IMPACT_SCORES = {"high": 30, "medium": 20, "low": 10}
EFFORT_SCORES = {"small": 10, "medium": 5, "large": 0}
URGENCY_SCORES = {"high": 30, "medium": 20, "low": 10}
CATEGORICAL_THRESHOLDS = {"P0": 50, "P1": 35, "P2": 20}


def calculate_priority(
    impact: str = "medium",
    urgency: str = "medium",
    effort: str = "medium",
    revenue: bool = False,
) -> str:
    """Calculate priority based on impact, urgency, effort, and revenue.

    Supports two modes:
    - Numeric (1-10): --impact 9 --urgency 9 --effort 3
    - Categorical: --impact high --urgency medium --effort small
    """
    # Detect numeric mode
    try:
        impact_n = int(impact)
        urgency_n = int(urgency)
        effort_n = int(effort)
        is_numeric = all(1 <= v <= 10 for v in [impact_n, urgency_n, effort_n])
    except (ValueError, TypeError):
        is_numeric = False

    if is_numeric:
        impact_n = int(impact)
        urgency_n = int(urgency)
        effort_n = int(effort)
        # Score = impact + urgency + (11 - effort) + revenue bonus
        # effort 1=small (max bonus), effort 10=large (no bonus)
        effort_bonus = 11 - effort_n
        revenue_bonus = 15 if revenue else 0
        total = impact_n + urgency_n + effort_bonus + revenue_bonus
    else:
        impact_s = str(impact).lower()
        urgency_s = str(urgency).lower()
        effort_s = str(effort).lower()
        impact_score = IMPACT_SCORES.get(impact_s, 0)
        urgency_score = URGENCY_SCORES.get(urgency_s, 0)
        effort_score = EFFORT_SCORES.get(effort_s, 0)
        revenue_score = 15 if revenue else 0
        total = impact_score + urgency_score + effort_score + revenue_score

    if is_numeric:
        if total >= NUMERIC_THRESHOLDS["P0"]:
            return "P0"
        elif total >= NUMERIC_THRESHOLDS["P1"]:
            return "P1"
        elif total >= NUMERIC_THRESHOLDS["P2"]:
            return "P2"
        else:
            return "P3"
    else:
        if total >= CATEGORICAL_THRESHOLDS["P0"]:
            return "P0"
        elif total >= CATEGORICAL_THRESHOLDS["P1"]:
            return "P1"
        elif total >= CATEGORICAL_THRESHOLDS["P2"]:
            return "P2"
        else:
            return "P3"


def main():
    parser = argparse.ArgumentParser(description="提案优先级计算器")
    parser.add_argument(
        "--impact",
        default="medium",
        help="影响度: 数值 1-10 或 分类 high/medium/low (默认: medium)",
    )
    parser.add_argument(
        "--urgency",
        default="medium",
        help="紧急度: 数值 1-10 或 分类 high/medium/low (默认: medium)",
    )
    parser.add_argument(
        "--effort",
        default="medium",
        help="工作量: 数值 1-10 或 分类 small/medium/large (默认: medium)",
    )
    parser.add_argument(
        "--revenue", action="store_true", help="是否有收入影响 (+15 bonus)"
    )
    args = parser.parse_args()

    if len(sys.argv) == 1:
        # Interactive mode
        impact = input("Impact (1-10 或 high/medium/low) [medium]: ").strip() or "medium"
        urgency = input("Urgency (1-10 或 high/medium/low) [medium]: ").strip() or "medium"
        effort = input("Effort (1-10 或 small/medium/large) [medium]: ").strip() or "medium"
        revenue = input("Revenue impact? (y/N): ").strip().lower() == "y"
        priority = calculate_priority(impact, urgency, effort, revenue)
        print(f"Priority: {priority}")
    else:
        priority = calculate_priority(args.impact, args.urgency, args.effort, args.revenue)
        print(priority)


if __name__ == "__main__":
    main()

