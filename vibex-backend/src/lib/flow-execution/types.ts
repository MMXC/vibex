/**
 * Flow Execution Types
 * Re-exports and extends types from prompts/flow-execution.ts
 */

import type {
  ExecutionMode,
  ExecutionStatus,
  NodeExecutionState,
  FlowExecutionContext,
  FlowExecutionConfig,
  ExecutionNode,
  ExecutionEdge,
  ExecutableFlow,
  ExecutionResult,
  ExecutionStep,
} from '../prompts/flow-execution';

export type {
  ExecutionMode,
  ExecutionStatus,
  NodeExecutionState,
  FlowExecutionContext,
  FlowExecutionConfig,
  ExecutionNode,
  ExecutionEdge,
  ExecutableFlow,
  ExecutionResult,
  ExecutionStep,
};

/**
 * Extended ExecutionResult with execution ID
 */
export interface FlowExecutionResult extends ExecutionResult {
  executionId: string;
  error?: string;
}

/**
 * Extended execution node with handler-specific config
 */
export interface FlowExecutionNode extends ExecutionNode {
  timeout?: number;
  onError?: 'continue' | 'stop' | 'retry';
  fallbackNodeId?: string;
  expectedDuration?: number;
  retryConfig?: RetryConfig;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoff?: 'fixed' | 'exponential';
}

/**
 * Node configuration for different node types
 */
export interface NodeConfig {
  // Action node
  actionType?: 'http_request' | 'script' | 'ai_call' | 'database';
  actionConfig?: Record<string, unknown>;
  
  // Decision node
  conditions?: Array<{
    expression: string;
    targetNodeId: string;
  }>;
  defaultTarget?: string;
  
  // API Call node
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  
  // Parallel node
  branches?: string[][];
  joinType?: 'all' | 'any' | 'race';
  
  // Wait node
  duration?: number;
  until?: string;
  
  // User Interaction node
  prompt?: string;
  inputType?: 'text' | 'select' | 'multiselect' | 'file';
  options?: string[];
  
  // Subflow node
  subflowId?: string;
  inputMapping?: Record<string, string>;
  outputMapping?: Record<string, string>;
  
  // Transform node
  transformExpression?: string;
  
  // Loop node
  arrayVariable?: string;
  iterationVariable?: string;
  bodyNodes?: string[];
}

/**
 * Execution mode type
 */
export type ExecutionModeType = 'live' | 'simulation' | 'planning' | 'debug';

/**
 * Service registry for external services
 */
export interface ServiceRegistry {
  http: {
    request: (url: string, options: RequestOptions) => Promise<Response>;
  };
  database: {
    query: (sql: string, params?: unknown[]) => Promise<unknown>;
  };
  ai: {
    generate: (prompt: string, options?: AIOptions) => Promise<string>;
  };
  storage: {
    get: (key: string) => Promise<unknown>;
    set: (key: string, value: unknown) => Promise<void>;
  };
}

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface AIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Code generation options
 */
export interface FlowCodeGenOptions {
  language: 'typescript' | 'javascript' | 'python' | 'java';
  framework?: 'express' | 'fastapi' | 'spring' | 'none';
  includeTests?: boolean;
  includeComments?: boolean;
}

/**
 * Node execution result
 * Used by node handlers to return execution outcome
 */
export interface NodeResult {
  success: boolean;
  output?: Record<string, unknown>;
  nextNodeId?: string;
  error?: string;
}

/**
 * Simulation result
 */
export interface SimulationResult {
  mode: string;
  paths: ExecutionPath[];
  variables: Record<string, unknown>;
  estimatedDuration: number;
  potentialErrors: Array<{ nodeId: string; error: string }>;
}

export interface ExecutionPath {
  pathId: string;
  description: string;
  nodes: string[];
  conditions: string[];
  isMainPath: boolean;
  probability?: number;
}
