#!/usr/bin/env python3
"""
actionable-collector.py — 从 self-check 文档中提取 [ACTIONABLE] 建议
用法: python3 actionable-collector.py <docs-dir> [date]
"""
import sys
import os
import re
import json
import glob
from pathlib import Path
from typing import List, Optional

ACTIONABLE_PATTERN = re.compile(r'\[ACTIONABLE\]\s*(.+?)(?:$|\n)', re.MULTILINE)
DATE_PATTERN = re.compile(r'date:\s*(\S+)')
AGENT_PATTERN = re.compile(r'agent:\s*(\S+)')


def extract_agent_from_filename(file_path: str) -> str:
    """从文件名提取 agent 名: project-self-evolution-DATE/agent-selfcheck-DATE.md"""
    basename = os.path.basename(file_path)
    # agent-selfcheck-20260330.md → agent
    match = re.match(r'^(.+?)-selfcheck', basename)
    if match:
        return match.group(1)
    return 'unknown'


def extract_agent_from_frontmatter(file_path: str) -> Optional[str]:
    """从 frontmatter 提取 agent"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        m = AGENT_PATTERN.search(content)
        if m:
            return m.group(1).rstrip('*_')
    except Exception:
        pass
    return None


def extract_actionable_items(file_path: str) -> List[dict]:
    """从单个文件中提取所有 [ACTIONABLE] 建议"""
    items = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f'⚠️  读取失败 {file_path}: {e}', file=sys.stderr)
        return items

    # 提取 agent（优先 frontmatter，其次文件名）
    agent = extract_agent_from_frontmatter(file_path) or extract_agent_from_filename(file_path)

    # 提取日期
    date_match = DATE_PATTERN.search(content)
    date = date_match.group(1) if date_match else ''

    # 提取所有 [ACTIONABLE] 行及其上下文
    matches = ACTIONABLE_PATTERN.finditer(content)
    for m in matches:
        suggestion = m.group(1).strip()
        # 去除 markdown 格式
        suggestion = re.sub(r'\[.*?\]\(.*?\)', '', suggestion)  # 去除链接
        suggestion = re.sub(r'\*+([^*]+)\*+', r'\1', suggestion)  # 去除粗体斜体
        suggestion = suggestion.strip(' -–—')
        items.append({
            'agent': agent,
            'suggestion': suggestion,
            'date': date,
            'source_file': os.path.relpath(file_path, os.getcwd())
        })

    return items


def find_selfcheck_docs(docs_dir: str, date: str) -> List[str]:
    """
    查找指定日期的 self-check 文档
    支持目录模式: docs/agent-self-evolution-YYYYMMDD/*-selfcheck*.md
    """
    # 标准化日期格式
    date_normalized = date.replace('-', '')

    patterns = [
        # docs/agent-self-evolution-YYYYMMDD-daily/*-selfcheck*.md
        f'{docs_dir}/agent-self-evolution-{date_normalized}-daily/*-selfcheck*.md',
        f'{docs_dir}/agent-self-evolution-{date_normalized}-daily/*-self-assessment*.md',
        # docs/agent-self-evolution-YYYYMMDD/*-selfcheck*.md
        f'{docs_dir}/agent-self-evolution-{date_normalized}/*-selfcheck*.md',
        f'{docs_dir}/agent-self-evolution-{date_normalized}/*-self-assessment*.md',
    ]

    found = []
    for pattern in patterns:
        found.extend(glob.glob(pattern))
    # 去重
    return list(set(found))


def collect_actionable_suggestions(docs_dir: str, date: str) -> List[dict]:
    """收集指定日期所有 self-check 文档中的 [ACTIONABLE] 建议"""
    files = find_selfcheck_docs(docs_dir, date)
    all_items = []
    for f in files:
        items = extract_actionable_items(f)
        all_items.extend(items)
    return all_items


def save_to_json(items: List[dict], proposals_dir: str, date: str) -> str:
    """保存建议到 JSON 文件"""
    # 标准化日期目录名 YYYYMMDD
    date_dir = date.replace('-', '')
    out_dir = os.path.join(proposals_dir, date_dir)
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, 'actionable-suggestions.json')
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    return out_file


def main():
    docs_dir = sys.argv[1] if len(sys.argv) > 1 else 'docs'
    date = sys.argv[2] if len(sys.argv) > 2 else None

    if date is None:
        import datetime
        date = datetime.date.today().strftime('%Y-%m-%d')

    if not os.path.isdir(docs_dir):
        print(f'错误: 目录不存在: {docs_dir}', file=sys.stderr)
        sys.exit(1)

    items = collect_actionable_suggestions(docs_dir, date)
    out_file = save_to_json(items, 'proposals', date)

    print(f'✅ 已收集 {len(items)} 个建议 → {out_file}')

    if items:
        print('\n📋 建议汇总:')
        by_agent = {}
        for item in items:
            by_agent.setdefault(item['agent'], []).append(item['suggestion'])
        for agent, suggestions in sorted(by_agent.items()):
            print(f'  [{agent}]')
            for s in suggestions:
                print(f'    - {s}')

    sys.exit(0)


if __name__ == '__main__':
    main()
