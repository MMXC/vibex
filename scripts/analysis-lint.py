#!/usr/bin/env python3
"""
Analysis Lint — 检查 analysis.md 是否满足模板要求。

Usage:
  python3 scripts/analysis-lint.py docs/vibex-xxx/analysis.md
  python3 scripts/analysis-lint.py docs/           # lint all docs/*/analysis.md
  python3 scripts/analysis-lint.py --check docs/vibex-xxx/analysis.md  # exit code = pass/fail

Exit codes:
  0 = all checks passed
  1 = validation failed (with details printed)
"""

import argparse
import os
import re
import sys
from pathlib import Path


def read_file(path: str) -> str:
    with open(path, encoding="utf-8") as f:
        return f.read()


def has_section(content: str, title: str) -> bool:
    """Check if a markdown section exists (case-insensitive)."""
    pattern = re.compile(rf"^#+\s+{re.escape(title)}", re.MULTILINE | re.IGNORECASE)
    return bool(pattern.search(content))


def count_risks(content: str) -> int:
    """Count risk rows in a risk matrix table."""
    # Count table rows that contain risk level emojis
    rows = content.count("🔴") + content.count("🟠") + content.count("🟡")
    return rows


def count_risk_categories(content: str) -> dict:
    """Count risk categories present."""
    cats = {"技术": 0, "业务": 0, "依赖": 0}
    for cat in cats:
        # Look for category in risk matrix context
        pattern = re.compile(rf"{re.escape(cat)}", re.IGNORECASE)
        cats[cat] = len(pattern.findall(content))
    return cats


def check_conclusion(content: str) -> tuple[bool, str]:
    """Check if conclusion is valid."""
    content_lower = content.lower()
    if "结论" not in content:
        return False, "Missing '结论' section"

    # Extract conclusion section (everything after "结论" heading)
    match = re.search(r"(?:^|\n)#{1,6}\s*结\s*论\s*(.+?)(?=\n#|\Z)", content, re.DOTALL | re.IGNORECASE)
    if not match:
        return False, "Conclusion section empty or malformed"

    conclusion_text = match.group(1).strip()

    # Check for valid conclusions
    valid_conclusions = ["推荐", "不推荐", "有条件推荐"]
    found = [c for c in valid_conclusions if c in conclusion_text]

    if not found:
        return False, f"Conclusion must contain one of: {', '.join(valid_conclusions)}"

    # Check for invalid rejection reasons
    invalid_patterns = ["综合考虑", "暂缓", "需要再评估", "再讨论", "再议"]
    for pattern in invalid_patterns:
        if pattern in conclusion_text:
            # If it's the conclusion itself, flag it
            if any(c in conclusion_text[:20] for c in valid_conclusions):
                pass  # OK if it's after the valid conclusion keyword
            else:
                return False, f"Invalid rejection reason: '{pattern}'"

    # Check "not recommend" has specific reason
    if "不推荐" in conclusion_text:
        # Must have substantive reason (not just "综合考虑")
        if len(conclusion_text) < 15:
            return False, "不推荐 requires specific rejection reason"

    return True, f"Valid conclusion: {found[0]}"


def check_estimate_range(content: str) -> tuple[bool, str]:
    """Check if estimate has optimistic/pessimistic range."""
    required = ["乐观", "悲观"]
    found = [r for r in required if r in content]
    if len(found) == len(required):
        return True, "Estimate has optimistic/pessimistic range"
    return False, f"Estimate missing: {', '.join([r for r in required if r not in found])}"


def lint_analysis(path: str) -> dict:
    """Lint a single analysis.md file. Returns dict of checks."""
    checks = []
    content = read_file(path)

    # Check 1: Has conclusion
    has_conclusion, msg = check_conclusion(content)
    checks.append({"id": "conclusion", "passed": has_conclusion, "msg": msg})

    # Check 2: Risk count >= 3
    risk_count = count_risks(content)
    checks.append({
        "id": "risk_count",
        "passed": risk_count >= 3,
        "msg": f"Risk count: {risk_count} (need >= 3)",
    })

    # Check 3: Risk categories (技术/业务/依赖 each >= 1)
    cats = count_risk_categories(content)
    cats_ok = all(cats[c] >= 1 for c in ["技术", "业务", "依赖"])
    checks.append({
        "id": "risk_categories",
        "passed": cats_ok,
        "msg": f"Risk categories: 技术={cats['技术']}, 业务={cats['业务']}, 依赖={cats['依赖']} (need each >= 1)",
    })

    # Check 4: Estimate range
    has_range, msg = check_estimate_range(content)
    checks.append({"id": "estimate_range", "passed": has_range, "msg": msg})

    # Check 5: Feasibility sections (技术/业务/依赖 可行性)
    sections_ok = all(
        has_section(content, dim) for dim in ["技术可行性", "业务可行性", "依赖可行性"]
    )
    checks.append({
        "id": "feasibility_sections",
        "passed": sections_ok,
        "msg": "Has all three feasibility dimensions",
    })

    return {
        "path": path,
        "checks": checks,
        "passed": all(c["passed"] for c in checks),
    }


def main():
    parser = argparse.ArgumentParser(description="Analysis Lint")
    parser.add_argument("path", nargs="?", default=None, help="Path to analysis.md or docs/ dir")
    parser.add_argument("--check", action="store_true", help="Exit with code 1 if any check fails")
    args = parser.parse_args()

    if not args.path:
        # Default: lint all docs/*/analysis.md
        docs_dir = Path("/root/.openclaw/vibex/docs")
        paths = list(docs_dir.glob("*/analysis.md"))
        if not paths:
            print("No analysis.md files found in docs/*/")
            return
    elif os.path.isdir(args.path):
        paths = list(Path(args.path).glob("*/analysis.md"))
    else:
        paths = [Path(args.path)]

    if not paths:
        print(f"No analysis.md found at {args.path}")
        sys.exit(1)

    all_passed = True
    for p in paths:
        result = lint_analysis(str(p))
        icon = "✅" if result["passed"] else "❌"
        print(f"{icon} {p}")

        for check in result["checks"]:
            sub_icon = "✅" if check["passed"] else "❌"
            print(f"  {sub_icon} [{check['id']}] {check['msg']}")

        if not result["passed"]:
            all_passed = False
            failed = [c["id"] for c in result["checks"] if not c["passed"]]
            print(f"  ⚠️  Failed: {', '.join(failed)}")
        print()

    if args.check and not all_passed:
        sys.exit(1)


if __name__ == "__main__":
    main()
