/**
 * Wait Node Handler
 */
// @ts-nocheck


import { BaseHandler } from './base.handler';
import type { NodeExecutionContext } from './types';
import type { FlowExecutionNode, NodeResult } from '../types';

export class WaitHandler extends BaseHandler {
  readonly type = 'wait';
  
  protected async executeNode(context: NodeExecutionContext): Promise<{
    output?: Record<string, unknown>;
    nextNodeId?: string;
    wait?: { type: 'time'; duration?: number };
  }> {
    const node = context.node;
    const config = (node as any).config || {};
    const duration = config?.duration || 1000;
    const until = config?.until;
    
    if (until) {
      // Wait until specific time
      const targetTime = new Date(until).getTime();
      const waitTime = Math.max(0, targetTime - Date.now());
      
      return {
        output: { waited: true, until },
        wait: { type: 'time', duration: waitTime },
      };
    }
    
    // Wait for specified duration
    return {
      output: { waited: true, duration },
      wait: { type: 'time', duration },
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
    const errors: string[] = [];
    const config = (node as any).config || {};
    
    if (!config?.duration && !config?.until) {
      errors.push('Either duration or until is required');
    }
    
    return { valid: errors.length === 0, errors };
  }
}
