#!/usr/bin/env python3
"""
proposals/quality_gate.py

Quality gate for proposal submissions.
Validates proposals against required structure and quality criteria.

Usage:
    python3 proposals/quality_gate.py proposals/20260405/dev.md
    python3 proposals/quality_gate.py --all proposals/
"""

import sys
import os
import re
from pathlib import Path

REQUIRED_SECTIONS = [
    "问题描述",
    "根因分析",
    "建议方案",
    "优先级",
    "影响范围",
]

SCORE_WEIGHTS = {
    "问题描述": 2,
    "根因分析": 3,
    "建议方案": 3,
    "优先级": 1,
    "影响范围": 1,
}

def extract_proposals(filepath: str) -> list[dict]:
    """Extract proposals from a markdown file."""
    with open(filepath, encoding="utf-8") as f:
        content = f.read()

    # Split by ## at top level (lookahead for newline + ##)
    blocks = re.split(r"\n(?=## )", content)
    proposals = []
    for block in blocks:
        if not block.strip():
            continue
        # Find the header (first ## heading)
        header_match = re.search(r"^(##\s+\S[^\n]*)", block, re.MULTILINE)
        if not header_match:
            continue
        proposals.append({
            "content": block.strip(),
            "header": header_match.group(1).strip(),
        })
    return proposals

def score_proposal(proposal: dict) -> tuple[int, list[str]]:
    """Score a proposal. Returns (score, issues)."""
    content = proposal["content"]
    score = 0
    issues = []

    # Check each required section
    for section, weight in SCORE_WEIGHTS.items():
        if section in content:
            score += weight
        elif section in ("根因分析", "建议方案"):
            # Also check ### subsections
            subsection = f"### {section}"
            if subsection in content:
                score += weight
            else:
                issues.append(f"Missing: {section}")
        else:
            issues.append(f"Missing: {section}")

    # Bonus: specificity
    if re.search(r"\d{4}-\d{2}-\d{2}", content):
        score += 1
    if re.search(r"P[0-3]", content):
        score += 1
    if re.search(r"(commit|PR|branch|diff)", content, re.I):
        score += 1
    # Bonus: quality metrics section
    if "提案质量评分" in content or "总分" in content:
        score += 1

    return score, issues

def validate_file(filepath: str) -> dict:
    """Validate a single proposal file."""
    result = {
        "file": filepath,
        "exists": os.path.exists(filepath),
        "valid": False,
        "score": 0,
        "max_score": sum(SCORE_WEIGHTS.values()) + 3,
        "issues": [],
        "proposals": 0,
    }

    if not result["exists"]:
        result["issues"].append(f"File not found: {filepath}")
        return result

    proposals = extract_proposals(filepath)
    result["proposals"] = len(proposals)

    if not proposals:
        result["issues"].append("No proposals found")
        return result

    total_score = 0
    for p in proposals:
        s, issues = score_proposal(p)
        total_score += s
        # Only flag issues for P### proposal blocks
        is_proposal = bool(re.search(r"##\s+P\d+", p.get("content", "")))
        if is_proposal and issues:
            result["issues"].extend([f"{p['header']}: {i}" for i in issues])

    result["score"] = total_score
    result["valid"] = result["score"] >= 5 and not result["issues"]
    return result

def main():
    if "--all" in sys.argv:
        idx = sys.argv.index("--all")
        base_dir = sys.argv[idx + 1] if idx + 1 < len(sys.argv) and not sys.argv[idx + 1].startswith("-") else "proposals/"

        results = []
        for root, dirs, files in os.walk(base_dir):
            for f in files:
                if f.endswith(".md") and f != "index.md" and not f.endswith(".py"):
                    path = os.path.join(root, f)
                    r = validate_file(path)
                    if r["exists"]:
                        results.append(r)

        passed = sum(1 for r in results if r["valid"])
        total = len(results)
        print(f"\n📊 Quality Gate Report")
        print(f"   Total files: {total}")
        print(f"   Passed: {passed}/{total}")
        for r in results:
            status = "✅" if r["valid"] else "❌"
            print(f"   {status} {r['file']} (score: {r['score']}/{r['max_score']})")
    else:
        filepath = sys.argv[1] if len(sys.argv) > 1 else "proposals/20260405/dev.md"
        r = validate_file(filepath)
        status = "✅ PASS" if r["valid"] else "❌ FAIL"
        print(f"\n{status} | Score: {r['score']}/{r['max_score']}")
        if r["issues"]:
            for issue in r["issues"]:
                print(f"  - {issue}")

if __name__ == "__main__":
    main()
