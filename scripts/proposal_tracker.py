#!/usr/bin/env python3
"""proposal_tracker.py — Proposal Execution Tracker

Scans proposals/ date directories → parses summary.md → queries task_manager status
→ generates EXECUTION_TRACKER.json + EXECUTION_TRACKER.md.

Run:  python3 proposal_tracker.py
Cron: 0 9 * * * root cd /root/.openclaw/vibex && python3 scripts/proposal_tracker.py

E1.1 from agent-proposals-20260329-evening
"""

import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).parent.resolve()
VIBEX_ROOT = SCRIPT_DIR.parent.resolve()
PROPOSALS_DIR = VIBEX_ROOT / "proposals"
OUTPUT_DIR = PROPOSALS_DIR
OUTPUT_JSON = OUTPUT_DIR / "EXECUTION_TRACKER.json"
OUTPUT_MD = OUTPUT_DIR / "EXECUTION_TRACKER.md"

TEAM_TASKS_DIR = Path("/root/.openclaw/workspace-coord/team-tasks")

# ── ANSI colors ──────────────────────────────────────────────────────────────

C_RESET = "\033[0m"
C_GREEN = "\033[32m"
C_YELLOW = "\033[33m"
C_CYAN = "\033[36m"
C_BOLD = "\033[1m"
C_DIM = "\033[2m"


# ── Task State Query ─────────────────────────────────────────────────────────

def load_task_json(project_name: str) -> dict | None:
    """Load a task_manager JSON project file.

    Checks in order:
    1. TEAM_TASKS_DIR / projects / project_name / tasks.json  (new layout)
    2. TEAM_TASKS_DIR / {project_name}.json                   (legacy flat)
    """
    # New layout
    new_path = TEAM_TASKS_DIR / "projects" / project_name / "tasks.json"
    if new_path.exists():
        try:
            return json.loads(new_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            pass

    # Legacy flat layout
    flat_path = TEAM_TASKS_DIR / f"{project_name}.json"
    if flat_path.exists():
        try:
            return json.loads(flat_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            pass

    return None


def get_project_status(project_name: str) -> tuple[str, list[dict]]:
    """Return (project_status, stages_list) for a task_manager project.

    Stages are sorted by topological order (depth-first, roots first).
    """
    data = load_task_json(project_name)
    if not data:
        return "unknown", []

    project_status = data.get("status", "unknown")
    stages = data.get("stages", {})

    if not stages:
        return project_status, []

    # Build adjacency list (task → dependents) for topological sort
    dependents = {tid: [] for tid in stages}
    in_degree = {tid: 0 for tid in stages}
    for tid, t in stages.items():
        for dep in t.get("dependsOn", []):
            if dep in dependents:
                dependents[dep].append(tid)
                in_degree[tid] = in_degree.get(tid, 0) + 1

    # Kahn's algorithm → topological order
    queue = [tid for tid, deg in in_degree.items() if deg == 0]
    sorted_ids = []
    while queue:
        tid = queue.pop(0)
        sorted_ids.append(tid)
        for dep in dependents.get(tid, []):
            in_degree[dep] -= 1
            if in_degree[dep] == 0:
                queue.append(dep)

    # Fallback for cycles
    if len(sorted_ids) < len(stages):
        sorted_ids = list(stages.keys())

    stage_list = [
        {
            "id": tid,
            "agent": stages[tid].get("agent", ""),
            "status": stages[tid].get("status", "pending"),
            "startedAt": stages[tid].get("startedAt"),
            "completedAt": stages[tid].get("completedAt"),
        }
        for tid in sorted_ids
    ]
    return project_status, stage_list


def extract_proposal_task_id(summary_content: str) -> str | None:
    """Extract linked task_id from a proposal entry in summary.md.

    Looks for patterns like:
    - **负责**: dev-e1.1-proposal-tracker  → returns "dev-e1.1-proposal-tracker"
    - **负责**: dev  → returns None (just an agent, not a task)
    - **任务ID**: vibex-xxx  → returns "vibex-xxx"
    - task: vibex-xxx  → returns "vibex-xxx"
    """
    # Pattern 1: "**负责**: dev-e1.1-proposal-tracker" — explicit task_id
    # Must have at least 2 segments (e.g. dev-e1.1-proposal-tracker)
    responsible_match = re.search(
        r"\*\*?负责\*\*?:\s*([a-zA-Z][a-zA-Z0-9_\.-]+)",
        summary_content[:2000],
    )
    if responsible_match:
        value = responsible_match.group(1).strip()
        # Single words like "dev", "analyst" are agent names, not task IDs
        # Task IDs typically have multiple hyphenated segments
        hyphen_count = len(re.findall(r"-", value))
        if hyphen_count >= 1 and len(value) > 5:
            return value

    # Pattern 2: explicit task_id fields
    task_patterns = [
        r"(?:task_id|task-id|任务ID)[:：\s]+([a-z][a-z0-9_\.-]{4,})",
        r"(?:project|项目|项目名)[:：\s]+([a-z][a-z0-9_\.-]{4,})",
        r"(?:任务|task)[:：\s]+([a-z][a-z0-9_\.-]{4,})",
    ]
    for pattern in task_patterns:
        m = re.search(pattern, summary_content[:2000], re.IGNORECASE)
        if m:
            candidate = m.group(1).strip()
            if candidate and len(candidate) > 4:
                return candidate

    # Pattern 3: Conservative — only match known project/task ID prefixes
    # Avoid matching general words like "three-column" or "error-boundary"
    task_id_patterns = [
        r"\b(agent-proposals-[0-9]{8}(?:-[a-z]+)?)\b",
        r"\b(vibex-(?:canvas|backend|bc|api|feature|expand|phase)[a-z0-9_-]{2,})\b",
        r"\b(canvas-phase\d+)\b",
        r"\b(dev-[a-z][a-z0-9_-]{5,})\b",
        r"\b(analyst-[a-z][a-z0-9_-]{5,})\b",
        r"\b(pm-[a-z][a-z0-9_-]{5,})\b",
        r"\b(architect-[a-z][a-z0-9_-]{5,})\b",
        r"\b(tester-[a-z][a-z0-9_-]{5,})\b",
        r"\b(reviewer-[a-z][a-z0-9_-]{5,})\b",
    ]
    for pattern in task_id_patterns:
        m = re.search(pattern, summary_content[:3000], re.IGNORECASE)
        if m:
            return m.group(1).strip()

    return None


# ── Summary Parser ───────────────────────────────────────────────────────────

def parse_summary(summary_path: Path) -> list[dict]:
    """Parse a summary.md file and extract proposal entries.

    Handles both h2 (##) and h3 (###) proposal headings:
      ## P0-1: title
      ## 🔴 P0-1: title
      ### 🔴 P0-1: page.test.tsx 4 个预存失败
      ### 🟠 P1-1: ErrorBoundary 组件去重
      ## 一、执行摘要  ← NOT a proposal
      ## 二、P0 阻断项  ← NOT a proposal

    Returns a list of dicts:
      {
        "id": "P0-1",
        "title": "...",
        "priority": "P0",
        "raw_text": "...",
      }
    """
    content = summary_path.read_text(encoding="utf-8", errors="replace")

    proposals = []

    # Match h3 proposal headings: ### [emoji] P0-1: title
    # Also match h2 proposal headings: ## [emoji] P0-1: title
    # Skip section headings like "## 一、执行摘要" (no P/T/D/E/A prefix)
    heading_re = re.compile(
        r"^#{2,3}\s+(?:[🔴🟠🟡🟢⚠️]\s*)?([A-Z]\d+(?:[.:-]\d+)?)\s*[:\-]?\s*(.+)$",
        re.MULTILINE,
    )

    for match in heading_re.finditer(content):
        pid = match.group(1).strip()
        title = match.group(2).strip()

        # Extract priority prefix
        priority = "P?"
        pri_match = re.match(r"^([A-Z]\d+)", pid)
        if pri_match:
            # Extract letter/number prefix
            letter_match = re.match(r"^([A-Z])\d+", pid)
            if letter_match:
                letter = letter_match.group(1)
                num_match = re.search(r"\d+", pid)
                num = num_match.group() if num_match else ""
                priority = f"{letter}{num}"
            else:
                priority = pri_match.group(1)

        # Get the raw text block for this proposal (up to next heading or 3000 chars)
        start = match.start()
        next_match = heading_re.search(content, match.end())
        end = next_match.start() if next_match else len(content)
        raw_text = content[start:end]

        proposals.append({
            "id": pid,
            "title": title,
            "priority": priority,
            "raw_text": raw_text[:3000],  # Limit to avoid huge blocks
        })

    return proposals


# ── Tracker Core ─────────────────────────────────────────────────────────────

class ProposalTracker:
    """Scans proposals/ directories and generates execution tracker."""

    def __init__(self, proposals_dir: Path = PROPOSALS_DIR, output_dir: Path = OUTPUT_DIR):
        self.proposals_dir = Path(proposals_dir)
        self.output_dir = Path(output_dir)
        self.proposals: list[dict] = []

    # ── Phase 1: Scan ───────────────────────────────────────────────────────

    def scan_directories(self) -> int:
        """Scan date-named directories and parse summary.md files."""
        count = 0
        for entry in sorted(self.proposals_dir.iterdir()):
            if not entry.is_dir():
                continue
            # Date directories: 20260324, 20260325, 20260329_2208, 20260324_185417, etc.
            # Format: 8 digits, optionally followed by _ and any number of digits
            if not re.match(r"^\d{8}(_\d+)?$", entry.name):
                continue

            summary_file = entry / "summary.md"
            if not summary_file.exists():
                continue

            parsed = parse_summary(summary_file)
            for p in parsed:
                p["date_dir"] = entry.name
                p["summary_path"] = str(summary_file)

            self.proposals.extend(parsed)
            count += len(parsed)

        return count

    # ── Phase 2: Enrich with task status ───────────────────────────────────

    def enrich_with_task_status(self) -> None:
        """Query task_manager for each proposal's linked task status."""
        for proposal in self.proposals:
            raw_text = proposal.get("raw_text", "")

            # Try to extract task_id from the proposal text
            task_id = extract_proposal_task_id(raw_text)

            if not task_id:
                # Fallback: try to map proposal ID to a project
                task_id = self._infer_task_id(proposal)

            if task_id:
                proposal["task_id"] = task_id
                project_status, stages = get_project_status(task_id)
                proposal["task_status"] = project_status
                proposal["task_stages"] = stages

                # Determine the stage status that maps to this proposal
                # Look for a stage that contains the proposal ID in its task_id
                matched_stage = None
                for stage in stages:
                    sid = stage["id"]
                    if (
                        proposal["id"].lower().replace(" ", "-").replace("_", "-")
                        in sid.lower().replace(" ", "-").replace("_", "-")
                    ) or (
                        sid.lower().replace(" ", "-").replace("_", "-")
                        in proposal["id"].lower().replace(" ", "-").replace("_", "-")
                    ):
                        matched_stage = stage
                        break

                if matched_stage:
                    proposal["stage_status"] = matched_stage["status"]
                    proposal["stage_agent"] = matched_stage["agent"]
                    proposal["stage_started"] = matched_stage.get("startedAt")
                    proposal["stage_completed"] = matched_stage.get("completedAt")
                else:
                    proposal["stage_status"] = project_status
                    proposal["stage_agent"] = ""
                    proposal["stage_started"] = None
                    proposal["stage_completed"] = None
            else:
                proposal["task_id"] = None
                proposal["task_status"] = "no-linked-task"
                proposal["task_stages"] = []
                proposal["stage_status"] = "no-linked-task"
                proposal["stage_agent"] = ""
                proposal["stage_started"] = None
                proposal["stage_completed"] = None

    # ── E2-T1: Proposal → Epic → Task Linking ─────────────────────────────────

    def _parse_prd_epic_table(self, prd_path: Path) -> dict:
        """Parse the Epic总览 table from a PRD file.

        Returns a dict: {proposal_to_epics: {pid: [epic_name, ...], ...}, epic_to_proposals: {epic: [pid, ...], ...}}
        E.g. {"proposal_to_epics": {"P001": ["E1"]}, "epic_to_proposals": {"E1": ["P001", "A-P0-1"]}}
        """
        if not prd_path or not prd_path.exists():
            return {}

        try:
            content = prd_path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            return {}

        # Find the Epic总览 table (markdown table with | Epic | 名称 | 来源提案 | ...)
        epic_table_re = re.compile(
            r"(?:Epic\s*总览|Epic\s*拆分|Epic\s*概览)\s*\n\s*\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|\s*\n((?:\|[^\n]+\|\s*\n)+)",
            re.MULTILINE,
        )
        match = epic_table_re.search(content)
        if not match:
            return {}

        table_rows = match.group(1).strip().split("\n")
        proposal_to_epics: dict = {}
        epic_to_proposals: dict = {}

        for row in table_rows:
            # Parse markdown table row: | E1 | Canvas API 端点... | P001+A-P0-1 | ...
            cells = [c.strip().strip("|").strip() for c in row.split("|")]
            if len(cells) < 3:
                continue
            epic_name = cells[0].strip()
            # 3rd column (index 2) is "来源提案" containing "P001+A-P0-1" etc.
            source_col = cells[2].strip() if len(cells) > 2 else ""

            # Skip header-like rows
            if not epic_name or epic_name.lower() in ("epic", "名称", "来源"):
                continue

            epic_to_proposals.setdefault(epic_name, [])

            # Parse comma-or-plus-separated proposal IDs (e.g. "P001+A-P0-1" or "P001, A-P0-1")
            # Proposal IDs: P0-N, P1-N, A-P0-N, A-P1-N, etc.
            pid_matches = re.findall(r"[A-Z]-P\d+-\d+|[A-Z]\d+(?:[.:-]\d+)?", source_col)
            for pid in pid_matches:
                if pid not in epic_to_proposals[epic_name]:
                    epic_to_proposals[epic_name].append(pid)
                proposal_to_epics.setdefault(pid, []).append(epic_name)

        return {"proposal_to_epics": proposal_to_epics, "epic_to_proposals": epic_to_proposals}

    def _get_tasks_for_epic(self, project_name: str, epic_id: str) -> list[dict]:
        """Get all task stages for an Epic in a task_manager project.

        E.g. for epic_id="E2" in project "vibex-proposals-20260405",
        finds stages: dev-e2, tester-e2, reviewer-e2, reviewer-push-e2
        Also finds stages with proposal_id set.
        """
        data = load_task_json(project_name)
        if not data:
            return []

        stages = data.get("stages", {})
        epic_id_lower = epic_id.lower().replace(" ", "-").replace("_", "-")

        # Build topological order
        dependents = {tid: [] for tid in stages}
        in_degree = {tid: 0 for tid in stages}
        for tid, t in stages.items():
            for dep in t.get("dependsOn", []):
                if dep in dependents:
                    dependents[dep].append(tid)
                    in_degree[tid] = in_degree.get(tid, 0) + 1

        queue = [tid for tid, deg in in_degree.items() if deg == 0]
        sorted_ids = []
        while queue:
            tid = queue.pop(0)
            sorted_ids.append(tid)
            for dep in dependents.get(tid, []):
                in_degree[dep] -= 1
                if in_degree[dep] == 0:
                    queue.append(dep)

        if len(sorted_ids) < len(stages):
            sorted_ids = list(stages.keys())

        result = []
        for tid in sorted_ids:
            t = stages[tid]
            tid_lower = tid.lower().replace(" ", "-").replace("_", "-")
            # Match: dev-e2, tester-e2, reviewer-e2, reviewer-push-e2, etc.
            if f"-{epic_id_lower}" in tid_lower or tid_lower.startswith(epic_id_lower + "-"):
                result.append({
                    "id": tid,
                    "agent": t.get("agent", ""),
                    "status": t.get("status", "pending"),
                    "startedAt": t.get("startedAt"),
                    "completedAt": t.get("completedAt"),
                    "proposal_id": t.get("proposal_id"),
                })
            # Also match stages with proposal_id set (E2-T1 new field)
            elif t.get("proposal_id"):
                result.append({
                    "id": tid,
                    "agent": t.get("agent", ""),
                    "status": t.get("status", "pending"),
                    "startedAt": t.get("startedAt"),
                    "completedAt": t.get("completedAt"),
                    "proposal_id": t.get("proposal_id"),
                })

        return result

    def _find_project_for_date_dir(self, date_dir: str) -> str | None:
        """Find a vibex-proposals project matching a date directory.

        E.g. date_dir="20260405" → "vibex-proposals-20260405"
        """
        # Scan for vibex-proposals-{date} projects
        for candidate in TEAM_TASKS_DIR.glob(f"vibex-proposals-{date_dir}.json"):
            return candidate.stem
        # Also check projects subdirectory
        projects_dir = TEAM_TASKS_DIR / "projects"
        if projects_dir.is_dir():
            for candidate in projects_dir.glob(f"vibex-proposals-{date_dir}*"):
                tasks_file = candidate / "tasks.json"
                if tasks_file.exists():
                    return candidate.name
        # Fallback: scan all vibex-proposals projects
        for pattern in [f"vibex-proposals-{date_dir}*", f"vibex-*proposals*{date_dir}*"]:
            for candidate in TEAM_TASKS_DIR.glob(pattern):
                if candidate.suffix == ".json":
                    return candidate.stem
                elif candidate.is_dir():
                    return candidate.name
        return None

    def _enrich_with_linked_tasks(self) -> None:
        """E2-T1: Link proposals to task stages via PRD Epic总览 table.

        For each proposal:
        1. Find the vibex-proposals project for its date_dir
        2. Parse the PRD's Epic总览 table for proposal→Epic mapping
        3. Look up task stages for matching Epic in the project
        4. Store linked task stages in proposal entry
        """
        for proposal in self.proposals:
            date_dir = proposal.get("date_dir", "")
            proposal_id = proposal.get("id", "")
            raw_text = proposal.get("raw_text", "")

            linked_tasks = []

            # Strategy 1: proposal_id matches a stage's proposal_id field (E2-T1 new)
            for f in list(TEAM_TASKS_DIR.glob("*.json")) + \
                      list((TEAM_TASKS_DIR / "projects").glob("*/*.json")):
                try:
                    data = json.loads(f.read_text(encoding="utf-8"))
                except (json.JSONDecodeError, OSError):
                    continue

                for tid, stage in data.get("stages", {}).items():
                    if stage.get("proposal_id") == proposal_id:
                        linked_tasks.append({
                            "id": tid,
                            "agent": stage.get("agent", ""),
                            "status": stage.get("status", "pending"),
                            "project": f.stem if f.suffix == ".json" else f.parent.name,
                            "stage_proposal_id": stage.get("proposal_id"),
                            "startedAt": stage.get("startedAt"),
                            "completedAt": stage.get("completedAt"),
                        })

            # Strategy 2: Parse PRD's Epic总览 table for proposal→Epic mapping
            project_name = self._find_project_for_date_dir(date_dir)
            if project_name:
                # Look for PRD in both docs/ and proposals/ directories
                prd_paths = [
                    VIBEX_ROOT / "docs" / f"vibex-proposals-{date_dir}" / "prd.md",
                    PROPOSALS_DIR / date_dir / "prd.md",
                    VIBEX_ROOT / "docs" / project_name / "prd.md",
                ]
                for prd_path in prd_paths:
                    if prd_path.exists():
                        epic_map = self._parse_prd_epic_table(prd_path)
                        proposal_to_epics = epic_map.get("proposal_to_epics", {})
                        epic_names = proposal_to_epics.get(proposal_id, [])

                        for epic_name in epic_names:
                            tasks = self._get_tasks_for_epic(project_name, epic_name)
                            for task in tasks:
                                # Avoid duplicates
                                if not any(t["id"] == task["id"] and t.get("project") == project_name for t in linked_tasks):
                                    linked_tasks.append({**task, "project": project_name})
                        break  # Found and parsed PRD

            proposal["linked_tasks"] = linked_tasks

    def _infer_task_id(self, proposal: dict) -> str | None:
        """Infer a task ID from proposal context.

        Looks for patterns like:
        - "vibex-xxx" project names in raw text
        - date directory patterns (20260329)
        - common proposal-to-task mappings
        """
        raw = proposal.get("raw_text", "")

        # Try to find project names (vibex-xxx, agent-proposals-xxx)
        project_matches = re.findall(
            r"(?:project|项目)[:\s]+([a-z][a-z0-9_-]{5,})",
            raw,
            re.IGNORECASE,
        )
        if project_matches:
            # Return the most specific (longest) match
            return max(project_matches, key=len)

        # Try to match date patterns in text
        date_matches = re.findall(r"\b(20260[12]\d{2})\b", raw)
        if date_matches:
            # Try to find a project with this date
            for proj_dir in TEAM_TASKS_DIR.glob("*.json"):
                name = proj_dir.stem
                for d in date_matches:
                    if d in name:
                        return name

        return None

    # ── Phase 3: Compute summary stats ─────────────────────────────────────

    def compute_stats(self) -> dict:
        """Compute summary statistics across all proposals."""
        total = len(self.proposals)
        if total == 0:
            return {
                "total": 0,
                "by_priority": {},
                "by_status": {},
                "linked": 0,
                "unlinked": 0,
                "claim_rate": 0.0,
            }

        by_priority = {}
        by_status = {}
        linked = 0
        unlinked = 0

        for p in self.proposals:
            pri = p.get("priority", "P?")
            by_priority[pri] = by_priority.get(pri, 0) + 1

            stage_status = p.get("stage_status", "unknown")
            by_status[stage_status] = by_status.get(stage_status, 0) + 1

            if p.get("task_id"):
                linked += 1
            else:
                unlinked += 1

        # Group proposals by date_dir
        by_date = {}
        for p in self.proposals:
            d = p.get("date_dir", "unknown")
            if d not in by_date:
                by_date[d] = {"total": 0, "done": 0, "in_progress": 0}
            by_date[d]["total"] += 1
            s = p.get("stage_status", "")
            if s == "done":
                by_date[d]["done"] += 1
            elif s == "in-progress":
                by_date[d]["in_progress"] += 1

        claim_rate = linked / total if total > 0 else 0.0

        return {
            "total": total,
            "by_priority": by_priority,
            "by_status": by_status,
            "linked": linked,
            "unlinked": unlinked,
            "claim_rate": round(claim_rate, 3),
            "by_date": by_date,
        }

    # ── Phase 4: Generate outputs ───────────────────────────────────────────

    def generate_outputs(self, stats: dict) -> None:
        """Write EXECUTION_TRACKER.json and EXECUTION_TRACKER.md."""
        tracker_data = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "generated_by": "proposal_tracker.py",
            "proposals_dir": str(self.proposals_dir),
            "stats": stats,
            "proposals": [
                {
                    "id": p.get("id"),
                    "title": p.get("title"),
                    "priority": p.get("priority"),
                    "date_dir": p.get("date_dir"),
                    "task_id": p.get("task_id"),
                    "stage_status": p.get("stage_status", "unknown"),
                    "stage_agent": p.get("stage_agent", ""),
                    "task_status": p.get("task_status", "unknown"),
                    "stage_started": p.get("stage_started"),
                    "stage_completed": p.get("stage_completed"),
                    "summary_path": p.get("summary_path"),
                }
                for p in self.proposals
            ],
        }

        # Write JSON
        OUTPUT_JSON.write_text(
            json.dumps(tracker_data, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

        # Write Markdown
        md = self._build_markdown(tracker_data)
        OUTPUT_MD.write_text(md, encoding="utf-8")

        print(f"  {C_GREEN}✓{C_RESET} EXECUTION_TRACKER.json  ({len(self.proposals)} proposals)")
        print(f"  {C_GREEN}✓{C_RESET} EXECUTION_TRACKER.md  ({len(self.proposals)} proposals)")

    def _build_markdown(self, data: dict) -> str:
        """Build the Markdown tracker report."""
        stats = data.get("stats", {})
        proposals = data.get("proposals", [])

        lines = [
            "# VibeX 提案执行追踪表 — EXECUTION_TRACKER",
            "",
            f"**生成时间**: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}  ",
            f"**生成工具**: proposal_tracker.py  ",
            "",
            "---",
            "",
            "## 📊 统计摘要",
            "",
        ]

        # Stats table
        total = stats.get("total", 0)
        linked = stats.get("linked", 0)
        claim_rate = stats.get("claim_rate", 0)
        by_date = stats.get("by_date", {})
        by_priority = stats.get("by_priority", {})
        by_status = stats.get("by_status", {})

        lines.extend([
            f"| 指标 | 值 |",
            f"|------|-----|",
            f"| 提案总数 | {total} |",
            f"| 已关联任务 | {linked} |",
            f"| 未关联 | {stats.get('unlinked', 0)} |",
            f"| 认领率 | {claim_rate:.1%} |",
            "",
        ])

        # By priority
        if by_priority:
            lines.append("### 按优先级")
            lines.append("")
            lines.append("| 优先级 | 数量 |")
            lines.append("|--------|------|")
            for pri in sorted(by_priority.keys()):
                lines.append(f"| {pri} | {by_priority[pri]} |")
            lines.append("")

        # By status
        if by_status:
            lines.append("### 按状态")
            lines.append("")
            lines.append("| 状态 | 数量 |")
            lines.append("|------|------|")
            status_order = ["done", "in-progress", "pending", "no-linked-task", "failed", "unknown"]
            for s in status_order:
                if s in by_status:
                    lines.append(f"| {s} | {by_status[s]} |")
            for s, cnt in sorted(by_status.items()):
                if s not in status_order:
                    lines.append(f"| {s} | {cnt} |")
            lines.append("")

        # By date directory
        if by_date:
            lines.append("### 按日期目录")
            lines.append("")
            lines.append("| 日期目录 | 总计 | 已完成 | 进行中 |")
            lines.append("|---------|------|--------|--------|")
            for d in sorted(by_date.keys()):
                info = by_date[d]
                lines.append(f"| {d} | {info['total']} | {info['done']} | {info['in_progress']} |")
            lines.append("")

        lines.append("---")
        lines.append("")
        lines.append("## 📋 提案详情")

        # Group by date_dir
        by_dir = {}
        for p in proposals:
            d = p.get("date_dir", "unknown")
            if d not in by_dir:
                by_dir[d] = []
            by_dir[d].append(p)

        STATUS_EMOJI = {
            "done": "✅ done",
            "in-progress": "🔄 in-progress",
            "pending": "⬜ pending",
            "no-linked-task": "⚠️ 无关联任务",
            "failed": "❌ failed",
            "skipped": "⏭️ skipped",
            "blocked": "🚧 blocked",
            "unknown": "❓ unknown",
        }

        for date_dir in sorted(by_dir.keys()):
            lines.append(f"\n### {date_dir}\n")
            proposals_in_dir = by_dir[date_dir]

            lines.append("| # | 提案 | 优先级 | 状态 | 负责人 | 任务ID |")
            lines.append("|---|------|--------|------|--------|--------|")

            for i, p in enumerate(proposals_in_dir, 1):
                pid = p.get("id", "")
                title = p.get("title", "")[:50]
                pri = p.get("priority", "P?")
                status_raw = p.get("stage_status", "unknown")
                status_display = STATUS_EMOJI.get(status_raw, status_raw)
                agent = p.get("stage_agent", "—")
                task_id = p.get("task_id", "—")
                if len(title) < len(p.get("title", "")):
                    title += "..."

                lines.append(f"| {pid} | {title} | {pri} | {status_display} | {agent} | {task_id} |")

            lines.append("")

        lines.append("---")
        lines.append("")
        lines.append(f"*由 proposal_tracker.py 自动生成 | {datetime.now(timezone.utc).isoformat()}*")

        return "\n".join(lines)

    # ── Main run ─────────────────────────────────────────────────────────────

    def run(self) -> None:
        """Run the full proposal tracking pipeline."""
        start = time.perf_counter()

        print(f"{C_BOLD}proposal_tracker.py{C_RESET} — VibeX Proposal Execution Tracker")
        print(f"  Proposals dir: {self.proposals_dir}")
        print(f"  Output dir:    {self.output_dir}")
        print()

        # Phase 1: Scan
        print(f"{C_CYAN}Phase 1:{C_RESET} Scanning proposals directories...")
        count = self.scan_directories()
        elapsed = time.perf_counter() - start
        print(f"  {C_GREEN}✓{C_RESET} Found {count} proposals in {elapsed:.2f}s")

        if count == 0:
            print(f"  {C_YELLOW}⚠{C_RESET} No proposals found. Creating empty tracker.")
            self.generate_outputs({"total": 0, "by_priority": {}, "by_status": {}, "linked": 0, "unlinked": 0, "claim_rate": 0.0, "by_date": {}})
            total_elapsed = time.perf_counter() - start
            print(f"\n{C_GREEN}✅ Done{C_RESET} in {total_elapsed:.2f}s")
            return

        # Phase 2: Enrich with task status
        print(f"{C_CYAN}Phase 2:{C_RESET} Querying task_manager status...")
        enrich_start = time.perf_counter()
        self.enrich_with_task_status()
        enrich_elapsed = time.perf_counter() - enrich_start
        print(f"  {C_GREEN}✓{C_RESET} Task status enrichment done in {enrich_elapsed:.2f}s")

        # Phase 2b: E2-T1 — enrich with linked tasks from PRD Epic总览
        print(f"{C_CYAN}Phase 2b:{C_RESET} E2-T1: linking proposals to task stages...")
        enrich_tasks_start = time.perf_counter()
        self._enrich_with_linked_tasks()
        enrich_tasks_elapsed = time.perf_counter() - enrich_tasks_start
        linked = sum(1 for p in self.proposals if p.get("linked_tasks"))
        print(f"  {C_GREEN}✓{C_RESET} Linked tasks enriched: {linked} proposals with linked tasks in {enrich_tasks_elapsed:.2f}s")

        # Phase 3: Compute stats
        print(f"{C_CYAN}Phase 3:{C_RESET} Computing statistics...")
        stats = self.compute_stats()
        print(f"  {C_GREEN}✓{C_RESET} Total: {stats['total']} | Linked: {stats['linked']} | Unlinked: {stats['unlinked']} | Claim rate: {stats['claim_rate']:.1%}")

        # Phase 4: Generate outputs
        print(f"{C_CYAN}Phase 4:{C_RESET} Generating output files...")
        self.generate_outputs(stats)

        total_elapsed = time.perf_counter() - start
        print()
        if total_elapsed < 10:
            print(f"{C_GREEN}✅ Done{C_RESET} in {total_elapsed:.2f}s  (target: < 10s)")
        else:
            print(f"{C_YELLOW}⚠{C_RESET} Done in {total_elapsed:.2f}s  (target: < 10s — consider optimization)")


# ── CLI Entry Point ───────────────────────────────────────────────────────────

def main():
    tracker = ProposalTracker()
    tracker.run()


if __name__ == "__main__":
    main()
