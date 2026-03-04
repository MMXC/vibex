/**
 * API Call Node Handler
 */

import { BaseHandler } from './base.handler';
import type { NodeExecutionContext } from './types';
import type { FlowExecutionNode } from '../types';

export class ApiCallHandler extends BaseHandler {
  readonly type = 'api_call';
  
  protected async executeNode(context: NodeExecutionContext): Promise<{
    output?: Record<string, unknown>;
    nextNodeId?: string;
  }> {
    const node = context.node;
    const config = (node as any).config || {};
    
    const url = this.resolveValue(config?.url, context.variables) as string;
    const method = config?.method || 'GET';
    const headers = (config?.headers || {}) as Record<string, string>;
    const body = config?.body ? this.resolveValue(config.body, context.variables) : undefined;
    
    try {
      const response = await context.services.http.request(url, {
        method,
        headers,
        body,
      });
      
      let data: unknown;
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      return {
        output: { 
          data, 
          status: response.status,
          ok: response.ok,
        },
      };
    } catch (error) {
      throw new Error(`API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  validate(node: FlowExecutionNode): any {
    const errors: string[] = [];
    const config = (node as any).config || {};
    
    if (!config?.url) {
      errors.push('URL is required');
    }
    
    return { valid: errors.length === 0, errors };
  }
}
