#!/usr/bin/env python3
"""
priority_calculator.py — 提案优先级计算器

根据 impact/effort/revenue 计算提案优先级 P0-P3

Usage:
    python3 priority_calculator.py                    # 交互模式
    python3 priority_calculator.py --impact high --effort small --revenue   # 命令行模式
"""

import argparse
import sys


def calculate_priority(
    impact: str = "medium",  # high (+30) / medium (+20) / low (+10)
    effort: str = "medium",   # small (+10) / medium (+5) / large (+0)
    revenue: bool = False,    # +15 if True
) -> str:
    """Calculate priority based on impact, effort, and revenue."""
    IMPACT_SCORES = {"high": 30, "medium": 20, "low": 10}
    EFFORT_SCORES = {"small": 10, "medium": 5, "large": 0}

    impact_score = IMPACT_SCORES.get(impact.lower(), 0)
    effort_score = EFFORT_SCORES.get(effort.lower(), 0)
    revenue_score = 15 if revenue else 0

    total = impact_score + effort_score + revenue_score

    if total >= 50:
        return "P0"
    elif total >= 35:
        return "P1"
    elif total >= 20:
        return "P2"
    else:
        return "P3"


def main():
    parser = argparse.ArgumentParser(description="提案优先级计算器")
    parser.add_argument("--impact", choices=["high", "medium", "low"], default="medium")
    parser.add_argument("--effort", choices=["small", "medium", "large"], default="medium")
    parser.add_argument("--revenue", action="store_true")
    args = parser.parse_args()

    if len(sys.argv) == 1:
        # Interactive mode
        impact = input("Impact (high/medium/low) [medium]: ").strip() or "medium"
        effort = input("Effort (small/medium/large) [medium]: ").strip() or "medium"
        revenue = input("Revenue impact? (y/N): ").strip().lower() == "y"
        priority = calculate_priority(impact, effort, revenue)
        print(f"Priority: {priority}")
    else:
        priority = calculate_priority(args.impact, args.effort, args.revenue)
        print(priority)


if __name__ == "__main__":
    main()
