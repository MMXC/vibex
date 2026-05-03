/**
 * P005 Canvas 对比 — 核心算法
 * 比较两个 Canvas 项目的三棵树节点差异
 */

import type { BoundedContextNode, BusinessFlowNode, ComponentNode } from './canvas/types';

/** Canvas 项目 — 包含三棵树的完整数据 */
export interface CanvasProject {
  id: string;
  name: string;
  contextNodes: BoundedContextNode[];
  flowNodes: BusinessFlowNode[];
  componentNodes: ComponentNode[];
}

/** 单个树类型的 diff 条目 */
export interface DiffItem<T> {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  source: 'left' | 'right';
  /** 原始节点数据 */
  node: T;
  /** 修改前的内容（仅 modified 有） */
  before?: T;
  /** 修改后的内容（仅 modified 有） */
  after?: T;
}

/** Canvas 项目对比结果 */
export interface CanvasDiff {
  /** B 项目中新增的节点（不在 A 中） */
  added: DiffItem<BoundedContextNode | BusinessFlowNode | ComponentNode>[];
  /** A 项目中移除的节点（B 有，A 没有） */
  removed: DiffItem<BoundedContextNode | BusinessFlowNode | ComponentNode>[];
  /** 两边都存在但内容有变化 */
  modified: DiffItem<BoundedContextNode | BusinessFlowNode | ComponentNode>[];
  /** 两边完全相同的节点 */
  unchanged: DiffItem<BoundedContextNode | BusinessFlowNode | ComponentNode>[];
  /** 对比摘要 */
  summary: {
    contextAdded: number;
    contextRemoved: number;
    contextModified: number;
    flowAdded: number;
    flowRemoved: number;
    flowModified: number;
    componentAdded: number;
    componentRemoved: number;
    componentModified: number;
  };
}

/** 对比两种 Canvas 项目的三棵树节点 */
export function compareCanvasProjects(
  projectA: CanvasProject,
  projectB: CanvasProject
): CanvasDiff {
  const result: CanvasDiff = {
    added: [],
    removed: [],
    modified: [],
    unchanged: [],
    summary: {
      contextAdded: 0,
      contextRemoved: 0,
      contextModified: 0,
      flowAdded: 0,
      flowRemoved: 0,
      flowModified: 0,
      componentAdded: 0,
      componentRemoved: 0,
      componentModified: 0,
    },
  };

  const diffTree = (
    nodesA: { nodeId: string }[],
    nodesB: { nodeId: string }[],
    treeType: 'context' | 'flow' | 'component'
  ) => {
    const mapB = new Map(nodesB.map((n) => [n.nodeId, n]));

    for (const nodeA of nodesA) {
      const nodeB = mapB.get(nodeA.nodeId);
      if (!nodeB) {
        // In A but not in B → removed from B (right source means came from B)
        result.removed.push({ type: 'removed', source: 'right', node: nodeA as any });
        (result.summary as any)[`${treeType}Removed`]++;
      } else if (!deepEqual(nodeA, nodeB)) {
        result.modified.push({
          type: 'modified',
          source: 'left',
          node: nodeA as any,
          before: nodeB as any,
          after: nodeA as any,
        });
        (result.summary as any)[`${treeType}Modified`]++;
      } else {
        result.unchanged.push({ type: 'unchanged', source: 'left', node: nodeA as any });
      }
    }

    const mapA = new Map(nodesA.map((n) => [n.nodeId, n]));
    for (const nodeB of nodesB) {
      if (!mapA.has(nodeB.nodeId)) {
        // In B but not in A → added in B (left source means came from A's perspective)
        result.added.push({ type: 'added', source: 'left', node: nodeB as any });
        (result.summary as any)[`${treeType}Added`]++;
      }
    }
  };

  diffTree(projectA.contextNodes, projectB.contextNodes, 'context');
  diffTree(projectA.flowNodes, projectB.flowNodes, 'flow');
  diffTree(projectA.componentNodes, projectB.componentNodes, 'component');

  return result;
}

/** 深度相等检查（排除 nodeId） */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== 'object') return a === b;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;

  const aKeys = Object.keys(aObj).filter((k) => k !== 'nodeId');
  const bKeys = Object.keys(bObj).filter((k) => k !== 'nodeId');

  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!deepEqual(aObj[key], bObj[key])) return false;
  }
  return true;
}

/** 导出 diff 报告为 JSON */
export function exportDiffReport(diff: CanvasDiff, projectA: string, projectB: string): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      projectA,
      projectB,
      summary: diff.summary,
      added: diff.added,
      removed: diff.removed,
      modified: diff.modified,
      unchangedCount: diff.unchanged.length,
    },
    null,
    2
  );
}