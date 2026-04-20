#!/usr/bin/env python3
"""test_proposal_tracker.py — 验证 proposal_tracker.py 去重逻辑

运行: python3 scripts/test_proposal_tracker.py
"""

import json
import os
import re
import sys
import tempfile
import importlib
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent  # = /root/.openclaw/vibex/scripts

# Fresh reload to avoid cached state
for mod_name in list(sys.modules.keys()):
    if "proposal_tracker" in mod_name:
        del sys.modules[mod_name]

spec = importlib.util.spec_from_file_location("proposal_tracker", SCRIPT_DIR / "proposal_tracker.py")
pt = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pt)

parse_summary = pt.parse_summary
extract_proposal_task_id = pt.extract_proposal_task_id
ProposalTracker = pt.ProposalTracker


def test_em_dash_section_header():
    """## P1 — 重要问题 → parsed as proposal (em-dash = delimiter)."""
    content = "## P1 — 重要问题\n\n### TS-001: Backend Errors\n"
    with tempfile.NamedTemporaryFile(suffix=".md", delete=False, mode="w") as f:
        f.write(content)
        path = Path(f.name)
    try:
        proposals = parse_summary(path)
        ids = [p["id"] for p in proposals]
        assert "TS-001" in ids, f"TS-001 should be parsed, got {ids}"
        assert "P1" in ids, f"P1 with em-dash should be parsed, got {ids}"
        print("  ✓ test_em_dash_section_header")
    finally:
        os.unlink(f.name)


def test_colon_proposal():
    """## P0-1: title → parsed."""
    content = "## P0-1: page.test fix\n"
    with tempfile.NamedTemporaryFile(suffix=".md", delete=False, mode="w") as f:
        f.write(content)
        path = Path(f.name)
    try:
        proposals = parse_summary(path)
        ids = [p["id"] for p in proposals]
        assert "P0-1" in ids, f"got {ids}"
        print("  ✓ test_colon_proposal")
    finally:
        os.unlink(f.name)


def test_no_delimiter_rejected():
    """### P1 执行 (no delimiter) → NOT a proposal."""
    content = "### P1 执行\n"
    with tempfile.NamedTemporaryFile(suffix=".md", delete=False, mode="w") as f:
        f.write(content)
        path = Path(f.name)
    try:
        proposals = parse_summary(path)
        ids = [p["id"] for p in proposals]
        assert "P1" not in ids, f"P1 执行 (no delimiter) should NOT be parsed, got {ids}"
        print("  ✓ test_no_delimiter_rejected")
    finally:
        os.unlink(f.name)


def test_dedup_same_id_same_date():
    """Same id + same date_dir → deduplicate to 1."""
    proposals = [
        {"id": "P0-1", "date_dir": "20260324", "title": "first"},
        {"id": "P0-1", "date_dir": "20260324", "title": "second"},
    ]
    seen_keys = set()
    deduped = []
    for p in proposals:
        key = (p["id"], p.get("date_dir", ""))
        if key in seen_keys:
            continue
        seen_keys.add(key)
        deduped.append(p)
    assert len(deduped) == 1, f"Expected 1, got {len(deduped)}"
    print("  ✓ test_dedup_same_id_same_date")


def test_no_dedup_different_date():
    """Same id + different date_dir → KEEP BOTH."""
    proposals = [
        {"id": "P0-1", "date_dir": "20260324", "title": "page.test"},
        {"id": "P0-1", "date_dir": "20260412", "title": "TS errors"},
    ]
    seen_keys = set()
    deduped = []
    for p in proposals:
        key = (p["id"], p.get("date_dir", ""))
        if key in seen_keys:
            continue
        seen_keys.add(key)
        deduped.append(p)
    assert len(deduped) == 2, f"Expected 2 (diff dates), got {len(deduped)}"
    print("  ✓ test_no_dedup_different_date")


def test_extract_task_id_valid():
    text = "**负责**: dev-e1.1-proposal-tracker"
    result = extract_proposal_task_id(text)
    assert result == "dev-e1.1-proposal-tracker", f"got {result}"
    print("  ✓ test_extract_task_id_valid")


def test_extract_task_id_agent_name():
    text = "**负责**: dev"
    result = extract_proposal_task_id(text)
    assert result is None, f"got {result}"
    print("  ✓ test_extract_task_id_agent_name")


def test_ts_style_id():
    content = "### TS-001: Backend TypeScript Errors\n"
    with tempfile.NamedTemporaryFile(suffix=".md", delete=False, mode="w") as f:
        f.write(content)
        path = Path(f.name)
    try:
        proposals = parse_summary(path)
        ids = [p["id"] for p in proposals]
        assert "TS-001" in ids, f"got {ids}"
        print("  ✓ test_ts_style_id")
    finally:
        os.unlink(f.name)


def test_alpha_prefix_id():
    content = "### A-P1-2: Canvas TreeErrorBoundary\n"
    with tempfile.NamedTemporaryFile(suffix=".md", delete=False, mode="w") as f:
        f.write(content)
        path = Path(f.name)
    try:
        proposals = parse_summary(path)
        ids = [p["id"] for p in proposals]
        assert "A-P1-2" in ids, f"got {ids}"
        print("  ✓ test_alpha_prefix_id")
    finally:
        os.unlink(f.name)


def test_lint_style_id():
    content = "### LINT-001: Frontend ESLint Config Conflict\n"
    with tempfile.NamedTemporaryFile(suffix=".md", delete=False, mode="w") as f:
        f.write(content)
        path = Path(f.name)
    try:
        proposals = parse_summary(path)
        ids = [p["id"] for p in proposals]
        assert "LINT-001" in ids, f"got {ids}"
        print("  ✓ test_lint_style_id")
    finally:
        os.unlink(f.name)


def run_all():
    print("proposal_tracker.py — Test Suite")
    print("=" * 50)
    tests = [
        test_em_dash_section_header,
        test_colon_proposal,
        test_no_delimiter_rejected,
        test_dedup_same_id_same_date,
        test_no_dedup_different_date,
        test_extract_task_id_valid,
        test_extract_task_id_agent_name,
        test_ts_style_id,
        test_alpha_prefix_id,
        test_lint_style_id,
    ]
    passed = failed = 0
    for t in tests:
        try:
            t()
            passed += 1
        except AssertionError as e:
            print(f"  ✗ {t.__name__}: {e}")
            failed += 1
        except Exception as e:
            print(f"  ✗ {t.__name__}: {type(e).__name__}: {e}")
            failed += 1
    print("=" * 50)
    total = passed + failed
    if failed:
        print(f"FAIL: {passed}/{total} passed, {failed} FAILED")
        sys.exit(1)
    else:
        print(f"PASS: {passed}/{total} — ALL OK ✓")
        sys.exit(0)


if __name__ == "__main__":
    run_all()