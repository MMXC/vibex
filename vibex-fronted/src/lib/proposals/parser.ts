/**
 * Proposal Parser — Parse agent proposal markdown files into structured objects.
 *
 * Parses proposal files from:
 *   /root/.openclaw/proposals/<date>/<agent>-proposals.md
 *   /root/.openclaw/vibex/proposals/<date>/<agent>-proposals.md
 *
 * Format expected:
 *   ## 提案 <id> [:：]? <title>
 *   **问题[:：]? <text>
 *   **改进建议[:：]? <text>
 *   **预期收益[:：]? <text>
 *   **工作量估算[:：]? <S|M|L|XL|XXL|1d|2d|3d|5d|1w|2w>
 *   **优先级[:：]? P0|P1|P2|P3
 *   **标签[:：]? [tag1, tag2, ...]
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const PROPOSALS_DIR = '/root/.openclaw/proposals';
export const VIBEX_PROPOSALS_DIR = '/root/.openclaw/vibex/proposals';
export const AGENTS = ['dev', 'analyst', 'architect', 'pm', 'tester', 'reviewer'] as const;
export type Agent = typeof AGENTS[number];

// ── Types ────────────────────────────────────────────────────────────────────

export interface Proposal {
  id: string;
  agent: string;
  date: string;
  title: string;
  description: string;
  improvement: string;
  benefit: string;
  effort: string;
  priority: string;
  tags: string[];
  raw: string;
}

export interface ParseResult {
  agent: string;
  date: string;
  proposals: Proposal[];
}

export interface ListResult {
  date: string;
  count: number;
  proposals: Proposal[];
}

// ── Regex patterns ────────────────────────────────────────────────────────────

const PROPOSAL_ID_RE = /^###\s+提案\s*(\d+|[A-Z]-\d+)\s*[:：]?\s*(.+)/;
const PROPOSAL_END_RE = /^##\s+\w|^---$/;
const PROBLEM_RE = /\*\*问题\*?[:：]?\s*(.+)/;
const IMPROVEMENT_RE = /\*\*改进建议\*?[:：]?\s*(.+)/;
const BENEFIT_RE = /\*\*预期收益\*?[:：]?\s*(.+)/;
const EFFORT_RE = /\*\*工作量估算\*?[:：]?\s*([\w/]+)/;
const PRIORITY_RE = /\*\*优先级\*?[:：]?\s*(P\d)/;
const TAGS_RE = /\*\*标签\*?[:：]?\s*\[([^\]]+)\]/;
const BULLET_RE = /^[-*]\s+(.+)/;

// ── Field extraction ───────────────────────────────────────────────────────────

function extractField(text: string, pattern: RegExp): string | undefined {
  const m = pattern.exec(text);
  return m?.[1]?.trim();
}

function parseTags(tagsStr: string | undefined): string[] {
  if (!tagsStr) return [];
  return tagsStr
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

// ── Core parsing ─────────────────────────────────────────────────────────────

function parseProposalBlock(block: string, agent: string, date: string): Proposal | null {
  block = block.trim();
  if (block.length < 10) return null;

  const idMatch = PROPOSAL_ID_RE.exec(block);
  const proposalId = idMatch?.[1]?.trim() ?? '1';
  let title = idMatch?.[2]?.trim() ?? '';

  if (!title) {
    const firstLine = block.split('\n')[0].replace(/^#+\s*/, '').trim();
    title = firstLine.length > 100 ? firstLine.slice(0, 100) : firstLine;
  }

  const description =
    extractField(block, PROBLEM_RE) ||
    extractField(block, /^\*\*描述[:：]?\s*(.+)/m) ||
    block.split('\n\n')[0];

  const improvement = extractField(block, IMPROVEMENT_RE) ?? '';
  const benefit = extractField(block, BENEFIT_RE) ?? '';
  const effort = extractField(block, EFFORT_RE) ?? '';
  const priority = extractField(block, PRIORITY_RE) ?? 'P2';
  const tagsStr = extractField(block, TAGS_RE);
  const tags = parseTags(tagsStr);

  // Fallback: extract bullet points
  if (!description) {
    const bullets = block
      .split('\n')
      .map((l) => BULLET_RE.exec(l)?.[1])
      .filter(Boolean)
      .slice(0, 3);
    if (bullets.length > 0) {
      // Keep description as-is (empty) if no bullets found
    }
  }

  return {
    id: `${agent.toUpperCase()}-${proposalId}`,
    agent,
    date,
    title,
    description: description ?? '',
    improvement,
    benefit,
    effort,
    priority,
    tags,
    raw: block.slice(0, 500),
  };
}

function splitBlocks(content: string): string[] {
  const blocks: string[] = [];
  let current: string[] = [];
  let inProposal = false;

  for (const line of content.split('\n')) {
    const idMatch = PROPOSAL_ID_RE.test(line) || (line.startsWith('###') && /提案\s*\d/.test(line));

    if (idMatch) {
      if (current.length > 0) {
        blocks.push(current.join('\n'));
      }
      current = [line];
      inProposal = true;
    } else if (inProposal) {
      if (PROPOSAL_END_RE.test(line) && !line.startsWith('###')) {
        blocks.push(current.join('\n'));
        current = [];
        inProposal = false;
      } else {
        current.push(line);
      }
    }
  }

  if (current.length > 0) {
    blocks.push(current.join('\n'));
  }

  return blocks;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Parse a single proposal markdown file.
 */
export function parseProposalsFile(filepath: string): Proposal[] {
  if (!existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }

  const content = readFileSync(filepath, 'utf-8');
  const filename = filepath.split('/').pop() ?? '';
  const agent = filename.replace(/^-proposals(?:\.md)?$/, '').replace(/\.md$/, '');
  const date = filepath.split('/').slice(-2, -1)[0] ?? '';

  const blocks = splitBlocks(content);
  const proposals: Proposal[] = [];

  for (const block of blocks) {
    const proposal = parseProposalBlock(block, agent, date);
    if (proposal) {
      proposals.push(proposal);
    }
  }

  return proposals;
}

/**
 * List all proposals for a given date from both proposals directories.
 */
export function listProposals(date: string): ListResult {
  const proposals: Proposal[] = [];

  for (const baseDir of [PROPOSALS_DIR, VIBEX_PROPOSALS_DIR]) {
    const dateDir = join(baseDir, date);
    if (!existsSync(dateDir)) continue;

    for (const agent of AGENTS) {
      const filepath = join(dateDir, `${agent}-proposals.md`);
      if (existsSync(filepath)) {
        try {
          const parsed = parseProposalsFile(filepath);
          proposals.push(...parsed);
        } catch {
          // Skip files that can't be parsed
        }
      }
    }
  }

  return {
    date,
    count: proposals.length,
    proposals,
  };
}

export default { parseProposalsFile, listProposals };
