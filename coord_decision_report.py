#!/usr/bin/env python3
"""
Coord Decision Report CLI

快速获取三个决策答案：
1. 下一步做什么？（Ready 任务建议）
2. 有没有卡住？（Blocked 根因）
3. 该不该创建新项目？（空转提案推荐）

用法:
    python coord_decision_report.py              # 文本输出
    python coord_decision_report.py --json      # JSON 输出
    python coord_decision_report.py --idle 3   # 设置连续空转次数
    python coord_decision_report.py --workspace /path/to/workspace

依赖:
    - scripts/current_report/ (复用 task-manager-current-report 分析器)
    - team-tasks/ 目录
"""

import argparse
import json
import sys
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict


def get_idle_count(workspace: str) -> int:
    """获取连续空转次数"""
    count_file = Path(workspace) / ".heartbeat_count"
    if count_file.exists():
        try:
            return int(count_file.read_text().strip())
        except (ValueError, IOError):
            pass
    return 0


def generate_full_report(tasks_dir: str, idle_count: int, proposals_dir: str) -> Dict:
    """生成完整决策报告。"""
    # 导入 current_report 模块
    try:
        sys.path.insert(0, str(Path(__file__).parent / "scripts"))
        from current_report import (
            get_ready_tasks,
            get_blocked_tasks,
            get_active_projects,
            detect_false_completions,
            get_server_info,
        )
    except ImportError as e:
        raise RuntimeError(f"Failed to import current_report modules: {e}") from e

    # 运行分析
    ready = get_ready_tasks(tasks_dir)
    blocked = get_blocked_tasks(tasks_dir)
    active = get_active_projects(tasks_dir)
    false_comp = detect_false_completions(tasks_dir)
    server = get_server_info()

    # 计算空转建议
    should_create_new_project = idle_count >= 3 and ready.get("count", 0) < 3

    return {
        "ready_tasks": ready,
        "blocked_tasks": blocked,
        "active_projects": active,
        "false_completions": false_comp,
        "server_info": server,
        "idle_count": idle_count,
        "should_create_new_project": should_create_new_project,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


def format_report_text(report: Dict) -> str:
    """格式化报告为文本输出。"""
    lines = []
    lines.append("=== 🤖 Coord Decision Report ===")
    lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"Consecutive idle: {report['idle_count']}/3")
    if report["should_create_new_project"]:
        lines.append("📌 RECOMMENDATION: Create new project (idle threshold reached, <3 ready tasks)")
    lines.append("")

    # Ready Tasks
    ready = report["ready_tasks"]
    count = ready.get("count", 0)
    lines.append(f"=== 🚀 Ready to Execute ({count}) ===")
    if ready.get("error"):
        lines.append(f"  ERROR: {ready['error']}")
    elif count == 0:
        lines.append("  (none — no tasks with all deps satisfied)")
    else:
        for i, t in enumerate(ready.get("ready", [])[:10], 1):
            lines.append(f"  {i}. [{t['agent']}] {t['project']}/{t['task_id']}")
            lines.append(f"     ⏳ Wait: {t['wait_str']} | Priority: P{t['priority_rank']}")
            if t.get("task_desc"):
                lines.append(f"     📝 {t['task_desc']}")
            lines.append("")
        if count > 10:
            lines.append(f"  ... and {count - 10} more ready tasks")
    lines.append("")

    # Blocked Tasks
    blocked = report["blocked_tasks"]
    count = blocked.get("count", 0)
    lines.append(f"=== 🚫 Blocked Tasks ({count}) ===")
    if blocked.get("error"):
        lines.append(f"  ERROR: {blocked['error']}")
    elif count == 0:
        lines.append("  ✓ No blocked tasks")
    else:
        for i, t in enumerate(blocked.get("blocked", [])[:10], 1):
            lines.append(f"  {i}. [{t['agent']}] {t['project']}/{t['task_id']}")
            lines.append(f"     ⏱️ Blocked for: {t.get('blocked_duration_str', 'unknown')}")
            lines.append(f"     🚫 Blocked by: {', '.join(t['blocked_by'][:3])}")
            if len(t['blocked_by']) > 3:
                lines.append(f"     + {len(t['blocked_by']) - 3} more dependencies")
            lines.append(f"     ⚠️ Root cause: {t['root_cause']}")
            lines.append("")
        if count > 10:
            lines.append(f"  ... and {count - 10} more blocked tasks")
    lines.append("")

    # Active Projects
    active = report["active_projects"]
    count = active.get("count", 0)
    lines.append(f"=== 🔄 Active Projects ({count}) ===")
    if active.get("error"):
        lines.append(f"  ERROR: {active['error']}")
    elif count == 0:
        lines.append("  (none)")
    else:
        for p in active.get("projects", []):
            lines.append(f"  - {p['name']}: stage={p['stage']}, pending={p['pending']}/{p['total']}")
    lines.append("")

    # Summary
    ready_count = report["ready_tasks"].get("count", 0)
    blocked_count = report["blocked_tasks"].get("count", 0)
    active_count = report["active_projects"].get("count", 0)
    lines.append("=== 📊 Summary ===")
    lines.append(f"  Ready: {ready_count} | Blocked: {blocked_count} | Active: {active_count}")
    if blocked_count > 5:
        lines.append("  ⚠️ WARNING: High number of blocked tasks, consider unblocking first")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Coord 决策报告 - 快速获取三个决策答案",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python coord_decision_report.py
  python coord_decision_report.py --json
  python coord_decision_report.py --idle 3
  python coord_decision_report.py --workspace /root/.openclaw/workspace-coord
        """
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="输出 JSON 格式"
    )
    parser.add_argument(
        "--idle",
        type=int,
        default=None,
        help="连续空转次数（默认: 从 .heartbeat_count 读取）"
    )
    parser.add_argument(
        "--workspace",
        default="/root/.openclaw/workspace-coord",
        help="工作目录（默认: /root/.openclaw/workspace-coord）"
    )
    parser.add_argument(
        "--proposals-dir",
        default="proposals",
        help="提案库目录（默认: proposals）"
    )
    parser.add_argument(
        "--tasks-dir",
        default="team-tasks",
        help="任务目录（默认: team-tasks）"
    )
    
    args = parser.parse_args()

    # 构建路径
    workspace = Path(args.workspace).resolve()
    tasks_dir = str(workspace / args.tasks_dir)
    idle_count = args.idle if args.idle is not None else get_idle_count(str(workspace))
    
    try:
        report = generate_full_report(tasks_dir, idle_count, args.proposals_dir)
        
        if args.json:
            print(json.dumps(report, indent=2, ensure_ascii=False))
        else:
            print(format_report_text(report))
        
        # 退出码：有阻塞或连续空转 >= 3 时返回非零
        has_blocked = report["blocked_tasks"].get("count", 0) > 0
        should_alert = has_blocked or idle_count >= 3
        sys.exit(1 if should_alert else 0)
        
    except Exception as e:
        print(f"Error generating report: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
