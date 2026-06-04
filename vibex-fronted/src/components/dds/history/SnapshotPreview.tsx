'use client';

/**
 * SnapshotPreview — E1 (Sprint61): Canvas version history timeline view + snapshot comparison
 *
 * Shows a read-only mini canvas preview of a snapshot's nodes.
 * Nodes are rendered as scaled cards with labels, showing the canvas structure
 * at the time the snapshot was taken.
 *
 * D1.2: SnapshotPreview.tsx — 点击快照显示节点预览（只读，节点可缩放查看）
 */

import React, { memo, useRef, useState, useCallback } from 'react';
import type { Snapshot } from '@/stores/dds/canvasHistoryStore';

export interface SnapshotPreviewProps {
  /** The snapshot to preview */
  snapshot: Snapshot;
  /** Called when user wants to restore to this snapshot */
  onRestore: (snap: Snapshot) => void;
}

/** Node card rendered in the preview */
interface PreviewNode {
  id: string;
  label?: string;
  type?: string;
  x?: number;
  y?: number;
}

/** Scale level for the preview */
type ScaleLevel = 'compact' | 'medium' | 'detailed';

const SCALE_DIMENSIONS: Record<ScaleLevel, { nodeWidth: number; nodeHeight: number; showLabel: boolean; showType: boolean }> = {
  compact: { nodeWidth: 60, nodeHeight: 30, showLabel: false, showType: false },
  medium: { nodeWidth: 100, nodeHeight: 40, showLabel: true, showType: false },
  detailed: { nodeWidth: 140, nodeHeight: 50, showLabel: true, showType: true },
};

/**
 * Get a display label for a node card
 */
function getNodeLabel(node: PreviewNode): string {
  if (node.label) return node.label;
  if (node.type) return node.type.charAt(0).toUpperCase() + node.type.slice(1);
  return 'Node';
}

/**
 * Get a color class for the node type
 */
function getNodeTypeColor(type?: string): string {
  switch (type?.toLowerCase()) {
    case 'chapter': return 'preview-node-chapter';
    case 'context': return 'preview-node-context';
    case 'flow': return 'preview-node-flow';
    case 'api': return 'preview-node-api';
    case 'business-rules': return 'preview-node-rules';
    case 'requirement': return 'preview-node-requirement';
    default: return 'preview-node-default';
  }
}

const SnapshotPreview = memo(function SnapshotPreview({
  snapshot,
  onRestore,
}: SnapshotPreviewProps) {
  const [scale, setScale] = useState<ScaleLevel>('medium');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const nodes: PreviewNode[] = (snapshot.data.nodes ?? []) as PreviewNode[];
  const edges = snapshot.data.edges ?? [];
  const scaleConfig = SCALE_DIMENSIONS[scale];

  // Build a simple 2D grid layout for the nodes
  const cols = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
  const nodeWidth = scaleConfig.nodeWidth + 16; // include gap
  const nodeHeight = scaleConfig.nodeHeight + 16;
  const gridWidth = cols * nodeWidth;

  const handleScaleChange = useCallback((newScale: ScaleLevel) => {
    setScale(newScale);
  }, []);

  const handleRestore = useCallback(() => {
    onRestore(snapshot);
  }, [onRestore, snapshot]);

  return (
    <div className="snapshot-preview" data-testid="snapshot-preview">
      {/* Header */}
      <div className="preview-header">
        <div className="preview-title-row">
          <span className="preview-title">{snapshot.name}</span>
          {snapshot.branchName && snapshot.branchName !== 'main' && (
            <span className="preview-branch">{snapshot.branchName}</span>
          )}
        </div>
        <div className="preview-meta">
          <span>{nodes.length} 节点</span>
          <span>{edges.length} 连线</span>
          <span>{new Date(snapshot.timestamp).toLocaleString('zh-CN')}</span>
        </div>
      </div>

      {/* Scale controls */}
      <div className="preview-scale-controls" role="toolbar" aria-label="缩放控制">
        <button
          type="button"
          className={`preview-scale-btn ${scale === 'compact' ? 'active' : ''}`}
          onClick={() => handleScaleChange('compact')}
          aria-label="紧凑视图"
          title="紧凑视图"
        >
          ──
        </button>
        <button
          type="button"
          className={`preview-scale-btn ${scale === 'medium' ? 'active' : ''}`}
          onClick={() => handleScaleChange('medium')}
          aria-label="中等视图"
          title="中等视图"
        >
          ━━
        </button>
        <button
          type="button"
          className={`preview-scale-btn ${scale === 'detailed' ? 'active' : ''}`}
          onClick={() => handleScaleChange('detailed')}
          aria-label="详细视图"
          title="详细视图"
        >
          ═══
        </button>
      </div>

      {/* Canvas preview area */}
      <div
        className="preview-canvas"
        ref={containerRef}
        role="img"
        aria-label={`快照预览：${nodes.length}个节点`}
        style={{ minWidth: Math.max(200, gridWidth) }}
      >
        {nodes.length === 0 ? (
          <div className="preview-empty">空画布</div>
        ) : (
          <div
            className="preview-nodes"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              padding: '8px',
            }}
          >
            {nodes.map((node) => (
              <div
                key={node.id}
                className={`preview-node ${getNodeTypeColor(node.type)} ${hoveredNode === node.id ? 'hovered' : ''}`}
                style={{
                  width: scaleConfig.nodeWidth,
                  height: scaleConfig.nodeHeight,
                  cursor: 'default',
                }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                role="img"
                aria-label={`${getNodeLabel(node)} (${node.id.slice(0, 6)})`}
                title={`${getNodeLabel(node)}\nID: ${node.id}`}
              >
                {scaleConfig.showLabel && (
                  <span className="preview-node-label">{getNodeLabel(node)}</span>
                )}
                {scaleConfig.showType && (
                  <span className="preview-node-type">{node.type}</span>
                )}
                {!scaleConfig.showLabel && !scaleConfig.showType && (
                  <span className="preview-node-id">{node.id.slice(0, 4)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edge count indicator */}
      {edges.length > 0 && (
        <div className="preview-edges-indicator">
          <svg width={edges.length * 8 + 40} height={16} aria-hidden="true">
            {edges.slice(0, 8).map((edge: { id?: string; source?: string; target?: string }, i: number) => (
              <line
                key={edge.id ?? i}
                x1={8 + i * 8}
                y1={4}
                x2={16 + i * 8}
                y2={12}
                stroke="currentColor"
                strokeWidth="1.5"
                opacity={0.6}
              />
            ))}
            {edges.length > 8 && (
              <text x={edges.length * 8 + 4} y={12} fontSize="10" fill="currentColor">
                +{edges.length - 8}
              </text>
            )}
          </svg>
          <span>{edges.length} 条连线</span>
        </div>
      )}

      {/* Restore button */}
      <div className="preview-actions">
        <button
          type="button"
          className="preview-restore-btn"
          onClick={handleRestore}
          aria-label="恢复到此版本"
        >
          ↩ 恢复此版本
        </button>
      </div>
    </div>
  );
});

export default SnapshotPreview;
