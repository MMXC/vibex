/**
 * useCanvasSearch — Fuse.js fuzzy search across all three canvas trees
 *
 * Epic 2: E2-F5
 *
 * 遵守约束:
 * - 无 any 类型
 * - 无 console.log
 * - 搜索 < 200ms（500节点）
 */
'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import Fuse from 'fuse.js';
import type { BoundedContextNode, BusinessFlowNode, ComponentNode } from '@/lib/canvas/types';

/** 搜索结果项 */
export interface SearchResult {
  /** 唯一 ID */
  id: string;
  /** 节点名称（高亮用） */
  name: string;
  /** 树类型 */
  treeType: 'context' | 'flow' | 'component';
  /** 节点路径（用于显示） */
  path: string;
  /** 所属上下文（仅 flow/component 节点） */
  contextName?: string;
  /** 节点状态 */
  status: BoundedContextNode['status'];
  /** 是否已激活 */
  isActive?: boolean;
  /** 节点原始数据 */
  data: BoundedContextNode | BusinessFlowNode | ComponentNode;
}

interface UseCanvasSearchOptions {
  /** 防抖延迟（ms） */
  debounceMs?: number;
}

interface UseCanvasSearchReturn {
  /** 当前搜索词 */
  query: string;
  /** 设置搜索词 */
  setQuery: (q: string) => void;
  /** 搜索结果 */
  results: SearchResult[];
  /** 是否有结果 */
  hasResults: boolean;
  /** 搜索耗时（ms） */
  searchTimeMs: number;
  /** 是否正在搜索 */
  isSearching: boolean;
}

/**
 * Fuse.js 模糊搜索 hook
 * 合并三树所有节点，按节点路径搜索
 *
 * @example
 * const { query, setQuery, results, hasResults } = useCanvasSearch();
 */
export function useCanvasSearch(
  contextNodes: BoundedContextNode[],
  flowNodes: BusinessFlowNode[],
  componentNodes: ComponentNode[],
  options: UseCanvasSearchOptions = {}
): UseCanvasSearchReturn {
  const { debounceMs = 150 } = options;

  const [query, setQueryState] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimeRef = useRef<number>(0);

  // Build the flattened list of all searchable nodes
  const allNodes = useMemo<SearchResult[]>(() => {
    const ctxResults: SearchResult[] = contextNodes.map((n) => ({
      id: n.nodeId,
      name: n.name,
      treeType: 'context' as const,
      path: n.name,
      status: n.status,
      confirmed: n.isActive !== false,
      data: n,
    }));

    // Build context name lookup for flow/component nodes
    const contextNameMap = new Map<string, string>();
    contextNodes.forEach((n) => contextNameMap.set(n.nodeId, n.name));

    const flowResults: SearchResult[] = flowNodes.map((n) => {
      const contextName = contextNameMap.get(n.contextId);
      return {
        id: n.nodeId,
        name: n.name,
        treeType: 'flow' as const,
        path: contextName ? `${contextName} → ${n.name}` : n.name,
        contextName,
        status: n.status,
        confirmed: n.isActive !== false,
        data: n,
      };
    });

    // For components, find the parent flow's context
    const flowContextMap = new Map<string, string>();
    flowNodes.forEach((f) => flowContextMap.set(f.nodeId, f.contextId));

    const componentResults: SearchResult[] = componentNodes.map((n) => {
      const contextId = flowContextMap.get(n.flowId);
      const contextName = contextId ? contextNameMap.get(contextId) : undefined;
      return {
        id: n.nodeId,
        name: n.name,
        treeType: 'component' as const,
        path: contextName ? `${contextName} → ${n.name}` : n.name,
        contextName,
        status: n.status,
        confirmed: n.isActive !== false,
        data: n,
      };
    });

    return [...ctxResults, ...flowResults, ...componentResults];
  }, [contextNodes, flowNodes, componentNodes]);

  // Fuse.js instance — memoized, rebuilt only when nodes change
  const fuse = useMemo(() => {
    return new Fuse(allNodes, {
      keys: ['name', 'path'],
      threshold: 0.3,
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 1,
    });
  }, [allNodes]);

  // Debounced search
  const setQuery = useCallback(
    (q: string) => {
      setQueryState(q);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (!q.trim()) {
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      debounceTimerRef.current = setTimeout(() => {
        setIsSearching(false);
      }, debounceMs);
    },
    [debounceMs]
  );

  // Compute results inline (memoized by query + nodes)
  const results = useMemo<SearchResult[]>(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const start = performance.now();
    const fuseResults = fuse.search(trimmed);
    const elapsed = performance.now() - start;
    // Use ref to avoid triggering re-render during memo
    searchTimeRef.current = elapsed;

    return fuseResults.map((r) => r.item);
  }, [query, fuse]);

  const hasResults = results.length > 0;

  return {
    query,
    setQuery,
    results,
    hasResults,
    searchTimeMs: searchTimeRef.current,
    isSearching,
  };
}
