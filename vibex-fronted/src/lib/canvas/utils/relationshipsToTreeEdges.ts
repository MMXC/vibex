/**
 * relationshipsToTreeEdges.ts — E3-F13: Convert flow/component relationships to ReactFlow edges
 *
 * Reuses the RelationshipEdge component for Flow and Component tree relationship visualization.
 * 
 * Style mapping:
 * - sequence/conditional → solid line
 * - parallel/async → dashed line
 * - calls/includes/references → dotted line
 */

import { MarkerType } from '@xyflow/react';
import type { Edge } from '@xyflow/react';
import type { FlowRelationship, ComponentRelationship } from '@/lib/canvas/types';
import { getRelationshipStyle } from './inferRelationships';

/** E3-F13: Flow relationship edge data */
export interface FlowRelationshipEdgeData extends Record<string, unknown> {
  relationshipType: FlowRelationship['type'];
  label?: string;
  treeType: 'flow';
}

/** E3-F13: Component relationship edge data */
export interface ComponentRelationshipEdgeData extends Record<string, unknown> {
  relationshipType: ComponentRelationship['type'];
  label?: string;
  treeType: 'component';
}

// =============================================================================
// Flow Relationships → Edges
// =============================================================================

/**
 * Convert flow relationships to ReactFlow edges.
 * Maps flow relationship types to visual styles:
 * - sequence: solid blue
 * - parallel: dashed blue  
 * - conditional: dotted blue
 */
export function flowRelationshipsToEdges(
  relationships: FlowRelationship[],
  existingNodeIds: Set<string>
): Edge[] {
  return relationships
    .filter((rel) => {
      // Only create edge if both source and target nodes exist
      const srcOk = !rel.sourceId || existingNodeIds.has(rel.sourceId);
      const tgtOk = existingNodeIds.has(rel.targetId);
      return srcOk && tgtOk;
    })
    .map((rel, idx) => {
      const style = getFlowRelationshipStyle(rel.type);
      return {
        id: `flow-rel-${idx}`,
        source: rel.sourceId ?? '',
        target: rel.targetId,
        type: 'relationshipEdge',
        data: {
          relationshipType: rel.type,
          label: rel.label,
          treeType: 'flow',
        } as FlowRelationshipEdgeData,
        markerEnd: { type: MarkerType.ArrowClosed },
        style,
        label: rel.label,
      };
    });
}

/** Style for flow relationship edges */
function getFlowRelationshipStyle(type: FlowRelationship['type']): {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
} {
  const base = { stroke: '#3b82f6', strokeWidth: 1.5 };
  switch (type) {
    case 'sequence': return { ...base };
    case 'parallel': return { ...base, strokeDasharray: '5,3' };
    case 'conditional': return { ...base, strokeDasharray: '3,3' };
    default: return base;
  }
}

// =============================================================================
// Component Relationships → Edges
// =============================================================================

/**
 * Convert component relationships to ReactFlow edges.
 * Maps component relationship types to visual styles:
 * - calls: dashed orange
 * - includes: solid green
 * - references: dotted gray
 */
export function componentRelationshipsToEdges(
  relationships: ComponentRelationship[],
  existingNodeIds: Set<string>
): Edge[] {
  return relationships
    .filter((rel) => {
      const srcOk = !rel.sourceId || existingNodeIds.has(rel.sourceId);
      const tgtOk = existingNodeIds.has(rel.targetId);
      return srcOk && tgtOk;
    })
    .map((rel, idx) => {
      const style = getComponentRelationshipStyle(rel.type);
      return {
        id: `comp-rel-${idx}`,
        source: rel.sourceId ?? '',
        target: rel.targetId,
        type: 'relationshipEdge',
        data: {
          relationshipType: rel.type,
          label: rel.label,
          treeType: 'component',
        } as ComponentRelationshipEdgeData,
        markerEnd: { type: MarkerType.ArrowClosed },
        style,
        label: rel.label,
      };
    });
}

/** Style for component relationship edges */
function getComponentRelationshipStyle(type: ComponentRelationship['type']): {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
} {
  switch (type) {
    case 'includes': return { stroke: '#10b981', strokeWidth: 2 };
    case 'calls': return { stroke: '#f59e0b', strokeWidth: 1.5, strokeDasharray: '5,3' };
    case 'references': return { stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '2,4' };
    default: return { stroke: '#94a3b8', strokeWidth: 1 };
  }
}
