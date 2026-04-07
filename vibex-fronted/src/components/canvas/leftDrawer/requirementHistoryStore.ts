/**
 * requirementHistoryStore.ts — 需求输入历史存储（sessionStorage）
 *
 * Epic 2 S2.4: 最近 3-5 条输入历史（sessionStorage）
 *
 * 使用 sessionStorage（标签页会话级）存储，避免 localStorage 跨标签页污染
 */

const STORAGE_KEY = 'vibex-requirement-history';
const MAX_HISTORY = 5;

export interface RequirementHistoryItem {
  id: string;
  text: string;
  timestamp: number; // Date.now()
}

function generateId(): string {
  return `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadHistory(): RequirementHistoryItem[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Only return items with non-empty text
    return parsed.filter((item: unknown) => {
      return (
        typeof item === 'object' &&
        item !== null &&
        'text' in item &&
        typeof (item as { text: unknown }).text === 'string' &&
        (item as { text: string }).text.trim().length > 0
      );
    });
  } catch {
    return [];
  }
}

function saveHistory(history: RequirementHistoryItem[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // sessionStorage may be unavailable (e.g. private browsing with storage limit)
  }
}

/**
 * 获取当前历史列表（最近 MAX_HISTORY 条）
 */
export function getHistory(): RequirementHistoryItem[] {
  return loadHistory().slice(0, MAX_HISTORY);
}

/**
 * 添加一条历史记录（去重：相同文本不重复追加，放到最前）
 */
export function addHistory(text: string): RequirementHistoryItem[] {
  const trimmed = text.trim();
  if (!trimmed) return getHistory();

  const history = loadHistory();

  // Remove existing entry with same text (to avoid duplicates when re-submitting)
  const filtered = history.filter((item) => item.text !== trimmed);

  // Prepend new item
  const newItem: RequirementHistoryItem = {
    id: generateId(),
    text: trimmed,
    timestamp: Date.now(),
  };

  const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);
  saveHistory(updated);
  return updated;
}

/**
 * 清空所有历史
 */
export function clearHistory(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * 删除指定 id 的历史项
 */
export function removeHistoryItem(id: string): RequirementHistoryItem[] {
  const history = loadHistory().filter((item) => item.id !== id);
  saveHistory(history);
  return history;
}
