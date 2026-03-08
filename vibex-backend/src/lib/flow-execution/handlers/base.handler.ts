/**
 * Base Node Handler
 */

import type { INodeHandler, NodeExecutionContext, HandlerValidationResult } from './types';
import type { FlowExecutionNode, NodeResult } from '../types';

export abstract class BaseHandler implements INodeHandler {
  abstract readonly type: string;
  
  async execute(context: NodeExecutionContext): Promise<NodeResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.executeNode(context);
      const duration = Date.now() - startTime;
      
      // Log execution
      context.logger.logStep(context.executionId, {
        executionId: context.executionId,
        stepNumber: context.stepNumber,
        nodeId: context.node.id,
        nodeType: context.node.type,
        state: result.success ? 'completed' : 'failed',
        input: this.extractInput(context),
        output: result.output,
        error: result.error,
        duration,
        timestamp: new Date(),
      });
      
      return {
        success: true,
        output: result.output,
        nextNodeId: result.nextNodeId,
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      context.logger.logStep(context.executionId, {
        executionId: context.executionId,
        stepNumber: context.stepNumber,
        nodeId: context.node.id,
        nodeType: context.node.type,
        state: 'failed',
        input: this.extractInput(context),
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp: new Date(),
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Execute the node logic - to be implemented by subclasses
   */
  protected abstract executeNode(context: NodeExecutionContext): Promise<{
    output?: Record<string, unknown>;
    nextNodeId?: string;
  }>;
  
  /**
   * Validate node configuration
   */
  validate(node: FlowExecutionNode): HandlerValidationResult {
    return { valid: true, errors: [], warnings: [] };
  }
  
  /**
   * Get next nodes based on result
   */
  getNextNodes(
    node: FlowExecutionNode,
    result: NodeResult,
    edges: { source: string; target: string; condition?: string }[]
  ): string[] {
    return edges
      .filter(e => e.source === node.id)
      .map(e => e.target);
  }
  
  /**
   * Extract input variables for logging
   */
  protected extractInput(context: NodeExecutionContext): Record<string, unknown> {
    const inputVars = context.node.inputVariables || [];
    const input: Record<string, unknown> = {};
    
    for (const varName of inputVars) {
      input[varName] = context.variables.get(varName);
    }
    
    return input;
  }
  
  /**
   * Resolve a value that may contain variable references
   */
  protected resolveValue(value: unknown, variables: VariableManager): unknown {
    if (typeof value === 'string') {
      // Handle variable references like ${variableName}
      const matches = value.match(/\$\{(\w+)\}/g);
      if (matches) {
        let resolved = value;
        for (const match of matches) {
          const varName = match.slice(2, -1);
          const varValue = variables.get(varName);
          resolved = resolved.replace(match, String(varValue ?? ''));
        }
        return resolved;
      }
      return value;
    }
    
    if (Array.isArray(value)) {
      return value.map(v => this.resolveValue(v, variables));
    }
    
    if (value && typeof value === 'object') {
      const resolved: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        resolved[key] = this.resolveValue(val, variables);
      }
      return resolved;
    }
    
    return value;
  }
}
