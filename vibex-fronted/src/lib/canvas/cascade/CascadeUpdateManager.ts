/**
 * VibeX CascadeUpdateManager
 * 上游变更触发下游重置的内聚管理器
 *
 * 遵守 AGENTS.md ADR-002 约束：
 * - 放在 lib/canvas/cascade/，不散落在组件内
 * - 必须经过 CascadeUpdateManager 修改下游状态
 */
import type { BoundedContextNode, BusinessFlowNode, ComponentNode } from '../types';

/**
 * 上游变更时，级联标记下游为 pending
 */
export function markFlowNodesPending(nodes: BusinessFlowNode[]): BusinessFlowNode[] {
  return nodes.map((n) => ({
    ...n,
    status: 'pending' as const,
    confirmed: false,
    steps: n.steps.map((s) => ({
      ...s,
      status: 'pending' as const,
      confirmed: false,
    })),
  }));
}

export function markComponentNodesPending(nodes: ComponentNode[]): ComponentNode[] {
  return nodes.map((n) => ({
    ...n,
    status: 'pending' as const,
    confirmed: false,
  }));
}

/**
 * 检查节点数组是否有任何节点（display metric, not a gate）
 * S1.4: phase gates removed — formerly checked every(n => n.confirmed),
 * now just checks nodes.length > 0
 * To be replaced by isActive in Epic 3
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function hasNodes(nodes: any[]): boolean {
  return nodes.length > 0;
}

/**
 * @deprecated Use hasNodes. kept for backward compat until Epic 3
 * S1.4: removed confirmed check — now just a display metric
 */
export function areAllConfirmed(nodes: Array<{ confirmed: boolean }>): boolean {
  return nodes.length > 0;
}

/**
 * 级联更新上下文节点变更
 * context 变更 → flow + component marked pending
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
 * flow 变更 → component marked pending
 */
export function cascadeFlowChange(
  flowNodes: BusinessFlowNode[],
  componentNodes: ComponentNode[]
): { componentNodes: ComponentNode[] } {
  return {
    componentNodes: markComponentNodesPending(componentNodes),
  };
}
