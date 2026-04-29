/**
 * useCanvasRenderer — memoized rendering computations for CanvasPage
 *
 * Extracts from CanvasPage.tsx:
 *  - Node rects (context/flow/component) for edge layers
 *  - Bounded edges (context relationships)
 *  - Flow edges (step connections)
 *  - Unified TreeNode arrays for each tree
 *
 * All computations are pure useMemo — no side effects.
 *
 * Epic: canvas-split-hooks / E3-useCanvasRenderer
 */

import { useMemo } from 'react';
import type {
  BoundedContextNode,
  BusinessFlowNode,
  ComponentNode,
  TreeType,
  TreeNode,
  NodeRect,
} from '@/lib/canvas/types';

// ============================================================================
// Constants (matching CanvasPage.tsx)
// ============================================================================
const CARD_W = 240;
const CARD_H = 200;
const CARD_GAP = 16;

// ============================================================================
// Node rect computation
// ============================================================================
function computeNodeRects<T extends { nodeId: string }>(
  nodes: T[]
): NodeRect[] {
  return nodes.map((node, i) => ({
    id: node.nodeId,
    x: (i % 3) * (CARD_W + CARD_GAP),
    y: Math.floor(i / 3) * (CARD_H + CARD_GAP),
    width: CARD_W,
    height: CARD_H,
  }));
}

// ============================================================================
// Bounded context edges
// ============================================================================
function computeBoundedEdges(nodes: BoundedContextNode[]) {
  const edges = [];
  let idx = 0;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      if (!a || !b) continue;
      let relType: 'dependency' | 'association' | 'composition' = 'dependency';
      if ((a.type === 'core' && b.type === 'supporting') || (a.type === 'supporting' && b.type === 'core'))
        relType = 'dependency';
      else if ((a.type === 'generic' && b.type === 'core') || (a.type === 'core' && b.type === 'generic'))
        relType = 'dependency';
      else if (a.type === 'core' && b.type === 'core') relType = 'dependency';
      else if (
        (a.type === 'supporting' && b.type === 'supporting') ||
        (a.type === 'supporting' && b.type === 'generic') ||
        (a.type === 'generic' && b.type === 'supporting')
      )
        relType = 'association';
      else if (a.type === 'external' || b.type === 'external') relType = 'dependency';
      edges.push({
        id: `bounded-edge-${idx++}`,
        from: { groupId: a.nodeId },
        to: { groupId: b.nodeId },
        type: relType,
      });
    }
  }
  return edges;
}

// ============================================================================
// Flow edges
// ============================================================================
function computeFlowEdges(flowNodes: BusinessFlowNode[]) {
  const edges = [];
  let edgeIdx = 0;
  for (const node of flowNodes) {
    const steps = node.steps;
    if (steps.length < 2) continue;
    for (let i = 0; i < steps.length - 1; i++) {
      const from = steps[i];
      const to = steps[i + 1];
      if (!from || !to) continue;
      const fromType = (from.type as string) ?? 'normal';
      const toType = (to.type as string) ?? 'normal';
      let edgeType: 'sequence' | 'branch' | 'loop' = 'sequence';
      if (fromType === 'loop' || toType === 'loop') edgeType = 'loop';
      else if (fromType === 'branch' || toType === 'branch') edgeType = 'branch';
      edges.push({
        id: `flow-edge-${edgeIdx++}`,
        from: from.stepId,
        to: to.stepId,
        type: edgeType,
      });
    }
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (!step) continue;
      if (step.type === 'loop' && step.description) {
        const targetStep = steps.find(
          (s, idx) => idx < i && s.name.includes(step.description!.replace('回到: ', ''))
        );
        if (targetStep)
          edges.push({
            id: `flow-edge-${edgeIdx++}`,
            from: step.stepId,
            to: targetStep.stepId,
            type: 'loop' as const,
          });
      }
    }
  }
  return edges;
}

// ============================================================================
// TreeNode transforms
// ============================================================================

// ============================================================================
// Hook
// ============================================================================
export interface UseCanvasRendererReturn {
  contextNodeRects: NodeRect[];
  flowNodeRects: NodeRect[];
  componentNodeRects: NodeRect[];
  boundedEdges: { id: string; from: { groupId: string }; to: { groupId: string }; type: 'dependency' | 'association' | 'composition' }[];
  flowEdges: { id: string; from: string; to: string; type: 'sequence' | 'branch' | 'loop' }[];
  contextTreeNodes: TreeNode[];
  flowTreeNodes: TreeNode[];
  componentTreeNodes: TreeNode[];
}

export function useCanvasRenderer(params: {
  contextNodes: BoundedContextNode[];
  flowNodes: BusinessFlowNode[];
  componentNodes: ComponentNode[];
}): UseCanvasRendererReturn {
  const { contextNodes, flowNodes, componentNodes } = params;

  const contextNodeRects = useMemo(() => computeNodeRects(contextNodes), [contextNodes]);
  const flowNodeRects = useMemo(() => computeNodeRects(flowNodes), [flowNodes]);
  const componentNodeRects = useMemo(() => computeNodeRects(componentNodes), [componentNodes]);

  const boundedEdges = useMemo(() => computeBoundedEdges(contextNodes), [contextNodes]);
  const flowEdges = useMemo(() => computeFlowEdges(flowNodes), [flowNodes]);

  const contextTreeNodes = useMemo(
    () =>
      contextNodes.map((n) => ({
        id: n.nodeId,
        label: n.name,
        type: 'context' as TreeType,
        status: n.status,
        confirmed: n.isActive !== false,
        parentId: n.parentId,
        children: n.children,
        data: n,
      })),
    [contextNodes]
  );

  const flowTreeNodes = useMemo(
    () =>
      flowNodes.map((n) => ({
        id: n.nodeId,
        label: n.name,
        type: 'flow' as TreeType,
        status: n.status,
        confirmed: (n as unknown as { isActive?: boolean }).isActive !== false,
        parentId: (n as unknown as { parentId?: string }).parentId,
        children: (n as unknown as { children?: string[] }).children ?? [],
        data: n,
      })),
    [flowNodes]
  );

  const componentTreeNodes = useMemo(
    () =>
      componentNodes.map((n) => ({
        id: n.nodeId,
        label: n.name,
        type: 'component' as TreeType,
        status: n.status,
        confirmed: (n as unknown as { isActive?: boolean }).isActive !== false,
        parentId: (n as unknown as { parentId?: string }).parentId,
        children: (n as unknown as { children?: string[] }).children ?? [],
        data: n,
      })),
    [componentNodes]
  );

  return {
    contextNodeRects,
    flowNodeRects,
    componentNodeRects,
    boundedEdges,
    flowEdges,
    contextTreeNodes,
    flowTreeNodes,
    componentTreeNodes,
  };
}
