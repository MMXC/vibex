/**
 * serialize.ts — 三树数据序列化/反序列化
 * E4-U2: 三树数据序列化
 */
import type { BoundedContextNode, BusinessFlowNode, ComponentNode } from '@/lib/canvas/types';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';

/** 三树快照数据结构 */
export interface CanvasSnapshotData {
  version: number;
  savedAt: string;
  contextNodes: BoundedContextNode[];
  flowNodes: BusinessFlowNode[];
  componentNodes: ComponentNode[];
}

/**
 * 从当前 Zustand stores 序列化三树
 * 用于保存时打包数据
 */
export function serializeThreeTrees(): CanvasSnapshotData {
  const contextNodes = useContextStore.getState().contextNodes;
  const flowNodes = useFlowStore.getState().flowNodes;
  const componentNodes = useComponentStore.getState().componentNodes;

  return {
    version: 1,
    savedAt: new Date().toISOString(),
    contextNodes,
    flowNodes,
    componentNodes,
  };
}

/**
 * 反序列化 JSON 字符串为 CanvasSnapshotData
 * @throws Error 不支持的数据版本
 */
export function deserializeThreeTrees(jsonStr: string): CanvasSnapshotData {
  const data = JSON.parse(jsonStr) as CanvasSnapshotData;

  if (typeof data.version !== 'number') {
    throw new Error('不支持的数据格式：缺少 version 字段');
  }

  if (data.version !== 1) {
    throw new Error(`不支持的数据版本: ${data.version}（仅支持 version 1）`);
  }

  return {
    version: data.version,
    savedAt: data.savedAt ?? new Date().toISOString(),
    contextNodes: Array.isArray(data.contextNodes) ? data.contextNodes : [],
    flowNodes: Array.isArray(data.flowNodes) ? data.flowNodes : [],
    componentNodes: Array.isArray(data.componentNodes) ? data.componentNodes : [],
  };
}

/**
 * 将 CanvasSnapshotData 恢复到 Zustand stores
 * 用于从快照加载时恢复状态
 */
export function restoreStore(data: CanvasSnapshotData): void {
  const setContextNodes = useContextStore.getState().setContextNodes;
  const setFlowNodes = useFlowStore.getState().setFlowNodes;
  const setComponentNodes = useComponentStore.getState().setComponentNodes;

  setContextNodes(data.contextNodes ?? []);
  setFlowNodes(data.flowNodes ?? []);
  setComponentNodes(data.componentNodes ?? []);
}

/**
 * 将 CanvasSnapshotData 序列化为 JSON 字符串
 */
export function serializeToJson(data: CanvasSnapshotData): string {
  return JSON.stringify(data);
}
