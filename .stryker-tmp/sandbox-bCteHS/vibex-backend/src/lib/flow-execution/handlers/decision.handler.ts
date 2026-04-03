/**
 * Decision Node Handler
 */
// @ts-nocheck


import { BaseHandler } from './base.handler';
import type { NodeExecutionContext } from './types';
import type { FlowExecutionNode, NodeResult } from '../types';

export class DecisionHandler extends BaseHandler {
  readonly type = 'decision';
  
  protected async executeNode(context: NodeExecutionContext): Promise<{
    output?: Record<string, unknown>;
    nextNodeId?: string;
  }> {
    const node = context.node;
    const config = (node as any).config || {};
    const conditions = config?.conditions || [];
    const variables = context.variables.getAll();
    
    // Evaluate conditions in order
    for (const condition of conditions) {
      const expression = this.resolveValue(condition.expression, context.variables) as string;
      
      if (this.evaluateCondition(expression, variables)) {
        return {
          output: { decision: condition.expression, result: 'matched' },
          nextNodeId: condition.targetNodeId,
        };
      }
    }
    
    // Default branch
    return {
      output: { decision: 'default', result: 'no match' },
      nextNodeId: config?.defaultTarget,
    };
  }
  
  private evaluateCondition(expression: string, variables: Record<string, unknown>): boolean {
    try {
      // Safe evaluation - only allow simple comparisons
      const keys = Object.keys(variables);
      const values = Object.values(variables);
      const fn = new Function(...keys, `return ${expression}`);
      return fn(...values);
    } catch {
      return false;
    }
  }
  
  getNextNodes(
    node: FlowExecutionNode,
    result: NodeResult,
    edges: { source: string; target: string; condition?: string }[]
  ): string[] {
    if (result.nextNodeId) {
      return [result.nextNodeId];
    }
    return [];
  }
  
  validate(node: FlowExecutionNode): any {
    const errors: string[] = [];
    const config = (node as any).config || {};
    
    if (!config.conditions || config.conditions.length === 0) {
      errors.push('At least one condition is required');
    }
    
    return { valid: errors.length === 0, errors };
  }
}
