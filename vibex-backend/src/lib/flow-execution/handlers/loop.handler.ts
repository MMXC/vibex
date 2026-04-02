/**
 * Loop Node Handler
 */

import { BaseHandler } from './base.handler';
import type { NodeExecutionContext } from './types';
import type { FlowExecutionNode, NodeResult } from '../types';

export class LoopHandler extends BaseHandler {
  readonly type = 'loop';
  
  protected async executeNode(context: NodeExecutionContext): Promise<{
    output?: Record<string, unknown>;
    nextNodeId?: string;
  }> {
    const node = context.node;
    const config = (node as any).config || {};
    
    const arrayVariable = config?.arrayVariable;
    const iterationVariable = config?.iterationVariable || 'item';
    
    if (!arrayVariable) {
      throw new Error('arrayVariable is required');
    }
    
    const array = context.variables.get(arrayVariable) as unknown[];
    
    if (!Array.isArray(array)) {
      throw new Error(`Variable ${arrayVariable} is not an array`);
    }
    
    // Execute loop body for each item (actual loop execution managed by scheduler)
    return {
      output: {
        loop: true,
        arrayLength: array.length,
        iterationVariable,
      },
    };
  }
  
  getNextNodes(
    node: FlowExecutionNode,
    result: NodeResult,
    edges: { source: string; target: string; condition?: string }[]
  ): string[] {
    // After loop body, return to loop start for next iteration
    return edges.filter(e => e.source === node.id).map(e => e.target);
  }
  
  validate(node: FlowExecutionNode): any {
    const errors: string[] = [];
    const config = (node as any).config || {};
    
    if (!config?.arrayVariable) {
      errors.push('arrayVariable is required');
    }
    
    return { valid: errors.length === 0, errors };
  }
}
