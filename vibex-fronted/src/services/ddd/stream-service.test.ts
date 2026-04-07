/**
 * DDD Stream Service Tests
 */

import {
  ThinkingStep,
  DomainModel,
  BusinessFlow,
  BoundedContext,
  BoundedContextStreamCallbacks,
  DomainModelStreamCallbacks,
  BusinessFlowStreamCallbacks,
} from './stream-service';

// Mock fetch
global.fetch = vi.fn();

describe('DDD Stream Service Types', () => {
  describe('ThinkingStep', () => {
    it('should create thinking step', () => {
      const step: ThinkingStep = {
        step: 'analysis',
        message: 'Analyzing requirement',
      };
      expect(step.step).toBe('analysis');
      expect(step.message).toBe('Analyzing requirement');
    });
  });

  describe('DomainModel', () => {
    it('should create domain model', () => {
      const model: DomainModel = {
        id: 'model-1',
        name: 'User',
        contextId: 'context-1',
        type: 'aggregate_root',
        properties: [
          { name: 'id', type: 'string', required: true, description: 'User ID' },
        ],
        methods: ['create', 'update'],
      };
      expect(model.type).toBe('aggregate_root');
      expect(model.properties).toHaveLength(1);
    });

    it('should support different domain model types', () => {
      const entity: DomainModel = {
        id: 'e1',
        name: 'OrderItem',
        contextId: 'c1',
        type: 'entity',
        properties: [],
        methods: [],
      };
      expect(entity.type).toBe('entity');

      const valueObject: DomainModel = {
        id: 'v1',
        name: 'Money',
        contextId: 'c1',
        type: 'value_object',
        properties: [],
        methods: [],
      };
      expect(valueObject.type).toBe('value_object');
    });
  });

  describe('BusinessFlow', () => {
    it('should create business flow', () => {
      const flow: BusinessFlow = {
        id: 'flow-1',
        name: 'Order Process',
        states: [
          { id: 's1', name: 'Created', type: 'initial', description: 'Order created' },
          { id: 's2', name: 'Paid', type: 'intermediate', description: 'Payment received' },
          { id: 's3', name: 'Completed', type: 'final', description: 'Order completed' },
        ],
        transitions: [
          { id: 't1', fromStateId: 's1', toStateId: 's2', event: 'pay' },
          { id: 't2', fromStateId: 's2', toStateId: 's3', event: 'complete' },
        ],
      };
      expect(flow.states).toHaveLength(3);
      expect(flow.transitions).toHaveLength(2);
    });

    it('should support conditions in transitions', () => {
      const flow: BusinessFlow = {
        id: 'flow-2',
        name: 'Approval Flow',
        states: [],
        transitions: [
          {
            id: 't1',
            fromStateId: 's1',
            toStateId: 's2',
            event: 'approve',
            condition: 'amount < 1000',
          },
        ],
      };
      expect(flow.transitions[0].condition).toBe('amount < 1000');
    });
  });

  describe('BoundedContext', () => {
    it('should create bounded context', () => {
      const context: BoundedContext = {
        id: 'bc-1',
        name: 'UserManagement',
        description: 'Manages user accounts',
        domains: [],
      };
      expect(context.name).toBe('UserManagement');
    });
  });

  describe('Callbacks interfaces', () => {
    it('should define bounded context stream callbacks', () => {
      const callbacks: BoundedContextStreamCallbacks = {
        onThinking: vi.fn(),
        onContext: vi.fn(),
        onDone: vi.fn(),
        onError: vi.fn(),
      };
      expect(typeof callbacks.onThinking).toBe('function');
      expect(typeof callbacks.onContext).toBe('function');
      expect(typeof callbacks.onDone).toBe('function');
      expect(typeof callbacks.onError).toBe('function');
    });

    it('should define domain model stream callbacks', () => {
      const callbacks: DomainModelStreamCallbacks = {
        onThinking: vi.fn(),
        onDone: vi.fn(),
        onError: vi.fn(),
      };
      expect(typeof callbacks.onThinking).toBe('function');
      expect(typeof callbacks.onDone).toBe('function');
      expect(typeof callbacks.onError).toBe('function');
    });

    it('should define business flow stream callbacks', () => {
      const callbacks: BusinessFlowStreamCallbacks = {
        onThinking: vi.fn(),
        onDone: vi.fn(),
        onError: vi.fn(),
      };
      expect(typeof callbacks.onThinking).toBe('function');
      expect(typeof callbacks.onDone).toBe('function');
      expect(typeof callbacks.onError).toBe('function');
    });
  });
});
