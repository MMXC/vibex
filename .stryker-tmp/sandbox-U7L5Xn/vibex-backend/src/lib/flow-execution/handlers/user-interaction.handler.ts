/**
 * User Interaction Node Handler
 */
// @ts-nocheck


import { BaseHandler } from './base.handler';
import type { NodeExecutionContext } from './types';
import type { FlowExecutionNode, NodeResult } from '../types';

export class UserInteractionHandler extends BaseHandler {
  readonly type = 'user_interaction';
  
  protected async executeNode(context: NodeExecutionContext): Promise<{
    output?: Record<string, unknown>;
    nextNodeId?: string;
    wait?: { type: 'user_input'; prompt?: string };
  }> {
    const node = context.node;
    const config = (node as any).config || {};
    
    const prompt = config?.prompt || 'Please provide input';
    const inputType = config?.inputType || 'text';
    const options = config?.options || [];
    
    // Return wait state to prompt user
    return {
      output: { prompt, inputType, options },
      wait: { type: 'user_input', prompt },
    };
  }
  
  getNextNodes(
    node: FlowExecutionNode,
    result: NodeResult,
    edges: { source: string; target: string; condition?: string }[]
  ): string[] {
    return edges.filter(e => e.source === node.id).map(e => e.target);
  }
  
  validate(node: FlowExecutionNode): any {
    return { valid: true, errors: [] };
  }
}
