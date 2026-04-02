/**
 * NodeState — Unified node state interface for all canvas trees
 *
 * Used as a reference/contract for all three tree node types:
 * - BoundedContextNode
 * - BusinessFlowNode
 * - ComponentNode
 *
 * This type defines the common fields that all canvas nodes share,
 * enabling unified JSON persistence schema design.
 *
 * E1-S1: Unified NodeState interface
 */
export type NodeStatus = 'idle' | 'pending' | 'confirmed' | 'error' | 'generating';

export interface NodeState {
  nodeId: string;
  name: string;
  type: 'context' | 'flow' | 'component';
  status: NodeStatus;
  selected: boolean;
  version: number;
  parentId?: string;
  children?: string[];
  isActive?: boolean;
}
