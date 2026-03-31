#!/usr/bin/env python3
"""
validate_report_path.py — E2-T2: 自检报告路径规范

验证所有自检报告路径符合 proposals/YYYYMMDD/ 格式。

Usage:
    python3 validate_report_path.py <report_path>
    python3 validate_report_path.py --check-dir proposals/

Exit codes:
    0 = valid
    1 = invalid path
    2 = usage error
"""

import re
import sys
import os
import argparse
from pathlib import Path

PROPOSALS_DATE_PATTERN = re.compile(r'^proposals/\d{8}/.+$')


def validate_report_path(report_path: str) -> tuple[bool, str]:
    """
    验证报告路径是否符合 proposals/YYYYMMDD/ 格式
    
    Args:
        report_path: 报告路径
        
    Returns:
        (is_valid, message)
    """
    if not report_path:
        return False, "Path cannot be empty"
    
    # 支持绝对路径和相对路径
    # 提取相对于 proposals/ 的部分
    normalized = report_path.strip()
    
    # 如果是绝对路径，提取相对部分
    if os.path.isabs(normalized):
        parts = Path(normalized).parts
        try:
            idx = parts.index('proposals')
            relative = '/'.join(parts[idx:])
        except ValueError:
            return False, f"Path does not contain 'proposals': {normalized}"
        normalized = relative
    
    # 检查是否符合 proposals/YYYYMMDD/ 格式
    if PROPOSALS_DATE_PATTERN.match(normalized):
        return True, f"Valid: {normalized}"
    
    # 更宽松的检查：至少包含 proposals/YYYYMMDD/
    loose_pattern = re.compile(r'^proposals/\d{8}/')
    if loose_pattern.match(normalized):
        return True, f"Valid (relative): {normalized}"
    
    return False, (
        f"Invalid path: '{normalized}'\n"
        f"  Expected format: proposals/YYYYMMDD/<agent>.md\n"
        f"  Example: proposals/20260401/analyst.md"
    )


def check_directory(base_dir: str) -> tuple[int, int]:
    """
    检查目录下所有 .md 文件的路径是否符合规范
    
    Returns:
        (valid_count, invalid_count)
    """
    valid = 0
    invalid = 0
    
    for root, _, files in os.walk(base_dir):
        for f in files:
            if f.endswith('.md'):
                full_path = os.path.join(root, f)
                # 提取相对于 base_dir 的部分
                rel = os.path.relpath(full_path, base_dir)
                is_valid, _ = validate_report_path(rel)
                if is_valid:
                    valid += 1
                    print(f"✓ {rel}")
                else:
                    invalid += 1
                    print(f"✗ {rel}")
    
    return valid, invalid


def main():
    parser = argparse.ArgumentParser(
        description='Validate self-check report paths match proposals/YYYYMMDD/ format'
    )
    parser.add_argument('path', nargs='?', help='Report path to validate')
    parser.add_argument('--check-dir', help='Check all .md files in directory')
    parser.add_argument('--strict', action='store_true', help='Require exact proposals/YYYYMMDD/name.md format')
    
    args = parser.parse_args()
    
    if args.check_dir:
        if not os.path.isdir(args.check_dir):
            print(f"Error: {args.check_dir} is not a directory", file=sys.stderr)
            return 2
        print(f"Checking all .md files in {args.check_dir}...")
        valid, invalid = check_directory(args.check_dir)
        print(f"\nResults: {valid} valid, {invalid} invalid")
        return 1 if invalid > 0 else 0
    
    if not args.path:
        parser.print_help()
        return 2
    
    is_valid, message = validate_report_path(args.path)
    print(message)
    return 0 if is_valid else 1


if __name__ == '__main__':
    sys.exit(main())
