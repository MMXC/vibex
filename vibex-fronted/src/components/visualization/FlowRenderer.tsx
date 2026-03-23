/**
 * FlowRenderer — ReactFlow visualization component
 *
 * Renders flow diagrams using ReactFlow, connected to visualizationStore.
 * Supports zoom, pan, minimap, node selection, and store synchronization.
 */

'use client';

import React, { useCallback } from 'react';
import FlowEditor from '@/components/ui/FlowEditor';
import { useFlowVisualization, useFlowVisualizationWithStore } from '@/hooks/useFlowVisualization';
import { useVisualizationStore } from '@/stores/visualizationStore';
import type { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect } from 'reactflow';
import { BackgroundVariant } from 'reactflow';
import type { FlowVisualizationRaw, FlowNodeData, FlowEdgeData } from '@/types/visualization';
import styles from './FlowRenderer.module.css';

export interface FlowRendererProps {
  /** Flow data to render */
  data: FlowVisualizationRaw;
  /** Override: show minimap */
  showMinimap?: boolean;
  /** Override: initial zoom */
  initialZoom?: number;
  /** Override: fit view on load */
  fitView?: boolean;
  /** Override: readonly mode */
  readonly?: boolean;
  /** Override: show controls */
  showControls?: boolean;
  /** Override: show background */
  showBackground?: boolean;
  /** Callback: node clicked */
  onNodeClick?: (node: Node<FlowNodeData>) => void;
  /** Callback: edge clicked */
  onEdgeClick?: (edge: Edge<FlowEdgeData>) => void;
  /** Callback: nodes changed (ReactFlow native type) */
  onNodesChange?: OnNodesChange;
  /** Callback: edges changed (ReactFlow native type) */
  onEdgesChange?: OnEdgesChange;
  /** Callback: connection made (ReactFlow native type) */
  onConnect?: OnConnect;
  /** Callback: flow initialized */
  onInit?: (instance: unknown) => void;
  /** Custom class name */
  className?: string;
}

/**
 * FlowRenderer — Visualizes flow diagrams
 *
 * Uses useFlowVisualizationWithStore to:
 * - Parse FlowVisualizationRaw into ReactFlow nodes/edges
 * - Sync selectedNodeId to visualizationStore
 * - Read zoom/minimap preferences from store
 */
export function FlowRenderer({
  data,
  showMinimap: minimapProp,
  initialZoom: zoomProp,
  fitView: fitViewProp = true,
  readonly: readonlyProp = false,
  showControls: controlsProp = true,
  showBackground: backgroundProp = true,
  onNodeClick: onNodeClickProp,
  onEdgeClick: onEdgeClickProp,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onInit,
  className,
}: FlowRendererProps) {
  const { options, setOption } = useVisualizationStore();
  const {
    nodes,
    edges,
    nodeCount,
    edgeCount,
  } = useFlowVisualization(data);

  // Use prop overrides or fall back to store
  const showMinimap = minimapProp ?? options.showMinimap ?? true;
  const fitView = fitViewProp;
  const readonly = readonlyProp;
  const showControls = controlsProp;
  const showBackground = backgroundProp;

  // Sync node click to store
  const onNodeClick = useCallback(
    (node: Node) => {
      setOption('selectedNodeId', node.id);
      onNodeClickProp?.(node as Node<FlowNodeData>);
    },
    [setOption, onNodeClickProp]
  );

  if (!data) {
    return (
      <div className={`${styles.empty} ${className || ''}`}>
        <div className={styles.emptyContent}>
          <span className={styles.emptyIcon}>📊</span>
          <p className={styles.emptyText}>No flow data provided</p>
          <p className={styles.emptySubtext}>Add flow data to visualize the diagram</p>
        </div>
      </div>
    );
  }

  if (nodeCount === 0 && edgeCount === 0) {
    return (
      <div className={`${styles.empty} ${className || ''}`}>
        <div className={styles.emptyContent}>
          <span className={styles.emptyIcon}>🔗</span>
          <p className={styles.emptyText}>Empty flow</p>
          <p className={styles.emptySubtext}>Add nodes and edges to build your diagram</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className || ''}`} data-testid="flow-renderer">
      <FlowEditor
        initialNodes={nodes}
        initialEdges={edges}
        readonly={readonly}
        fitView={fitView}
        fitViewOptions={{ padding: 0.2 }}
        showControls={showControls}
        showMiniMap={showMinimap}
        showBackground={showBackground}
        backgroundVariant={BackgroundVariant.Dots}
        backgroundGap={20}
        backgroundColor="#f9fafb"
        minZoom={0.1}
        maxZoom={2}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClickProp}
        onNodesChange={onNodesChange as Parameters<typeof FlowEditor>[0]['onNodesChange']}
        onEdgesChange={onEdgesChange as Parameters<typeof FlowEditor>[0]['onEdgesChange']}
        onConnect={onConnect as Parameters<typeof FlowEditor>[0]['onConnect']}
        onInit={onInit}
      />

      {/* Stats overlay */}
      <div className={styles.stats}>
        <span>{nodeCount} nodes</span>
        <span className={styles.statsDivider}>·</span>
        <span>{edgeCount} edges</span>
        {options.selectedNodeId && (
          <>
            <span className={styles.statsDivider}>·</span>
            <span className={styles.statsSelected}>selected</span>
          </>
        )}
      </div>
    </div>
  );
}
