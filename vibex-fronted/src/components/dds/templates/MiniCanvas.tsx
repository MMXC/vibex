/**
 * MiniCanvas.tsx — Simplified Read-Only Canvas Renderer for Template Preview
 * Sprint54 E5: Template Gallery 增强
 *
 * Renders a canvas template in read-only mode using ReactFlow.
 * No interactions, no animations — just visual preview.
 */
'use client';

import { useMemo } from 'react';
import { ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { CanvasSnapshotData } from '@/lib/canvas/serialize';
import type { Node, Edge } from '@xyflow/react';

interface MiniCanvasProps {
  /** Parsed canvas snapshot data */
  data: CanvasSnapshotData;
}

// Minimal node style for preview
function getMiniNodeStyle(type?: string): Record<string, string> {
  const base: Record<string, string> = {
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '11px',
    border: '1px solid #374151',
    background: '#1e293b',
    color: '#e2e8f0',
    minWidth: '60px',
    textAlign: 'center' as const,
  };
  return base;
}

export function MiniCanvas({ data }: MiniCanvasProps) {
  const { nodes, edges } = useMemo(() => {
    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];

    // Layout nodes in a simple grid
    let xOffset = 0;
    let yOffset = 0;
    const xStep = 180;
    const yStep = 100;
    const maxPerRow = 4;

    // Render context nodes at top
    if (data.contexts?.length) {
      data.contexts.forEach((ctx, i) => {
        allNodes.push({
          id: `ctx-${ctx.id}`,
          type: 'input',
          position: { x: i * xStep, y: 0 },
          data: { label: ctx.name || ctx.id },
          style: { ...getMiniNodeStyle('context'), borderColor: '#3b82f6', background: '#1e3a5f' },
        });
      });
      yOffset = yStep;
    }

    // Render flow nodes
    if (data.flows?.length) {
      const flow = data.flows[0];
      if (flow?.nodes?.length) {
        flow.nodes.forEach((node, i) => {
          const row = Math.floor(i / maxPerRow);
          const col = i % maxPerRow;
          allNodes.push({
            id: node.id,
            type: node.type || 'default',
            position: { x: col * xStep, y: yOffset + row * yStep },
            data: { label: (node.data as { label?: string })?.label || node.id },
            style: getMiniNodeStyle(node.type),
          });
        });
      }
      if (flow?.edges?.length) {
        flow.edges.forEach((edge) => {
          allEdges.push({
            id: edge.id || `${edge.source}-${edge.target}`,
            source: edge.source,
            target: edge.target,
            type: 'default',
            style: { stroke: '#475569', strokeWidth: 1.5 },
            animated: false,
          });
        });
      }
    }

    return { nodes: allNodes, edges: allEdges };
  }, [data]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0f172a' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodesDraggable={false}
        nodesConnectable={false}
        panEnabled={false}
        zoomEnabled={false}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        style={{ background: '#0f172a' }}
      />
    </div>
  );
}
