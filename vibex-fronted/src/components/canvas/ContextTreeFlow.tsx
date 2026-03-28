/**
 * ContextTreeFlow — 限界上下文树 + 领域关系连线渲染组件
 *
 * Epic 1: vibex-three-trees-enhancement-20260326
 * Spec:  docs/vibex-three-trees-enhancement-20260326/specs/context-tree-relationships.md
 *
 * 功能：
 * - 将 BoundedContextNode[] 转换为 CardTreeVisualizationRaw
 * - 通过 inferRelationships 推理领域关系
 * - 通过 relationshipsToEdges 生成 ReactFlow Edge[]
 * - 通过 RelationshipEdge 渲染带样式的连线
 */

'use client';

import React, { useMemo } from 'react';
import type { EdgeTypes } from '@xyflow/react';
import { CardTreeRenderer } from '@/components/visualization/CardTreeRenderer/CardTreeRenderer';
import { RelationshipEdge } from '@/components/canvas/edges/RelationshipEdge';
import { inferRelationships, relationshipsToEdges } from '@/lib/canvas/utils/inferRelationships';
import type { CardTreeVisualizationRaw, CardTreeNodeData } from '@/types/visualization';
import type { BoundedContextNode, ContextRelationship } from '@/lib/canvas/types';

export interface ContextTreeFlowProps {
  /** Bounded context nodes from canvas store */
  contexts: BoundedContextNode[];
  /** Whether to show relationship edges */
  showRelationships?: boolean;
  /** Callback when a relationship edge is clicked */
  onRelationshipClick?: (sourceId: string, targetId: string, type: ContextRelationship['type']) => void;
  /** @deprecated Use onRelationshipClick */
  _onRelationshipClick?: (sourceId: string, targetId: string, type: ContextRelationship['type']) => void;
  /** Additional CardTreeRenderer props */
  cardTreeProps?: {
    showMinimap?: boolean;
    fitView?: boolean;
    showControls?: boolean;
    showBackground?: boolean;
    readonly?: boolean;
    expandedIds?: Set<string>;
    onToggleExpand?: (nodeId: string) => void;
    onCardClick?: (cardId: string) => void;
    className?: string;
  };
}

/**
 * Convert BoundedContextNode[] to CardTreeVisualizationRaw for CardTreeRenderer.
 * Uses nodeId as card title (id) for relationship edge matching.
 */
/** Map canvas NodeStatus to CardTreeNodeData status */
function mapStatus(status: BoundedContextNode['status']): CardTreeNodeData['status'] {
  const map: Record<BoundedContextNode['status'], CardTreeNodeData['status']> = {
    pending: 'pending',
    generating: 'in-progress',
    confirmed: 'done',
    error: 'error',
  };
  return map[status] ?? 'pending';
}

function contextsToCardTree(contexts: BoundedContextNode[]): CardTreeVisualizationRaw {
  const nodes: CardTreeNodeData[] = contexts.map((ctx) => ({
    title: ctx.nodeId, // nodeId used as card title for edge matching
    description: ctx.description,
    status: mapStatus(ctx.status),
    icon: ctx.type === 'core' ? '◆' : ctx.type === 'supporting' ? '◇' : ctx.type === 'generic' ? '○' : '◁',
    children: [
      // Each context becomes a card with type/description as children
      {
        id: `${ctx.nodeId}-type`,
        label: `类型: ${ctx.type === 'core' ? '核心域' : ctx.type === 'supporting' ? '支撑域' : ctx.type === 'generic' ? '通用域' : '外部域'}`,
        checked: ctx.confirmed,
        description: ctx.description,
      },
      {
        id: `${ctx.nodeId}-confirmed`,
        label: ctx.confirmed ? '已确认 ✓' : '待确认',
        checked: ctx.confirmed,
      },
    ],
    isExpanded: true,
    updatedAt: new Date().toISOString(),
  }));

  return { nodes };
}

export function ContextTreeFlow({
  contexts,
  showRelationships = true,
  _onRelationshipClick,
  cardTreeProps,
}: ContextTreeFlowProps) {
  // Convert contexts to CardTree visualization format
  const cardTreeData = useMemo(() => contextsToCardTree(contexts), [contexts]);

  // Infer relationships from contexts
  const relationships = useMemo(
    () => (showRelationships ? inferRelationships(contexts) : []),
    [contexts, showRelationships]
  );

  // Convert relationships to ReactFlow edges
  const relationshipEdges = useMemo(
    () => relationshipsToEdges(relationships),
    [relationships]
  );

  // Register RelationshipEdge as custom edge type
  const edgeTypes = useMemo(
    () =>
      ({
        relationshipEdge: RelationshipEdge,
      }) as EdgeTypes,
    []
  );

  if (contexts.length === 0) {
    return null;
  }

  return (
    <CardTreeRenderer
      data={cardTreeData}
      extraEdges={relationshipEdges}
      edgeTypes={edgeTypes}
      showMinimap={cardTreeProps?.showMinimap ?? true}
      fitView={cardTreeProps?.fitView ?? true}
      showControls={cardTreeProps?.showControls ?? true}
      showBackground={cardTreeProps?.showBackground ?? true}
      readonly={cardTreeProps?.readonly ?? true}
      expandedIds={cardTreeProps?.expandedIds}
      onToggleExpand={cardTreeProps?.onToggleExpand}
      onCardClick={cardTreeProps?.onCardClick}
      className={cardTreeProps?.className}
    />
  );
}
