/**
 * Parallel Node Handler
 */

import { BaseHandler } from './base.handler';
import type { NodeExecutionContext } from './types';
import type { FlowExecutionNode, NodeResult } from '../types';

export class ParallelHandler extends BaseHandler {
  readonly type = 'parallel';
  
  protected async executeNode(context: NodeExecutionContext): Promise<{
    output?: Record<string, unknown>;
    nextNodeId?: string;
  }> {
    const node = context.node;
    const config = (node as any).config || {};
    const branches = config?.branches || [];
    const joinType = config?.joinType || 'all';
    
    // Execute branches in parallel (placeholder - actual execution managed by scheduler)
    return {
      output: {
        branches: branches.length,
        joinType,
        executed: true,
      },
    };
  }
  
  getNextNodes(
    node: FlowExecutionNode,
    result: NodeResult,
    edges: { source: string; target: string; condition?: string }[]
  ): string[] {
    // After parallel execution completes, continue to join node
    return edges.filter(e => e.source === node.id).map(e => e.target);
  }
  
  validate(node: FlowExecutionNode): any {
    const errors: string[] = [];
    const config = (node as any).config || {};
    
    if (!config?.branches || config.branches.length === 0) {
      errors.push('At least one branch is required');
    }
    
    return { valid: errors.length === 0, errors };
  }
}
