/**
 * End Node Handler
 */
// @ts-nocheck


import { BaseHandler } from './base.handler';
import type { NodeExecutionContext } from './types';
import type { NodeResult } from '../types';

export class EndHandler extends BaseHandler {
  readonly type = 'end';
  
  protected async executeNode(context: NodeExecutionContext): Promise<{
    output?: Record<string, unknown>;
    nextNodeId?: string;
  }> {
    return {
      output: {
        completedAt: new Date().toISOString(),
        finalVariables: context.variables.getAll(),
      },
    };
  }
}
