#!/usr/bin/env python3
"""
proposal-tracker — CLI for tracking proposal execution status
Usage:
  python scripts/proposal-tracker.py list [--status <status>]
  python scripts/proposal-tracker.py status <id>
  python scripts/proposal-tracker.py update <id> <status>
  python scripts/proposal-tracker.py create <id> --title <title> --priority <P0-P3>
"""
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path

TRACKING_FILE = Path(__file__).parent.parent / "docs" / "TRACKING.md"

VALID_STATUSES = ["done", "in_progress", "pending", "blocked", "rejected"]
VALID_PRIORITIES = ["P0", "P1", "P2", "P3"]


def parse_tracking_md():
    """Parse TRACKING.md to extract proposal statuses."""
    if not TRACKING_FILE.exists():
        return {}

    content = TRACKING_FILE.read_text(encoding="utf-8")
    proposals = {}

    # Match table rows like | id | status | notes |
    pattern = re.compile(r"^\|\s*([a-zA-Z0-9_-]+)\s*\|\s*([^\|]+)\s*\|")
    for line in content.splitlines():
        m = pattern.match(line.strip())
        if m:
            pid, status = m.group(1).strip(), m.group(2).strip()
            if pid.startswith("Arc-") or pid.startswith("D-") or pid.startswith("T-") or pid.startswith("A-") or pid.startswith("P-"):
                proposals[pid] = status

    return proposals


def write_tracking_md(proposals, epic="Sprint 1"):
    """Write updated proposal statuses back to TRACKING.md."""
    content = TRACKING_FILE.read_text()

    for pid, status in proposals.items():
        # Match table row pattern
        pattern = re.compile(rf"(\|\s*{re.escape(pid)}\s*\|\s*)[^\|]+(\s*\|)")
        replacement = rf"\g<1>{status}\2"
        content = pattern.sub(replacement, content)

    # Update last updated
    content = re.sub(
        r"(\*\*Last Updated\*\*:)[^*]+",
        rf"\1 {datetime.now().strftime('%Y-%m-%d')}",
        content
    )

    TRACKING_FILE.write_text(content)


def cmd_list(status_filter=None):
    """List proposals."""
    epics = parse_tracking_epics()
    proposals = {}
    for epic in epics.values():
        proposals.update(epic["proposals"])

    if not proposals:
        print("No proposals found in TRACKING.md")
        return

    print(f"{'ID':<30} {'Status':<20} {'Epic':<10}")
    print("-" * 62)
    for pid, prop in sorted(proposals.items()):
        st = prop["status"]
        if status_filter and st != status_filter:
            continue
        print(f"{pid:<30} {st:<20}")
    print(f"\nTotal: {len(proposals)} proposals")


def cmd_status(proposal_id):
    """Show status of a proposal."""
    proposals = parse_tracking_md()
    if proposal_id in proposals:
        print(f"{proposal_id}: {proposals[proposal_id]}")
    else:
        print(f"Proposal '{proposal_id}' not found")
        sys.exit(1)


def cmd_update(proposal_id, new_status):
    """Update proposal status."""
    if new_status not in VALID_STATUSES:
        print(f"Invalid status: {new_status}. Valid: {VALID_STATUSES}")
        sys.exit(1)

    proposals = parse_tracking_md()
    if proposal_id not in proposals:
        print(f"Proposal '{proposal_id}' not found")
        sys.exit(1)

    proposals[proposal_id] = new_status
    write_tracking_md(proposals)
    print(f"Updated {proposal_id} → {new_status}")


def cmd_create(proposal_id, title=None, priority=None):
    """Add new proposal to tracking."""
    proposals = parse_tracking_md()
    if proposal_id in proposals:
        print(f"Proposal '{proposal_id}' already exists")
        sys.exit(1)

    if priority and priority not in VALID_PRIORITIES:
        print(f"Invalid priority: {priority}. Valid: {VALID_PRIORITIES}")
        sys.exit(1)

    proposals[proposal_id] = "pending"
    write_tracking_md(proposals)

    print(f"Created {proposal_id} (priority={priority or 'N/A'}, title={title or 'N/A'})")


def parse_tracking_epics():
    """Parse TRACKING.md to extract epics and their proposals."""
    if not TRACKING_FILE.exists():
        return {}

    content = TRACKING_FILE.read_text(encoding="utf-8")
    epics = {}

    # Match epic headers like "### Epic E1: Backend 数据完整性 ✅"
    # Use Unicode-aware patterns
    epic_pattern = re.compile(r"^### Epic\s+([^\s:]+)\s*:\s*(.+?)\s*([✔✅🔄⬜❌💥📋]*)\s*$")
    # Match proposal rows like "| D-P0-1: ... | ✅ Done | ..."
    proposal_pattern = re.compile(
        r"^\|\s*([A-Za-z0-9_-]+)\s*:\s*[^\|]+\|\s*([^\|]+)\s*\|"
    )

    current_epic = None
    for line in content.splitlines():
        line_s = line.strip()
        if not line_s:
            continue
        epic_m = epic_pattern.match(line_s)
        if epic_m:
            epic_id = epic_m.group(1).strip()
            epic_name = epic_m.group(2).strip()
            epic_status = epic_m.group(3).strip()
            current_epic = epic_id
            epics[epic_id] = {
                "name": epic_name,
                "status": epic_status,
                "proposals": {},
            }
            continue

        prop_m = proposal_pattern.match(line_s)
        if prop_m and current_epic:
            pid = prop_m.group(1).strip()
            status_raw = prop_m.group(2).strip()
            status = _normalize_status(status_raw)
            epics[current_epic]["proposals"][pid] = {
                "title": pid,
                "status": status,
            }

    return epics


def _normalize_status(raw: str) -> str:
    """Normalize emoji or text status to canonical."""
    raw = raw.strip()
    mapping = {
        "✅": "done", "✅ Done": "done", "done": "done",
        "🔄": "in_progress", "🔄 In Progress": "in_progress", "in_progress": "in_progress",
        "⬜": "pending", "⬜ TODO": "pending", "pending": "pending",
        "❌": "rejected", "rejected": "rejected",
        "❓": "blocked", "blocked": "blocked",
        "💥": "blocked", "📋": "in_progress",
    }
    return mapping.get(raw, "pending")


def _load_team_tasks():
    """Load task statuses from team-tasks."""
    tasks_dir = Path.home() / ".openclaw" / "skills" / "team-tasks" / "projects"
    if not tasks_dir.exists():
        return {}

    all_tasks = {}
    for project_dir in tasks_dir.iterdir():
        if not project_dir.is_dir():
            continue
        project = project_dir.name
        tasks_file = project_dir / "tasks.json"
        if tasks_file.exists():
            try:
                data = json.loads(tasks_file.read_text())
                all_tasks[project] = data.get("tasks", [])
            except (json.JSONDecodeError, OSError):
                pass

    return all_tasks


def cmd_report():
    """Generate execution report from TRACKING.md and team-tasks."""
    epics = parse_tracking_epics()
    team_tasks = _load_team_tasks()

    # Count proposals
    total_proposals = 0
    done_proposals = 0
    in_progress_proposals = 0
    pending_proposals = 0
    blocked_proposals = 0

    for epic_id, epic in epics.items():
        for pid, prop in epic["proposals"].items():
            total_proposals += 1
            st = prop["status"]
            if st == "done":
                done_proposals += 1
            elif st == "in_progress":
                in_progress_proposals += 1
            elif st == "blocked":
                blocked_proposals += 1
            else:
                pending_proposals += 1

    # Count team tasks
    total_tasks = 0
    done_tasks = 0
    in_progress_tasks = 0
    pending_tasks = 0
    blocked_tasks = 0

    for project, tasks in team_tasks.items():
        for task in tasks:
            total_tasks += 1
            st = task.get("status", "pending")
            if st == "done":
                done_tasks += 1
            elif st == "in_progress":
                in_progress_tasks += 1
            elif st == "blocked":
                blocked_tasks += 1
            else:
                pending_tasks += 1

    # Print report
    print("=" * 60)
    print("  VibeX Proposal & Task Execution Report")
    print(f"  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)

    print("\n## Proposal Progress (from TRACKING.md)\n")
    print(f"  Total:    {total_proposals}")
    print(f"  ✅ Done:          {done_proposals:>4}  ({_pct(done_proposals, total_proposals)}%)")
    print(f"  🔄 In Progress:    {in_progress_proposals:>4}  ({_pct(in_progress_proposals, total_proposals)}%)")
    print(f"  ⬜ Pending:       {pending_proposals:>4}  ({_pct(pending_proposals, total_proposals)}%)")
    print(f"  ❌ Blocked:      {blocked_proposals:>4}  ({_pct(blocked_proposals, total_proposals)}%)")

    if total_proposals > 0:
        bar = _progress_bar(done_proposals, total_proposals, width=30)
        print(f"\n  [{bar}] {done_proposals}/{total_proposals}")

    print("\n## Epic Breakdown\n")
    for epic_id, epic in sorted(epics.items()):
        epic_total = len(epic["proposals"])
        epic_done = sum(1 for p in epic["proposals"].values() if p["status"] == "done")
        epic_status_icon = epic.get("status", "")
        print(f"  {epic_id}: {epic['name']} {epic_status_icon}  ({epic_done}/{epic_total})")

    print("\n## Team Tasks Progress\n")
    print(f"  Total:    {total_tasks}")
    print(f"  ✅ Done:          {done_tasks:>4}  ({_pct(done_tasks, total_tasks)}%)")
    print(f"  🔄 In Progress:    {in_progress_tasks:>4}  ({_pct(in_progress_tasks, total_tasks)}%)")
    print(f"  ⬜ Pending:        {pending_tasks:>4}  ({_pct(pending_tasks, total_tasks)}%)")
    print(f"  ❌ Blocked:       {blocked_tasks:>4}  ({_pct(blocked_tasks, total_tasks)}%)")

    if total_tasks > 0:
        bar = _progress_bar(done_tasks, total_tasks, width=30)
        print(f"\n  [{bar}] {done_tasks}/{total_tasks}")

    if blocked_proposals > 0 or blocked_tasks > 0:
        print("\n## ⚠️  Blocked Items\n")
        for epic_id, epic in epics.items():
            for pid, prop in epic["proposals"].items():
                if prop["status"] == "blocked":
                    print(f"  {pid}: {prop['title']}")
        for project, tasks in team_tasks.items():
            for task in tasks:
                if task.get("status") == "blocked":
                    print(f"  [{project}] {task.get('name', task.get('id', 'unknown'))}")

    print("\n" + "=" * 60)


def _pct(part: int, total: int) -> str:
    if total == 0:
        return "0"
    return f"{round(part * 100 / total)}"


def _progress_bar(done: int, total: int, width: int = 30) -> str:
    if total == 0:
        return " " * width + " 0%"
    filled = int(width * done / total)
    empty = width - filled
    bar = "█" * filled + "░" * empty
    pct = round(done * 100 / total)
    return f"{bar} {pct}%"


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == "list":
        status_filter = None
        if "--status" in sys.argv:
            idx = sys.argv.index("--status")
            status_filter = sys.argv[idx + 1] if idx + 1 < len(sys.argv) else None
        cmd_list(status_filter)

    elif cmd == "status":
        if len(sys.argv) < 3:
            print("Usage: proposal-tracker.py status <id>")
            sys.exit(1)
        cmd_status(sys.argv[2])

    elif cmd == "update":
        if len(sys.argv) < 4:
            print("Usage: proposal-tracker.py update <id> <status>")
            sys.exit(1)
        cmd_update(sys.argv[2], sys.argv[3])

    elif cmd == "create":
        title = None
        priority = None
        proposal_id = None
        args = sys.argv[2:]
        i = 0
        while i < len(args):
            if args[i] == "--title" and i + 1 < len(args):
                title = args[i + 1]
                i += 2
            elif args[i] == "--priority" and i + 1 < len(args):
                priority = args[i + 1]
                i += 2
            elif not proposal_id:
                proposal_id = args[i]
                i += 1
            else:
                i += 1
        if not proposal_id:
            print("Usage: proposal-tracker.py create <id> [--title <title>] [--priority <P0-P3>]")
            sys.exit(1)
        cmd_create(proposal_id, title, priority)

    elif cmd == "report":
        cmd_report()

    else:
        print(f"Unknown command: {cmd}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
