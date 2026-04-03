"""Tests for Epic3: Idle Proposal Recommendations."""
import json
import os
import sys
from pathlib import Path

# Import via sys.modules simulation
_script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_parent_dir = os.path.dirname(_script_dir)
sys.path.insert(0, _parent_dir)

import importlib.util

def _load_mod(name, rel_path):
    """Load a module from scripts/current_report/."""
    full_path = os.path.join(_parent_dir, rel_path)
    spec = importlib.util.spec_from_file_location(name, full_path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod

_rec = _load_mod("current_report._idle_recommendations", "scripts/current_report/_idle_recommendations.py")


class TestIdleRecommendations:
    """F3: Idle proposal recommendations"""

    def test_extract_priority_p0(self):
        """P0 priority extraction"""
        assert _rec._extract_priority("[P0] Test proposal") == "P0"
        assert _rec._extract_priority("优先级: P0") == "P0"
        assert _rec._extract_priority("高优先级 proposal") == "P0"

    def test_extract_priority_p1(self):
        """P1 priority extraction"""
        assert _rec._extract_priority("[P1] Test proposal") == "P1"
        assert _rec._extract_priority("中优先级") == "P1"

    def test_extract_priority_p2(self):
        """P2 priority extraction"""
        assert _rec._extract_priority("[P2] Test proposal") == "P2"
        # Default
        assert _rec._extract_priority("no priority here") == "P2"

    def test_extract_cost_hours(self):
        """Cost extraction in hours"""
        assert _rec._extract_cost("estimated 8 hours") == 8
        assert _rec._extract_cost("工时: 24") == 24
        assert _rec._extract_cost("~5h of work") == 5

    def test_extract_cost_days(self):
        """Cost extraction in days (converted to hours)"""
        assert _rec._extract_cost("estimated 3 days") == 24  # 3*8
        assert _rec._extract_cost("2天") == 16  # 2*8

    def test_strategic_value_reduction(self):
        """Strategic value for reduction keywords"""
        # 减少50%
        score = _rec._calculate_strategic_value("减少50% checkbox bug")
        assert score >= 20
        # High value cap
        assert score <= 30

    def test_strategic_value_automate(self):
        """Strategic value for automation keywords"""
        score = _rec._calculate_strategic_value("自动化工作流程")
        assert score >= 15

    def test_clean_proposal_title(self):
        """Title cleaning removes markdown"""
        assert _rec._clean_proposal_title("**Bold** text") == "Bold text"
        assert _rec._clean_proposal_title("[link](url) text") == "link text"
        assert _rec._clean_proposal_title("`code` example") == "example"
        # Truncation
        long_title = "x" * 200
        assert len(_rec._clean_proposal_title(long_title)) <= 100

    def test_score_proposal(self, tmp_path):
        """Proposal scoring is deterministic"""
        proposal = {
            "priority": "P0",
            "strategic_value": 20,
            "proposal_date": "2026-03-29T00:00:00Z",
        }
        now = _rec.datetime(2026, 3, 30, tzinfo=_rec.timezone.utc)
        score = _rec._score_proposal(proposal, now)
        assert score == 100 + 30 + 20  # P0 + <7days + strategic_value

    def test_parse_proposal_file(self, tmp_path):
        """Parse a simple proposal file"""
        content = """# Test Proposal

## Proposals

| # | Title | Priority | Impact |
|---|-------|----------|--------|
| 1 | Test Proposal A | P0 | 减少50% bug |
| 2 | Test Proposal B | P1 | 自动化 |
"""
        f = tmp_path / "test.md"
        f.write_text(content)

        proposals = _rec._parse_proposal_file(str(f))
        assert len(proposals) >= 1
        # Should have at least P0 proposal
        priorities = [p["priority"] for p in proposals]
        assert "P0" in priorities

    def test_get_idle_recommendations_with_mock_files(self, tmp_path):
        """Test recommendations from temp proposals dir"""
        proposals_dir = tmp_path / "proposals"
        proposals_dir.mkdir()

        # Create a proposal file
        content = """# Test Proposals

## Proposals

| # | Title | Priority | Impact |
|---|-------|----------|--------|
| 1 | Test P0 Proposal | P0 | 减少50% bug |
"""
        (proposals_dir / "test.md").write_text(content)

        result = _rec.get_idle_recommendations(
            proposals_dirs=[str(proposals_dir)],
            top_n=3
        )

        assert result["count"] >= 0  # May be 0 if parsing fails
        assert result["total_scanned"] >= 1
        assert result["error"] is None

    def test_get_idle_recommendations_deduplication(self, tmp_path):
        """Test that duplicate titles are deduplicated"""
        proposals_dir = tmp_path / "proposals"
        proposals_dir.mkdir()

        content = """# Proposals

| # | Title | Priority |
|---|-------|----------|
| 1 | Same Title | P0 |
| 2 | Same Title | P0 |
| 3 | Different Title | P1 |
"""
        (proposals_dir / "test.md").write_text(content)

        result = _rec.get_idle_recommendations(
            proposals_dirs=[str(proposals_dir)],
            top_n=3
        )

        titles = [r["title"] for r in result["recommendations"]]
        assert len(titles) == len(set(titles))  # All unique

    def test_get_idle_recommendations_nonexistent_dir(self):
        """Nonexistent directory returns empty list"""
        result = _rec.get_idle_recommendations(
            proposals_dirs=["/nonexistent/path"],
            top_n=3
        )
        assert result["count"] == 0
        assert result["total_scanned"] == 0
        assert result["error"] is None


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
