/**
 * Node Handler Types
 */

import type { FlowExecutionNode, NodeResult, FlowExecutionConfig, ServiceRegistry } from '../types';

/**
 * Node execution context
 */
export interface NodeExecutionContext {
  node: FlowExecutionNode;
  variables: VariableManager;
  services: ServiceRegistry;
  logger: ExecutionLogger;
  config: FlowExecutionConfig;
  executionId: string;
  stepNumber: number;
}

/**
 * Variable manager interface
 */
export interface VariableManager {
  get(name: string): unknown;
  set(name: string, value: unknown): void;
  resolve(value: string | unknown): unknown;
  getAll(): Record<string, unknown>;
  snapshot(): Record<string, unknown>;
  restore(snapshot: Record<string, unknown>): void;
  createScope(parent?: VariableManager): VariableManager;
}

/**
 * Execution logger interface
 */
export interface ExecutionLogger {
  logExecution(executionId: string, data: unknown): void;
  logStep(executionId: string, step: ExecutionStepLog): void;
  getExecutionLogs(executionId: string): ExecutionStepLog[];
}

export interface ExecutionStepLog {
  executionId: string;
  stepNumber: number;
  nodeId: string;
  nodeType: string;
  state: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  duration?: number;
  timestamp: Date;
}

/**
 * Node handler interface
 */
export interface INodeHandler {
  readonly type: string;
  
  /**
   * Execute the node
   */
  execute(context: NodeExecutionContext): Promise<NodeResult>;
  
  /**
   * Validate node configuration
   */
  validate(node: FlowExecutionNode): HandlerValidationResult;
  
  /**
   * Get next node IDs based on execution result
   */
  getNextNodes(
    node: FlowExecutionNode,
    result: NodeResult,
    edges: { source: string; target: string; condition?: string }[]
  ): string[];
}

/**
 * Handler validation result
 */
export interface HandlerValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}
