/**
 * useDraft - 草稿自动保存 Hook
 * 功能: localStorage 防抖自动保存 + 恢复
 * 规格: 2s 防抖，5000字限制
 */
import { useEffect, useRef, useCallback } from 'react';

const DRAFT_KEY = 'vibex-bottompanel-draft';
const DEBOUNCE_MS = 2000;
const MAX_LENGTH = 5000;

export interface UseDraftReturn {
  /** 从 localStorage 恢复草稿 */
  restoreDraft: () => string;
  /** 保存草稿到 localStorage */
  saveDraft: (text: string) => void;
  /** 清除草稿 */
  clearDraft: () => void;
  /** 获取保存时间戳 */
  getSavedAt: () => number | null;
}

export function useDraft(): UseDraftReturn {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** 恢复草稿 */
  const restoreDraft = useCallback((): string => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return '';
      const parsed = JSON.parse(raw) as { text: string; savedAt: number };
      return parsed.text || '';
    } catch {
      return '';
    }
  }, []);

  /** 保存草稿（防抖） */
  const saveDraft = useCallback((text: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      try {
        const trimmed = text.slice(0, MAX_LENGTH);
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ text: trimmed, savedAt: Date.now() })
        );
      } catch {
        // localStorage 容量不足时静默失败
      }
    }, DEBOUNCE_MS);
  }, []);

  /** 清除草稿 */
  const clearDraft = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
  }, []);

  /** 获取保存时间戳 */
  const getSavedAt = useCallback((): number | null => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { text: string; savedAt: number };
      return parsed.savedAt || null;
    } catch {
      return null;
    }
  }, []);

  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { restoreDraft, saveDraft, clearDraft, getSavedAt };
}

export default useDraft;
