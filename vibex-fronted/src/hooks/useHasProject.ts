/**
 * useHasProject — 检测画布是否有已加载的项目
 * E3 S3.4: 示例项目快速入口 — 检测 localStorage 是否有项目数据
 */
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';

export function useHasProject(): boolean {
  const contextNodes = useContextStore((s) => s.contextNodes);
  const flowNodes = useFlowStore((s) => s.flowNodes);
  const componentNodes = useComponentStore((s) => s.componentNodes);

  return contextNodes.length > 0 || flowNodes.length > 0 || componentNodes.length > 0;
}
