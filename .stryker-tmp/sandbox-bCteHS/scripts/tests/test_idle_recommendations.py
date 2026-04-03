"""Tests for _idle_recommendations.py — F3 Idle Proposal Recommendation.

Epic3 for coord-decision-report.
"""
import json
import os
import sys
import tempfile
from datetime import datetime, timezone, timedelta

_script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, _script_dir)

from current_report._idle_recommendations import (
    get_idle_recommendations,
    _extract_priority,
    _extract_cost,
    _calculate_strategic_value,
    _score_proposal,
    _parse_proposal_file,
)


class TestF31TopNRecommendations:
    """F3.1: Top N recommendations returned."""

    def test_returns_recommendations(self, tmp_path):
        """get_idle_recommendations returns a dict with recommendations."""
        result = get_idle_recommendations([str(tmp_path)])
        assert "recommendations" in result
        assert "count" in result
        assert "total_scanned" in result

    def test_empty_dir_returns_zero(self, tmp_path):
        """Empty directory returns count 0."""
        result = get_idle_recommendations([str(tmp_path)])
        assert result["count"] == 0
        assert result["recommendations"] == []

    def test_top_n_respected(self, tmp_path):
        """top_n parameter limits results."""
        # Create 5 proposal files
        for i in range(5):
            p = tmp_path / f"proposals/20260330/proj{i}.md"
            p.parent.mkdir(parents=True, exist_ok=True)
            content = f"# Proposal {i}\n\n| P0 | 描述{i} | 减少 50% bug |\n"
            p.write_text(content)

        result = get_idle_recommendations([str(tmp_path)], top_n=3)
        assert result["count"] <= 3


class TestF32PriorityScoring:
    """F3.2: Priority scoring P0 > P1 > P2."""

    def test_p0_before_p1_before_p2(self, tmp_path):
        """P0 proposals ranked higher than P1 and P2."""
        base = tmp_path / "proposals/20260330"
        base.mkdir(parents=True, exist_ok=True)

        for priority in ["P0", "P1", "P2"]:
            p = base / f"prop-{priority}.md"
            p.write_text(f"# Proposal {priority}\n\n| {priority} | test desc for {priority} | 提升 20% |\n")

        result = get_idle_recommendations([str(tmp_path)], top_n=5)
        ranks = {r["priority"]: r["rank"] for r in result["recommendations"]}
        assert ranks["P0"] < ranks["P1"] < ranks["P2"]

    def test_priority_extraction(self):
        """_extract_priority correctly identifies P0/P1/P2."""
        assert _extract_priority("P0 priority proposal") == "P0"
        assert _extract_priority("优先级 P1 item") == "P1"
        assert _extract_priority("P2 低优先级") == "P2"
        assert _extract_priority("no priority here") == "P2"  # default

    def test_cost_extraction(self):
        """_extract_cost correctly identifies hours."""
        assert _extract_cost("工时: 5") == 5
        assert _extract_cost("5 hours effort") == 5
        assert _extract_cost("2 days") == 16  # 2 * 8
        assert _extract_cost("2天工作") == 16
        assert _extract_cost("no cost info") is None


class TestF33ScoringAlgorithm:
    """F3.3: Deterministic scoring algorithm."""

    def test_score_higher_for_p0(self):
        """P0 proposals score higher than P1/P2."""
        p0 = {"priority": "P0", "strategic_value": 0, "proposal_date": datetime.now(timezone.utc).isoformat()}
        p1 = {"priority": "P1", "strategic_value": 0, "proposal_date": datetime.now(timezone.utc).isoformat()}
        p2 = {"priority": "P2", "strategic_value": 0, "proposal_date": datetime.now(timezone.utc).isoformat()}

        now = datetime.now(timezone.utc)
        assert _score_proposal(p0, now) > _score_proposal(p1, now)
        assert _score_proposal(p1, now) > _score_proposal(p2, now)

    def test_strategic_value_boost(self):
        """Proposals with strategic keywords score higher."""
        base = {"priority": "P2", "strategic_value": 0, "proposal_date": datetime.now(timezone.utc).isoformat()}
        high_value = base.copy()
        high_value["strategic_value"] = 25

        now = datetime.now(timezone.utc)
        assert _score_proposal(high_value, now) > _score_proposal(base, now)

    def test_recency_bonus(self):
        """Recent proposals (< 7 days) get recency bonus."""
        now = datetime.now(timezone.utc)
        recent = {"priority": "P2", "strategic_value": 0, "proposal_date": (now - timedelta(days=3)).isoformat()}
        old = {"priority": "P2", "strategic_value": 0, "proposal_date": (now - timedelta(days=30)).isoformat()}

        assert _score_proposal(recent, now) > _score_proposal(old, now)


class TestF34ProposalParsing:
    """F3.4: Proposal file parsing."""

    def test_parse_simple_proposal(self, tmp_path):
        """_parse_proposal_file extracts proposals from markdown."""
        p = tmp_path / "proposals/20260330/test.md"
        p.parent.mkdir(parents=True, exist_ok=True)
        content = """# Test Proposal

| P0 | 减少50%问题 | 提升 20% |
"""
        p.write_text(content)

        proposals = _parse_proposal_file(str(p))
        assert len(proposals) >= 1
        assert proposals[0]["priority"] == "P0"

    def test_proposals_sorted_by_score(self, tmp_path):
        """get_idle_recommendations returns proposals sorted by score descending."""
        base = tmp_path / "proposals/20260330"
        base.mkdir(parents=True, exist_ok=True)

        # Create a P0 proposal (should rank first)
        p = base / "p0-proposal.md"
        p.write_text("# P0 Proposal\n\n| P0 | High priority item | 减少 50% |")

        result = get_idle_recommendations([str(tmp_path)], top_n=3)
        scores = [r["score"] for r in result["recommendations"]]
        assert scores == sorted(scores, reverse=True)


class TestF35Deduplication:
    """F3.5: Duplicate proposals are deduplicated."""

    def test_similar_titles_deduplicated(self, tmp_path):
        """Proposals with similar titles appear only once."""
        base = tmp_path / "proposals/20260330"
        base.mkdir(parents=True, exist_ok=True)

        # Two files with same proposal
        p1 = base / "file1.md"
        p1.write_text("# Proposal\n\n| P0 | 画布状态管理规范 | 减少50% |")
        p2 = base / "file2.md"
        p2.write_text("# Proposal\n\n| P0 | 画布状态管理规范 | 减少50% |")

        result = get_idle_recommendations([str(tmp_path)], top_n=5)
        # Should only have one entry for "画布状态管理规范"
        titles = [r["title"] for r in result["recommendations"]]
        assert len(titles) == len(set(titles))


class TestF36RealProposals:
    """F3.6: Test against real proposal files."""

    def test_real_analyst_proposals(self, tmp_path):
        """Parse real analyst proposal file."""
        # Create a realistic proposal file matching the analyst.md format
        content = """# Analyst 每日自检提案 — 2026-03-30

| # | 提案 | 优先级 | 预期收益 |
|---|------|--------|----------|
| 1 | 画布状态管理规范 | P0 | 减少50% checkbox bug |
| 2 | Canvas Bug Sprint | P0 | 减少50% blocking |
| 3 | 分析报告模板优化 | P1 | 提升阅读效率 |
"""
        p = tmp_path / "proposals/20260330/analyst.md"
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content)

        proposals = _parse_proposal_file(str(p))
        assert len(proposals) >= 1

    def test_proposals_dir_scanned(self):
        """get_idle_recommendations scans real proposals directories."""
        # This tests against the real proposal dirs
        result = get_idle_recommendations()
        assert result["total_scanned"] >= 0
        assert "recommendations" in result
