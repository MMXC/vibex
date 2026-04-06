/**
 * Execution Logger
 */

import type { ExecutionLogger as IExecutionLogger, ExecutionStepLog } from './handlers/types';

import { devLog } from '@/lib/log-sanitizer';

export class ExecutionLogger implements IExecutionLogger {
  private executionLogs: Map<string, ExecutionStepLog[]> = new Map();
  
  logExecution(executionId: string, data: unknown): void {
    devLog(`[Execution ${executionId}]`, data);
  }
  
  logStep(executionId: string, step: ExecutionStepLog): void {
    let logs = this.executionLogs.get(executionId);
    if (!logs) {
      logs = [];
      this.executionLogs.set(executionId, logs);
    }
    logs.push(step);
  }
  
  getExecutionLogs(executionId: string): ExecutionStepLog[] {
    return this.executionLogs.get(executionId) || [];
  }
  
  clearExecution(executionId: string): void {
    this.executionLogs.delete(executionId);
  }
  
  getStepCount(executionId: string): number {
    return this.getExecutionLogs(executionId).length;
  }
  
  getFailedSteps(executionId: string): ExecutionStepLog[] {
    return this.getExecutionLogs(executionId).filter(s => s.state === 'failed');
  }
}
