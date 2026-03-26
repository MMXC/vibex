/**
 * inferRelationships.ts — 领域关系推算引擎
 *
 * 根据上下文节点名称和类型，推算领域之间的关系。
 * ADR-002: 使用前端规则推算（后端 API 作为扩展）
 *
 * Epic 1: vibex-three-trees-enhancement-20260326
 */
import { MarkerType } from '@xyflow/react';
import type { BoundedContextNode, ContextRelationship } from '@/lib/canvas/types';
import type { Edge } from '@xyflow/react';

// Re-export for consumers
export type { ContextRelationship } from '@/lib/canvas/types';

/** Relationship inference result (with sourceId for edge creation) */
export interface InferredRelationship {
  sourceId: string;
  targetId: string;
  type: ContextRelationship['type'];
  label?: string;
}

// =============================================================================
// Keyword → Type Mapping
// =============================================================================

const KEYWORD_MAP: Array<{
  keywords: string[];
  type: ContextRelationship['type'];
  label: string;
}> = [
  { keywords: ['依赖', '用到', '使用', '需要', '下游', 'service'], type: 'dependency', label: '依赖' },
  { keywords: ['聚合', '根', 'aggregate', '包含', '持有'], type: 'aggregate', label: '聚合' },
  { keywords: ['调用', '消费', '事件', 'publish', 'subscribe', '集成'], type: 'calls', label: '调用' },
];

// =============================================================================
// Inference Rules
// =============================================================================

function inferRelation(a: BoundedContextNode, b: BoundedContextNode): InferredRelationship | null {
  const nameA = a.name.toLowerCase();
  const nameB = b.name.toLowerCase();

  for (const { keywords, type, label } of KEYWORD_MAP) {
    if (keywords.some((kw) => nameA.includes(kw))) {
      return { sourceId: a.nodeId, targetId: b.nodeId, type, label };
    }
    if (keywords.some((kw) => nameB.includes(kw))) {
      return { sourceId: b.nodeId, targetId: a.nodeId, type, label };
    }
  }

  if (a.type === 'generic' && b.type === 'core') {
    return { sourceId: a.nodeId, targetId: b.nodeId, type: 'dependency', label: '支撑核心' };
  }
  if (b.type === 'generic' && a.type === 'core') {
    return { sourceId: b.nodeId, targetId: a.nodeId, type: 'dependency', label: '支撑核心' };
  }
  if (a.type === 'supporting' && b.type === 'core') {
    return { sourceId: a.nodeId, targetId: b.nodeId, type: 'dependency', label: '支撑核心' };
  }
  if (b.type === 'supporting' && a.type === 'core') {
    return { sourceId: b.nodeId, targetId: a.nodeId, type: 'dependency', label: '支撑核心' };
  }
  if (a.type === 'core' && b.type === 'core') {
    return { sourceId: a.nodeId, targetId: b.nodeId, type: 'calls', label: '业务调用' };
  }
  if (a.type === 'core' && b.type === 'supporting') {
    return { sourceId: a.nodeId, targetId: b.nodeId, type: 'calls', label: '服务调用' };
  }
  if (b.type === 'core' && a.type === 'supporting') {
    return { sourceId: b.nodeId, targetId: a.nodeId, type: 'calls', label: '服务调用' };
  }

  return null;
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Infer all relationships from bounded context nodes.
 */
export function inferRelationships(nodes: BoundedContextNode[]): InferredRelationship[] {
  if (nodes.length < 2) return [];

  const results: InferredRelationship[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const rel = inferRelation(nodes[i], nodes[j]);
      if (rel) results.push(rel);
    }
  }
  return results;
}

/**
 * Convert inferred relationships to ReactFlow Edge objects.
 * Uses nodeId as source/target identifiers.
 */
export function relationshipsToEdges(relationships: InferredRelationship[]): Edge[] {
  return relationships.map((rel, idx) => {
    const style = getRelationshipStyle(rel.type);
    return {
      id: `rel-${idx}`,
      source: rel.sourceId,
      target: rel.targetId,
      type: 'relationshipEdge',
      data: { relationshipType: rel.type, label: rel.label },
      markerEnd: { type: MarkerType.ArrowClosed },
      style,
      label: rel.label,
    };
  });
}

// =============================================================================
// Style Helpers
// =============================================================================

const EDGE_STYLE_MAP: Record<ContextRelationship['type'], { stroke: string; strokeWidth: number; strokeDasharray?: string }> = {
  dependency: { stroke: '#94a3b8', strokeWidth: 1.5 },
  aggregate: { stroke: '#6366f1', strokeWidth: 2.5 },
  calls: { stroke: '#f59e0b', strokeWidth: 1.5, strokeDasharray: '5,3' },
};

const _EDGE_LABEL_MAP: Record<ContextRelationship['type'], string> = {
  dependency: '依赖',
  aggregate: '聚合',
  calls: '调用',
};

export function getRelationshipStyle(type: ContextRelationship['type']): {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
} {
  return EDGE_STYLE_MAP[type] ?? EDGE_STYLE_MAP.dependency;
}
