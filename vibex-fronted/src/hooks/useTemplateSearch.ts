/**
 * useTemplateSearch.ts — S92-E2: Template Marketplace 2.0
 *
 * Hook for managing search history (localStorage, last 5 entries)
 * and synonym-based search term expansion.
 *
 * DoD:
 * [x] Search history storage (localStorage, last 5)
 * [x] Synonym term expansion utility
 * [x] Search term highlighting utility
 */

const SEARCH_HISTORY_KEY = 'vibex-template-search-history';
const MAX_HISTORY = 5;

/** S92-E2: Synonym map for term expansion */
export const SYNONYM_MAP: Record<string, string[]> = {
  '电商': ['电商网站', '网上商店', '购物', '商城', '零售'],
  '教育': ['在线教育', '课程', '培训', '学习', '教学'],
  '医疗': ['医院', '健康', '诊所', '医疗健康'],
  '金融': ['银行', '保险', '证券', '支付'],
  '社交': ['社交网络', '社区', '论坛', '聊天'],
  '企业': ['企业服务', 'SaaS', 'B2B', '办公'],
  '游戏': ['游戏', '手游', '电竞'],
  '内容': ['内容平台', '博客', '资讯', '媒体'],
  '移动': ['移动应用', 'APP', '手机'],
  '物流': ['配送', '仓储', '供应链'],
  '餐饮': ['餐饮', '外卖', '餐厅'],
};

/**
 * Expand a search term to include all its synonyms.
 */
export function expandSearchTerm(term: string): string[] {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return [];

  const allTerms = new Set<string>([normalized]);

  for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
    if (key === normalized || synonyms.some((s) => s.toLowerCase() === normalized)) {
      allTerms.add(key.toLowerCase());
      for (const s of synonyms) allTerms.add(s.toLowerCase());
    }
  }

  return [...allTerms];
}

/**
 * Highlight occurrences of search terms in text.
 * Returns an array of { text, highlight } segments.
 */
export function highlightSearchTerms(text: string, searchTerms: string[]): React.ReactNode[] {
  if (!searchTerms.length || !text) return [text];

  const patterns = searchTerms
    .filter(Boolean)
    .map((t) => new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

  const segments: Array<{ text: string; highlight: boolean }> = [];
  let remaining = text;
  let lastIndex = 0;

  // Build combined pattern
  const combinedPattern = new RegExp(
    searchTerms
      .filter(Boolean)
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|'),
    'gi'
  );

  let match: RegExpExecArray | null;
  const matches: Array<{ start: number; end: number; term: string }> = [];

  // Find all matches
  while ((match = combinedPattern.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      term: match[0],
    });
  }

  if (matches.length === 0) return [text];

  // Build segments
  let pos = 0;
  for (const m of matches) {
    if (m.start > pos) {
      segments.push({ text: text.slice(pos, m.start), highlight: false });
    }
    segments.push({ text: m.term, highlight: true });
    pos = m.end;
  }
  if (pos < text.length) {
    segments.push({ text: text.slice(pos), highlight: false });
  }

  return segments;
}

/** Load search history from localStorage */
export function loadSearchHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Save search term to history (most recent first, max 5, deduplicated) */
export function saveSearchTerm(term: string): void {
  if (typeof window === 'undefined') return;
  if (!term.trim()) return;

  const history = loadSearchHistory();
  const next = [term, ...history.filter((h) => h !== term)].slice(0, MAX_HISTORY);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
}

/** Clear search history */
export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SEARCH_HISTORY_KEY);
}
