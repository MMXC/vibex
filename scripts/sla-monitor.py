#!/usr/bin/env python3
"""
SLA Monitor — 检查所有 team-tasks 的 SLA deadline 超时情况。

Usage:
  python3 scripts/sla-monitor.py
  python3 scripts/sla-monitor.py --dry-run

Cron 配置（建议每 5 分钟执行）:
  */5 * * * * cd /root/.openclaw/vibex && python3 scripts/sla-monitor.py
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

# ── Config ──────────────────────────────────────────────────────────────────────
TEAM_TASKS_DIR = "/root/.openclaw/workspace-coord/team-tasks"
PROJECTS_DIR = os.path.join(TEAM_TASKS_DIR, "projects")
SLACK_TOKEN_ENV = "SLACK_TOKEN_coord"
SLACK_CHANNEL = "C0AG6F818DD"  # #coord


def _now_shanghai():
    return datetime.now(timezone(timedelta(hours=8)))


def _parse_iso_with_tz(ts: str):
    """Parse ISO timestamp, return datetime with timezone."""
    try:
        # Handle +08:00 format
        if ts.endswith("+00:00"):
            ts = ts[:-6]
            dt = datetime.fromisoformat(ts)
            return dt.replace(tzinfo=timezone.utc)
        elif "+08:00" in ts:
            return datetime.fromisoformat(ts)
        else:
            # Assume UTC
            dt = datetime.fromisoformat(ts)
            return dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def _is_overdue(sla_deadline: str) -> bool:
    dt = _parse_iso_with_tz(sla_deadline)
    if dt is None:
        return False
    now = _now_shanghai()
    # Compare in same timezone
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone(timedelta(hours=8)))
    return now > dt


def _find_all_task_files():
    """Find all task JSON files."""
    files = []
    # New layout: projects/*/tasks.json
    if os.path.isdir(PROJECTS_DIR):
        for entry in os.listdir(PROJECTS_DIR):
            subdir = os.path.join(PROJECTS_DIR, entry)
            if os.path.isdir(subdir):
                task_file = os.path.join(subdir, "tasks.json")
                if os.path.exists(task_file):
                    files.append(task_file)
    # Legacy: *.json in team-tasks root
    for fname in os.listdir(TEAM_TASKS_DIR):
        if fname.endswith(".json"):
            files.append(os.path.join(TEAM_TASKS_DIR, fname))
    return files


def _check_sla_for_file(filepath: str) -> list[dict]:
    """Return list of overdue tasks from a task file."""
    overdue = []
    try:
        data = json.load(open(filepath))
    except (json.JSONDecodeError, FileNotFoundError):
        return overdue

    project = data.get("project", os.path.basename(filepath).replace(".json", ""))
    stages = data.get("stages", {})

    for stage_id, stage in stages.items():
        status = stage.get("status", "")
        if status in ("done", "skipped", "failed"):
            continue  # Skip completed tasks

        sla = stage.get("sla_deadline", "")
        if not sla:
            continue

        if _is_overdue(sla):
            overdue.append({
                "project": project,
                "stage": stage_id,
                "agent": stage.get("agent", "?"),
                "sla_deadline": sla,
                "started_at": stage.get("startedAt", "?"),
            })

    return overdue


def _send_slack_notification(token: str, channel: str, text: str) -> bool:
    """Send Slack notification via web API."""
    import urllib.request
    import urllib.parse

    payload = {
        "channel": channel,
        "text": text,
        "mrkdwn": True,
    }

    data = urllib.parse.urlencode({"payload": json.dumps(payload)}).encode()

    req = urllib.request.Request(
        "https://slack.com/api/chat.postMessage",
        data=data,
        headers={"Authorization": f"Bearer {token}"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read())
            return result.get("ok", False)
    except Exception:
        return False


def main():
    parser = argparse.ArgumentParser(description="SLA Monitor")
    parser.add_argument("--dry-run", action="store_true", help="Don't send Slack notifications")
    args = parser.parse_args()

    all_overdue = []
    for fpath in _find_all_task_files():
        all_overdue.extend(_check_sla_for_file(fpath))

    if not all_overdue:
        print("✅ No SLA violations found")
        return

    print(f"⚠️  Found {len(all_overdue)} SLA violations:")
    for item in all_overdue:
        print(f"  • {item['project']}/{item['stage']} (agent: {item['agent']})")
        print(f"    SLA deadline: {item['sla_deadline']}")
        print(f"    Started: {item['started_at']}")

    # Build Slack message
    blocks = [{
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": f"⚠️ *SLA 超时预警* ({len(all_overdue)} 项)",
        }
    }]

    for item in all_overdue:
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": (
                    f"• `{item['project']}/{item['stage']}`\n"
                    f"  Agent: {item['agent']} | SLA: `{item['sla_deadline']}`"
                ),
            }
        })

    blocks.append({
        "type": "context",
        "elements": [{
            "type": "mrkdwn",
            "text": f"SLA Monitor | {_now_shanghai().isoformat()}",
        }]
    })

    import urllib.request, urllib.parse
    token = os.environ.get(SLACK_TOKEN_ENV, "")
    if not token:
        print("⚠️  SLACK_TOKEN_coord not set, skipping Slack notification")
        return

    if args.dry_run:
        print(f"[DRY RUN] Would send Slack notification to #{SLACK_CHANNEL}")
        return

    payload = {
        "channel": SLACK_CHANNEL,
        "blocks": blocks,
        "text": f"⚠️ SLA 超时预警: {len(all_overdue)} 项任务超时",
    }

    data = urllib.parse.urlencode({"payload": json.dumps(payload)}).encode()
    req = urllib.request.Request(
        "https://slack.com/api/chat.postMessage",
        data=data,
        headers={"Authorization": f"Bearer {token}"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read())
            if result.get("ok"):
                print("✅ Slack notification sent")
            else:
                print(f"⚠️  Slack error: {result}")
    except Exception as e:
        print(f"⚠️  Slack notification failed: {e}")


if __name__ == "__main__":
    main()
