/**
 * Flow Execution Engine
 * Core engine for executing flow diagrams
 */

import type { 
  ExecutableFlow, 
  FlowExecutionConfig, 
  FlowExecutionContext,
  FlowCodeGenOptions,
  SimulationResult
} from './types';
import type { ExecutionResult } from '../prompts/flow-execution';

interface ValidationResult {
  valid: boolean;
  errors: Array<{ type: string; message: string }>;
  warnings: string[];
}
import { NodeHandlerRegistry } from './handlers';
import { VariableManager } from './variables';
import { ExecutionLogger } from './logger';
import { ExecutionScheduler } from './scheduler';
import { ErrorHandlerManager } from './error-handler';
import { CodeGenerator } from './code-generator';

export class FlowExecutionEngine {
  private handlerRegistry: NodeHandlerRegistry;
  private logger: ExecutionLogger;
  private errorManager: ErrorHandlerManager;
  private codeGenerator: CodeGenerator;
  
  constructor() {
    this.handlerRegistry = new NodeHandlerRegistry();
    this.logger = new ExecutionLogger();
    this.errorManager = new ErrorHandlerManager();
    this.codeGenerator = new CodeGenerator();
  }
  
  /**
   * Execute a flow
   */
  async execute(
    flow: ExecutableFlow,
    config: FlowExecutionConfig,
    context: FlowExecutionContext
  ): Promise<ExecutionResult> {
    const executionId = this.generateExecutionId();
    
    try {
      // Validate flow first
      const validation = await this.validate(flow);
      if (!validation.valid) {
        const errorMessages = validation.errors.map((e: { message: string }) => e.message);
        return {
          success: false,
          executedNodes: [],
          skippedNodes: [],
          failedNodes: [],
          pathsTaken: [],
          variables: {},
          errors: validation.errors.map((e: { type: string; message: string }) => ({ nodeId: 'validation', error: e.message, recoverable: true })),
          steps: [],
        };
      }
      
      // Initialize variables
      const variableManager = new VariableManager(flow.variables);
      const configWithInput = config as FlowExecutionConfig & { input?: Record<string, unknown> };
      if (configWithInput.input) {
        for (const [key, value] of Object.entries(configWithInput.input)) {
          variableManager.set(key, value);
        }
      }
      
      // Create scheduler and execute
      const scheduler = new ExecutionScheduler(this.handlerRegistry);
      const result = await scheduler.run(
        flow,
        variableManager,
        config,
        context
      );
      
      // Log execution
      this.logger.logExecution(executionId, result);
      
      return result;
      
    } catch (error) {
      return this.errorManager.createErrorResult(executionId, error);
    }
  }
  
  /**
   * Simulate flow execution (without actual execution)
   */
  async simulate(
    flow: ExecutableFlow,
    config: FlowExecutionConfig
  ): Promise<SimulationResult> {
    const paths = this.analyzeExecutionPaths(flow);
    const variableManager = new VariableManager(flow.variables);
    
    // Simulate variable changes
    const configWithInput = config as FlowExecutionConfig & { input?: Record<string, unknown> };
    const variables = configWithInput.input 
      ? { ...flow.variables, ...configWithInput.input }
      : flow.variables;
    
    return {
      mode: config.mode as any || 'simulation',
      paths,
      variables,
      estimatedDuration: this.estimateDuration(flow),
      potentialErrors: this.identifyPotentialErrors(flow),
    };
  }
  
  /**
   * Validate a flow
   */
  async validate(flow: ExecutableFlow): Promise<ValidationResult> {
    const errors: { type: string; message: string }[] = [];
    const warnings: string[] = [];
    
    // Check start node
    if (!flow.startNode) {
      errors.push({ type: 'missing_start', message: 'Flow must have a start node' });
    } else {
      const startNode = flow.nodes.find(n => n.id === flow.startNode);
      if (!startNode) {
        errors.push({ type: 'invalid_start', message: 'Start node not found' });
      }
    }
    
    // Check end nodes
    if (!flow.endNodes || flow.endNodes.length === 0) {
      errors.push({ type: 'missing_end', message: 'Flow must have at least one end node' });
    }
    
    // Check for orphaned nodes
    const connectedNodes = new Set<string>();
    flow.edges?.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });
    
    const orphanedNodes = flow.nodes.filter(n => 
      n.id !== flow.startNode && 
      !connectedNodes.has(n.id)
    );
    
    if (orphanedNodes.length > 0) {
      warnings.push(`Orphaned nodes found: ${orphanedNodes.map(n => n.id).join(', ')}`);
    }
    
    // Check for cycles
    const cycles: string[] = [];
    // TODO: Implement cycle detection
    // const cycles = this.detectCycles(flow);
    if (cycles.length > 0) {
      warnings.push(`Cycles detected: ${cycles.join(' -> ')}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
  
  /**
   * Generate executable code from flow
   */
  async generateCode(
    flow: ExecutableFlow,
    options: FlowCodeGenOptions
  ): Promise<string> {
    return this.codeGenerator.generate(flow, options);
  }
  
  /**
   * Analyze execution paths
   */
  private analyzeExecutionPaths(flow: ExecutableFlow): string[][] {
    const paths: string[][] = [];
    const startNode = flow.startNode || flow.nodes[0]?.id;
    
    if (!startNode) return paths;
    
    const visited = new Set<string>();
    const currentPath: string[] = [];
    
    const dfs = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      
      visited.add(nodeId);
      currentPath.push(nodeId);
      
      const outgoing = flow.edges?.filter(e => e.source === nodeId) || [];
      
      if (outgoing.length === 0) {
        paths.push([...currentPath]);
      } else {
        for (const edge of outgoing) {
          dfs(edge.target);
        }
      }
      
      currentPath.pop();
      visited.delete(nodeId);
    };
    
    dfs(startNode);
    return paths;
  }
  
  /**
   * Estimate execution duration
   */
  private estimateDuration(flow: ExecutableFlow): number {
    let total = 0;
    for (const node of flow.nodes) {
      const expectedDuration = (node as any).expectedDuration;
      if (expectedDuration) {
        total += expectedDuration;
      } else {
        // Default estimates
        switch (node.type) {
          case 'wait': total += 1000; break;
          case 'api_call': total += 500; break;
          default: total += 100; break;
        }
      }
    }
    return total;
  }
  
  /**
   * Identify potential errors
   */
  private identifyPotentialErrors(flow: ExecutableFlow): string[] {
    const errors: string[] = [];
    
    // Check for nodes without handlers
    for (const node of flow.nodes) {
      if (!this.handlerRegistry.has(node.type)) {
        errors.push(`Node ${node.id} has unknown type: ${node.type}`);
      }
    }
    
    // Check for unhandled errors
    const hasErrorHandler = flow.nodes.some(n => n.type === 'error');
    if (flow.nodes.length > 5 && !hasErrorHandler) {
      errors.push('Flow has many nodes but no error handler');
    }
    
    return errors;
  }
  
  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
  
  /**
   * Get handler registry (for debugging)
   */
  getHandlerTypes(): string[] {
    return this.handlerRegistry.getAllTypes();
  }
}
