/**
 * VibeX CascadeUpdateManager
 * 上游变更触发下游重置的内聚管理器
 *
 * 遵守 AGENTS.md ADR-002 约束：
 * - 放在 lib/canvas/cascade/，不散落在组件内
 * - 必须经过 CascadeUpdateManager 修改下游状态
 */
// @ts-nocheck

import type { BoundedContextNode, BusinessFlowNode, ComponentNode } from '../types';

/**
 * 上游变更时，级联标记下游为 pending
 */
export function markFlowNodesPending(nodes: BusinessFlowNode[]): BusinessFlowNode[] {
  return nodes.map((n) => ({
    ...n,
    status: 'pending' as const,
    isActive: false,
    steps: n.steps.map((s) => ({
      ...s,
      status: 'pending' as const,
      isActive: false,
    })),
  }));
}

export function markComponentNodesPending(nodes: ComponentNode[]): ComponentNode[] {
  return nodes.map((n) => ({
    ...n,
    status: 'pending' as const,
    isActive: false,
  }));
}

/**
 * 检查节点数组是否有数据（显示指标，不再是 gate）
 * S1.4: 替代 areAllConfirmed，用于显示目的
 */
export function hasNodes(nodes: unknown[]): boolean {
  return nodes.length > 0;
}

/**
 * 检查所有节点是否都已确认
 * @deprecated Use hasNodes instead — phase gates removed in Epic 1
 */
export function areAllConfirmed(nodes: Array<{ isActive?: boolean }>): boolean {
  return nodes.length > 0 && nodes.every((n) => n.isActive !== false);
}

/**
 * 检查是否有激活节点（isActive=true 或 undefined）
 */
export function hasActiveNodes(nodes: Array<{ isActive?: boolean }>): boolean {
  return nodes.some((n) => n.isActive !== false);
}

/**
 * 级联更新上下文节点变更
 * @deprecated Epic 4: cascade is now manual — editing/deleting context does NOT auto-reset downstream
 */
export function cascadeContextChange(
  contextNodes: BoundedContextNode[],
  flowNodes: BusinessFlowNode[],
  componentNodes: ComponentNode[]
): { flowNodes: BusinessFlowNode[]; componentNodes: ComponentNode[] } {
  return {
    flowNodes: markFlowNodesPending(flowNodes),
    componentNodes: markComponentNodesPending(componentNodes),
  };
}

/**
 * 级联更新流程节点变更
 * @deprecated Epic 4: cascade is now manual — editing/deleting flow does NOT auto-reset downstream
 */
export function cascadeFlowChange(
  flowNodes: BusinessFlowNode[],
  componentNodes: ComponentNode[]
): { componentNodes: ComponentNode[] } {
  return {
    componentNodes: markComponentNodesPending(componentNodes),
  };
}
