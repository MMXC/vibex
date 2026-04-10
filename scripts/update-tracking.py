#!/usr/bin/env python3
"""update-tracking.py - Update proposal status in INDEX.md"""

import sys
import argparse
import re
import fcntl
import os
from datetime import datetime
from pathlib import Path

INDEX = 'docs/proposals/INDEX.md'
LOCK_FILE = '/tmp/update-tracking.lock'

VALID_STATUSES = ['pending', 'in-progress', 'done', 'rejected']

def read_index(index_path):
    if not Path(index_path).exists():
        print(f"ERROR: INDEX.md not found at {index_path}", file=sys.stderr)
        sys.exit(1)
    with open(index_path, 'r', encoding='utf-8') as f:
        return f.read()

def update_status(proposal_id, new_status, dry_run=False, index_path=None):
    if new_status not in VALID_STATUSES:
        print(f"ERROR: Invalid status '{new_status}'. Valid: {VALID_STATUSES}", file=sys.stderr)
        sys.exit(2)
    index_path = index_path or INDEX
    content = read_index(index_path)
    original = content
    
    # Find and update the row for this proposal ID
    # Pattern: | ID | Title | Sprint | Status | Owner | Created | Updated |
    pattern = rf'(\| ({re.escape(proposal_id)})\s*\| [^\|]+\| [^\|]+\| )([^\| ]+)( \|)'
    match = re.search(pattern, content)
    
    if not match:
        print(f"ERROR: Proposal '{proposal_id}' not found in INDEX.md", file=sys.stderr)
        sys.exit(1)
    
    old_status = match.group(3)
    today = datetime.now().strftime('%Y-%m-%d')
    
    if dry_run:
        print(f"[DRY RUN] Would change {proposal_id}: {old_status} → {new_status}")
        return
    
    # Update status and updated date
    new_line = f"{match.group(1)}{new_status}{match.group(4)}"
    # Also update the Updated column (last column before |)
    content = re.sub(
        rf'(\| {re.escape(proposal_id)}\s*\| [^\|]+\| [^\|]+\| {re.escape(new_status)} \| [^\|]+\| )[^\|]+( \|)',
        rf'\g<1>{today}\g<2>',
        content
    )
    content = re.sub(pattern, new_line, content, count=1)
    
    # File lock for concurrent safety
    lock_fd = open(LOCK_FILE, 'w')
    try:
        fcntl.flock(lock_fd, fcntl.LOCK_EX)
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(content)
        fcntl.flock(lock_fd, fcntl.LOCK_UN)
    finally:
        lock_fd.close()
    
    print(f"Updated {proposal_id}: {old_status} → {new_status}")

def main():
    parser = argparse.ArgumentParser(description='Update proposal status in INDEX.md')
    parser.add_argument('proposal_id', help='Proposal ID (e.g., A-P0-1)')
    parser.add_argument('status', choices=VALID_STATUSES, help='New status')
    parser.add_argument('--dry-run', action='store_true', help='Preview change without writing')
    parser.add_argument('--index', default=None, help='INDEX.md path')
    args = parser.parse_args()

    index_path = args.index if args.index else INDEX
    update_status(args.proposal_id, args.status, args.dry_run, index_path)

if __name__ == '__main__':
    main()
