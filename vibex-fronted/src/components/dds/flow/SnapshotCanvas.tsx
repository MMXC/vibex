/**
 * SnapshotCanvas — Read-only canvas renderer for public snapshot viewing
 * S45-P005-E5: Canvas Snapshot Sharing
 *
 * Renders the three-tree canvas in read-only mode:
 * - nodesDraggable = false
 * - nodesConnectable = false
 * - no toolbar, no editing controls
 */
'use client';

import { useMemo } from 'react';
import { ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { CanvasSnapshotData } from '@/lib/canvas/serialize';
import type { Node, Edge } from '@xyflow/react';

interface SnapshotCanvasProps {
  data: CanvasSnapshotData;
}

export function SnapshotCanvas({ data }: SnapshotCanvasProps) {
  // Convert three-tree data to ReactFlow nodes/edges
  // The SnapshotCanvas is simplified: renders all nodes in a single flat view
  // for the read-only public snapshot use case
  const { nodes, edges } = useMemo(() => {
    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];

    let xOffset = 0;
    const yOffset = 0;

    // Render context nodes
    if (data.contexts?.length) {
      data.contexts.forEach((ctx, i) => {
        allNodes.push({
          id: `ctx-${ctx.id}`,
          type: 'input',
          position: { x: xOffset + i * 250, y: yOffset },
          data: { label: ctx.name || ctx.id, type: 'context' },
        });
      });
    }

    // Render flow nodes (from the first flow)
    if (data.flows?.length) {
      const flow = data.flows[0];
      if (flow?.nodes?.length) {
        flow.nodes.forEach((node, i) => {
          allNodes.push({
            id: `flow-${node.id}`,
            type: 'default',
            position: { x: xOffset + i * 200, y: yOffset + 200 },
            data: { label: node.name || node.id, type: 'flow' },
          });
        });
      }
      if (flow?.edges?.length) {
        allEdges.push(
          ...flow.edges.map((e) => ({
            id: `fe-${e.id}`,
            source: `flow-${e.source}`,
            target: `flow-${e.target}`,
            label: e.label,
            type: 'smoothstep',
          }))
        );
      }
    }

    // Render component nodes
    if (data.components?.length) {
      data.components.forEach((comp, i) => {
        allNodes.push({
          id: `comp-${comp.id}`,
          type: 'output',
          position: { x: xOffset + i * 200, y: yOffset + 400 },
          data: { label: comp.name || comp.id, type: 'component' },
        });
      });
    }

    return { nodes: allNodes, edges: allEdges };
  }, [data]);

  if (!nodes.length && !edges.length) {
    return (
      <div className="snapshot-canvas-empty" data-testid="snapshot-canvas-empty">
        <p>This snapshot is empty.</p>
      </div>
    );
  }

  return (
    <div className="snapshot-canvas" data-testid="snapshot-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
      />
    </div>
  );
}
