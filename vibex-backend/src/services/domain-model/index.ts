/**
 * Domain Model Class Diagram Service
 * 
 * Provides functionality to generate Mermaid classDiagram syntax
 * from domain entities and relationships.
 * 
 * Features:
 * - Aggregate root / Entity / Value Object identification
 * - Mermaid classDiagram syntax generation
 * - Integration with bounded context diagram data
 * - Customizable diagram options
 * 
 * @module services/domain-model
 */

import {
  DomainEntity,
  DomainEntityCreateInput,
  DomainEntityUpdateInput,
  DomainEntityFilters,
  parseEntityProperties,
} from '../domain-entities';
import {
  EntityRelation,
  EntityRelationCreateInput,
  EntityRelationUpdateInput,
  EntityRelationFilters,
  parseRelationProperties,
  RelationType,
} from '../entity-relations';
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';

// ==================== Types ====================

/**
 * Domain entity type classification following DDD patterns
 */
export type DomainEntityType = 'AggregateRoot' | 'Entity' | 'ValueObject' | 'DomainService' | 'Repository' | 'Factory';

/**
 * Simplified entity classification for class diagram generation
 */
export type EntityClassificationType = 'aggregateRoot' | 'entity' | 'valueObject';

/**
 * Entity classification result
 */
export interface EntityClassification {
  aggregateRoots: DomainEntity[];
  entities: DomainEntity[];
  valueObjects: DomainEntity[];
}

/**
 * Class diagram generation options
 */
export interface ClassDiagramOptions {
  /** Show properties in the diagram */
  showProperties?: boolean;
  /** Show relationships in the diagram */
  showRelations?: boolean;
  /** Diagram title */
  title?: string;
  /** Include stereotype markers */
  showStereotypes?: boolean;
  /** Custom relation type mapping */
  relationMapping?: Record<RelationType, string>;
}

/**
 * Relation mapping for Mermaid syntax
 */
const DEFAULT_RELATION_MAPPING: Record<RelationType, string> = {
  'contains': '*--',
  'associates': '<--',
  'depends-on': '<..',
  'parent-child': '--',
  'implements': '<|--',
  'uses': '..>',
  'related-to': '--',
};

// ==================== Helper Functions ====================

/**
 * Identify entity type from domain entity type string
 * Maps various type formats to simplified classification
 */
export function identifyEntityType(type: string): EntityClassificationType {
  const normalizedType = type.toLowerCase().replace(/[_-]/g, '');
  
  if (normalizedType === 'aggregateroot' || normalizedType === 'aggregate') {
    return 'aggregateRoot';
  }
  
  if (normalizedType === 'valueobject' || normalizedType === 'vo' || normalizedType === 'value') {
    return 'valueObject';
  }
  
  // Default to entity for unknown types
  return 'entity';
}

/**
 * Classify entities into DDD categories
 */
export function classifyEntities(entities: DomainEntity[]): EntityClassification {
  const classification: EntityClassification = {
    aggregateRoots: [],
    entities: [],
    valueObjects: [],
  };

  for (const entity of entities) {
    const type = identifyEntityType(entity.type);
    
    switch (type) {
      case 'aggregateRoot':
        classification.aggregateRoots.push(entity);
        break;
      case 'valueObject':
        classification.valueObjects.push(entity);
        break;
      case 'entity':
      default:
        classification.entities.push(entity);
        break;
    }
  }

  return classification;
}

/**
 * Get Mermaid syntax for a relation type
 */
export function getRelationMermaidSyntax(relationType: RelationType): string {
  return DEFAULT_RELATION_MAPPING[relationType] || '--';
}

/**
 * Parse properties from domain entity
 * Returns a map of property name to type
 */
function parseProperties(entity: DomainEntity): Record<string, string> {
  const properties: Record<string, string> = {};
  
  const parsed = parseEntityProperties(entity);
  if (!parsed) {
    return properties;
  }

  for (const [key, value] of Object.entries(parsed)) {
    // Infer type from value
    if (value === null) {
      properties[key] = 'any';
    } else if (Array.isArray(value)) {
      properties[key] = `${typeof value[0] || 'any'}[]`;
    } else {
      properties[key] = typeof value;
    }
  }

  return properties;
}

/**
 * Get stereotype marker for entity type
 */
function getStereotypeMarker(type: EntityClassificationType): string {
  switch (type) {
    case 'aggregateRoot':
      return '<<AggregateRoot>>';
    case 'valueObject':
      return '<<ValueObject>>';
    case 'entity':
    default:
      return '<<Entity>>';
  }
}

// ==================== Main Functions ====================

/**
 * Generate Mermaid classDiagram syntax from domain entities and relations
 * 
 * @param entities Domain entities to include in the diagram
 * @param relations Entity relations to visualize
 * @param options Diagram generation options
 * @returns Mermaid classDiagram syntax string
 */
export function generateClassDiagram(
  entities: DomainEntity[],
  relations: EntityRelation[],
  options: ClassDiagramOptions = {}
): string {
  const {
    showProperties = true,
    showRelations = true,
    title,
    showStereotypes = true,
    relationMapping = DEFAULT_RELATION_MAPPING,
  } = options;

  const lines: string[] = [];

  // Header
  lines.push('classDiagram');
  
  // Add title comment if provided
  if (title) {
    lines.push(`    %% ${title}`);
  }

  // Create entity map for quick lookup
  const entityMap = new Map<string, DomainEntity>();
  for (const entity of entities) {
    entityMap.set(entity.id, entity);
    entityMap.set(entity.name, entity); // Also map by name
  }

  // Generate class definitions
  for (const entity of entities) {
    const classificationType = identifyEntityType(entity.type);
    
    // Class declaration with stereotype
    if (showStereotypes) {
      lines.push(`    class ${entity.name} {`);
      lines.push(`      ${getStereotypeMarker(classificationType)}`);
    } else {
      lines.push(`    class ${entity.name} {`);
    }

    // Properties
    if (showProperties) {
      const properties = parseProperties(entity);
      
      if (Object.keys(properties).length === 0) {
        // Add placeholder if no properties
        lines.push(`      +id: string`);
      } else {
        for (const [propName, propType] of Object.entries(properties)) {
          lines.push(`      +${propName}: ${propType}`);
        }
      }
    }

    lines.push(`    }`);
  }

  // Generate relationships
  if (showRelations && relations.length > 0) {
    lines.push(''); // Empty line before relations
    
    for (const relation of relations) {
      // Try to find source and target entities
      const sourceEntity = entityMap.get(relation.sourceEntityId) || entityMap.get(relation.sourceEntityId);
      const targetEntity = entityMap.get(relation.targetEntityId) || entityMap.get(relation.targetEntityId);
      
      const sourceName = sourceEntity?.name || relation.sourceEntityId;
      const targetName = targetEntity?.name || relation.targetEntityId;
      
      // Get relation syntax from mapping
      const relationSyntax = relationMapping[relation.relationType] || DEFAULT_RELATION_MAPPING[relation.relationType] || '--';
      
      // Build relation line with optional label
      let relationLine = `    ${sourceName} ${relationSyntax} ${targetName}`;
      
      if (relation.description) {
        relationLine += ` : "${relation.description}"`;
      }
      
      lines.push(relationLine);
    }
  }

  return lines.join('\n');
}

/**
 * Generate class diagram from project data
 * This is the main entry point that would typically fetch data from database
 * 
 * @param projectId Project ID to generate diagram for
 * @param env Cloudflare environment
 * @param options Diagram generation options
 * @returns Mermaid classDiagram syntax string
 */
export async function generateClassDiagramFromProject(
  projectId: string,
  env: Env,
  options: ClassDiagramOptions = {}
): Promise<string> {
  // Fetch entities for the project
  const entities = await queryDB<DomainEntity>(
    env,
    'SELECT * FROM DomainEntity WHERE projectId = ? ORDER BY createdAt DESC',
    [projectId]
  );

  // Fetch relations for the project
  const relations = await queryDB<EntityRelation>(
    env,
    'SELECT * FROM EntityRelation WHERE projectId = ? ORDER BY createdAt DESC',
    [projectId]
  );

  return generateClassDiagram(entities, relations, options);
}

/**
 * Get diagram metadata for frontend rendering
 */
export interface DiagramMetadata {
  entityCount: number;
  relationCount: number;
  aggregateRootCount: number;
  entityCountByType: Record<EntityClassificationType, number>;
}

export function getDiagramMetadata(
  entities: DomainEntity[],
  relations: EntityRelation[]
): DiagramMetadata {
  const classification = classifyEntities(entities);

  return {
    entityCount: entities.length,
    relationCount: relations.length,
    aggregateRootCount: classification.aggregateRoots.length,
    entityCountByType: {
      aggregateRoot: classification.aggregateRoots.length,
      entity: classification.entities.length,
      valueObject: classification.valueObjects.length,
    },
  };
}

// ==================== Service Functions (Database Operations) ====================

/**
 * List domain models (entities + relations) for a project
 */
export async function listDomainModels(
  env: Env,
  projectId: string
): Promise<{ entities: DomainEntity[]; relations: EntityRelation[] }> {
  const entities = await queryDB<DomainEntity>(
    env,
    'SELECT * FROM DomainEntity WHERE projectId = ? ORDER BY createdAt DESC',
    [projectId]
  );

  const relations = await queryDB<EntityRelation>(
    env,
    'SELECT * FROM EntityRelation WHERE projectId = ? ORDER BY createdAt DESC',
    [projectId]
  );

  return { entities, relations };
}

/**
 * Generate and save class diagram for a project
 */
export async function generateAndSaveClassDiagram(
  env: Env,
  projectId: string,
  options: ClassDiagramOptions = {}
): Promise<{ diagram: string; metadata: DiagramMetadata }> {
  const { entities, relations } = await listDomainModels(env, projectId);
  
  const diagram = generateClassDiagram(entities, relations, options);
  const metadata = getDiagramMetadata(entities, relations);

  return { diagram, metadata };
}

// ==================== Export all types and functions ====================

export type {
  DomainEntity,
  DomainEntityCreateInput,
  DomainEntityUpdateInput,
  DomainEntityFilters,
  EntityRelation,
  EntityRelationCreateInput,
  EntityRelationUpdateInput,
  EntityRelationFilters,
  RelationType,
};
