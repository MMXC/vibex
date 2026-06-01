/**
 * fullTextSearch.ts — Sprint50 E1: Canvas Global Search
 *
 * 职责：对 keywordIndex Map 执行全文本搜索。
 * 不执行 DB scan — 直接查询 Map（由 canvasSearchStore 维护）。
 * 查询结果返回 canvasId 列表。
 *
 * 遵守约束:
 * - 无 any 类型
 */
'use client';

import type { CanvasSearchResult } from '@/stores/canvasSearchStore';

/**
 * Search across all indexed canvases by keyword.
 * Queries the in-memory Map from canvasSearchStore.
 * Returns canvas IDs sorted by relevance (match count desc).
 */
export function fullTextSearch(
  keywordIndex: Map<string, { canvasId: string; name: string; searchableText: string; nodeTexts: string[]; matchCount: number }>,
  query: string
): string[] {
  if (!query.trim() || keywordIndex.size === 0) {
    return [];
  }

  const queryLower = query.toLowerCase().trim();
  const terms = queryLower.split(/\s+/).filter(Boolean);

  const scored: Array<{ canvasId: string; score: number }> = [];

  keywordIndex.forEach((entry) => {
    let score = 0;
    const nameLower = entry.name.toLowerCase();
    const textLower = entry.searchableText.toLowerCase();

    for (const term of terms) {
      // Name match scores higher
      if (nameLower.includes(term)) {
        score += 10;
        // Count occurrences in name
        const nameMatches = (nameLower.match(new RegExp(term, 'g')) ?? []).length;
        score += nameMatches * 5;
      }
      // Text match scores base points
      if (textLower.includes(term)) {
        score += 3;
        // Count occurrences in text
        const textMatches = (textLower.match(new RegExp(term, 'g')) ?? []).length;
        score += textMatches;
      }
    }

    if (score > 0) {
      scored.push({ canvasId: entry.canvasId, score });
    }
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.canvasId);
}

/**
 * Get canvas search results with metadata for display.
 */
export function getSearchResults(
  canvasIds: string[],
  keywordIndex: Map<string, { canvasId: string; name: string; updatedAt: string }>
): CanvasSearchResult[] {
  return canvasIds
    .map((canvasId) => {
      const entry = keywordIndex.get(canvasId);
      if (!entry) return null;
      return {
        canvasId: entry.canvasId,
        name: entry.name,
        updatedAt: entry.updatedAt,
        matchCount: 1,
        matchedField: 'both' as const,
      };
    })
    .filter((r): r is CanvasSearchResult => r !== null);
}
