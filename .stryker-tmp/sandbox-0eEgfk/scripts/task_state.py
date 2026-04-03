#!/usr/bin/env python3
"""task_state.py — Team task state manager CLI (Epic 2)

Provides atomic, concurrency-safe operations for the team task pipeline.

Commands:
  update   Update a stage status (atomic with lock)
  claim    Claim a stage for an agent (lock-protected)
  status   Show project status
  lock     Lock a stage with TTL

Uses save_project_with_lock() for all writes to prevent data loss.
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone

# Add parent directory for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from task_manager import (
    load_project,
    save_project,
    load_project_with_rev,
    save_project_with_lock,
    _REVISION_KEY,
    TEAM_TASKS_DIR_DEFAULT,
)

# ANSI color codes
C_RESET = "\033[0m"
C_RED = "\033[31m"
C_GREEN = "\033[32m"
C_YELLOW = "\033[33m"
C_BLUE = "\033[34m"
C_CYAN = "\033[36m"
C_BOLD = "\033[1m"
C_DIM = "\033[2m"


def color_status(status: str) -> str:
    """Return colored status string."""
    colors = {
        "done": C_GREEN,
        "in-progress": C_YELLOW,
        "pending": C_CYAN,
        "blocked": C_RED,
        "failed": C_RED,
    }
    c = colors.get(status.lower(), C_RESET)
    return f"{c}{C_BOLD}{status}{C_RESET}"


def color_agent(agent: str) -> str:
    """Return colored agent string."""
    return f"{C_BLUE}{agent}{C_RESET}"


def color_stage(stage: str) -> str:
    """Return colored stage string."""
    return f"{C_BOLD}{stage}{C_RESET}"


# =============================================================================
# Commands
# =============================================================================

def cmd_update(args):
    """Update a stage status atomically with optimistic lock."""
    project = args.project
    stage = args.stage
    new_status = args.status

    # Load current data with revision
    data, rev = load_project_with_rev(project)
    if "stages" not in data:
        print(f"Error: project '{project}' has no stages", file=sys.stderr)
        sys.exit(1)

    stages = data["stages"]
    if stage not in stages:
        print(f"Error: stage '{stage}' not found in project '{project}'", file=sys.stderr)
        print(f"Available stages: {', '.join(stages.keys())}", file=sys.stderr)
        sys.exit(1)

    old_status = stages[stage].get("status", "pending")
    stages[stage]["status"] = new_status
    stages[stage]["updatedAt"] = datetime.now(timezone.utc).isoformat()

    # Write atomically with lock
    try:
        new_rev = save_project_with_lock(project, data, expected_rev=rev)
        print(f"✅ {stage}: {old_status} → {color_status(new_status)} (rev {rev} → {new_rev})")
    except RuntimeError as e:
        print(f"{C_RED}❌ Update failed (concurrent modification): {e}{C_RESET}", file=sys.stderr)
        sys.exit(1)


def cmd_claim(args):
    """Claim a stage for an agent (lock-protected)."""
    project = args.project
    stage = args.stage
    agent = args.agent

    data, rev = load_project_with_rev(project)
    if "stages" not in data:
        print(f"Error: project '{project}' has no stages", file=sys.stderr)
        sys.exit(1)

    stages = data["stages"]
    target = stage

    if target not in stages:
        print(f"Error: stage '{target}' not found", file=sys.stderr)
        sys.exit(1)

    current = stages[target]
    current_status = current.get("status", "pending")
    current_agent = current.get("agent", "")

    # Check if already claimed by someone else
    if current_status in ("in-progress", "done") and current_agent and current_agent != agent:
        print(f"❌ Cannot claim '{target}': already claimed by {color_agent(current_agent)} (status={current_status})")
        sys.exit(1)
    # Also block if a different agent claimed but didn't start (pending with agent assigned)
    if current_status == "pending" and current_agent and current_agent != agent:
        print(f"❌ Cannot claim '{target}': already claimed by {color_agent(current_agent)} (status={current_status})")
        sys.exit(1)

    # Claim it
    stages[target]["status"] = "in-progress"
    stages[target]["agent"] = agent
    stages[target]["claimedAt"] = datetime.now(timezone.utc).isoformat()
    stages[target]["updatedAt"] = datetime.now(timezone.utc).isoformat()

    try:
        new_rev = save_project_with_lock(project, data, expected_rev=rev)
        print(f"✅ Claimed: {color_stage(target)} by {color_agent(agent)} (rev {rev} → {new_rev})")
    except RuntimeError as e:
        print(f"{C_RED}❌ Claim failed (concurrent modification): {e}{C_RESET}", file=sys.stderr)
        sys.exit(1)


def cmd_status(args):
    """Show project status with formatted table."""
    project = args.project

    try:
        data, rev = load_project_with_rev(project)
    except SystemExit:
        print(f"Error: project '{project}' not found", file=sys.stderr)
        sys.exit(1)

    print(f"\n{C_BOLD}Project:{C_RESET} {project}")
    print(f"{C_DIM}Revision:{C_RESET} {rev}")
    print(f"{C_DIM}Status:{C_RESET} {color_status(data.get('status', 'unknown'))}")
    print()

    stages = data.get("stages", {})
    if not stages:
        print(f"{C_DIM}No stages defined{C_RESET}")
        return

    # Header
    stage_w = max(len("Stage"), max(len(s) for s in stages.keys()))
    print(f"{'Stage':<{stage_w}} {'Agent':<12} {'Status':<15} {'Updated'}")
    print(f"{'-' * stage_w} {'-' * 12} {'-' * 15} {'-' * 20}")

    for name, info in stages.items():
        agent = info.get("agent", "-") or "-"
        status = info.get("status", "pending")
        updated = info.get("updatedAt", "-")
        if updated and updated != "-":
            # Shorten ISO timestamp
            updated = updated[:19].replace("T", " ")

        status_colored = color_status(status)
        agent_colored = color_agent(agent) if agent != "-" else C_DIM + "-" + C_RESET
        print(f"{color_stage(name):<{stage_w}} {agent_colored:<12} {status_colored:<15} {C_DIM}{updated}{C_RESET}")

    print()
    print(f"{C_DIM}Revision: {rev}{C_RESET}")


def cmd_lock(args):
    """Lock a stage with TTL (seconds) to prevent duplicate claims."""
    project = args.project
    stage = args.stage
    ttl = args.ttl  # seconds

    data, rev = load_project_with_rev(project)
    stages = data.get("stages", {})

    if stage not in stages:
        print(f"Error: stage '{stage}' not found", file=sys.stderr)
        sys.exit(1)

    lock_key = "_lock"
    now = time.time()
    expiry = now + ttl

    current_lock = stages[stage].get(lock_key, {})
    if current_lock:
        lock_expiry = current_lock.get("expiresAt", 0)
        if lock_expiry > now:
            remaining = lock_expiry - now
            print(f"⚠️  Stage '{stage}' is already locked for {remaining:.1f}s more")
            print(f"    Locked by: {current_lock.get('agent', 'unknown')}")
            sys.exit(1)

    stages[stage][lock_key] = {
        "agent": args.agent,
        "lockedAt": datetime.now(timezone.utc).isoformat(),
        "expiresAt": expiry,
    }
    stages[stage]["updatedAt"] = datetime.now(timezone.utc).isoformat()

    try:
        new_rev = save_project_with_lock(project, data, expected_rev=rev)
        print(f"🔒 Locked: {color_stage(stage)} for {ttl}s (by {color_agent(args.agent)}) rev {rev} → {new_rev}")
    except RuntimeError as e:
        print(f"{C_RED}❌ Lock failed (concurrent modification): {e}{C_RESET}", file=sys.stderr)
        sys.exit(1)


# =============================================================================
# CLI Entry Point
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        prog="task_state.py",
        description="Team task state manager — atomic, concurrency-safe operations",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python task_state.py update vibex-task-state-20260326 dev-epic2 in-progress
  python task_state.py claim vibex-task-state-20260326 dev-epic2 --agent dev
  python task_state.py status vibex-task-state-20260326
  python task_state.py lock vibex-task-state-20260326 dev-epic2 --ttl 3600 --agent dev
        """,
    )

    sub = parser.add_subparsers(dest="command", required=True)

    # update
    p_update = sub.add_parser("update", help="Update a stage status (atomic with lock)")
    p_update.add_argument("project", help="Project name")
    p_update.add_argument("stage", help="Stage ID")
    p_update.add_argument("status", help="New status (pending/in-progress/done/failed/blocked)")
    p_update.set_defaults(func=cmd_update)

    # claim
    p_claim = sub.add_parser("claim", help="Claim a stage for an agent (lock-protected)")
    p_claim.add_argument("project", help="Project name")
    p_claim.add_argument("stage", help="Stage ID")
    p_claim.add_argument("--agent", default="dev", help="Agent ID (default: dev)")
    p_claim.set_defaults(func=cmd_claim)

    # status
    p_status = sub.add_parser("status", help="Show project status")
    p_status.add_argument("project", help="Project name")
    p_status.set_defaults(func=cmd_status)

    # lock
    p_lock = sub.add_parser("lock", help="Lock a stage with TTL (seconds)")
    p_lock.add_argument("project", help="Project name")
    p_lock.add_argument("stage", help="Stage ID")
    p_lock.add_argument("--ttl", type=int, default=3600, help="Lock TTL in seconds (default: 3600)")
    p_lock.add_argument("--agent", default="dev", help="Agent ID (default: dev)")
    p_lock.set_defaults(func=cmd_lock)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
