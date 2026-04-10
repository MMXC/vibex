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
import subprocess
import sys
import urllib.request
import urllib.error

DEDUP_API_URL = os.environ.get("DEDUP_API_URL", "http://localhost:8765")
TIMEOUT_SEC = 5
SLACK_TOKEN = os.environ.get("SLACK_TOKEN_coord", "")
SLACK_CHANNEL = "C0AP3CPJL8N"  # #coord
SLACK_API = "https://slack.com/api/chat.postMessage"


def _curl_slack(channel_id: str, user_token: str, text: str) -> bool:
    """Send Slack message via curl. Non-blocking — failures logged but not raised."""
    if not user_token or not channel_id:
        print(f"⚠️  [dedup] 未配置 Slack token，跳过通知", file=sys.stderr)
        return False
    cmd = [
        "curl", "-s", "-X", "POST", SLACK_API,
        "-H", f"Authorization: Bearer {user_token}",
        "-H", "Content-Type: application/json",
        "-d", json.dumps({"channel": channel_id, "text": text}),
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, timeout=10)
        return result.returncode == 0
    except Exception as e:
        print(f"⚠️  [dedup] Slack 通知失败: {e}", file=sys.stderr)
        return False


def notify_dedup_alert(level: str, project_name: str, project_goal: str,
                       candidates: list) -> None:
    """
    Send Slack alert to #coord channel when dedup detects duplicates.
    Non-blocking — failures do not affect exit code.
    """
    if level == "pass":
        return

    if level == "block":
        icon = "🚫"
        title = "提案查重阻断"
    else:
        icon = "⚠️"
        title = "提案查重告警"

    text = f"""{icon} *{title}*

*项目*: `{project_name}`
*目标*: {project_goal[:80]}{'...' if len(project_goal) > 80 else ''}
*级别*: `{level.upper()}`
"""
    if candidates:
        text += f"\n*相似项目* ({len(candidates)} 个):\n"
        for c in candidates[:5]:
            text += f"  • `{c.get('name', '?')}` (相似度 {c.get('similarity', 0):.2f})\n"

    _curl_slack(SLACK_CHANNEL, SLACK_TOKEN, text)


def call_dedup_api(name: str, goal: str) -> dict:
    """Call the dedup REST API."""
    payload = json.dumps({"project_name": name, "description": goal, "name": name, "goal": goal}).encode("utf-8")
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
        # E3: send Slack alert to #coord
        notify_dedup_alert(level, name, goal, candidates)
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
        # E3: send Slack alert to #coord
        notify_dedup_alert(level, name, goal, candidates)
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
    # Support both old (name/goal positional) and new (--project-name/--description) args
    parser.add_argument("name", nargs="?", help="项目名称 (旧参数，支持 --project-name)")
    parser.add_argument("goal", nargs="?", help="项目目标 (旧参数，支持 --description)")
    parser.add_argument("--project-name", dest="project_name", help="项目名称 (新参数)")
    parser.add_argument("--description", dest="description", help="项目目标 (新参数)")
    parser.add_argument("--force", action="store_true", help="强制创建（跳过 warn 确认）")
    args = parser.parse_args()
    resolved_name = args.project_name or args.name or ""
    resolved_goal = args.description or args.goal or ""
    code = check_and_exit(resolved_name, resolved_goal, force=args.force)
    resolved_name = args.project_name or args.name or ""
    resolved_goal = args.description or args.goal or ""
    code = check_and_exit(resolved_name, resolved_goal, force=args.force)
    sys.exit(code)
