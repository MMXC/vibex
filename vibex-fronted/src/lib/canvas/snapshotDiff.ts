import type { CanvasSnapshot } from '@/lib/canvas/types';

export interface TreeDiff {
  type: 'added' | 'removed' | 'changed' | 'unchanged';
  /** Node name/id for display */
  name: string;
  /** Node id for key */
  id?: string;
  /** Detail for changed items */
  detail?: string;
}

export interface SnapshotDiffResult {
  contextDiff: TreeDiff[];
  flowDiff: TreeDiff[];
  componentDiff: TreeDiff[];
  summary: {
    contextsAdded: number;
    contextsRemoved: number;
    flowsAdded: number;
    flowsRemoved: number;
    componentsAdded: number;
    componentsRemoved: number;
  };
}

function diffNodes<T extends { nodeId: string; name: string }>(
  aNodes: T[],
  bNodes: T[]
): TreeDiff[] {
  const aMap = new Map(aNodes.map(n => [n.nodeId, n]));
  const bMap = new Map(bNodes.map(n => [n.nodeId, n]));
  const diffs: TreeDiff[] = [];

  for (const node of aNodes) {
    if (!bMap.has(node.nodeId)) {
      diffs.push({ type: 'removed', name: node.name, id: node.nodeId });
    }
  }
  for (const node of bNodes) {
    if (!aMap.has(node.nodeId)) {
      diffs.push({ type: 'added', name: node.name, id: node.nodeId });
    }
  }
  return diffs;
}

export function computeSnapshotDiff(
  snapA: CanvasSnapshot,
  snapB: CanvasSnapshot
): SnapshotDiffResult {
  const aContexts = snapA.contextNodes ?? [];
  const bContexts = snapB.contextNodes ?? [];
  const aFlows = snapA.flowNodes ?? [];
  const bFlows = snapB.flowNodes ?? [];
  const aComponents = snapA.componentNodes ?? [];
  const bComponents = snapB.componentNodes ?? [];

  const contextDiff = diffNodes(aContexts, bContexts);
  const flowDiff = diffNodes(aFlows, bFlows);
  const componentDiff = diffNodes(aComponents, bComponents);

  return {
    contextDiff,
    flowDiff,
    componentDiff,
    summary: {
      contextsAdded: contextDiff.filter(d => d.type === 'added').length,
      contextsRemoved: contextDiff.filter(d => d.type === 'removed').length,
      flowsAdded: flowDiff.filter(d => d.type === 'added').length,
      flowsRemoved: flowDiff.filter(d => d.type === 'removed').length,
      componentsAdded: componentDiff.filter(d => d.type === 'added').length,
      componentsRemoved: componentDiff.filter(d => d.type === 'removed').length,
    },
  };
}
