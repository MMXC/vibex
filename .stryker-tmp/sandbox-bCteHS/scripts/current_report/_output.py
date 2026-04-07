"""Output formatting for current-report command."""
from datetime import datetime, timezone


def format_text(active: dict, false_comp: dict, server: dict,
                ready: dict = None, blocked: dict = None) -> str:
    """Format report as human-readable text."""
    lines = []

    # === Ready Tasks (F1: Ready Decision Engine) ===
    if ready is not None:
        count = ready.get("count", 0)
        tasks = ready.get("ready", [])
        lines.append(f"=== Ready to Execute ({count}) ===")
        if ready.get("error"):
            lines.append(f"  ERROR: {ready['error']}")
        elif count == 0:
            lines.append("  (none — no tasks with all deps satisfied)")
        else:
            for t in tasks:
                lines.append(
                    f"  [{t['agent']}] {t['project']}/{t['task_id']} "
                    f"(wait={t['wait_str']}, priority=P{t['priority_rank']})"
                )
                if t.get("task_desc"):
                    lines.append(f"    {t['task_desc']}")
                lines.append("")

    # === Blocked Tasks (F2: Blocked Root Cause Analysis) ===
    if blocked is not None:
        count = blocked.get("count", 0)
        tasks = blocked.get("blocked", [])
        lines.append(f"=== Blocked Tasks ({count}) ===")
        if blocked.get("error"):
            lines.append(f"  ERROR: {blocked['error']}")
        elif count == 0:
            lines.append("  ✓ No blocked tasks")
        else:
            for t in tasks:
                dur = t.get('blocked_duration_str', 'unknown')
                lines.append(f"  [{t['agent']}] {t['project']}/{t['task_id']} (blocked for {dur})")
                lines.append(f"    🚫 Blocked by: {', '.join(t['blocked_by'][:3])}")
                if len(t['blocked_by']) > 3:
                    lines.append(f"    + {len(t['blocked_by']) - 3} more dependencies")
                lines.append(f"    ⚠️ Root cause: {t['root_cause']}")
                lines.append("")

    # === Active Projects ===
    active_count = active.get("count", 0)
    projects = active.get("projects", [])
    lines.append(f"\n=== Active Projects ({active_count}) ===")
    if active.get("error"):
        lines.append(f"  ERROR: {active['error']}")
    elif active_count == 0:
        lines.append("  (none)")
    else:
        for p in projects:
            lines.append(
                f"  - {p['name']}: stage={p['stage']}, pending={p['pending']}/{p['total']}"
            )

    # === False Completion Detection ===
    fc_count = false_comp.get("count", 0)
    fc_items = false_comp.get("items", [])
    lines.append(f"\n=== False Completion Detection ({fc_count}) ===")
    if false_comp.get("error"):
        lines.append(f"  ERROR: {false_comp['error']}")
    elif fc_count == 0:
        lines.append("  ✓ No false completions detected")
    else:
        for item in fc_items[:20]:  # Show first 20
            lines.append(
                f"  - {item['project']}/{item['task']}: "
                f"missing={item['output']}"
            )
        if fc_count > 20:
            lines.append(f"  ... and {fc_count - 20} more")

    # === Server Info ===
    lines.append("\n=== Server Info ===")
    if server.get("psutil_available"):
        cpu = _fmt(server.get("cpu_percent"), "%")
        mem_pct = _fmt(server.get("memory_percent"), "%")
        mem_mb = server.get("memory_mb")
        disk = _fmt(server.get("disk_percent"), "%")
        uptime = _fmt_uptime(server.get("uptime_seconds"))
        lines.append(
            f"  CPU: {cpu} | Memory: {mem_pct} ({mem_mb}MB) | Disk: {disk}"
        )
        lines.append(f"  Uptime: {uptime}")
    else:
        lines.append("  CPU: N/A | Memory: N/A | Disk: N/A")
        lines.append("  Uptime: N/A (psutil not available)")

    # Timestamp
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    lines.append(f"\nGenerated: {ts}")

    return "\n".join(lines)


def format_json(active: dict, false_comp: dict, server: dict,
                ready: dict = None, blocked: dict = None) -> str:
    """Format report as JSON."""
    import json

    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    result = {
        "active_projects": active,
        "false_completions": false_comp,
        "server_info": server,
        "ready_tasks": ready,
        "blocked_tasks": blocked,
        "generated_at": ts,
    }
    return json.dumps(result, indent=2, ensure_ascii=False)


def _fmt(value, unit: str) -> str:
    if value is None:
        return f"N/A{unit}" if unit != "%" else "N/A"
    return f"{value}{unit}"


def _fmt_uptime(seconds: int) -> str:
    if seconds is None:
        return "N/A"
    days = seconds // 86400
    hours = (seconds % 86400) // 3600
    mins = (seconds % 3600) // 60
    if days > 0:
        return f"{days}d {hours}h {mins}m"
    if hours > 0:
        return f"{hours}h {mins}m"
    return f"{mins}m"
