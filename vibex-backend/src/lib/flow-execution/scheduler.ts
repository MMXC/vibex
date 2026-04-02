/**
 * Execution Scheduler
 */

import type { FlowExecutionNode, ExecutionEdge, ExecutionResult, FlowExecutionConfig } from './types';
import type { NodeHandlerRegistry } from './handlers';
import type { NodeExecutionContext, VariableManager } from './handlers/types';
import { ExecutionLogger } from './logger';
import { VariableManager as VarManager } from './variables';

interface ExecutionState {
  currentNodeId: string;
  stepNumber: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export class ExecutionScheduler {
  private handlerRegistry: NodeHandlerRegistry;
  
  constructor(handlerRegistry: NodeHandlerRegistry) {
    this.handlerRegistry = handlerRegistry;
  }
  
  async run(
    flow: { nodes: FlowExecutionNode[]; edges: ExecutionEdge[]; startNode?: string },
    variableManager: VarManager,
    config: FlowExecutionConfig,
    context: any
  ): Promise<ExecutionResult> {
    const executionId = this.generateExecutionId();
    const logger = new ExecutionLogger();
    const executedNodes: string[] = [];
    const failedNodes: string[] = [];
    const pathsTaken: string[] = [];
    
    // Initialize state
    let currentNodeId = flow.startNode || flow.nodes[0]?.id;
    let stepNumber = 0;
    const maxSteps = config.maxSteps || 100;
    
    
    
    if (!currentNodeId) {
      return {
        success: false,
        executionId,
        executedNodes: [],
        failedNodes: [],
        error: 'No start node found',
      };
    }
    
    // Execute nodes
    while (currentNodeId && stepNumber < maxSteps) {
      stepNumber++;
      
      const node = flow.nodes.find(n => n.id === currentNodeId);
      if (!node) {
        failedNodes.push(currentNodeId);
        break;
      }
      
      // Get handler
      const handler = this.handlerRegistry.get(node.type);
      if (!handler) {
        failedNodes.push(currentNodeId);
        currentNodeId = this.getNextNodeId(flow.edges, currentNodeId, undefined);
        continue;
      }
      
      // Create execution context
      const nodeContext: NodeExecutionContext = {
        node,
        variables: variableManager,
        services: this.createMockServices(),
        logger,
        config: config as any,
        executionId,
        stepNumber,
      };
      
      try {
        // Execute node
        const result = await handler.execute(nodeContext);

        executedNodes.push(currentNodeId);
        pathsTaken.push(currentNodeId);
        
        if (!result.success) {
          failedNodes.push(currentNodeId);
          
          // Check error handling
          if (node.onError === 'stop') {
            break;
          }
        }
        
        // Get next node
        currentNodeId = result.nextNodeId || this.getNextNodeId(flow.edges, currentNodeId, result);
        
      } catch (error) {
        failedNodes.push(currentNodeId);
        console.error(`Error executing node ${currentNodeId}:`, error);
        
        if (node.onError === 'stop') {
          break;
        }
        
        currentNodeId = node.fallbackNodeId || this.getNextNodeId(flow.edges, currentNodeId, undefined);
      }
    }
    
    return {
      success: executedNodes.length > 0,
      executionId,
      executedNodes,
      failedNodes,
      pathsTaken,
      variables: variableManager.getAll(),
    };
  }
  
  private getNextNodeId(
    edges: ExecutionEdge[],
    currentNodeId: string,
    result: any
  ): string | undefined {
    const outgoing = edges.filter(e => e.source === currentNodeId);
    if (outgoing.length === 0) return undefined;
    return outgoing[0].target;
  }
  
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
  
  private createMockServices() {
    return {
      http: {
        request: async (url: string, options: any) => {
          // Mock HTTP request
          return {
            ok: true,
            status: 200,
            json: async () => ({}),
            headers: new Map(),
          };
        },
      },
      database: {
        query: async (sql: string, params?: unknown[]) => ({}),
      },
      ai: {
        generate: async (prompt: string, options?: any) => '',
      },
      storage: {
        get: async (key: string) => undefined,
        set: async (key: string, value: unknown) => {},
      },
    };
  }
}
