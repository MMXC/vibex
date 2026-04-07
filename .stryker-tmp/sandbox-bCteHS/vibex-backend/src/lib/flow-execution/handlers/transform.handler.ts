/**
 * Transform Node Handler
 */
// @ts-nocheck


import { BaseHandler } from './base.handler';
import type { NodeExecutionContext } from './types';
import type { FlowExecutionNode } from '../types';

export class TransformHandler extends BaseHandler {
  readonly type = 'transform';
  
  protected async executeNode(context: NodeExecutionContext): Promise<{
    output?: Record<string, unknown>;
    nextNodeId?: string;
  }> {
    const node = context.node;
    const config = (node as any).config || {};
    const transformExpression = config?.transformExpression;
    
    if (!transformExpression) {
      throw new Error('transformExpression is required');
    }
    
    const variables = context.variables.getAll();
    const keys = Object.keys(variables);
    const values = Object.values(variables);
    
    try {
      // Execute transformation
      const fn = new Function(...keys, `return ${transformExpression}`);
      const result = fn(...values);
      
      return {
        output: { transformed: result },
      };
    } catch (error) {
      throw new Error(`Transform failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  validate(node: FlowExecutionNode): any {
    const errors: string[] = [];
    const config = (node as any).config || {};
    
    if (!config?.transformExpression) {
      errors.push('transformExpression is required');
    }
    
    return { valid: errors.length === 0, errors };
  }
}
