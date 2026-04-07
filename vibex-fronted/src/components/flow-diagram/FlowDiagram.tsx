/**
 * Flow Diagram Component
 * 流程图展示：节点渲染、缩放、高亮
 */

'use client';

import { useRef, useState, useCallback, useMemo } from 'react';
import { EmptyFallback } from '@/components/ui/DDDFallback';
import styles from './FlowDiagram.module.css';

export interface FlowNode {
  id: string;
  label: string;
  type: 'start' | 'end' | 'process' | 'decision' | 'input' | 'output';
  status?: 'pending' | 'active' | 'completed' | 'error';
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface FlowDiagramProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  width?: number;
  height?: number;
  onNodeClick?: (nodeId: string) => void;
}

export function FlowDiagram({
  nodes,
  edges,
  width = 800,
  height = 600,
  onNodeClick,
}: FlowDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(s + 0.1, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((s) => Math.max(s - 0.1, 0.3));
  }, []);

  const handleZoomReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Node click handler
  const handleNodeClick = useCallback((nodeId: string) => {
    setHighlightedNode(nodeId);
    onNodeClick?.(nodeId);
  }, [onNodeClick]);

  // Calculate node positions (simple grid layout)
  const nodePositions = useMemo(() => {
    const cols = Math.ceil(Math.sqrt(nodes.length));
    return nodes.map((node, index) => ({
      id: node.id,
      x: 100 + (index % cols) * 180,
      y: 80 + Math.floor(index / cols) * 120,
    }));
  }, [nodes]);

  // Get node color by status
  const getNodeColor = (node: FlowNode) => {
    if (highlightedNode === node.id) return '#3b82f6';
    
    switch (node.status) {
      case 'completed': return '#10b981';
      case 'active': return '#3b82f6';
      case 'error': return '#ef4444';
      case 'pending': return '#9ca3af';
      default: return '#6b7280';
    }
  };

  // Get node shape
  const getNodeShape = (type: FlowNode['type']) => {
    switch (type) {
      case 'start': return 'circle';
      case 'end': return 'circle';
      case 'decision': return 'diamond';
      default: return 'rect';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.toolButton} onClick={handleZoomIn}>+</button>
        <span className={styles.scaleLabel}>{Math.round(scale * 100)}%</span>
        <button type="button" className={styles.toolButton} onClick={handleZoomOut}>-</button>
        <button type="button" className={styles.toolButton} onClick={handleZoomReset}>⟲</button>
      </div>

      <div
        ref={containerRef}
        className={styles.diagramArea}
        style={{ width, height }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* F1.1: 空值保护 — 无节点时显示 fallback */}
        {(!nodes || nodes.length === 0) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <EmptyFallback message="暂无业务流程，请先生成" />
          </div>
        )}
        <svg
          className={styles.svg}
          viewBox={`0 0 ${width} ${height}`}
          style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})` }}
        >
          {/* Edges */}
          {edges.map((edge) => {
            const source = nodePositions.find((p) => p.id === edge.source);
            const target = nodePositions.find((p) => p.id === edge.target);
            if (!source || !target) return null;

            return (
              <g key={edge.id}>
                <line
                  x1={source.x + 60}
                  y1={source.y + 25}
                  x2={target.x + 60}
                  y2={target.y + 25}
                  stroke="#9ca3af"
                  strokeWidth={2}
                />
                {edge.label && (
                  <text
                    x={(source.x + target.x) / 2 + 60}
                    y={(source.y + target.y) / 2 + 20}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#6b7280"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const pos = nodePositions.find((p) => p.id === node.id);
            if (!pos) return null;

            const isHighlighted = highlightedNode === node.id;
            const color = getNodeColor(node);
            const shape = getNodeShape(node.type);

            return (
              <g
                key={node.id}
                className={`${styles.node} ${isHighlighted ? styles.highlighted : ''}`}
                onClick={() => handleNodeClick(node.id)}
                style={{ cursor: 'pointer' }}
              >
                {shape === 'circle' ? (
                  <circle
                    cx={pos.x + 60}
                    cy={pos.y + 25}
                    r={25}
                    fill="white"
                    stroke={color}
                    strokeWidth={isHighlighted ? 3 : 2}
                  />
                ) : shape === 'diamond' ? (
                  <polygon
                    points={`${pos.x + 60},${pos.y} ${pos.x + 120},${pos.y + 25} ${pos.x + 60},${pos.y + 50} ${pos.x},${pos.y + 25}`}
                    fill="white"
                    stroke={color}
                    strokeWidth={isHighlighted ? 3 : 2}
                  />
                ) : (
                  <rect
                    x={pos.x + 10}
                    y={pos.y}
                    width={100}
                    height={50}
                    rx={6}
                    fill="white"
                    stroke={color}
                    strokeWidth={isHighlighted ? 3 : 2}
                  />
                )}
                <text
                  x={pos.x + 60}
                  y={pos.y + 30}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={500}
                  fill="#111827"
                >
                  {node.label.length > 12 ? node.label.slice(0, 12) + '...' : node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default FlowDiagram;
