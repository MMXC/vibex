/**
 * Start Node Handler
 */
// @ts-nocheck


import { BaseHandler } from './base.handler';
import type { NodeExecutionContext, VariableManager } from './types';
import type { NodeResult } from '../types';

export class StartHandler extends BaseHandler {
  readonly type = 'start';
  
  protected async executeNode(context: NodeExecutionContext): Promise<{
    output?: Record<string, unknown>;
    nextNodeId?: string;
  }> {
    // Initialize execution variables from input
    const config = context.config;
    if (config.input) {
      for (const [key, value] of Object.entries(config.input)) {
        context.variables.set(key, value);
      }
    }
    
    return {
      output: {
        executionId: context.executionId,
        startedAt: new Date().toISOString(),
      },
    };
  }
  
  validate(node: any): any {
    return { valid: true, errors: [] };
  }
}
