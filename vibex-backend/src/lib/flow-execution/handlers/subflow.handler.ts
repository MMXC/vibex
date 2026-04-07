/**
 * Subflow Node Handler
 */

import { BaseHandler } from './base.handler';
import type { NodeExecutionContext } from './types';
import type { FlowExecutionNode } from '../types';

export class SubflowHandler extends BaseHandler {
  readonly type = 'subflow';
  
  protected async executeNode(context: NodeExecutionContext): Promise<{
    output?: Record<string, unknown>;
    nextNodeId?: string;
  }> {
    const node = context.node;
    const config = (node as any).config || {};
    const subflowId = config?.subflowId;
    const inputMapping = config?.inputMapping || {};
    const outputMapping = config?.outputMapping || {};
    
    if (!subflowId) {
      throw new Error('subflowId is required');
    }
    
    // Map input variables to subflow
    const subflowInput: Record<string, unknown> = {};
    for (const [targetVar, sourceVar] of Object.entries(inputMapping)) {
      subflowInput[targetVar] = context.variables.get(sourceVar);
    }
    
    // Execute subflow (placeholder - actual execution would call the engine)
    return {
      output: {
        subflowId,
        executed: true,
        input: subflowInput,
      },
    };
  }
  
  validate(node: FlowExecutionNode): any {
    const errors: string[] = [];
    const config = (node as any).config || {};
    
    if (!config?.subflowId) {
      errors.push('subflowId is required');
    }
    
    return { valid: errors.length === 0, errors };
  }
}
