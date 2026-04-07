/**
 * Business Flow Diagram Service - Tests
 * 
 * Tests for generating Mermaid stateDiagram-v2/flowchart from domain entities.
 * This service identifies state/status fields and generates business process diagrams.
 * 
 * @module services/business-flow/index.test
 */

import {
  DomainEntity,
  DomainEntityType,
  EntityRelation,
  RelationType,
  generateFlowDiagram,
  generateStateDiagram,
  identifyStates,
  identifyActivities,
  FlowDiagramOptions,
  StateDiagramOptions,
  BusinessFlowNode,
  BusinessFlowTransition,
  parseEntityProperties,
} from './index';

// Test data factories
const createMockEntity = (
  id: string,
  name: string,
  type: DomainEntityType,
  properties?: Record<string, unknown> | null
): DomainEntity => ({
  id,
  projectId: 'proj1',
  name,
  type,
  description: `Description for ${name}`,
  properties: properties ? JSON.stringify(properties) : null,
  requirementId: 'req1',
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
});

const createMockRelation = (
  id: string,
  sourceEntityId: string,
  targetEntityId: string,
  relationType: RelationType
): EntityRelation => ({
  id,
  projectId: 'proj1',
  sourceEntityId,
  targetEntityId,
  relationType,
  description: null,
  properties: null,
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
});

describe('identifyStates', () => {
  it('should identify status field as state', () => {
    const entity = createMockEntity('1', 'Order', 'Entity', {
      id: 'string',
      status: 'pending | processing | completed | cancelled',
      amount: 'number',
    });

    const states = identifyStates(entity);

    expect(states).toHaveLength(1);
    expect(states[0].field).toBe('status');
    expect(states[0].values).toContain('pending');
    expect(states[0].values).toContain('processing');
    expect(states[0].values).toContain('completed');
    expect(states[0].values).toContain('cancelled');
  });

  it('should identify state field as state', () => {
    const entity = createMockEntity('1', 'Task', 'Entity', {
      id: 'string',
      state: 'todo | in_progress | done',
      assignee: 'string',
    });

    const states = identifyStates(entity);

    expect(states).toHaveLength(1);
    expect(states[0].field).toBe('state');
    expect(states[0].values).toContain('todo');
    expect(states[0].values).toContain('in_progress');
    expect(states[0].values).toContain('done');
  });

  it('should identify multiple state fields', () => {
    const entity = createMockEntity('1', 'Order', 'Entity', {
      id: 'string',
      status: 'active | closed',
      fulfillmentStatus: 'pending | fulfilled | returned',
      paymentStatus: 'unpaid | paid | refunded',
    });

    const states = identifyStates(entity);

    expect(states.length).toBeGreaterThanOrEqual(1);
  });

  it('should return empty array for entity without state fields', () => {
    const entity = createMockEntity('1', 'Address', 'ValueObject', {
      street: 'string',
      city: 'string',
      country: 'string',
    });

    const states = identifyStates(entity);

    expect(states).toHaveLength(0);
  });

  it('should handle entity without properties', () => {
    const entity = createMockEntity('1', 'EmptyEntity', 'Entity', null);

    const states = identifyStates(entity);

    expect(states).toHaveLength(0);
  });
});

describe('identifyActivities', () => {
  it('should identify action/operation fields as activities', () => {
    const entity = createMockEntity('1', 'Workflow', 'Entity', {
      id: 'string',
      currentStep: 'start | step1 | step2 | end',
      actions: 'approve | reject | submit | review',
    });

    const activities = identifyActivities(entity);

    expect(activities.length).toBeGreaterThanOrEqual(1);
  });

  it('should identify step/phases fields as activities', () => {
    const entity = createMockEntity('1', 'Process', 'Entity', {
      id: 'string',
      phase: 'initiation | planning | execution | closure',
      step: 'step1 | step2 | step3',
    });

    const activities = identifyActivities(entity);

    expect(activities.length).toBeGreaterThanOrEqual(1);
  });

  it('should return empty array for entity without activity fields', () => {
    const entity = createMockEntity('1', 'Product', 'Entity', {
      id: 'string',
      name: 'string',
      price: 'number',
    });

    const activities = identifyActivities(entity);

    expect(activities).toHaveLength(0);
  });
});

describe('generateStateDiagram', () => {
  const orderEntity = createMockEntity('1', 'Order', 'AggregateRoot', {
    id: 'string',
    status: 'pending | processing | shipped | delivered | cancelled',
    customerId: 'string',
  });

  it('should generate valid Mermaid stateDiagram-v2 syntax', () => {
    const result = generateStateDiagram([orderEntity], []);

    expect(result).toContain('stateDiagram-v2');
    expect(result).toContain('[*]');
    expect(result).toContain('pending');
    expect(result).toContain('processing');
  });

  it('should include all identified states', () => {
    const result = generateStateDiagram([orderEntity], []);

    expect(result).toContain('pending');
    expect(result).toContain('processing');
    expect(result).toContain('shipped');
    expect(result).toContain('delivered');
    expect(result).toContain('cancelled');
  });

  it('should generate state transitions based on relation flow', () => {
    const result = generateStateDiagram([orderEntity], []);

    // Should have transitions between states
    expect(result).toMatch(/pending.*processing/);
  });

  it('should respect showTransitions option', () => {
    const options: StateDiagramOptions = { showTransitions: false };
    const result = generateStateDiagram([orderEntity], [], options);

    expect(result).toContain('stateDiagram-v2');
    expect(result).toContain('pending');
  });

  it('should handle multiple entities with states', () => {
    const taskEntity = createMockEntity('2', 'Task', 'Entity', {
      id: 'string',
      state: 'todo | in_progress | done',
      priority: 'high',
    });

    const result = generateStateDiagram([orderEntity, taskEntity], []);

    expect(result).toContain('stateDiagram-v2');
    expect(result).toContain('pending');
    expect(result).toContain('todo');
  });

  it('should handle empty entity list', () => {
    const result = generateStateDiagram([], []);

    expect(result).toContain('stateDiagram-v2');
    expect(result).not.toMatch(/pending|todo|active/);
  });

  it('should include title when provided', () => {
    const options: StateDiagramOptions = { title: 'Order Processing Flow' };
    const result = generateStateDiagram([orderEntity], [], options);

    expect(result).toContain('Order Processing Flow');
  });
});

describe('generateFlowDiagram', () => {
  const orderEntity = createMockEntity('1', 'Order', 'AggregateRoot', {
    id: 'string',
    status: 'pending | processing | completed | cancelled',
  });

  it('should generate valid Mermaid flowchart syntax', () => {
    const result = generateFlowDiagram([orderEntity], []);

    expect(result).toContain('flowchart');
    expect(result).toContain('pending');
    expect(result).toContain('processing');
  });

  it('should use TD direction by default', () => {
    const result = generateFlowDiagram([orderEntity], []);

    expect(result).toContain('flowchart TD');
  });

  it('should respect direction option', () => {
    const options: FlowDiagramOptions = { direction: 'LR' };
    const result = generateFlowDiagram([orderEntity], [], options);

    expect(result).toContain('flowchart LR');
  });

  it('should include all identified states as nodes', () => {
    const result = generateFlowDiagram([orderEntity], []);

    expect(result).toContain('pending');
    expect(result).toContain('processing');
    expect(result).toContain('completed');
    expect(result).toContain('cancelled');
  });

  it('should generate flow connections between nodes', () => {
    const result = generateFlowDiagram([orderEntity], []);

    // Should have arrows/connections
    expect(result).toMatch(/pending.*processing|pending -->|pending ->|pending==> /);
  });

  it('should handle empty entity list', () => {
    const result = generateFlowDiagram([], []);

    expect(result).toContain('flowchart');
    expect(result).not.toMatch(/pending|processing|completed/);
  });

  it('should include title when provided', () => {
    const options: FlowDiagramOptions = { title: 'Order Process' };
    const result = generateFlowDiagram([orderEntity], [], options);

    expect(result).toContain('%% Order Process');
  });

  it('should handle multiple entities with different states', () => {
    const taskEntity = createMockEntity('2', 'Task', 'Entity', {
      id: 'string',
      state: 'open | in_progress | closed',
    });

    const result = generateFlowDiagram([orderEntity, taskEntity], []);

    expect(result).toContain('flowchart');
    expect(result).toContain('pending');
    expect(result).toContain('open');
  });
});

describe('Business Flow with Relations', () => {
  const orderEntity = createMockEntity('1', 'Order', 'AggregateRoot', {
    id: 'string',
    status: 'pending | confirmed | shipped | delivered',
  });

  const paymentEntity = createMockEntity('2', 'Payment', 'Entity', {
    id: 'string',
    status: 'unpaid | processing | paid | failed',
  });

  const relation = createMockRelation('r1', '1', '2', 'contains');

  it('should include states from related entities', () => {
    const result = generateStateDiagram([orderEntity, paymentEntity], [relation]);

    expect(result).toContain('pending');
    expect(result).toContain('confirmed');
    expect(result).toContain('unpaid');
    expect(result).toContain('paid');
  });

  it('should generate cross-entity flow when entities are related', () => {
    const result = generateFlowDiagram([orderEntity, paymentEntity], [relation]);

    // Should contain nodes from both entities
    expect(result).toMatch(/pending.*confirmed|pending -->|pending ->|pending==>/);
    expect(result).toMatch(/unpaid.*paid/);
  });
});

describe('Integration with Domain Model', () => {
  it('should work with domain model entity types', () => {
    const entities: DomainEntity[] = [
      createMockEntity('1', 'Order', 'AggregateRoot', {
        id: 'string',
        status: 'draft | submitted | processing | completed',
      }),
      createMockEntity('2', 'OrderItem', 'Entity', {
        id: 'string',
        quantity: 'number',
      }),
      createMockEntity('3', 'Money', 'ValueObject', {
        amount: 'number',
        currency: 'string',
      }),
    ];

    const relations: EntityRelation[] = [
      createMockRelation('r1', '1', '2', 'contains'),
      createMockRelation('r2', '1', '3', 'contains'),
    ];

    const stateResult = generateStateDiagram(entities, relations);
    const flowResult = generateFlowDiagram(entities, relations);

    expect(stateResult).toContain('stateDiagram-v2');
    expect(stateResult).toContain('draft');
    expect(flowResult).toContain('flowchart');
    expect(flowResult).toContain('draft');
  });

  it('should identify states only from entities with state fields', () => {
    const entities: DomainEntity[] = [
      createMockEntity('1', 'Order', 'AggregateRoot', {
        id: 'string',
        status: 'active | inactive',
      }),
      createMockEntity('2', 'Product', 'Entity', {
        id: 'string',
        name: 'string',
        price: 'number',
      }),
    ];

    const result = generateStateDiagram(entities, []);

    expect(result).toContain('active');
    expect(result).not.toContain('name');
    expect(result).not.toContain('price');
  });
});

describe('Edge Cases', () => {
  it('should handle entities with empty status values', () => {
    const entity = createMockEntity('1', 'EmptyStatus', 'Entity', {
      id: 'string',
      status: '',
    });

    const result = generateStateDiagram([entity], []);

    expect(result).toContain('stateDiagram-v2');
  });

  it('should handle entities with special characters in status', () => {
    const entity = createMockEntity('1', 'Special', 'Entity', {
      id: 'string',
      status: 'state_one | state-two | state_three',
    });

    const result = generateStateDiagram([entity], []);

    expect(result).toContain('state_one');
    expect(result).toContain('state-two');
    expect(result).toContain('state_three');
  });

  it('should handle very long status chains', () => {
    const entity = createMockEntity('1', 'LongFlow', 'Entity', {
      id: 'string',
      status: 'step1 | step2 | step3 | step4 | step5 | step6 | step7 | step8',
    });

    const result = generateStateDiagram([entity], []);

    expect(result).toContain('step1');
    expect(result).toContain('step8');
  });
});
