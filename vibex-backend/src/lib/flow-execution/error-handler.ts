/**
 * Error Handler Manager
 */

import type { ExecutionResult } from './types';

export class ErrorHandlerManager {
  private errors: Map<string, any[]> = new Map();
  
  handleError(executionId: string, error: unknown, nodeId?: string): void {
    const executionErrors = this.errors.get(executionId) || [];
    executionErrors.push({
      nodeId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    });
    this.errors.set(executionId, executionErrors);
  }
  
  getErrors(executionId: string): any[] {
    return this.errors.get(executionId) || [];
  }
  
  clearErrors(executionId: string): void {
    this.errors.delete(executionId);
  }
  
  createErrorResult(executionId: string, error: unknown): ExecutionResult {
    return {
      success: false,
      executedNodes: [],
      skippedNodes: [],
      failedNodes: [],
      pathsTaken: [],
      variables: {},
      errors: [{ nodeId: executionId, error: error instanceof Error ? error.message : 'Unknown error', recoverable: false }],
      steps: [],
    };
  }
}
