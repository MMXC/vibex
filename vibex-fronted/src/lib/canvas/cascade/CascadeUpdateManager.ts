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
 * 检查所有节点是否都已确认
 */
export function areAllConfirmed(nodes: Array<{ confirmed: boolean }>): boolean {
  return nodes.length > 0 && nodes.every((n) => n.confirmed);
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
