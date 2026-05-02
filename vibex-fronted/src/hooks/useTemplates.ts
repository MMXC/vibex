/**
 * useTemplates — 需求模板 Hook
 *
 * 管理行业模板的懒加载、自定义模板保存与读取。
 * 模板数据从 /data/industry-templates.json 懒加载，不阻塞首屏。
 * 自定义模板存储在 localStorage，异常时优雅降级。
 *
 * C-E4-1: 懒加载（不在首屏同步加载）
 * C-E4-2: QuotaExceededError 处理
 * C-E4-3: JSON schema 由 industry-templates.json 保证
 */

import { useState, useEffect, useCallback } from 'react';

// ==================== Types ====================

export interface IndustryTemplate {
  id: string;
  name: string;
  description: string;
  chapters: {
    requirement: string;
    architecture?: string;
  };
}

// ==================== Constants ====================

const STORAGE_KEY = 'vibex:customTemplates';

// ==================== Hook ====================

export function useTemplates() {
  const [templates, setTemplates] = useState<IndustryTemplate[]>([]);
  const [customTemplates, setCustomTemplates] = useState<IndustryTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 懒加载 — 仅在首次调用时请求
  useEffect(() => {
    loadTemplates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/data/industry-templates.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: IndustryTemplate[] = await res.json();
      if (!Array.isArray(data)) throw new Error('Invalid template data');
      setTemplates(data);

      // 加载自定义模板（容错处理）
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        setCustomTemplates(stored ? JSON.parse(stored) : []);
      } catch {
        setCustomTemplates([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载模板失败');
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectTemplate = useCallback(
    (templateId: string): IndustryTemplate | null => {
      const all = [...templates, ...customTemplates];
      return all.find((t) => t.id === templateId) ?? null;
    },
    [templates, customTemplates]
  );

  /**
   * saveAsTemplate — 将当前章节内容保存为自定义模板
   * C-E4-2: 处理 localStorage 配额超限异常
   */
  const saveAsTemplate = useCallback(
    async (name: string, chapters: Record<string, string>) => {
      const newTemplate: IndustryTemplate = {
        id: `custom-${Date.now()}`,
        name,
        description: `自定义模板: ${name}`,
        chapters: {
          requirement: chapters.requirement ?? '',
          architecture: chapters.architecture ?? '',
        },
      };

      const updated = [...customTemplates, newTemplate];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setCustomTemplates(updated);
        return newTemplate;
      } catch (e) {
        // C-E4-2: QuotaExceededError 降级 — 提示用户但不崩溃
        if (e instanceof Error && e.name === 'QuotaExceededError') {
          console.warn('[useTemplates] Custom template storage full');
          throw new Error('自定义模板存储空间已满，请清理旧模板后重试');
        }
        throw e;
      }
    },
    [customTemplates]
  );

  /**
   * deleteCustomTemplate — 删除自定义模板
   */
  const deleteCustomTemplate = useCallback(
    (templateId: string) => {
      const updated = customTemplates.filter((t) => t.id !== templateId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setCustomTemplates(updated);
      } catch {
        // localStorage 写入失败时静默忽略
      }
    },
    [customTemplates]
  );

  return {
    templates,
    customTemplates,
    isLoading,
    error,
    selectTemplate,
    saveAsTemplate,
    deleteCustomTemplate,
    reload: loadTemplates,
  };
}
