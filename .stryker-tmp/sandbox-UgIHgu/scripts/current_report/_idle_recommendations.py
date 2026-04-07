"""F3: Idle proposal recommendation — scan proposals/ and recommend Top 3.

Epic3 for coord-decision-report.

Deterministic ranking algorithm:
1. Priority score: P0=100, P1=50, P2=10
2. Recency score: proposals < 7 days old = +30, < 14 days = +15, else +0
3. Strategic value score: parsed from description keywords
4. Final score = priority_score + recency_score + strategic_value_score
"""
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Optional

# Known proposal directories
PROPOSALS_DIRS = [
    "/root/.openclaw/workspace-coord/proposals",
    "/root/.openclaw/vibex/docs/proposals",
]

# Strategic value keywords and their scores
VALUE_KEYWORDS = {
    # High impact keywords
    r"减少\s*50%|reduce\s*50%": 20,
    r"消除|eliminate": 20,
    r"自动化|automate": 15,
    r"规范|standard": 10,
    r"优化|optimize": 8,
    r"修复|fix": 5,
    r"清理|cleanup|refactor": 3,
    # Impact indicators
    r"\d+[x×]\s*提效|10x|100%": 15,
    r"50%.*提升|50%.*improvement": 12,
    r"提升\s*\d+%": 8,
    r"减少\s*\d+%": 8,
    r"改进|improve": 5,
}

# Priority patterns
PRIORITY_PATTERNS = [
    (r"P0|优先级\s*0|高优先", "P0"),
    (r"P1|优先级\s*1|中优先", "P1"),
    (r"P2|优先级\s*2|低优先", "P2"),
]

# Cost estimation patterns (in hours)
COST_PATTERNS = [
    (r"(\d+)\s*h(?:our)?s?|工时[:\s]*(\d+)", "hours"),
    (r"(\d+)\s*d(?:ay)?s?|工时[:\s]*(\d+)", "hours"),
    (r"(\d+)\s*天|天[:\s]*(\d+)", "days"),  # Chinese "N天" + "天N"
]


def _extract_priority(text: str) -> str:
    """Extract priority from proposal text. Returns P0, P1, P2, or unknown."""
    for pattern, priority in PRIORITY_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return priority
    return "P2"  # Default to lowest priority if not found


def _extract_cost(text: str) -> Optional[int]:
    """Extract estimated cost in hours from proposal text."""
    # Try hours first
    m = re.search(r"(\d+)\s*h(?:our)?s?", text, re.IGNORECASE)
    if m:
        return int(m.group(1))
    m = re.search(r"工时[:\s]*(\d+)", text)
    if m:
        return int(m.group(1))
    # Try days, convert to hours
    m = re.search(r"(\d+)\s*d(?:ay)?s?", text, re.IGNORECASE)
    if m:
        return int(m.group(1)) * 8  # 8 hours per day
    m = re.search(r"天[:\s]*(\d+)", text)
    if m:
        return int(m.group(1)) * 8
    # "2天" pattern: number directly followed by 天
    m = re.search(r"(\d+)\s*天", text)
    if m:
        return int(m.group(1)) * 8
    return None


def _calculate_strategic_value(text: str) -> int:
    """Calculate strategic value score from proposal description."""
    score = 0
    for pattern, value in VALUE_KEYWORDS.items():
        if re.search(pattern, text, re.IGNORECASE):
            score += value
    return min(score, 30)  # Cap at 30 to avoid dominance


def _extract_date_from_path(fpath: str) -> datetime:
    """Extract date from proposal file path (e.g., /proposals/20260330/dev.md)."""
    # Try to find date pattern YYYYMMDD in path
    m = re.search(r"/(\d{8})/", fpath)
    if m:
        date_str = m.group(1)
        try:
            return datetime.strptime(date_str, "%Y%m%d").replace(tzinfo=timezone.utc)
        except ValueError:
            pass
    # Fallback: file modification time
    try:
        mtime = os.path.getmtime(fpath)
        return datetime.fromtimestamp(mtime, tz=timezone.utc)
    except OSError:
        return datetime.now(timezone.utc)


def _parse_proposal_file(fpath: str) -> List[Dict]:
    """Parse a proposal markdown file and extract proposals."""
    try:
        with open(fpath, encoding="utf-8", errors="replace") as f:
            content = f.read()
    except (OSError, UnicodeDecodeError):
        return []

    proposals = []
    date = _extract_date_from_path(fpath)
    priority = _extract_priority(content)
    cost = _extract_cost(content)
    strategic_value = _calculate_strategic_value(content)

    # Extract title
    title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else os.path.basename(fpath)

    # Extract agent from path or content
    agent_match = re.search(r"/(analyst|architect|dev|pm|tester|reviewer|coord)[-_]?(?:self)?[-_]?(?:check|proposal)", fpath, re.IGNORECASE)
    agent = agent_match.group(1).lower() if agent_match else "unknown"

    # Try to extract individual proposals from table format
    # Looking for markdown tables with priority column
    table_sections = re.split(r"\n\|[^\n]+\|[^\n]+\|[^\n]+\|\n", content)
    for section in table_sections:
        # Look for proposal lines with P0/P1/P2
        prop_matches = re.findall(
            r"(?:^|\n)(\|[^\n]+\|)\s*(?:\n\|[-:\s|]+\|)?(?:\n([^\n]+?))?",
            section,
            re.MULTILINE
        )

    # Simple extraction: look for numbered/bulleted items with priority
    # Pattern: - [P0/P1/P2] or | P0/P1/P2 | description
    lines = content.split("\n")
    for line in lines:
        line = line.strip()
        if not line:
            continue
        # Skip table separator lines
        if re.match(r"\|[-:\s|]+\|", line):
            continue
        # Skip table header lines (contain 提案/priority/描述 etc.)
        if re.match(r"\|\s*[#提案序号优先级]", line):
            continue
        # Must have pipe character for table row
        if "|" not in line:
            # Try non-table pattern: "- [P0] description"
            prop_match = re.search(r"(?:^|\n)(?:-\s+)?\[?(P[012])\]?\s*[:\-]?\s*(.+)", line)
            if prop_match:
                prop_priority = prop_match.group(1)
                desc = prop_match.group(2).strip()
                if len(desc) > 5:
                    prop_cost = _extract_cost(line) or cost
                    prop_value = _calculate_strategic_value(line)
                    proposals.append({
                        "title": _clean_proposal_title(desc[:100]),
                        "priority": prop_priority,
                        "cost_hours": prop_cost,
                        "strategic_value": prop_value,
                        "proposer": agent,
                        "source": os.path.relpath(fpath, "/root/.openclaw"),
                        "proposal_date": date.isoformat(),
                    })
            continue

        # Check if table row contains priority
        prop_match = re.search(r"\|\s*(P[012])\s*\|", line)
        if prop_match:
            prop_priority = prop_match.group(1)
            # Split by | and get the description column
            cells = [c.strip() for c in line.split("|")]
            # Skip empty cells at start/end
            cells = [c for c in cells if c]
            # Priority cell index
            prio_idx = next((i for i, c in enumerate(cells) if re.match(r"^P[012]$", c)), 1)
            # Description cells: non-priority, non-numeric, non-empty
            desc_cells = [
                c for i, c in enumerate(cells)
                if i != prio_idx
                and not re.match(r"^\d+$", c)  # skip row numbers
                and not re.match(r"^P[012]$", c)
                and len(c) > 2
            ]
            desc = desc_cells[0] if desc_cells else ""
            if not desc or len(desc) < 3:
                continue

            prop_cost = _extract_cost(line) or cost
            prop_value = _calculate_strategic_value(line)

            proposals.append({
                "title": _clean_proposal_title(desc[:100]),
                "priority": prop_priority,
                "cost_hours": prop_cost,
                "strategic_value": prop_value,
                "proposer": agent,
                "source": os.path.relpath(fpath, "/root/.openclaw"),
                "proposal_date": date.isoformat(),
            })

    # If no proposals found in table format, create one from the whole file
    if not proposals:
        proposals.append({
            "title": title[:100],
            "priority": priority,
            "cost_hours": cost,
            "strategic_value": strategic_value,
            "proposer": agent,
            "source": os.path.relpath(fpath, "/root/.openclaw"),
            "proposal_date": date.isoformat(),
        })

    return proposals


def _clean_proposal_title(text: str) -> str:
    """Clean proposal title text."""
    # Remove markdown formatting
    text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)  # [text](url) -> text
    text = re.sub(r"\*\*|__", "", text)  # Bold
    text = re.sub(r"\*|_", "", text)  # Italic
    text = re.sub(r"`[^`]+`", "", text)  # Inline code
    # Remove extra whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text[:100]


def _score_proposal(proposal: Dict, now: datetime) -> float:
    """Calculate deterministic score for a proposal."""
    # Priority score
    priority_scores = {"P0": 100, "P1": 50, "P2": 10}
    priority_score = priority_scores.get(proposal["priority"], 0)

    # Recency score
    try:
        prop_date = datetime.fromisoformat(proposal["proposal_date"].replace("Z", "+00:00"))
        age_days = (now - prop_date).days
        if age_days < 7:
            recency_score = 30
        elif age_days < 14:
            recency_score = 15
        elif age_days < 30:
            recency_score = 5
        else:
            recency_score = 0
    except (ValueError, TypeError):
        recency_score = 0

    # Strategic value score
    value_score = proposal.get("strategic_value", 0)

    return float(priority_score + recency_score + value_score)


def get_idle_recommendations(
    proposals_dirs: List[str] = None,
    top_n: int = 3
) -> dict:
    """Scan proposals directories and return Top N recommendations.

    Args:
        proposals_dirs: List of directories to scan. Defaults to PROPOSALS_DIRS.
        top_n: Number of top proposals to return.

    Returns:
        {
            "count": int,
            "recommendations": [
                {
                    "rank": int,
                    "title": str,
                    "priority": str,
                    "cost_hours": Optional[int],
                    "strategic_value": int,
                    "proposer": str,
                    "source": str,
                    "score": float,
                    "reason": str
                }
            ],
            "total_scanned": int,
            "error": Optional[str]
        }
    """
    dirs = proposals_dirs or PROPOSALS_DIRS
    all_proposals = []
    total_scanned = 0
    now = datetime.now(timezone.utc)

    for proposals_dir in dirs:
        if not os.path.isdir(proposals_dir):
            continue

        for root, _, files in os.walk(proposals_dir):
            for fname in files:
                if not fname.endswith(".md"):
                    continue
                fpath = os.path.join(root, fname)
                total_scanned += 1

                # Skip self-check reports (too noisy)
                if "self-check" in fname.lower() or "selfcheck" in fname.lower():
                    continue

                proposals = _parse_proposal_file(fpath)
                all_proposals.extend(proposals)

    # Score and rank all proposals
    for proposal in all_proposals:
        proposal["score"] = _score_proposal(proposal, now)

    # Sort by score descending, then by recency
    all_proposals.sort(
        key=lambda p: (-p["score"], p.get("proposal_date", ""))
    )

    # Build recommendations
    recommendations = []
    seen_titles = set()
    for i, prop in enumerate(all_proposals[:top_n * 3]):  # Get more for deduplication
        title_key = prop["title"].lower()[:50]
        if title_key in seen_titles:
            continue
        seen_titles.add(title_key)

        rank = len(recommendations) + 1
        reason = _build_reason(prop)

        recommendations.append({
            "rank": rank,
            "title": prop["title"],
            "priority": prop["priority"],
            "cost_hours": prop.get("cost_hours"),
            "strategic_value": prop["strategic_value"],
            "proposer": prop["proposer"],
            "source": prop["source"],
            "score": prop["score"],
            "reason": reason,
        })

        if len(recommendations) >= top_n:
            break

    return {
        "count": len(recommendations),
        "recommendations": recommendations,
        "total_scanned": total_scanned,
        "error": None
    }


def _build_reason(proposal: Dict) -> str:
    """Build a human-readable reason for the recommendation."""
    parts = []
    parts.append(f"{proposal['priority']} priority")
    if proposal.get("cost_hours"):
        parts.append(f"~{proposal['cost_hours']}h")
    if proposal.get("strategic_value", 0) >= 15:
        parts.append("high impact")
    elif proposal.get("strategic_value", 0) >= 8:
        parts.append("moderate impact")
    parts.append(f"by {proposal['proposer']}")
    return ", ".join(parts)
