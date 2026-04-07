#!/usr/bin/env python3
"""
dedup_production_verify.py - 生产环境 dedup 验证脚本

用途:
  - 验证 proposals/ 目录下的提案与生产项目无重复
  - 支持批量验证，返回误判率报告

用法:
  python3 dedup_production_verify.py [proposals_dir] [--workspace TEAM_TASKS_DIR]

示例:
  python3 dedup_production_verify.py docs/proposals/20260324
  python3 dedup_production_verify.py /path/to/proposals --workspace /path/to/team-tasks
"""

import sys
import os
import argparse

# Add dedup module to path
script_dir = os.path.dirname(os.path.abspath(__file__))
dedup_path = os.path.join(script_dir)
if dedup_path not in sys.path:
    sys.path.insert(0, dedup_path)

from dedup import (
    load_existing_projects,
    detect_duplicates,
    extract_keywords,
    THRESHOLD_WARN,
    THRESHOLD_BLOCK,
)


def load_proposals_from_dir(proposals_dir: str) -> list[dict]:
    """从目录加载所有 .md 提案文件"""
    proposals = []
    if not os.path.isdir(proposals_dir):
        print(f"⚠️  目录不存在: {proposals_dir}")
        return proposals

    for fname in sorted(os.listdir(proposals_dir)):
        if not fname.endswith(".md"):
            continue
        fpath = os.path.join(proposals_dir, fname)
        if not os.path.isfile(fpath):
            continue
        with open(fpath, encoding="utf-8") as f:
            content = f.read()

        name = fname.replace(".md", "")
        # 使用前 500 字符作为目标描述代理
        goal = content[:500].replace("\n", " ").strip()
        proposals.append({"name": name, "goal": goal, "source": f"proposals/{fname}"})

    return proposals


def verify_dedup(proposals: list[dict], workspace: str | None = None) -> dict:
    """
    验证提案去重效果。

    Returns:
        {
            "total": int,
            "blocks": int,
            "warns": int,
            "passes": int,
            "false_positives": int,
            "details": [...]
        }
    """
    existing = load_existing_projects(workspace)
    print(f"📊 加载 {len(existing)} 个生产项目")

    blocks = 0
    warns = 0
    passes = 0
    details = []

    for proj in proposals:
        candidates = detect_duplicates(proj, existing, THRESHOLD_WARN)

        if candidates:
            top_sim = candidates[0]["similarity"]
            if top_sim > THRESHOLD_BLOCK:
                blocks += 1
                level = "BLOCK"
            else:
                warns += 1
                level = "WARN"
        else:
            passes += 1
            level = "PASS"

        details.append(
            {
                "name": proj["name"],
                "level": level,
                "candidates": len(candidates),
                "top_similarity": candidates[0]["similarity"] if candidates else 0.0,
                "top_candidate": candidates[0]["name"] if candidates else None,
            }
        )

    total = len(proposals)
    false_positives = blocks  # BLOCK 级别的都是误判（提案是新创建的，不应与旧项目重复）
    fp_rate = false_positives / total if total > 0 else 0.0

    return {
        "total": total,
        "blocks": blocks,
        "warns": warns,
        "passes": passes,
        "false_positives": false_positives,
        "false_positive_rate": fp_rate,
        "details": details,
    }


def print_report(result: dict):
    """打印验证报告"""
    print()
    print("=" * 60)
    print("📋 Dedup 生产验证报告")
    print("=" * 60)
    print(f"  提案总数: {result['total']}")
    print(f"  🔴 Block:  {result['blocks']}")
    print(f"  🟡 Warn:   {result['warns']}")
    print(f"  🟢 Pass:   {result['passes']}")
    print(f"  误判率:   {result['false_positive_rate']:.1%}")
    print()

    if result["blocks"] > 0 or result["warns"] > 0:
        print("  详细结果:")
        for d in result["details"]:
            if d["level"] != "PASS":
                sim = d["top_similarity"]
                cand = d["top_candidate"] or "N/A"
                print(f"    [{d['level']}] {d['name']}")
                print(f"          相似项目: {cand} (相似度 {sim:.3f})")
    else:
        print("  ✅ 所有提案均无重复，生产验证通过！")

    print()
    passed = result["passes"] == result["total"]
    if result["false_positive_rate"] < 0.05 and passed:
        print("  ✅ 验收标准: 误判率 < 5% — 通过")
    else:
        print("  ❌ 验收标准: 误判率 < 5% — 未通过")

    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description="Dedup 生产验证工具")
    parser.add_argument(
        "proposals_dir",
        nargs="?",
        default="docs/proposals",
        help="提案目录路径 (默认: docs/proposals)",
    )
    parser.add_argument(
        "--workspace",
        help="team-tasks 数据目录 (默认从环境变量 TEAM_TASKS_DIR 读取)",
    )
    args = parser.parse_args()

    print(f"🔍 加载提案目录: {args.proposals_dir}")
    proposals = load_proposals_from_dir(args.proposals_dir)
    print(f"📄 加载 {len(proposals)} 个提案文件")

    if not proposals:
        print("⚠️  未找到任何提案文件，退出")
        sys.exit(1)

    result = verify_dedup(proposals, args.workspace)
    print_report(result)

    # Exit code: 0 = pass, 1 = fail
    if result["false_positive_rate"] < 0.05 and result["blocks"] == 0:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
