/**
 * Domain Model Diagram Component
 * 领域模型图展示：实体关系图渲染、缩放、拖拽
 */

'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import styles from './DomainModelDiagram.module.css';

export interface DomainEntity {
  id: string;
  name: string;
  type: 'aggregate' | 'entity' | 'value-object' | 'domain-event';
  attributes: Array<{ name: string; type: string }>;
}

export interface Relationship {
  sourceId: string;
  targetId: string;
  type: string;
  label?: string;
}

export interface DomainModelDiagramProps {
  entities: DomainEntity[];
  relationships?: Relationship[];
  width?: number;
  height?: number;
  onEntityClick?: (entityId: string) => void;
}

export function DomainModelDiagram({
  entities = [],
  relationships = [],
  width = 800,
  height = 600,
  onEntityClick,
}: DomainModelDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

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

  // Entity click handler
  const handleEntityClick = useCallback((entityId: string) => {
    setSelectedEntity(entityId);
    onEntityClick?.(entityId);
  }, [onEntityClick]);

  // Get entity color by type
  const getEntityColor = (type: string) => {
    const colors: Record<string, string> = {
      aggregate: '#3b82f6',
      entity: '#10b981',
      'value-object': '#f59e0b',
      'domain-event': '#ef4444',
    };
    return colors[type] || '#6b7280';
  };

  // Calculate entity positions (simple grid layout)
  const getEntityPositions = useCallback(() => {
    const cols = Math.ceil(Math.sqrt(entities.length));
    return entities.map((entity, index) => ({
      id: entity.id,
      x: 150 + (index % cols) * 200,
      y: 100 + Math.floor(index / cols) * 150,
    }));
  }, [entities]);

  const positions = getEntityPositions();

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.toolButton}
          onClick={handleZoomIn}
          title="放大"
        >
          +
        </button>
        <span className={styles.scaleLabel}>{Math.round(scale * 100)}%</span>
        <button
          type="button"
          className={styles.toolButton}
          onClick={handleZoomOut}
          title="缩小"
        >
          -
        </button>
        <button
          type="button"
          className={styles.toolButton}
          onClick={handleZoomReset}
          title="重置"
        >
          ⟲
        </button>
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
        <svg
          className={styles.svg}
          viewBox={`0 0 ${width} ${height}`}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
        >
          {/* Relationships */}
          {relationships.map((rel, index) => {
            const source = positions.find((p) => p.id === rel.sourceId);
            const target = positions.find((p) => p.id === rel.targetId);
            if (!source || !target) return null;

            return (
              <line
                key={`rel-${index}`}
                x1={source.x + 75}
                y1={source.y + 30}
                x2={target.x + 75}
                y2={target.y + 30}
                stroke="#9ca3af"
                strokeWidth={2}
                strokeDasharray={rel.type === 'dependency' ? '5,5' : undefined}
              />
            );
          })}

          {/* Entities */}
          {entities.map((entity) => {
            const pos = positions.find((p) => p.id === entity.id);
            if (!pos) return null;

            return (
              <g
                key={entity.id}
                className={`${styles.entity} ${selectedEntity === entity.id ? styles.selected : ''}`}
                onClick={() => handleEntityClick(entity.id)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={150}
                  height={60}
                  rx={8}
                  fill="white"
                  stroke={getEntityColor(entity.type)}
                  strokeWidth={selectedEntity === entity.id ? 3 : 2}
                />
                <text
                  x={pos.x + 75}
                  y={pos.y + 25}
                  textAnchor="middle"
                  fontSize={14}
                  fontWeight={600}
                  fill="#111827"
                >
                  {entity.name}
                </text>
                <text
                  x={pos.x + 75}
                  y={pos.y + 45}
                  textAnchor="middle"
                  fontSize={11}
                  fill={getEntityColor(entity.type)}
                >
                  {entity.type}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default DomainModelDiagram;
