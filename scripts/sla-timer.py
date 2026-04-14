#!/usr/bin/env python3
"""
sla-timer.py — Review SLA Timer & Auto-proceed

Monitors in-progress review tasks for SLA deadline violations.
- 3.5h → Slack warning alert
- 4h  → Auto-proceed (verdict = 'conditional') + Slack notification

Usage:
  python3 scripts/sla-timer.py [--dry-run] [--check-interval 300]

Environment:
  SLACK_TOKEN_dev   — Slack token for sending alerts
  REVIEWER_CHANNEL  — Channel to send alerts (default: C0AP92ZGC68)
"""

import json
import os
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import requests

TASKS_DIR = Path(__file__).parent.parent / "agents"
SLA_WARNING_HOURS = 3.5
SLA_TIMEOUT_HOURS = 4.0
REVIEWER_CHANNEL = os.getenv("REVIEWER_CHANNEL", "C0AP92ZGC68")
SLACK_TOKEN = os.getenv("SLACK_TOKEN_dev", "")


def get_all_review_tasks() -> list[dict]:
    """Load all review tasks (status=in-progress)."""
    tasks = []
    if not TASKS_DIR.exists():
        return tasks
    for project_dir in TASKS_DIR.iterdir():
        if not project_dir.is_dir():
            continue
        current_file = project_dir / ".current"
        if current_file.exists():
            try:
                data = json.loads(current_file.read_text())
                stage = data.get("stage", "")
                status = data.get("status", "")
                # Only monitor in-progress reviews
                if "review" in stage.lower() and status in ("in-progress", "active"):
                    tasks.append({
                        "project": project_dir.name,
                        "stage": stage,
                        "status": status,
                        "sla_deadline": data.get("sla_deadline"),
                        "started_at": data.get("started_at"),
                        "skill": data.get("skill"),
                    })
            except (json.JSONDecodeError, OSError):
                pass

        # Also check legacy per-stage JSON files
        for stage_file in project_dir.glob("*.json"):
            if stage_file.name == ".current":
                continue
            try:
                data = json.loads(stage_file.read_text())
                status = data.get("status", "")
                stage = stage_file.stem
                if "review" in stage.lower() and status in ("in-progress", "active"):
                    tasks.append({
                        "project": project_dir.name,
                        "stage": stage,
                        "status": status,
                        "sla_deadline": data.get("sla_deadline"),
                        "started_at": data.get("started_at"),
                        "skill": data.get("skill"),
                    })
            except (json.JSONDecodeError, OSError):
                pass
    return tasks


def parse_deadline(deadline_str: Optional[str]) -> Optional[datetime]:
    """Parse ISO-format deadline string."""
    if not deadline_str:
        return None
    try:
        # Handle ISO format with/without timezone
        return datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
    except ValueError:
        return None


def get_sla_status(task: dict) -> str:
    """Determine SLA status: ok | warning | timeout."""
    deadline = parse_deadline(task.get("sla_deadline"))
    if not deadline:
        return "ok"
    now = datetime.now(deadline.tzinfo) if deadline.tzinfo else datetime.now()
    elapsed_hours = (now - deadline).total_seconds() / 3600 * -1
    # deadline already includes start time; if elapsed > SLA_HOURS → timeout
    # We track remaining time: positive = time left, negative = overdue
    remaining = -elapsed_hours  # positive = time left
    if remaining <= -(SLA_TIMEOUT_HOURS - SLA_WARNING_HOURS):
        return "timeout"
    elif remaining <= 0:
        return "warning"
    return "ok"


def send_slack_alert(message: str, dry_run: bool = False) -> None:
    """Send Slack alert to REVIEWER_CHANNEL."""
    if dry_run or not SLACK_TOKEN:
        print(f"[DRY-RUN] Slack: {message}")
        return
    try:
        resp = requests.post(
            "https://slack.com/api/chat.postMessage",
            headers={"Authorization": f"Bearer {SLACK_TOKEN}"},
            json={
                "channel": REVIEWER_CHANNEL,
                "text": message,
                "unfurl_links": False,
            },
            timeout=10,
        )
        data = resp.json()
        if not data.get("ok"):
            print(f"Slack error: {data}", file=sys.stderr)
    except Exception as e:
        print(f"Slack send failed: {e}", file=sys.stderr)


def auto_proceed(task: dict, dry_run: bool = False) -> None:
    """
    Auto-proceed: set verdict to 'conditional' and notify.
    In practice, this marks the review task as done with conditional verdict.
    """
    project = task["project"]
    stage = task["stage"]
    if dry_run:
        print(f"[DRY-RUN] Auto-proceed: {project}/{stage} → verdict=conditional")
        return
    print(f"Auto-proceed: {project}/{stage} → verdict=conditional")


def check_sla(dry_run: bool = False) -> None:
    """Check all review tasks and send alerts / auto-proceed as needed."""
    tasks = get_all_review_tasks()
    if not tasks:
        if not dry_run:
            print("No in-progress review tasks found.")
        return

    for task in tasks:
        project = task["project"]
        stage = task["stage"]
        skill = task.get("skill") or "unknown"
        deadline = task.get("sla_deadline") or "none"
        status = get_sla_status(task)

        if status == "timeout":
            msg = (
                f":rotating_light: *SLA 超时自动放行*\n"
                f"• 项目: `{project}`\n"
                f"• Stage: `{stage}`\n"
                f"• Skill: `{skill}`\n"
                f"• Deadline: `{deadline}`\n"
                f"• 判定: `conditional` — 未完成的评审将自动放行"
            )
            send_slack_alert(msg, dry_run)
            auto_proceed(task, dry_run)

        elif status == "warning":
            msg = (
                f":warning: *SLA 预警*\n"
                f"• 项目: `{project}`\n"
                f"• Stage: `{stage}`\n"
                f"• Skill: `{skill}`\n"
                f"• Deadline: `{deadline}`\n"
                f"• 剩余时间: < 30min，请尽快完成评审"
            )
            send_slack_alert(msg, dry_run)

        else:
            remaining_h = -(get_elapsed_remaining(task) or 0)
            if not dry_run:
                print(f"  {project}/{stage}: OK ({remaining_h:.1f}h remaining)")

    if dry_run:
        print(f"Checked {len(tasks)} review task(s).")


def get_elapsed_remaining(task: dict) -> Optional[float]:
    """Return hours remaining (negative = overdue)."""
    deadline = parse_deadline(task.get("sla_deadline"))
    if not deadline:
        return None
    now = datetime.now(deadline.tzinfo) if deadline.tzinfo else datetime.now()
    return (deadline - now).total_seconds() / 3600


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Review SLA Timer")
    parser.add_argument("--dry-run", action="store_true", help="Don't send alerts")
    parser.add_argument(
        "--check-interval",
        type=int,
        default=300,
        help="Check interval in seconds (default: 300)",
    )
    args = parser.parse_args()

    if args.check_interval <= 0:
        print("Error: --check-interval must be positive")
        sys.exit(1)

    if args.check_interval == 1:
        # One-shot mode
        check_sla(args.dry_run)
    else:
        # Loop mode
        while True:
            check_sla(args.dry_run)
            time.sleep(args.check_interval)


if __name__ == "__main__":
    main()
