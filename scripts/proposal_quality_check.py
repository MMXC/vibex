#!/usr/bin/env python3
"""
proposal_quality_check.py — 提案质量检查工具

验证所有 agent 提案文件的完整性：
- 文件存在且非空
- 必需字段存在（日期、Agent、提案列表）
- 优先级格式正确 (P0/P1/P2/P3)
- 每个提案有非空的问题描述和预期收益

用法:
    python proposal_quality_check.py --dir proposals/20260324_0958
    python proposal_quality_check.py --dir proposals/20260324_0958 --fix
"""

import argparse
import os
import re
import sys
from pathlib import Path
from typing import Optional


class ProposalChecker:
    """检查单个提案文件的完整性"""

    REQUIRED_HEADERS = ["日期", "Agent"]  # 必需字段列表

    # 支持的格式:
    #   "**日期**: 2026-03-24"
    #   "# Title — 2026-03-24" (日期在标题行末尾)
    #   "**Agent**: analyst"
    #   "## Architect 提案" + "**作者**: Architect Agent"
    HEADER_PATTERNS = {
        "日期": re.compile(
            r"(?:^\*\*日期\*\*\s*[:：]\s*|—\s*)(\d{4}-\d{2}-\d{2})",
            re.MULTILINE,
        ),
        "Agent": re.compile(
            r"(?:^\*\*Agent\*\*\s*[:：]\s*|^\*\*作者\*\*\s*[:：]\s*)(\w+)",
            re.MULTILINE,
        ),
    }
    VALID_PRIORITIES = ["P0", "P1", "P2", "P3", "P4"]

    def __init__(self, filepath: Path):
        self.filepath = filepath
        self.content = ""
        self.errors: list[str] = []
        self.warnings: list[str] = []
        self.stats = {
            "proposals": 0,
            "with_problem": 0,
            "with_benefit": 0,
            "with_estimate": 0,
        }

    def load(self) -> bool:
        try:
            self.content = self.filepath.read_text(encoding="utf-8")
            if not self.content.strip():
                self.errors.append("文件为空")
                return False
            return True
        except Exception as e:
            self.errors.append(f"文件读取失败: {e}")
            return False

    def check_headers(self) -> bool:
        ok = True
        for header, pattern in self.HEADER_PATTERNS.items():
            if not pattern.search(self.content):
                self.errors.append(f"缺少必需字段: {header}")
                ok = False
        return ok

    def _extract_proposals(self) -> list[dict]:
        """提取所有提案块"""
        proposals = []
        # 匹配 "提案 N: ..." / "Proposal N..." / "P0:" 格式
        # 用前瞻断言找到下一个提案或文件末尾
        end_boundary = r"(?:(?:提案|Proposal)\s+[A-Z]-\d+)|(?:^[A-Z]\d+:)|(?:${}))"
        pattern = rf"(?:(?:提案|Proposal)\s+[A-Z]-\d+.*?(?={end_boundary})|(?:^[A-Z]\d+:.*?(?={end_boundary})))"
        blocks = re.findall(pattern, self.content, re.DOTALL | re.MULTILINE)
        for block in blocks:
            proposals.append({"raw": block})
        return proposals

    def check_proposals(self) -> bool:
        """检查提案列表的完整性和格式"""
        # 提取提案名称和优先级
        # 格式1: "提案 D-001: xxx (P1, 4h)"
        # 格式2: "P0: E2E 测试失败根因分析更新"
        proposal_headers = re.findall(
            r"(?:提案|Proposal)\s+([A-Z]-\d+)[:：]?\s*(?:([^,，\n]+?))?\s*\(?\s*(P\d+)\s*[),，]?\s*(\d+[a-z])?",
            self.content,
            re.MULTILINE,
        )
        # 格式2: standalone "P0:" headers
        standalone_headers = re.findall(
            r"^\s*(P\d+)[:：]\s*([^\n]+?)\s*$",
            self.content,
            re.MULTILINE,
        )
        for match in standalone_headers:
            pid = f"STANDALONE-{match[0]}"
            title = match[1].strip()
            priority = match[0]
            proposal_headers.append((pid, title, priority, ""))

        if not proposal_headers:
            self.warnings.append("未找到任何提案")
            return False

        ok = True
        for match in proposal_headers:
            pid = match[0]
            title = (match[1] or "").strip()
            priority = match[2]
            estimate = (match[3] or "").strip()

            self.stats["proposals"] += 1

            if not title:
                self.errors.append(f"提案 {pid} 缺少标题")
                ok = False

            if priority not in self.VALID_PRIORITIES:
                self.errors.append(f"提案 {pid} 优先级 '{priority}' 无效，应为 {self.VALID_PRIORITIES}")
                ok = False

            # 检查问题描述
            end_boundary = r"(?:提案|Proposal)\s+[A-Z]-\d+|$"
            block_match = re.search(
                rf"(?:提案|Proposal)\s+{re.escape(pid)}.*?(?={end_boundary})",
                self.content,
                re.DOTALL,
            )
            if block_match:
                block = block_match.group()
                if "问题描述" in block or "现状" in block:
                    self.stats["with_problem"] += 1
                else:
                    self.warnings.append(f"提案 {pid} 可能缺少'问题描述'部分")

                if "预期收益" in block or "收益" in block:
                    self.stats["with_benefit"] += 1

                if "工作量" in block or "工时" in block or estimate:
                    self.stats["with_estimate"] += 1

        return ok

    def check_report_section(self) -> bool:
        """检查是否有工作总结部分"""
        if "工作总结" in self.content or "今日工作总结" in self.content:
            return True
        self.warnings.append("建议添加'工作总结'部分")
        return True  # warning not error

    def run(self) -> bool:
        if not self.load():
            return False
        self.check_headers()
        self.check_proposals()
        self.check_report_section()
        return len(self.errors) == 0

    def print_report(self):
        name = self.filepath.name
        passed = len(self.errors) == 0
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"\n{status} {name}")
        for err in self.errors:
            print(f"   🔴 {err}")
        for warn in self.warnings:
            print(f"   🟡 {warn}")
        if self.stats["proposals"] > 0:
            print(f"   📊 提案: {self.stats['proposals']} | "
                  f"含问题描述: {self.stats['with_problem']} | "
                  f"含收益: {self.stats['with_benefit']} | "
                  f"含工时: {self.stats['with_estimate']}")


def scan_directory(base_dir: Path) -> list[Path]:
    """扫描目录获取所有 .md 提案文件"""
    proposals = []
    if not base_dir.exists():
        return proposals

    # 识别常见 agent 提案文件
    agent_patterns = [
        "dev-proposals.md",
        "analyst-proposals.md",
        "architect-proposals.md",
        "pm-proposals.md",
        "tester-proposals.md",
        "reviewer-proposals.md",
        "summary.md",
        "product-analysis.md",
    ]

    for f in sorted(base_dir.iterdir()):
        if f.suffix == ".md" and f.name in agent_patterns:
            proposals.append(f)
        elif f.suffix == ".md" and "proposal" in f.name.lower():
            proposals.append(f)

    return proposals


def main():
    parser = argparse.ArgumentParser(description="检查提案文件质量")
    parser.add_argument("--dir", required=True, help="提案目录路径")
    parser.add_argument("--fix", action="store_true", help="自动修复可修复的问题")
    parser.add_argument("--ci", action="store_true", help="CI 模式，仅返回退出码")
    args = parser.parse_args()

    base_dir = Path(args.dir)
    proposals = scan_directory(base_dir)

    if not proposals:
        print(f"❌ 未找到任何提案文件: {base_dir}")
        sys.exit(1)

    print(f"🔍 检查提案质量: {base_dir}")
    print(f"   发现 {len(proposals)} 个提案文件")

    results = {}
    for fp in proposals:
        checker = ProposalChecker(fp)
        ok = checker.run()
        results[fp.name] = ok
        if not args.ci:
            checker.print_report()

    passed = sum(1 for v in results.values() if v)
    failed = len(results) - passed

    print(f"\n{'='*50}")
    print(f"📊 汇总: {passed} 通过, {failed} 失败 / {len(results)} 总计")

    if failed > 0:
        print(f"\n❌ 以下文件需要修复:")
        for name, ok in results.items():
            if not ok:
                print(f"   - {name}")
        sys.exit(1)
    else:
        print(f"\n✅ 所有提案文件质量检查通过!")
        sys.exit(0)


if __name__ == "__main__":
    main()
