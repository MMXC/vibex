/**
 * useProjectSearch — Dashboard 项目搜索/过滤/排序 Hook
 *
 * E4: Sprint 25 Dashboard 项目搜索与过滤
 * 迁移自 dashboard/page.tsx 的 inline search/sort/filter 逻辑，
 * 统一管理 searchQuery / filter / sort 状态。
 *
 * @param projects - 原始项目列表（来自 API）
 * @param currentUserId - 当前登录用户 ID（用于 "我创建的" 过滤）
 */
import { useState, useMemo, useCallback } from 'react';
import { Project } from '@/services/api/types/project';

// ─── Types ───────────────────────────────────────────────────────────────────

export type FilterOption = 'all' | '7d' | '30d' | 'mine';
export type SortOption = 'updatedAt-desc' | 'updatedAt-asc' | 'name-asc' | 'name-desc';

export interface UseProjectSearchResult {
  /** 过滤/搜索/排序后的项目列表 */
  filtered: Project[];
  /** 是否处于搜索中（用于 loading 状态） */
  searching: boolean;
  /** 当前搜索词 */
  searchQuery: string;
  /** 当前过滤条件 */
  filter: FilterOption;
  /** 当前排序方式 */
  sort: SortOption;
  /** 更新搜索词（上层 SearchBar debounce 后调用） */
  setSearch: (query: string) => void;
  /** 更新过滤条件 */
  setFilter: (filter: FilterOption) => void;
  /** 更新排序方式 */
  setSort: (sort: SortOption) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** 过滤选项标签 */
export const FILTER_LABELS: Record<FilterOption, string> = {
  all: '全部',
  '7d': '最近 7 天',
  '30d': '最近 30 天',
  mine: '我创建的',
};

/** 排序选项标签 */
export const SORT_LABELS: Record<SortOption, string> = {
  'updatedAt-desc': '最新更新',
  'updatedAt-asc': '最早更新',
  'name-asc': '名称 A-Z',
  'name-desc': '名称 Z-A',
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useProjectSearch(
  projects: Project[],
  currentUserId?: string,
): UseProjectSearchResult {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [sort, setSort] = useState<SortOption>('updatedAt-desc');
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setSearching(query.trim().length > 0);
  }, []);

  const filtered = useMemo(() => {
    let result = [...projects];

    // ── 搜索过滤 ──────────────────────────────────────────────────────
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q),
      );
    }

    // ── 时间/范围过滤 ─────────────────────────────────────────────────
    const now = Date.now();
    if (filter === '7d') {
      result = result.filter(
        (p) =>
          p.updatedAt &&
          typeof p.updatedAt === 'string' &&
          now - new Date(p.updatedAt).getTime() < 7 * 86_400_000,
      );
    } else if (filter === '30d') {
      result = result.filter(
        (p) =>
          p.updatedAt &&
          typeof p.updatedAt === 'string' &&
          now - new Date(p.updatedAt).getTime() < 30 * 86_400_000,
      );
    } else if (filter === 'mine') {
      if (!currentUserId) return []; // no user context → return empty
      result = result.filter((p) => p.userId === currentUserId);
    }

    // ── 排序 ──────────────────────────────────────────────────────────
    result.sort((a, b) => {
      if (sort === 'name-asc') return a.name.localeCompare(b.name);
      if (sort === 'name-desc') return b.name.localeCompare(a.name);
      if (sort === 'updatedAt-asc') {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return aTime - bTime;
      }
      // updatedAt-desc (default)
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });

    return result;
  }, [projects, searchQuery, filter, sort, currentUserId]);

  return {
    filtered,
    searching,
    searchQuery,
    filter,
    sort,
    setSearch: handleSearch,
    setFilter,
    setSort,
  };
}
