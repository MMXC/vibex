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

    content = TRACKING_FILE.read_text()
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
    proposals = parse_tracking_md()
    if not proposals:
        print("No proposals found in TRACKING.md")
        return

    print(f"{'ID':<30} {'Status':<20}")
    print("-" * 52)
    for pid, st in sorted(proposals.items()):
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

    else:
        print(f"Unknown command: {cmd}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
