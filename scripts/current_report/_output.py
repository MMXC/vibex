"""Output formatting for current-report command."""
from datetime import datetime, timezone


def format_text(active: dict, false_comp: dict, server: dict) -> str:
    """Format report as human-readable text."""
    lines = []

    # === Active Projects ===
    count = active.get("count", 0)
    projects = active.get("projects", [])
    lines.append(f"=== Active Projects ({count}) ===")
    if active.get("error"):
        lines.append(f"  ERROR: {active['error']}")
    elif count == 0:
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
        for item in fc_items:
            lines.append(
                f"  - {item['project']}/{item['task']}: "
                f"missing={item['output']}"
            )

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


def format_json(active: dict, false_comp: dict, server: dict) -> str:
    """Format report as JSON."""
    import json

    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return json.dumps({
        "active_projects": active,
        "false_completions": false_comp,
        "server_info": server,
        "generated_at": ts,
    }, indent=2, ensure_ascii=False)


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
