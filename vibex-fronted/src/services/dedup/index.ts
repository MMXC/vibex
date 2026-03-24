/**
 * dedup/index.ts - Proposal Deduplication Service
 *
 * Frontend service for the proposal deduplication mechanism.
 * Integrates with task_manager.py check-dup command for production dedup.
 *
 * Epic 1 S1.3: 关键词提取在 services/ 中注册为独立模块
 */

import { httpClient } from '../api/client';

/** Dedup severity level */
export type DedupLevel = 'block' | 'warn' | 'pass';

/** A duplicate candidate */
export interface DedupCandidate {
  name: string;
  similarity: number;
  matchType: string;
  reason?: string;
}

/** Dedup check result */
export interface DedupResult {
  level: DedupLevel;
  candidates: DedupCandidate[];
  message: string;
}

/**
 * Check for duplicate proposals.
 * Uses task_manager.py check-dup via backend API.
 *
 * @param name - Project name to check
 * @param goal - Project goal description
 * @returns DedupResult with severity level and candidates
 */
export async function checkDuplicateProposals(
  name: string,
  goal: string
): Promise<DedupResult> {
  try {
    const response = await httpClient.post<DedupResult>('/api/dedup/check', {
      name,
      goal,
    });
    return response;
  } catch {
    // Fallback: allow through on error (fail-open for UX)
    return {
      level: 'pass',
      candidates: [],
      message: '去重检查服务暂时不可用，已放行',
    };
  }
}

/**
 * Client-side keyword extraction (mirrors Python extract_keywords).
 * Used for quick pre-validation before API call.
 */
export function extractKeywords(text: string): string[] {
  // Normalize whitespace
  const normalized = text.toLowerCase().trim();
  if (!normalized) return [];

  const keywords = new Set<string>();

  // Chinese: extract 2-char bigrams
  const chinese = normalized.match(/[\u4e00-\u9fff]+/g) || [];
  for (const segment of chinese) {
    for (let i = 0; i < segment.length - 1; i++) {
      const bigram = segment.slice(i, i + 2);
      // Skip if it's a common stopword
      if (!STOPWORDS.has(bigram) && bigram.length >= 2) {
        keywords.add(bigram);
      }
    }
  }

  // English: extract words (3+ chars)
  const english = normalized.match(/[a-z]{3,}/g) || [];
  for (const word of english) {
    if (!STOPWORDS.has(word)) {
      keywords.add(word);
    }
  }

  return Array.from(keywords);
}

/** Stopwords (mirrors Python dedup.py STOPWORDS) */
const STOPWORDS = new Set([
  // Chinese
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '看', '好',
  '自己', '这', '那', '但', '还', '又', '与', '或', '把', '被',
  '让', '从', '向', '对', '而', '之', '以', '及', '于', '中', '下', '过',
  // English
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
  'her', 'was', 'one', 'our', 'out', 'has', 'his', 'its', 'may', 'see',
]);

/**
 * Client-side similarity check (quick pre-validation).
 * Returns true if the two texts seem similar.
 */
export function isSimilar(text1: string, text2: string): boolean {
  const kw1 = new Set(extractKeywords(text1));
  const kw2 = new Set(extractKeywords(text2));

  if (kw1.size === 0 || kw2.size === 0) return false;

  const intersection = new Set([...kw1].filter(x => kw2.has(x)));
  const union = new Set([...kw1, ...kw2]);

  const jaccard = intersection.size / union.size;
  return jaccard >= 0.3; // threshold matching dedup_rules.py
}

export default {
  checkDuplicateProposals,
  extractKeywords,
  isSimilar,
};
