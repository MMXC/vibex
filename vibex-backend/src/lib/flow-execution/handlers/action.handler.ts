/**
 * Action Node Handler
 * Handles HTTP requests, scripts, AI calls, and database operations
 */

import { BaseHandler } from './base.handler';
import type { NodeExecutionContext } from './types';
import type { FlowExecutionNode } from '../types';

export class ActionHandler extends BaseHandler {
  readonly type = 'action';
  
  protected async executeNode(context: NodeExecutionContext): Promise<{
    output?: Record<string, unknown>;
    nextNodeId?: string;
  }> {
    const node = context.node;
    const config = (node as any).config || {};
    const actionType = config?.actionType || 'script';
    
    switch (actionType) {
      case 'http_request':
        return this.handleHttpRequest(context, config);
      case 'script':
        return this.handleScript(context, config);
      case 'ai_call':
        return this.handleAICall(context, config);
      case 'database':
        return this.handleDatabase(context, config);
      default:
        return { output: { message: 'Unknown action type' } };
    }
  }
  
  private async handleHttpRequest(
    context: NodeExecutionContext,
    config: any
  ): Promise<{ output?: Record<string, unknown>; nextNodeId?: string }> {
    const { url, method = 'GET', headers = {}, body } = config;
    
    const resolvedUrl = this.resolveValue(url, context.variables) as string;
    const resolvedBody = body ? this.resolveValue(body, context.variables) : undefined;
    
    try {
      const response = await context.services.http.request(resolvedUrl, {
        method,
        headers,
        body: resolvedBody,
      });
      
      const data = await response.json();
      
      return {
        output: { response: data, status: response.status },
      };
    } catch (error) {
      throw new Error(`HTTP request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private async handleScript(
    context: NodeExecutionContext,
    config: any
  ): Promise<{ output?: Record<string, unknown>; nextNodeId?: string }> {
    const script = config?.script;
    if (!script) {
      throw new Error('Script is required for action node');
    }
    
    try {
      const variables = context.variables.getAll();
      const keys = Object.keys(variables);
      const values = Object.values(variables);
      const fn = new Function(...keys, script);
      const result = fn(...values);
      
      return { output: { result } };
    } catch (error) {
      throw new Error(`Script execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private async handleAICall(
    context: NodeExecutionContext,
    config: any
  ): Promise<{ output?: Record<string, unknown>; nextNodeId?: string }> {
    const prompt = config?.prompt;
    if (!prompt) {
      throw new Error('Prompt is required for AI call');
    }
    
    const resolvedPrompt = this.resolveValue(prompt, context.variables) as string;
    
    try {
      const result = await context.services.ai.generate(resolvedPrompt, {
        model: config?.model,
        temperature: config?.temperature,
        maxTokens: config?.maxTokens,
      });
      
      return { output: { result } };
    } catch (error) {
      throw new Error(`AI call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private async handleDatabase(
    context: NodeExecutionContext,
    config: any
  ): Promise<{ output?: Record<string, unknown>; nextNodeId?: string }> {
    const sql = config?.sql;
    if (!sql) {
      throw new Error('SQL is required for database action');
    }
    
    const resolvedSql = this.resolveValue(sql, context.variables) as string;
    const params = config?.params || [];
    
    try {
      const result = await context.services.database.query(resolvedSql, params);
      return { output: { result } };
    } catch (error) {
      throw new Error(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  validate(node: FlowExecutionNode): any {
    const errors: string[] = [];
    const config = node.config || {};
    
    if (!config.actionType) {
      errors.push('actionType is required');
    }
    
    return { valid: errors.length === 0, errors };
  }
}
