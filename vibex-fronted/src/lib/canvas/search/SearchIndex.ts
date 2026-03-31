/**
 * SearchIndex — Fuse.js 搜索索引管理
 * 客户端模糊搜索，支持 < 300ms 响应
 *
 * ADR-004 实现:
 * - 使用 fuse.js 客户端模糊匹配
 * - 阈值 0.3，中文支持好
 * - 增量更新：节点变化时全量重建索引（< 200 节点 < 5ms）
 *
 * 遵守约束:
 * - 无 any 类型
 * - 无 console.log
 */
'use client';

import Fuse, { type FuseResultMatch, type IFuseOptions } from 'fuse.js';
import type { TreeType, BoundedContextNode, BusinessFlowNode, ComponentNode, NodeStatus } from '@/lib/canvas/types';

// =============================================================================
// Types
// =============================================================================

/** 搜索索引节点 */
export interface SearchNode {
  id: string;
  label: string;
  type: TreeType;
  /** 树类型中文名 */
  treeTypeLabel: string;
  status: NodeStatus;
  isActive?: boolean;
  /** 节点路径，如 ["限界上下文", "电商域"] */
  path: string[];
  /** 原始节点数据（用于跳转） */
  data: BoundedContextNode | BusinessFlowNode | ComponentNode;
}

/** 搜索结果 */
export interface SearchResult extends SearchNode {
  /** Fuse.js 匹配信息 */
  matches?: ReadonlyArray<FuseResultMatch>;
  /** 匹配得分（越低越好） */
  score?: number;
}

// =============================================================================
// Constants
// =============================================================================

const FUSE_OPTIONS: IFuseOptions<SearchNode> = {
  keys: [
    { name: 'label', weight: 0.7 },
    { name: 'path', weight: 0.2 },
    { name: 'treeTypeLabel', weight: 0.1 },
  ],
  threshold: 0.3, // 模糊度，值越小越精确
  includeMatches: true, // 高亮匹配片段
  minMatchCharLength: 1,
  ignoreLocation: true, // 忽略位置，允许匹配字符串任意位置
};

// =============================================================================
// Tree Type Labels
// =============================================================================

const _TREE_TYPE_LABELS: Record<TreeType, string> = {
  context: '限界上下文',
  flow: '业务流程',
  component: '组件树',
};

// =============================================================================
// SearchIndex
// =============================================================================

export class SearchIndex {
  private fuse: Fuse<SearchNode> | null = null;
  private nodes: SearchNode[] = [];

  /**
   * 构建/重建搜索索引
   * 在节点数量 < 200 时，全量重建 < 5ms
   */
  buildIndex(
    contextNodes: BoundedContextNode[],
    flowNodes: BusinessFlowNode[],
    componentNodes: ComponentNode[]
  ): void {
    const start = performance.now();

    const allNodes: SearchNode[] = [
      ...contextNodes.map((n) => ({
        id: n.nodeId,
        label: n.name,
        type: 'context' as TreeType,
        treeTypeLabel: `限界上下文 / ${n.name}`,
        status: n.status,
        isActive: n.isActive !== false,
        path: ['限界上下文', n.name],
        data: n,
      })),
      ...flowNodes.map((n) => ({
        id: n.nodeId,
        label: n.name,
        type: 'flow' as TreeType,
        treeTypeLabel: `业务流程 / ${n.name}`,
        status: n.status,
        isActive: n.isActive !== false,
        path: ['业务流程', n.name],
        data: n,
      })),
      ...componentNodes.map((n) => ({
        id: n.nodeId,
        label: n.name,
        type: 'component' as TreeType,
        treeTypeLabel: `组件树 / ${n.name}`,
        status: n.status,
        isActive: n.isActive !== false,
        path: ['组件树', n.name],
        data: n,
      })),
    ];

    this.nodes = allNodes;
    this.fuse = new Fuse(allNodes, FUSE_OPTIONS);

    const elapsed = performance.now() - start;
    // 仅在超过 300ms 阈值时记录（实际应该远低于此）
    if (elapsed > 300) {
      console.warn(`[SearchIndex] buildIndex took ${elapsed.toFixed(1)}ms, exceeding 300ms threshold`);
    }
  }

  /**
   * 执行搜索
   * @returns 匹配结果（按得分升序排列）
   */
  search(query: string): SearchResult[] {
    if (!this.fuse || !query.trim()) {
      return [];
    }

    const start = performance.now();
    const results = this.fuse.search(query).map((r) => ({
      ...r.item,
      matches: r.matches,
      score: r.score,
    }));

    const elapsed = performance.now() - start;
    if (elapsed > 300) {
      console.warn(`[SearchIndex] search took ${elapsed.toFixed(1)}ms, exceeding 300ms threshold`);
    }

    return results;
  }

  /** 获取所有节点（用于统计） */
  getAllNodes(): SearchNode[] {
    return this.nodes;
  }
}

/** 搜索节点到 store 操作的映射 */
export function navigateToSearchResult(result: SearchResult): void {
  const { useCanvasStore } = require('@/lib/canvas/canvasStore') as typeof import('@/lib/canvas/canvasStore');

  // 1. 展开对应的树面板
  if (result.type === 'context') {
    useCanvasStore.getState().setActiveTree('context');
    useCanvasStore.getState().toggleContextPanel();
  } else if (result.type === 'flow') {
    useCanvasStore.getState().setActiveTree('flow');
    useCanvasStore.getState().toggleFlowPanel();
  } else {
    useCanvasStore.getState().setActiveTree('component');
    useCanvasStore.getState().toggleComponentPanel();
  }

  // 2. 滚动到目标节点
  const nodeEl = document.querySelector(`[data-node-id="${result.id}"]`);
  if (nodeEl) {
    nodeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // 3. 脉冲高亮动画
    nodeEl.classList.add('search-highlight-pulse');
    setTimeout(() => {
      nodeEl.classList.remove('search-highlight-pulse');
    }, 2000);
  }
}
