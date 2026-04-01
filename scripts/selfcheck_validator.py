#!/usr/bin/env python3
"""
selfcheck-validator.py — 验证 self-check 文档格式
支持两种格式: YAML frontmatter 和 Markdown header 标题
用法: python3 selfcheck-validator.py <file-path>
Exit codes: 0=通过, 1=失败, 2=使用错误
"""
import sys
import re
import os
from typing import Optional
from datetime import datetime

ACTIONABLE_PATTERN = re.compile(r'\[ACTIONABLE\]\s*(.+)', re.MULTILINE)
# Use non-greedy match after #, handle emojis (multi-byte chars) before agent name
HEADER_AGENT_PATTERN = re.compile(r'#\s*(?:[^\s]+\s+)?([A-Za-z]+)\s+Agent\s+自我总结', re.IGNORECASE)
HEADER_DATE_PATTERN = re.compile(r'#\s*(?:[^\s]+\s+)?[A-Za-z]+\s+Agent\s+自我总结\s*\[(\d{4}-\d{2}-\d{2})\]', re.IGNORECASE)


def detect_format(doc: str) -> str:
    """检测文档格式: 'yaml' | 'header' | 'unknown'"""
    if doc.startswith('---'):
        return 'yaml'
    if HEADER_AGENT_PATTERN.search(doc):
        return 'header'
    return 'unknown'


def validate_format(doc: str) -> tuple[bool, list[str]]:
    """检查文档格式是否符合要求"""
    fmt = detect_format(doc)
    errors = []
    if fmt == 'yaml':
        end_idx = doc.find('---', 3)
        if end_idx == -1:
            errors.append('YAML frontmatter 未正确闭合 (缺少第二个 ---)')
            return False, errors
    elif fmt == 'header':
        if not HEADER_AGENT_PATTERN.search(doc):
            errors.append('文档标题缺少 Agent 自我总结 格式')
        if not HEADER_DATE_PATTERN.search(doc):
            errors.append('文档标题缺少 [YYYY-MM-DD] 日期格式')
    else:
        errors.append('文档必须使用 YAML frontmatter (---) 或 Markdown header 标题格式')
    return len(errors) == 0, errors


def validate_required_fields(doc: str) -> tuple[list[str], list[str]]:
    """
    检查必需字段是否存在（支持 yaml 和 header 格式）
    Returns: (errors, warnings) — errors 阻塞，warnings 建议修复
    """
    errors = []
    warnings = []
    fmt = detect_format(doc)

    # 核心必需字段（缺失 = 错误）
    if fmt == 'yaml':
        if 'agent:' not in doc:
            errors.append('缺少必需字段: agent:')
        if 'date:' not in doc:
            errors.append('缺少必需字段: date:')
    elif fmt == 'header':
        if not HEADER_AGENT_PATTERN.search(doc):
            errors.append('文档标题缺少 agent 名称')
        if not HEADER_DATE_PATTERN.search(doc):
            errors.append('文档标题缺少日期 [YYYY-MM-DD]')
    else:
        errors.append('无法识别文档格式')

    # 次要必需字段（缺失 = 警告，渐进式合规）
    for field, label in [('完成', '完成情况'), ('改进', '改进建议')]:
        if field not in doc:
            warnings.append(f'建议补充 [{label}] section')

    if '问题' not in doc:
        warnings.append('建议补充 [问题] section（即使是"无问题"）')

    if 'score:' not in doc and '评分' not in doc:
        warnings.append('建议添加 score: 字段或 [自检评分] 表格')

    return errors, warnings


def validate_score(doc: str) -> tuple[bool, Optional[str]]:
    """
    检查 score 是否在 1-10 范围内。
    如果文档缺少 score 字段，返回警告而非错误（新系统渐进式合规）。
    """
    fmt = detect_format(doc)
    score = None

    if fmt == 'yaml':
        match = re.search(r'score:\s*(\d+)', doc)
        if match:
            score = int(match.group(1))
    elif fmt == 'header':
        # 从评分表格中提取: | Agent | 评分 | ... | agent | score |
        match = re.search(r'\|\s*[Aa]gent\s*\|\s*评分\s*\|[\s\S]+?\|\s*\w+\s*\|\s*(\d+)\s*\|', doc)
        if match:
            score = int(match.group(1))
        # else: 缺少评分表格 → 渐进式合规，返回 None（警告而非错误）

    if score is None:
        # 缺少 score 是警告（非阻塞），新系统渐进式合规
        return True, None  # 不返回错误，只在 warnings 中体现

    if score < 1 or score > 10:
        return False, f'score 必须在 1-10 范围内，当前: {score}'
    return True, None


def extract_agent(doc: str) -> Optional[str]:
    """提取 agent 名称（规范化小写）"""
    fmt = detect_format(doc)
    if fmt == 'yaml':
        m = re.search(r'agent:\s*(\S+)', doc)
        return m.group(1).rstrip('*_').lower() if m else None
    elif fmt == 'header':
        m = HEADER_AGENT_PATTERN.search(doc)
        return m.group(1).lower() if m else None
    return None


def extract_date(doc: str) -> Optional[str]:
    """提取日期"""
    fmt = detect_format(doc)
    if fmt == 'yaml':
        m = re.search(r'date:\s*(\S+)', doc)
        return m.group(1) if m else None
    elif fmt == 'header':
        m = HEADER_DATE_PATTERN.search(doc)
        return m.group(1) if m else None
    return None


def extract_actionable(doc: str) -> int:
    """提取 [ACTIONABLE] 建议数量"""
    return len(ACTIONABLE_PATTERN.findall(doc))


# ── E2-T2: 自检报告路径规范 ────────────────────────────────────────────────
def validate_report_path(file_path: str) -> tuple[bool, Optional[str]]:
    """
    验证自检报告路径是否符合规范。
    规范: 报告必须保存在 proposals/YYYYMMDD/ 目录下。
    
    合法路径示例:
      - proposals/20260401/analyst.md
      - docs/proposals/20260401/dev.md
      - /root/.openclaw/workspace-coord/proposals/20260401/pm.md
    
    非法路径示例:
      - proposals/analyst.md          (缺少日期目录)
      - docs/20260401/dev.md         (不在 proposals/ 下)
      - proposals/20260401_1234/xxx   (日期格式不正确)
    
    Returns: (is_valid, error_message)
    """
    if not file_path:
        return False, "报告路径为空"
    
    # 提取 proposals/YYYYMMDD/ 部分
    m = re.search(r'proposals[/\\](\d{8})[/\\]', file_path)
    if not m:
        return False, (
            f"报告路径必须包含 proposals/YYYYMMDD/ 目录\n"
            f"  ✅ 正确: proposals/20260401/analyst.md\n"
            f"  ❌ 错误: proposals/analyst.md (缺少日期目录)\n"
            f"  ❌ 错误: docs/proposals_20260401/xxx (日期格式错误)"
        )
    
    date_str = m.group(1)
    try:
        year = int(date_str[:4])
        month = int(date_str[4:6])
        day = int(date_str[6:8])
        datetime(year, month, day)
    except ValueError:
        return False, f"报告路径中的日期无效: {date_str}"
    
    return True, None


def validate_selfcheck(doc: str, file_path: str = '') -> dict:
    """
    验证 self-check 文档
    Returns: dict with valid, errors, warnings, actionable_count, format
    """
    errors = []
    warnings = []
    fmt = detect_format(doc)

    # 检查格式
    fmt_ok, fmt_errors = validate_format(doc)
    if not fmt_ok:
        errors.extend(fmt_errors)

    # 检查必需字段（返回 errors + warnings）
    field_errors, field_warnings = validate_required_fields(doc)
    errors.extend(field_errors)
    warnings.extend(field_warnings)

    # 检查 score 范围
    score_ok, score_msg = validate_score(doc)
    if not score_ok:
        errors.append(score_msg)

    # 提取 actionable 建议
    actionable_count = extract_actionable(doc)
    if actionable_count > 0:
        warnings.append(f'发现 {actionable_count} 个可执行建议')

    # agent 名称格式建议
    agent = extract_agent(doc)
    if agent and not re.match(r'^[a-z]+(-[a-z]+)*$', agent):
        warnings.append(f'agent 名称格式建议使用小写字母和连字符: {agent}')

    # date 格式建议
    date = extract_date(doc)
    if date and not re.match(r'^\d{4}-\d{2}-\d{2}$', date):
        warnings.append(f'date 格式建议使用 YYYY-MM-DD: {date}')

    # E2-T2: 报告路径规范检查
    if file_path:
        path_ok, path_msg = validate_report_path(file_path)
        if not path_ok:
            errors.append(path_msg)

    return {
        'valid': len(errors) == 0,
        'errors': errors,
        'warnings': warnings,
        'actionable_count': actionable_count,
        'format': fmt,
        'agent': agent,
        'date': date,
        'file_path': file_path
    }


def main():
    if len(sys.argv) < 2:
        print('用法: selfcheck-validator.py <file-path>', file=sys.stderr)
        sys.exit(2)

    file_path = sys.argv[1]

    if file_path == '-':
        doc = sys.stdin.read()
    elif not os.path.exists(file_path):
        print(f'错误: 文件不存在: {file_path}', file=sys.stderr)
        sys.exit(2)
    else:
        with open(file_path, 'r', encoding='utf-8') as f:
            doc = f.read()

    result = validate_selfcheck(doc, file_path)

    if result['valid']:
        print(f'✅ 验证通过: {file_path} [格式: {result["format"]}]')
        for w in result['warnings']:
            print(f'⚠️  {w}')
        if result['actionable_count'] > 0:
            print(f'📋 {result["actionable_count"]} 个可执行建议')
        sys.exit(0)
    else:
        print(f'❌ 验证失败: {file_path}')
        for e in result['errors']:
            print(f'  - {e}')
        sys.exit(1)


if __name__ == '__main__':
    main()
