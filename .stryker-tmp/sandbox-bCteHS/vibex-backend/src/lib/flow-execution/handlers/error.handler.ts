/**
 * Error Handler Node
 */
// @ts-nocheck


import { BaseHandler } from './base.handler';
import type { NodeExecutionContext } from './types';
import type { FlowExecutionNode, NodeResult } from '../types';

export class ErrorHandlerNode extends BaseHandler {
  readonly type = 'error';
  
  protected async executeNode(context: NodeExecutionContext): Promise<{
    output?: Record<string, unknown>;
    nextNodeId?: string;
  }> {
    const node = context.node;
    const config = (node as any).config || {};
    
    return {
      output: {
        errorNode: true,
        message: config?.message || 'Error occurred',
      },
    };
  }
  
  getNextNodes(
    node: FlowExecutionNode,
    result: NodeResult,
    edges: { source: string; target: string; condition?: string }[]
  ): string[] {
    // Error handler typically continues to recovery flow
    return edges.filter(e => e.source === node.id).map(e => e.target);
  }
  
  validate(node: FlowExecutionNode): any {
    return { valid: true, errors: [] };
  }
}
