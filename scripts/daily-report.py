#!/usr/bin/env python3
"""
daily-report.py — 生成每日团队状态报告
用法: python3 daily-report.py [date]
输出: docs/daily-reports/YYYYMMDD.md
"""
import sys
import os
import json
import argparse
from pathlib import Path
from datetime import datetime


def load_actionable_suggestions(date: str) -> list:
    """加载指定日期的 actionable 建议"""
    # 尝试 proposals/YYYYMMDD/actionable-suggestions.json
    date_dir = date.replace('-', '')
    proposals_file = f'proposals/{date_dir}/actionable-suggestions.json'
    if os.path.exists(proposals_file):
        with open(proposals_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []


def load_selfcheck_reports(date: str) -> list:
    """加载指定日期的所有 self-check 报告"""
    reports = []
    date_normalized = date.replace('-', '')

    # 搜索模式（支持 -daily 后缀和无后缀目录）
    patterns = [
        f'docs/agent-self-evolution-{date_normalized}-daily/*-selfcheck*.md',
        f'docs/agent-self-evolution-{date_normalized}-daily/*-self-assessment*.md',
        f'docs/agent-self-evolution-{date_normalized}/*-selfcheck*.md',
        f'docs/agent-self-evolution-{date_normalized}/*-self-assessment*.md',
    ]

    import glob
    files = []
    for p in patterns:
        files.extend(glob.glob(p))
    files = list(set(files))

    for f in files:
        try:
            with open(f, 'r', encoding='utf-8') as fp:
                content = fp.read()
            # 提取 agent 名（支持 yaml 和 header 格式）
            import re
            agent_match = re.search(r'agent:\s*(\S+)', content)
            if not agent_match:
                # 从标题提取: # [emoji] Agent Agent 自我总结 [date]
                agent_match = re.search(r'#\s*(?:[^\s]+\s+)?([A-Za-z]+)\s+Agent\s+自我总结', content, re.IGNORECASE)
            agent = agent_match.group(1).rstrip('*_').lower() if agent_match else os.path.basename(f)
            # 提取 score（支持 yaml 和 header 表格格式）
            score_match = re.search(r'score:\s*(\d+)', content)
            if not score_match:
                # 从评分表格提取
                score_match = re.search(r'\|\s*[Aa]gent\s*\|\s*评分\s*\|[\s\S]+?\|\s*\w+\s*\|\s*(\d+)\s*\|', content)
            if not score_match:
                score_match = re.search(r'\|\s*\w+\s*\|\s*(\d+)\s*\|', content)
            score = int(score_match.group(1)) if score_match else None
            reports.append({
                'agent': agent,
                'file': os.path.relpath(f),
                'score': score
            })
        except Exception:
            pass

    return reports


def compute_stats(reports: list, suggestions: list) -> dict:
    """计算统计数据"""
    scores = [r['score'] for r in reports if r['score'] is not None]
    return {
        'total_reports': len(reports),
        'avg_score': round(sum(scores) / len(scores), 1) if scores else None,
        'min_score': min(scores) if scores else None,
        'max_score': max(scores) if scores else None,
        'total_suggestions': len(suggestions),
        'agents_reported': [r['agent'] for r in reports]
    }


def generate_markdown(date: str, reports: list, suggestions: list, stats: dict) -> str:
    """生成 Markdown 格式报告"""
    date_display = date[:4] + '-' + date[4:6] + '-' + date[6:8] if len(date) == 8 else date

    parts = []
    parts.append(f"# 每日团队状态报告 - {date_display}")
    parts.append("")
    parts.append(f"> 自动生成于 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    parts.append("")
    parts.append("## 概览")
    parts.append("")
    parts.append("| 指标 | 数值 |")
    parts.append("|------|------|")
    parts.append(f"| 自检报告提交数 | {stats['total_reports']} |")
    parts.append(f"| 平均自检评分 | {stats['avg_score'] or 'N/A'} |")
    parts.append(f"| 最低/最高评分 | {stats['min_score'] or 'N/A'} / {stats['max_score'] or 'N/A'} |")
    parts.append(f"| 可执行建议数 | {stats['total_suggestions']} |")
    parts.append("")
    parts.append("## 提交状态")
    parts.append("")

    if reports:
        parts.append("| Agent | 评分 | 报告 |")
        parts.append("|------|------|------|")
        for r in reports:
            score_str = str(r['score']) if r['score'] is not None else '?'
            parts.append(f"| {r['agent']} | {score_str} | `{r['file']}` |")
    else:
        parts.append("*暂无自检报告*")

    parts.append("")
    parts.append("## 可执行改进建议")
    parts.append("")

    if not suggestions:
        parts.append("*无 [ACTIONABLE] 建议*")
    else:
        by_agent = {}
        for s in suggestions:
            by_agent.setdefault(s['agent'], []).append(s['suggestion'])
        for agent, items in sorted(by_agent.items()):
            parts.append(f"### [{agent}]")
            for suggestion in items:
                parts.append(f"- [ACTIONABLE] {suggestion}")
            parts.append("")

    parts.append("---")
    parts.append(f"*报告自动生成自 agent-self-evolution-{date.replace('-', '')} 项目*")

    return "\n".join(parts)


def main():
    parser = argparse.ArgumentParser(description='生成每日团队状态报告')
    parser.add_argument('date', nargs='?', help='日期 (YYYYMMDD 或 YYYY-MM-DD)，默认为今天')
    parser.add_argument('--output-dir', default='docs/daily-reports', help='输出目录')
    parser.add_argument('--no-suggestions', action='store_true', help='跳过建议收集')
    args = parser.parse_args()

    date = args.date or datetime.now().strftime('%Y%m%d')

    reports = load_selfcheck_reports(date)
    suggestions = [] if args.no_suggestions else load_actionable_suggestions(date)
    stats = compute_stats(reports, suggestions)
    markdown = generate_markdown(date, reports, suggestions, stats)

    # 保存
    out_dir = args.output_dir
    date_for_path = date.replace('-', '')
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, f'{date_for_path}.md')

    with open(out_file, 'w', encoding='utf-8') as f:
        f.write(markdown)

    print(f'✅ 报告已生成: {out_file}')
    print(f'📊 统计: {stats["total_reports"]} 份报告, 平均评分 {stats["avg_score"] or "N/A"}')

    return 0


if __name__ == '__main__':
    sys.exit(main())
