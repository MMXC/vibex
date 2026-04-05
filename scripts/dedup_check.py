#!/usr/bin/env python3
"""
dedup_check.py — CLI wrapper for the dedup REST API

Usage:
  python3 dedup_check.py "project-name" "project-goal"

Exit codes:
  0 = passed (no duplicates or user approved)
  1 = blocked (high similarity, blocked by default)
  2 = warn (medium similarity, printed warning but allowed)
  3 = error (API unreachable or invalid input)
"""

import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

DEDUP_API_URL = os.environ.get("DEDUP_API_URL", "http://localhost:8765")
TIMEOUT_SEC = 5


def call_dedup_api(name: str, goal: str) -> dict:
    """Call the dedup REST API."""
    payload = json.dumps({"name": name, "goal": goal}).encode("utf-8")
    req = urllib.request.Request(
        f"{DEDUP_API_URL}/dedup",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=TIMEOUT_SEC) as resp:
        return json.loads(resp.read().decode("utf-8"))


def check_and_exit(name: str, goal: str, force: bool = False) -> int:
    """Call API, print result, exit with appropriate code."""
    try:
        result = call_dedup_api(name, goal)
    except urllib.error.URLError as e:
        print(f"⚠️  [dedup] API 不可用 ({DEDUP_API_URL}): {e}", file=sys.stderr)
        print("   继续创建项目（dedup API 非阻塞）", file=sys.stderr)
        return 0  # Non-blocking: allow to continue
    except Exception as e:
        print(f"❌ [dedup] API 调用失败: {e}", file=sys.stderr)
        return 0  # Non-blocking

    level = result.get("level", "pass")
    candidates = result.get("candidates", [])
    message = result.get("message", "")

    print(f"\n🔍 [dedup] 检查项目: {name}")
    print(f"   目标: {goal[:60]}{'...' if len(goal) > 60 else ''}")
    print()

    if level == "block":
        print(f"❌ {message}")
        if candidates:
            for c in candidates[:5]:
                print(f"   • {c.get('name', '?')} (相似度 {c.get('similarity', 0):.2f})")
        print()
        print("   阻断：项目目标与现有活跃项目高度相似。")
        print("   如需强制创建，请设置环境变量 DEDUP_FORCE=1")
        if os.environ.get("DEDUP_FORCE") == "1":
            print("\n   ⚠️  DEDUP_FORCE=1，强制继续...")
            return 0
        return 1

    elif level == "warn":
        print(f"⚠️  {message}")
        if candidates:
            for c in candidates[:5]:
                print(f"   • {c.get('name', '?')} (相似度 {c.get('similarity', 0):.2f})")
        print()
        if force or os.environ.get("DEDUP_FORCE") == "1":
            print("   ⚠️  强制创建（--force 或 DEDUP_FORCE=1）")
            return 0
        print("   建议确认后再创建，或设置 DEDUP_FORCE=1 强制继续")
        return 2

    else:
        print(f"{message}")
        return 0


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="提案查重 CLI")
    parser.add_argument("name", help="项目名称")
    parser.add_argument("goal", help="项目目标")
    parser.add_argument("--force", action="store_true", help="强制创建（跳过 warn 确认）")
    args = parser.parse_args()

    code = check_and_exit(args.name, args.goal, force=args.force)
    sys.exit(code)
