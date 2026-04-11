/**
 * @deprecated This router uses the legacy Page Router API.
 * All routes have been migrated to Next.js App Router (app/api/).
 * See: docs/migration/page-router-to-app-router.md
 * This file will be removed after E1 security fixes are complete.
 *
 * Domain Models API Routes
 * Provides endpoints for generating and managing domain models using AI.
 * Returns graph data with nodes (entities) and edges (relationships).
 * @module routes/domain-models
 */

import { Hono } from 'hono';
import { queryOne, queryDB, executeDB, generateId, Env } from '@/lib/db';
import { createAIService } from '@/services/ai-service';

import { safeError } from '@/lib/log-sanitizer';

const domainModels = new Hono<{ Bindings: Env }>();

// ==================== Types ====================

interface DomainEntityRow {
  id: string;
  projectId: string;
  name: string;
  type: string;
  description: string | null;
  properties: string | null;
  requirementId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EntityRelationRow {
  id: string;
  projectId: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationType: string;
  description: string | null;
  properties: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Graph node representing a domain entity
 */
interface GraphNode {
  id: string;
  label: string;
  type: string;
  description?: string;
  properties?: Record<string, unknown>;
}

/**
 * Graph edge representing a relationship
 */
interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  description?: string;
}

/**
 * Graph data structure for domain model visualization
 */
interface DomainModelGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata?: {
    totalEntities: number;
    totalRelations: number;
    generatedAt: string;
  };
}

/**
 * AI extracted entity
 */
interface ExtractedEntity {
  name: string;
  type: string;
  description?: string;
  properties?: Record<string, unknown>;
}

/**
 * AI extracted relation
 */
interface ExtractedRelation {
  sourceEntity: string;
  targetEntity: string;
  relationType: string;
  description?: string;
}

// ==================== LLM Prompt ====================

const DOMAIN_MODEL_GENERATION_PROMPT = `You are an expert domain modeler. Your task is to analyze a software requirement and generate a structured domain model as a graph.

You must respond with a valid JSON object in the following format:
{
  "entities": [
    {
      "name": "EntityName",
      "type": "person|place|object|concept|event|system|module",
      "description": "Brief description of this entity",
      "properties": {
        "key": "value"
      }
    }
  ],
  "relations": [
    {
      "sourceEntity": "EntityName1",
      "targetEntity": "EntityName2",
      "relationType": "owns|uses|contains|depends-on|implements|associates|related-to|inherits|composes|calls",
      "description": "Description of the relationship"
    }
  ]
}

Guidelines:
1. Entity types: person (users, actors), place (locations), object (data entities, resources), concept (abstract ideas), event (actions), system (external systems), module (internal modules)
2. Relation types: owns (A owns B), uses (A uses B), contains (A contains B), depends-on (A depends on B), implements (A implements B), associates (A is associated with B), related-to (general relationship), inherits (A inherits from B), composes (A is composed of B), calls (A calls B)
3. Create meaningful entities that represent key concepts in the domain
4. Define clear relationships between entities
5. Include relevant properties for each entity
6. Focus on the domain logic, not implementation details`;

// ==================== Helper Functions ====================

/**
 * Parse AI response into structured domain model
 */
function parseDomainModelResponse(content: string): { entities: ExtractedEntity[]; relations: ExtractedRelation[] } | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      safeError('No JSON found in response');
      return null;
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!Array.isArray(parsed.entities)) {
      safeError('Invalid response: missing entities array');
      return null;
    }
    
    return {
      entities: parsed.entities || [],
      relations: parsed.relations || [],
    };
  } catch (error) {
    safeError('Failed to parse domain model response:', error);
    return null;
  }
}

/**
 * Build graph data from entities and relations
 */
function buildGraphData(
  entities: ExtractedEntity[],
  relations: ExtractedRelation[]
): DomainModelGraph {
  const nodes: GraphNode[] = entities.map((entity, index) => ({
    id: `node_${index}_${entity.name.toLowerCase().replace(/\s+/g, '_')}`,
    label: entity.name,
    type: entity.type,
    description: entity.description,
    properties: entity.properties,
  }));

  const edges: GraphEdge[] = relations.map((relation, index) => {
    // Find matching source and target nodes
    const sourceNode = nodes.find(
      n => n.label.toLowerCase() === relation.sourceEntity.toLowerCase()
    );
    const targetNode = nodes.find(
      n => n.label.toLowerCase() === relation.targetEntity.toLowerCase()
    );

    return {
      id: `edge_${index}`,
      source: sourceNode?.id || relation.sourceEntity,
      target: targetNode?.id || relation.targetEntity,
      label: relation.relationType,
      description: relation.description,
    };
  });

  return {
    nodes,
    edges,
    metadata: {
      totalEntities: entities.length,
      totalRelations: relations.length,
      generatedAt: new Date().toISOString(),
    },
  };
}

// ==================== API Routes ====================

/**
 * POST /api/domain-models/generate - Generate domain model from description
 * 
 * Request body:
 * - description: string (required) - Description of the domain model to generate
 * - projectId: string (optional) - Project ID to associate with entities
 * - saveToDatabase: boolean (optional) - Whether to save entities to database (default: false)
 * 
 * Response:
 * - graph: DomainModelGraph - The generated domain model as graph data
 * - entities: ExtractedEntity[] - Raw entities from AI
 * - relations: ExtractedRelation[] - Raw relations from AI
 */
domainModels.post('/generate', async (c) => {
  try {
    const body = await c.req.json();
    const { description, projectId, saveToDatabase } = body;

    if (!description) {
      return c.json({ error: 'Missing required field: description' }, 400);
    }

    const env = c.env;

    // Create AI service
    const aiService = createAIService(env);

    // Build prompt for domain model generation
    const userPrompt = `Generate a domain model for the following requirement:

"""
${description}
"""

Extract all relevant domain entities and their relationships. Think about the core concepts, their attributes, and how they interact.`;

    // Call AI for domain model generation
    const result = await aiService.generateJSON<{ entities: ExtractedEntity[]; relations: ExtractedRelation[] }>(
      userPrompt,
      {
        entities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              properties: { type: 'object' },
            },
            required: ['name', 'type'],
          },
        },
        relations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceEntity: { type: 'string' },
              targetEntity: { type: 'string' },
              relationType: { type: 'string' },
              description: { type: 'string' },
            },
            required: ['sourceEntity', 'targetEntity', 'relationType'],
          },
        },
      },
      {
        temperature: 0.4,
        maxTokens: 4096,
      }
    );

    if (!result.success || !result.data) {
      return c.json({ 
        error: 'Failed to generate domain model', 
        details: result.error 
      }, 500);
    }

    const { entities, relations } = result.data;

    // Build graph data
    const graph = buildGraphData(entities, relations);

    // Optionally save to database
    const savedEntities: DomainEntityRow[] = [];
    const savedRelations: EntityRelationRow[] = [];

    if (saveToDatabase && projectId) {
      const now = new Date().toISOString();
      const entityNameToId = new Map<string, string>();

      // Create domain entities
      for (const entity of entities) {
        const entityId = generateId();
        
        await executeDB(
          env,
          `INSERT INTO DomainEntity (id, projectId, name, type, description, properties, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            entityId,
            projectId,
            entity.name,
            entity.type,
            entity.description || null,
            entity.properties ? JSON.stringify(entity.properties) : null,
            now,
            now,
          ]
        );
        
        entityNameToId.set(entity.name.toLowerCase(), entityId);
        savedEntities.push({
          id: entityId,
          projectId,
          name: entity.name,
          type: entity.type,
          description: entity.description || null,
          properties: entity.properties ? JSON.stringify(entity.properties) : null,
          requirementId: null,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Create entity relations
      for (const relation of relations) {
        const sourceId = entityNameToId.get(relation.sourceEntity.toLowerCase());
        const targetId = entityNameToId.get(relation.targetEntity.toLowerCase());

        if (!sourceId || !targetId) {
          safeError(`Skipping relation: entity not found (${relation.sourceEntity} -> ${relation.targetEntity})`);
          continue;
        }

        if (sourceId === targetId) {
          safeError(`Skipping self-referencing relation: ${relation.sourceEntity}`);
          continue;
        }

        const relationId = generateId();
        
        await executeDB(
          env,
          `INSERT INTO EntityRelation (id, projectId, sourceEntityId, targetEntityId, relationType, description, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            relationId,
            projectId,
            sourceId,
            targetId,
            relation.relationType,
            relation.description || null,
            now,
            now,
          ]
        );
        
        savedRelations.push({
          id: relationId,
          projectId,
          sourceEntityId: sourceId,
          targetEntityId: targetId,
          relationType: relation.relationType,
          description: relation.description || null,
          properties: null,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return c.json({
      success: true,
      graph,
      entities,
      relations,
      savedToDatabase: saveToDatabase && !!projectId,
      savedEntities: saveToDatabase ? savedEntities : undefined,
      savedRelations: saveToDatabase ? savedRelations : undefined,
      metadata: {
        provider: result.provider,
        model: result.model,
        latency: result.latency,
      },
    }, 200);

  } catch (error) {
    safeError('Error generating domain model:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ 
      error: 'Failed to generate domain model', 
      details: errorMessage 
    }, 500);
  }
});

/**
 * GET /api/domain-models - Get domain model graph for a project
 * 
 * Query params:
 * - projectId: string (required) - Project ID to get domain model for
 * 
 * Response:
 * - graph: DomainModelGraph - Domain model as graph data
 * - entities: DomainEntityRow[]
 * - relations: EntityRelationRow[]
 */
domainModels.get('/', async (c) => {
  try {
    const projectId = c.req.query('projectId');

    if (!projectId) {
      return c.json({ error: 'Missing required query parameter: projectId' }, 400);
    }

    const env = c.env;

    // Fetch entities for the project
    const entities = await queryDB<DomainEntityRow>(
      env,
      'SELECT * FROM DomainEntity WHERE projectId = ? ORDER BY createdAt DESC',
      [projectId]
    );

    // Fetch relations for the project
    const entityIds = entities.map(e => e.id);
    let relations: EntityRelationRow[] = [];

    if (entityIds.length > 0) {
      const placeholders = entityIds.map(() => '?').join(',');
      relations = await queryDB<EntityRelationRow>(
        env,
        `SELECT * FROM EntityRelation WHERE sourceEntityId IN (${placeholders}) OR targetEntityId IN (${placeholders}) ORDER BY createdAt`,
        [...entityIds, ...entityIds]
      );
    }

    // Build graph data
    const nodes: GraphNode[] = entities.map(entity => ({
      id: entity.id,
      label: entity.name,
      type: entity.type,
      description: entity.description || undefined,
      properties: entity.properties ? JSON.parse(entity.properties) : undefined,
    }));

    const edges: GraphEdge[] = relations.map(relation => ({
      id: relation.id,
      source: relation.sourceEntityId,
      target: relation.targetEntityId,
      label: relation.relationType,
      description: relation.description || undefined,
    }));

    const graph: DomainModelGraph = {
      nodes,
      edges,
      metadata: {
        totalEntities: entities.length,
        totalRelations: relations.length,
        generatedAt: new Date().toISOString(),
      },
    };

    return c.json({
      success: true,
      graph,
      entities,
      relations,
    }, 200);

  } catch (error) {
    safeError('Error fetching domain model:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ 
      error: 'Failed to fetch domain model', 
      details: errorMessage 
    }, 500);
  }
});

export default domainModels;
