/**
 * Flow Execution Engine Tests
 */
// @ts-nocheck


import { FlowExecutionEngine } from '../engine';
import type { ExecutableFlow, ExecutionConfig } from '../types';

describe('FlowExecutionEngine', () => {
  let engine: FlowExecutionEngine;
  
  beforeEach(() => {
    engine = new FlowExecutionEngine();
  });
  
  describe('execute', () => {
    it('should execute a simple sequential flow', async () => {
      const flow: ExecutableFlow = {
        id: 'flow-1',
        name: 'Simple Flow',
        nodes: [
          { id: 'start', type: 'start', label: 'Start' },
          { id: 'action', type: 'action', label: 'Do Something', config: { actionType: 'script' } },
          { id: 'end', type: 'end', label: 'End' },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'action' },
          { id: 'e2', source: 'action', target: 'end' },
        ],
        startNode: 'start',
        endNodes: ['end'],
      };
      
      const config: ExecutionConfig = {
        mode: 'simulation',
      };
      
      const result = await engine.execute(flow, config, {});
      
      
      expect(result.success).toBe(true);
      expect(result.executedNodes).toContain('start');
      expect(result.executedNodes).toContain('action');
      expect(result.executedNodes).toContain('end');
    });
    
    it('should handle decision branches', async () => {
      const flow: ExecutableFlow = {
        id: 'flow-2',
        name: 'Decision Flow',
        nodes: [
          { id: 'start', type: 'start', label: 'Start' },
          { 
            id: 'decision', 
            type: 'decision', 
            label: 'Check Value',
            config: {
              conditions: [
                { expression: 'value > 0', targetNodeId: 'positive' },
                { expression: 'value < 0', targetNodeId: 'negative' },
              ],
              defaultTarget: 'zero',
            }
          },
          { id: 'positive', type: 'action', label: 'Positive' },
          { id: 'negative', type: 'action', label: 'Negative' },
          { id: 'zero', type: 'action', label: 'Zero' },
          { id: 'end', type: 'end', label: 'End' },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'decision' },
          { id: 'e2', source: 'decision', target: 'positive', condition: 'value > 0' },
          { id: 'e3', source: 'decision', target: 'negative', condition: 'value < 0' },
          { id: 'e4', source: 'decision', target: 'zero' },
          { id: 'e5', source: 'positive', target: 'end' },
          { id: 'e6', source: 'negative', target: 'end' },
          { id: 'e7', source: 'zero', target: 'end' },
        ],
        startNode: 'start',
        endNodes: ['end'],
      };
      
      const config: ExecutionConfig = {
        mode: 'simulation',
        input: { value: 10 },
      };
      
      const result = await engine.execute(flow, config, {});
      
      expect(result.success).toBe(true);
      expect(result.pathsTaken).toContain('positive');
    });
    
    it('should handle parallel execution', async () => {
      const flow: ExecutableFlow = {
        id: 'flow-3',
        name: 'Parallel Flow',
        nodes: [
          { id: 'start', type: 'start', label: 'Start' },
          { 
            id: 'parallel', 
            type: 'parallel', 
            label: 'Parallel',
            config: { branches: [['branch1'], ['branch2']], joinType: 'all' }
          },
          { id: 'branch1', type: 'action', label: 'Branch 1' },
          { id: 'branch2', type: 'action', label: 'Branch 2' },
          { id: 'end', type: 'end', label: 'End' },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'parallel' },
          { id: 'e2', source: 'parallel', target: 'branch1' },
          { id: 'e3', source: 'parallel', target: 'branch2' },
          { id: 'e4', source: 'branch1', target: 'end' },
          { id: 'e5', source: 'branch2', target: 'end' },
        ],
        startNode: 'start',
        endNodes: ['end'],
      };
      
      const result = await engine.execute(flow, { mode: 'simulation' }, {});
      
      expect(result.success).toBe(true);
    });
  });
  
  describe('validate', () => {
    it('should detect missing start node', async () => {
      const flow: ExecutableFlow = {
        id: 'flow-invalid',
        name: 'Invalid Flow',
        nodes: [
          { id: 'end', type: 'end', label: 'End' },
        ],
        edges: [],
        startNode: undefined,
        endNodes: ['end'],
      };
      
      const result = await engine.validate(flow);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ type: 'missing_start' })
      );
    });
    
    it('should detect missing end nodes', async () => {
      const flow: ExecutableFlow = {
        id: 'flow-invalid',
        name: 'Invalid Flow',
        nodes: [
          { id: 'start', type: 'start', label: 'Start' },
        ],
        edges: [],
        startNode: 'start',
        endNodes: [],
      };
      
      const result = await engine.validate(flow);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ type: 'missing_end' })
      );
    });
    
    it('should validate a correct flow', async () => {
      const flow: ExecutableFlow = {
        id: 'flow-valid',
        name: 'Valid Flow',
        nodes: [
          { id: 'start', type: 'start', label: 'Start' },
          { id: 'end', type: 'end', label: 'End' },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'end' },
        ],
        startNode: 'start',
        endNodes: ['end'],
      };
      
      const result = await engine.validate(flow);
      
      expect(result.valid).toBe(true);
    });
  });
  
  describe('simulate', () => {
    it('should analyze execution paths', async () => {
      const flow: ExecutableFlow = {
        id: 'flow-1',
        name: 'Test Flow',
        nodes: [
          { id: 'start', type: 'start', label: 'Start' },
          { id: 'action1', type: 'action', label: 'Action 1' },
          { id: 'action2', type: 'action', label: 'Action 2' },
          { id: 'end', type: 'end', label: 'End' },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'action1' },
          { id: 'e2', source: 'action1', target: 'action2' },
          { id: 'e3', source: 'action2', target: 'end' },
        ],
        startNode: 'start',
        endNodes: ['end'],
      };
      
      const result = await engine.simulate(flow, { mode: 'simulation' });
      
      expect(result.paths).toHaveLength(1);
      expect(result.paths[0]).toEqual(['start', 'action1', 'action2', 'end']);
    });
    
    it('should estimate duration', async () => {
      const flow: ExecutableFlow = {
        id: 'flow-1',
        name: 'Test Flow',
        nodes: [
          { id: 'start', type: 'start', label: 'Start' },
          { id: 'api', type: 'api_call', label: 'API Call', expectedDuration: 500 },
          { id: 'end', type: 'end', label: 'End', expectedDuration: 100 },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'api' },
          { id: 'e2', source: 'api', target: 'end' },
        ],
        startNode: 'start',
        endNodes: ['end'],
      };
      
      const result = await engine.simulate(flow, { mode: 'simulation' });
      
      expect(result.estimatedDuration).toBeGreaterThan(0);
    });
  });
  
  describe('generateCode', () => {
    it('should generate TypeScript code', async () => {
      const flow: ExecutableFlow = {
        id: 'flow-1',
        name: 'Test Flow',
        nodes: [
          { id: 'start', type: 'start', label: 'Start' },
          { id: 'end', type: 'end', label: 'End' },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'end' },
        ],
        startNode: 'start',
        endNodes: ['end'],
      };
      
      const code = await engine.generateCode(flow, { language: 'typescript' });
      
      expect(code).toContain('async function executeFlow');
      expect(code).toContain('executeStart');
      expect(code).toContain('executeEnd');
    });
    
    it('should generate Python code', async () => {
      const flow: ExecutableFlow = {
        id: 'flow-1',
        name: 'Test Flow',
        nodes: [
          { id: 'start', type: 'start', label: 'Start' },
          { id: 'end', type: 'end', label: 'End' },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'end' },
        ],
        startNode: 'start',
        endNodes: ['end'],
      };
      
      const code = await engine.generateCode(flow, { language: 'python' });
      
      expect(code).toContain('async def execute_flow');
      expect(code).toContain('class FlowExecutor');
    });
    
    it('should generate Java code', async () => {
      const flow: ExecutableFlow = {
        id: 'flow-1',
        name: 'Test Flow',
        nodes: [
          { id: 'start', type: 'start', label: 'Start' },
          { id: 'end', type: 'end', label: 'End' },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'end' },
        ],
        startNode: 'start',
        endNodes: ['end'],
      };
      
      const code = await engine.generateCode(flow, { language: 'java' });
      
      expect(code).toContain('public class FlowExecutor');
      expect(code).toContain('executeFlow');
    });
  });
  
  describe('getHandlerTypes', () => {
    it('should return all registered handler types', () => {
      const types = engine.getHandlerTypes();
      
      expect(types).toContain('start');
      expect(types).toContain('end');
      expect(types).toContain('action');
      expect(types).toContain('decision');
      expect(types).toContain('api_call');
      expect(types).toContain('parallel');
      expect(types).toContain('wait');
      expect(types).toContain('user_interaction');
      expect(types).toContain('subflow');
      expect(types).toContain('error');
      expect(types).toContain('transform');
      expect(types).toContain('loop');
    });
  });
});
