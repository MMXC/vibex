/**
 * Domain Model Class Diagram Service - Tests
 * 
 * Tests for generating Mermaid classDiagram from domain entities and relationships.
 * 
 * @module services/domain-model/index.test
 */

import {
  DomainEntity,
  DomainEntityType,
  EntityRelation,
  RelationType,
  generateClassDiagram,
  generateClassDiagramFromProject,
  identifyEntityType,
  classifyEntities,
  EntityClassification,
  ClassDiagramOptions,
  getRelationMermaidSyntax,
} from './index';

// Test data factories
const createMockEntity = (
  id: string,
  name: string,
  type: DomainEntityType,
  properties?: Record<string, unknown>
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

describe('identifyEntityType', () => {
  it('should identify aggregate root from entity type', () => {
    expect(identifyEntityType('AggregateRoot')).toBe('aggregateRoot');
    expect(identifyEntityType('aggregate_root')).toBe('aggregateRoot');
  });

  it('should identify entity from entity type', () => {
    expect(identifyEntityType('Entity')).toBe('entity');
    expect(identifyEntityType('entity')).toBe('entity');
  });

  it('should identify value object from entity type', () => {
    expect(identifyEntityType('ValueObject')).toBe('valueObject');
    expect(identifyEntityType('value_object')).toBe('valueObject');
    expect(identifyEntityType('VO')).toBe('valueObject');
  });

  it('should default to entity for unknown types', () => {
    expect(identifyEntityType('Unknown')).toBe('entity');
    expect(identifyEntityType('')).toBe('entity');
  });
});

describe('classifyEntities', () => {
  it('should classify entities by their type', () => {
    const entities: DomainEntity[] = [
      createMockEntity('1', 'User', 'AggregateRoot'),
      createMockEntity('2', 'Project', 'AggregateRoot'),
      createMockEntity('3', 'Order', 'Entity'),
      createMockEntity('4', 'Address', 'ValueObject'),
      createMockEntity('5', 'Money', 'ValueObject'),
    ];

    const classification = classifyEntities(entities);

    expect(classification.aggregateRoots).toHaveLength(2);
    expect(classification.entities).toHaveLength(1);
    expect(classification.valueObjects).toHaveLength(2);
  });

  it('should handle empty entity list', () => {
    const classification = classifyEntities([]);
    expect(classification.aggregateRoots).toHaveLength(0);
    expect(classification.entities).toHaveLength(0);
    expect(classification.valueObjects).toHaveLength(0);
  });
});

describe('getRelationMermaidSyntax', () => {
  it('should generate composition relation', () => {
    const result = getRelationMermaidSyntax('contains');
    expect(result).toBe('*--');
  });

  it('should generate aggregation relation', () => {
    const result = getRelationMermaidSyntax('associates');
    expect(result).toBe('<--');
  });

  it('should generate dependency relation', () => {
    const result = getRelationMermaidSyntax('depends-on');
    expect(result).toBe('<..');
  });

  it('should generate inheritance relation', () => {
    const result = getRelationMermaidSyntax('implements');
    expect(result).toBe('<|--');
  });

  it('should default to association for unknown types', () => {
    const result = getRelationMermaidSyntax('unknown-type' as RelationType);
    expect(result).toBe('--');
  });
});

describe('generateClassDiagram', () => {
  const entities: DomainEntity[] = [
    createMockEntity('1', 'User', 'AggregateRoot', {
      id: 'string',
      email: 'string',
      name: 'string',
      createdAt: 'Date',
    }),
    createMockEntity('2', 'Order', 'Entity', {
      id: 'string',
      status: 'string',
      totalAmount: 'number',
    }),
    createMockEntity('3', 'Address', 'ValueObject', {
      street: 'string',
      city: 'string',
      country: 'string',
    }),
  ];

  const relations: EntityRelation[] = [
    createMockRelation('r1', '1', '2', 'contains'),
    createMockRelation('r2', '2', '3', 'contains'),
  ];

  it('should generate valid Mermaid classDiagram syntax', () => {
    const result = generateClassDiagram(entities, relations);

    expect(result).toContain('classDiagram');
    expect(result).toContain('class User');
    expect(result).toContain('class Order');
    expect(result).toContain('class Address');
  });

  it('should include entity type markers', () => {
    const result = generateClassDiagram(entities, relations);

    expect(result).toContain('<<AggregateRoot>>');
    expect(result).toContain('<<Entity>>');
    expect(result).toContain('<<ValueObject>>');
  });

  it('should include properties with types', () => {
    const result = generateClassDiagram(entities, relations);

    expect(result).toContain('+id: string');
    expect(result).toContain('+email: string');
    expect(result).toContain('+street: string');
  });

  it('should include relationships', () => {
    const result = generateClassDiagram(entities, relations);

    expect(result).toContain('User *-- Order');
    expect(result).toContain('Order *-- Address');
  });

  it('should respect showProperties option', () => {
    const options: ClassDiagramOptions = { showProperties: false };
    const result = generateClassDiagram(entities, relations, options);

    expect(result).not.toContain('+id: string');
    expect(result).toContain('class User');
  });

  it('should respect showRelations option', () => {
    const options: ClassDiagramOptions = { showRelations: false };
    const result = generateClassDiagram(entities, relations, options);

    expect(result).not.toContain('User *-- Order');
    expect(result).toContain('class User');
  });

  it('should handle empty entities', () => {
    const result = generateClassDiagram([], []);

    expect(result).toContain('classDiagram');
    expect(result).not.toContain('class User');
  });

  it('should handle entities without properties', () => {
    const noPropsEntity = createMockEntity('99', 'EmptyEntity', 'Entity');
    const result = generateClassDiagram([noPropsEntity], []);

    expect(result).toContain('class EmptyEntity');
  });

  it('should handle relation between non-existent entities', () => {
    const orphanRelation = createMockRelation('r99', 'nonexistent1', 'nonexistent2', 'depends-on');
    const result = generateClassDiagram(entities, [orphanRelation]);

    expect(result).toContain('nonexistent1 <.. nonexistent2');
  });
});

describe('generateClassDiagramFromProject', () => {
  // Mock entities from a project
  const projectEntities: DomainEntity[] = [
    createMockEntity('e1', 'User', 'AggregateRoot', {
      id: 'string',
      email: 'string',
    }),
    createMockEntity('e2', 'Project', 'AggregateRoot', {
      id: 'string',
      name: 'string',
    }),
    createMockEntity('e3', 'Page', 'Entity', {
      id: 'string',
      title: 'string',
    }),
    createMockEntity('e4', 'Flow', 'Entity', {
      id: 'string',
      nodes: 'array',
    }),
    createMockEntity('e5', 'Position', 'ValueObject', {
      x: 'number',
      y: 'number',
    }),
  ];

  const projectRelations: EntityRelation[] = [
    createMockRelation('rel1', 'e1', 'e2', 'contains'),
    createMockRelation('rel2', 'e2', 'e3', 'contains'),
    createMockRelation('rel3', 'e2', 'e4', 'contains'),
    createMockRelation('rel4', 'e4', 'e5', 'contains'),
  ];

  it('should generate class diagram from project data', async () => {
    // Mock the data fetching - would normally come from DB
    const mockEntities = projectEntities;
    const mockRelations = projectRelations;

    const result = generateClassDiagram(mockEntities, mockRelations);

    expect(result).toContain('classDiagram');
    expect(result).toContain('<<AggregateRoot>>');
    expect(result).toContain('<<Entity>>');
    expect(result).toContain('<<ValueObject>>');
  });

  it('should integrate with bounded context diagram data', () => {
    // Test integration with bounded context information
    const boundedContextInfo = {
      contextName: 'ProjectContext',
      description: 'Manages project lifecycle',
    };

    const options: ClassDiagramOptions = {
      title: boundedContextInfo.contextName,
    };

    const result = generateClassDiagram(projectEntities, projectRelations, options);

    expect(result).toContain('ProjectContext');
  });
});

describe('Entity Classification Logic', () => {
  it('should correctly identify DDD patterns', () => {
    const entities: DomainEntity[] = [
      createMockEntity('1', 'Order', 'AggregateRoot', { items: 'array' }),
      createMockEntity('2', 'OrderItem', 'Entity', { productId: 'string' }),
      createMockEntity('3', 'Money', 'ValueObject', { amount: 'number', currency: 'string' }),
      createMockEntity('4', 'Customer', 'AggregateRoot', { name: 'string' }),
      createMockEntity('5', 'Email', 'ValueObject', { address: 'string' }),
    ];

    const classification = classifyEntities(entities);

    // Check aggregate roots
    expect(classification.aggregateRoots.map(e => e.name)).toContain('Order');
    expect(classification.aggregateRoots.map(e => e.name)).toContain('Customer');

    // Check value objects
    expect(classification.valueObjects.map(e => e.name)).toContain('Money');
    expect(classification.valueObjects.map(e => e.name)).toContain('Email');

    // Check entities
    expect(classification.entities.map(e => e.name)).toContain('OrderItem');
  });
});
