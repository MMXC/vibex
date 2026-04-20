#!/usr/bin/env python3
"""
heartbeat_tracker.py — 追踪 heartbeat 话题变化并输出 diff

Usage:
    python3 scripts/heartbeat_tracker.py [--watch]
    python3 scripts/heartbeat_tracker.py --diff  # 只输出变化
    python3 scripts/heartbeat_tracker.py --watch  # 持续监控模式

Output format:
    JSON (default) or Markdown (--format md)
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path

HEARTBEAT_DIR = Path("/root/.openclaw/workspace-coord/heartbeat")
STATE_FILE = Path("/root/.openclaw/vibex/.heartbeat_tracker_state.json")


def load_heartbeats():
    """读取所有 heartbeat JSON 文件"""
    if not HEARTBEAT_DIR.exists():
        return []

    files = sorted(HEARTBEAT_DIR.glob("heartbeat-*.json"))
    results = []
    for f in files:
        try:
            data = json.loads(f.read_text())
            data["_file"] = f.name
            results.append(data)
        except (json.JSONDecodeError, IOError) as e:
            print(f"WARN: 跳过 {f.name}: {e}", file=sys.stderr)
    return results


def extract_topics(heartbeat: dict) -> dict:
    """从 heartbeat JSON 中提取话题信息"""
    # 按 project 分组，提取各 milestone 状态
    project = heartbeat.get("project", "unknown")
    topics = {}

    # 提取 milestone 状态（排除 M0 done 的）
    for key in sorted(heartbeat.keys()):
        if key.startswith("M") and key[1].isdigit():
            status = heartbeat[key]
            if status != "done":
                topics[key] = status

    return {
        "ts": heartbeat.get("ts"),
        "project": project,
        "topics": topics,
        "file": heartbeat.get("_file"),
    }


def compute_diff(prev: dict, curr: dict) -> dict:
    """计算两个 heartbeat 之间的变化"""
    prev_topics = prev.get("topics", {})
    curr_topics = curr.get("topics", {})

    all_keys = set(prev_topics.keys()) | set(curr_topics.keys())
    changes = []

    for key in sorted(all_keys):
        old = prev_topics.get(key)
        new = curr_topics.get(key)
        if old != new:
            changes.append({
                "topic": key,
                "from": old,
                "to": new,
            })

    return {
        "changed": len(changes) > 0,
        "at": curr.get("ts"),
        "previous_ts": prev.get("ts"),
        "current_ts": curr.get("ts"),
        "changes": changes,
        "total_open": len([v for v in curr_topics.values() if v != "done"]),
        "done_count": len([v for v in curr_topics.values() if v == "done"]),
    }


def detect_stale_tasks(heartbeats: list, days: int = 3) -> list:
    """检测连续 N 天状态不变的非 done 任务"""
    if len(heartbeats) < days:
        return []

    stale = []
    latest = heartbeats[-1]

    for key, status in latest.get("topics", {}).items():
        if status == "done":
            continue

        # 检查前 N 天是否都是同一状态
        all_same = True
        for h in heartbeats[-days:]:
            h_status = h.get("topics", {}).get(key)
            if h_status != status:
                all_same = False
                break

        if all_same:
            stale.append({
                "topic": key,
                "status": status,
                "stale_days": days,
            })

    return stale


def output_json(result: dict):
    print(json.dumps(result, indent=2, ensure_ascii=False))


def output_markdown(result: dict):
    print(f"# Heartbeat 话题追踪报告")
    print(f"\n📅 时间: {result.get('at', 'N/A')}")
    print(f"🟢 进展: {result.get('done_count', 0)} 已完成 | 🔴 未完成: {result.get('total_open', 0)}")

    if result.get("changes"):
        print("\n## 📊 状态变化\n")
        for c in result["changes"]:
            emoji = "✅" if c["to"] == "done" else "🔄"
            print(f"  {emoji} **{c['topic']}**: `{c['from']}` → `{c['to']}`")
    else:
        print("\n✅ 无状态变化")

    # 幽灵任务
    stale = result.get("stale", [])
    if stale:
        print(f"\n## ⚠️ 幽灵任务（连续 {stale[0]['stale_days']} 天无变化）\n")
        for s in stale:
            print(f"  • **{s['topic']}** — {s['status']}")

    print()


def save_state(latest_file: str):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps({"last_file": latest_file}))


def load_state() -> str | None:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text()).get("last_file")
        except Exception:
            pass
    return None


def main():
    parser = argparse.ArgumentParser(description="Heartbeat 话题追踪")
    parser.add_argument("--diff", action="store_true", help="输出变化报告")
    parser.add_argument("--watch", action="store_true", help="持续监控模式")
    parser.add_argument("--format", choices=["json", "md"], default="md", help="输出格式")
    parser.add_argument("--days", type=int, default=3, help="幽灵任务判定天数")
    args = parser.parse_args()

    heartbeats = load_heartbeats()
    if not heartbeats:
        print("ERROR: 未找到 heartbeat 文件", file=sys.stderr)
        sys.exit(1)

    latest = heartbeats[-1]
    prev = heartbeats[-2] if len(heartbeats) >= 2 else None

    topics = extract_topics(latest)
    stale = detect_stale_tasks(heartbeats, args.days)

    result = {
        "project": topics["project"],
        "at": topics["ts"],
        "file": topics["file"],
        "changed": False,
        "changes": [],
        "stale": stale,
        "total_open": len([v for v in topics["topics"].values() if v != "done"]),
        "done_count": len([v for v in topics["topics"].values() if v == "done"]),
        "topics": topics["topics"],
    }

    if prev:
        diff = compute_diff(extract_topics(prev), topics)
        result["changed"] = diff["changed"]
        result["changes"] = diff["changes"]

    if args.format == "json":
        output_json(result)
    else:
        output_markdown(result)

    # 保存状态
    save_state(topics["file"])

    # 更新 IMPLEMENTATION_PLAN.md
    update_plan_checklist()

    return 0


def update_plan_checklist():
    """更新 IMPLEMENTATION_PLAN.md 中的 E5 状态"""
    plan_path = Path("/root/.openclaw/vibex/docs/vibex-tech-debt-qa/IMPLEMENTATION_PLAN.md")
    if not plan_path.exists():
        return

    content = plan_path.read_text()

    marker = "- [ ] E5-U1: HEARTBEAT 话题追踪脚本"
    replacement = "- [x] E5-U1: HEARTBEAT 话题追踪脚本 ✅ ({}: heartbeat_tracker.py created)".format(
        datetime.now().strftime("%Y-%m-%d")
    )

    if marker in content and replacement not in content:
        new_content = content.replace(marker, replacement)
        plan_path.write_text(new_content)


if __name__ == "__main__":
    sys.exit(main())