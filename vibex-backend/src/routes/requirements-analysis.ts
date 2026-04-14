/**
 * @deprecated This router uses the legacy Page Router API.
 * All routes have been migrated to Next.js App Router (app/api/).
 * See: docs/migration/page-router-to-app-router.md
 * This file will be removed after E1 security fixes are complete.
 */
/**
 * Requirements Analysis API Routes
 *
 * Provides endpoints for analyzing requirements using LLM to extract:
 * - Domain entities (people, places, objects, concepts, events)
 * - Entity relationships (dependencies, associations, etc.)
 * - Structured requirement data
 *
 * @module routes/requirements-analysis
 */

import { Hono } from 'hono';
import { queryOne, queryDB, executeDB, generateId, Env } from '@/lib/db';
import { createLLMService, LLMService, ChatMessage } from '@/services/llm';

import { safeError } from '@/lib/log-sanitizer';
import { apiError, ERROR_CODES } from '@/lib/api-error';

const requirementsAnalysis = new Hono<{ Bindings: Env }>();

// ==================== Types ====================

interface RequirementRow {
  id: string;
  projectId: string;
  rawInput: string;
  parsedData: string | null;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

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

interface ExtractedEntity {
  name: string;
  type: 'person' | 'place' | 'object' | 'concept' | 'event';
  description?: string;
  properties?: Record<string, unknown>;
}

interface ExtractedRelation {
  sourceEntity: string;
  targetEntity: string;
  relationType: string;
  description?: string;
}

interface AnalysisResult {
  summary: string;
  entities: ExtractedEntity[];
  relations: ExtractedRelation[];
  keywords: string[];
  suggestedPriority: 'low' | 'medium' | 'high' | 'critical';
  complexity: 'simple' | 'moderate' | 'complex';
  notes?: string;
}

// ==================== LLM Prompts ====================

const ANALYSIS_SYSTEM_PROMPT = `You are an expert requirements analyst. Your task is to analyze a software requirement and extract structured information.

You must respond with a valid JSON object in the following format:
{
  "summary": "A concise summary of the requirement (1-2 sentences)",
  "entities": [
    {
      "name": "EntityName",
      "type": "person|place|object|concept|event",
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
      "relationType": "owns|uses|contains|depends-on|implements|associates|related-to",
      "description": "Description of the relationship"
    }
  ],
  "keywords": ["keyword1", "keyword2"],
  "suggestedPriority": "low|medium|high|critical",
  "complexity": "simple|moderate|complex",
  "notes": "Any additional observations or recommendations"
}

Guidelines:
1. Entity types: person (users, actors), place (locations), object (data entities, resources), concept (abstract ideas, processes), event (actions, occurrences)
2. Relation types: owns, uses, contains, depends-on, implements, associates, related-to
3. Be precise - only extract entities that are clearly mentioned or implied
4. Properties should capture key attributes mentioned in the requirement
5. Priority is based on business impact and urgency
6. Complexity is based on the number of entities, relations, and implementation difficulty`;

// ==================== Helper Functions ====================

/**
 * Parse LLM response as JSON with error handling
 */
function parseAnalysisResponse(content: string): AnalysisResult | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!parsed.summary || !Array.isArray(parsed.entities)) {
      return null;
    }
    
    return {
      summary: parsed.summary,
      entities: parsed.entities || [],
      relations: parsed.relations || [],
      keywords: parsed.keywords || [],
      suggestedPriority: parsed.suggestedPriority || 'medium',
      complexity: parsed.complexity || 'moderate',
      notes: parsed.notes,
    };
  } catch (error) {
    safeError('Failed to parse analysis response:', error);
    return null;
  }
}

/**
 * Create domain entities from extracted entities
 */
async function createDomainEntities(
  env: Env,
  projectId: string,
  requirementId: string,
  entities: ExtractedEntity[]
): Promise<Map<string, string>> {
  const entityNameToId = new Map<string, string>();
  const now = new Date().toISOString();

  for (const entity of entities) {
    const entityId = generateId();
    
    await executeDB(
      env,
      `INSERT INTO DomainEntity (id, projectId, name, type, description, properties, requirementId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entityId,
        projectId,
        entity.name,
        entity.type,
        entity.description || null,
        entity.properties ? JSON.stringify(entity.properties) : null,
        requirementId,
        now,
        now,
      ]
    );
    
    entityNameToId.set(entity.name.toLowerCase(), entityId);
  }

  return entityNameToId;
}

/**
 * Create entity relations from extracted relations
 */
async function createEntityRelations(
  env: Env,
  projectId: string,
  entityNameToId: Map<string, string>,
  relations: ExtractedRelation[]
): Promise<number> {
  const now = new Date().toISOString();
  let createdCount = 0;

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
    
    createdCount++;
  }

  return createdCount;
}

/**
 * Delete existing analysis results for a requirement
 */
async function deleteExistingAnalysis(env: Env, requirementId: string): Promise<void> {
  // Get entities for this requirement
  const entities = await queryDB<DomainEntityRow>(
    env,
    'SELECT id FROM DomainEntity WHERE requirementId = ?',
    [requirementId]
  );

  if (entities.length > 0) {
    const entityIds = entities.map(e => e.id);
    
    // Delete relations for these entities
    const placeholders = entityIds.map(() => '?').join(',');
    await executeDB(
      env,
      `DELETE FROM EntityRelation WHERE sourceEntityId IN (${placeholders}) OR targetEntityId IN (${placeholders})`,
      [...entityIds, ...entityIds]
    );
    
    // Delete entities
    await executeDB(
      env,
      `DELETE FROM DomainEntity WHERE requirementId = ?`,
      [requirementId]
    );
  }
}

// ==================== API Routes ====================

/**
 * POST /api/requirements-analysis - Analyze a requirement
 * 
 * Request body:
 * - requirementId: string (required) - ID of the requirement to analyze
 * - forceReanalyze: boolean (optional) - Force re-analysis even if already analyzed
 * 
 * Response:
 * - analysis: AnalysisResult
 * - entities: DomainEntityRow[]
 * - relations: EntityRelationRow[]
 */
requirementsAnalysis.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { requirementId, forceReanalyze } = body;

    if (!requirementId) {
      return         c.json(apiError('Missing required field: requirementId', ERROR_CODES.BAD_REQUEST), 400);
    }

    const env = c.env;

    // Fetch the requirement
    const requirement = await queryOne<RequirementRow>(
      env,
      'SELECT * FROM Requirement WHERE id = ?',
      [requirementId]
    );

    if (!requirement) {
      return         c.json(apiError('Requirement not found', ERROR_CODES.NOT_FOUND), 404);
    }

    // Check if already analyzed (unless force reanalyze)
    if (requirement.status === 'confirmed' && !forceReanalyze) {
      return         c.json(apiError('Requirement already confirmed. Use forceReanalyze=true to re-analyze.', ERROR_CODES.BAD_REQUEST), 400);
    }

    // Update status to analyzing
    await executeDB(
      env,
      'UPDATE Requirement SET status = ?, updatedAt = ? WHERE id = ?',
      ['analyzing', new Date().toISOString(), requirementId]
    );

    try {
      // Create LLM service
      const llmService = createLLMService(env);

      // Build analysis prompt
      const userPrompt = `Please analyze the following software requirement and extract structured information:

Requirement:
"""
${requirement.rawInput}
"""

Extract all domain entities, their relationships, and provide a structured analysis.`;

      const messages: ChatMessage[] = [
        { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ];

      // Call LLM for analysis
      const response = await llmService.chat({
        messages,
        temperature: 0.3, // Lower temperature for more consistent extraction
        maxTokens: 4096,
        responseFormat: 'json_object',
      });

      const analysisResult = parseAnalysisResponse(response.content);

      if (!analysisResult) {
        throw new Error('Failed to parse LLM analysis response');
      }

      // Delete existing analysis if re-analyzing
      if (forceReanalyze || requirement.parsedData) {
        await deleteExistingAnalysis(env, requirementId);
      }

      // Create domain entities
      const entityNameToId = await createDomainEntities(
        env,
        requirement.projectId,
        requirementId,
        analysisResult.entities
      );

      // Create entity relations
      const relationsCreated = await createEntityRelations(
        env,
        requirement.projectId,
        entityNameToId,
        analysisResult.relations
      );

      // Update requirement with parsed data and status
      const parsedData = JSON.stringify({
        ...analysisResult,
        analyzedAt: new Date().toISOString(),
        entitiesCreated: analysisResult.entities.length,
        relationsCreated,
      });

      await executeDB(
        env,
        'UPDATE Requirement SET parsedData = ?, status = ?, priority = ?, updatedAt = ? WHERE id = ?',
        [parsedData, 'clarified', analysisResult.suggestedPriority, new Date().toISOString(), requirementId]
      );

      // Fetch created entities and relations
      const createdEntities = await queryDB<DomainEntityRow>(
        env,
        'SELECT * FROM DomainEntity WHERE requirementId = ? ORDER BY createdAt',
        [requirementId]
      );

      const entityIds = createdEntities.map(e => e.id);
      let createdRelations: EntityRelationRow[] = [];

      if (entityIds.length > 0) {
        const placeholders = entityIds.map(() => '?').join(',');
        createdRelations = await queryDB<EntityRelationRow>(
          env,
          `SELECT * FROM EntityRelation WHERE sourceEntityId IN (${placeholders}) OR targetEntityId IN (${placeholders}) ORDER BY createdAt`,
          [...entityIds, ...entityIds]
        );
      }

      return c.json({
        success: true,
        analysis: analysisResult,
        entities: createdEntities,
        relations: createdRelations,
        requirement: {
          ...requirement,
          parsedData,
          status: 'clarified',
          priority: analysisResult.suggestedPriority,
        },
      }, 200);

    } catch (llmError) {
      // Reset status on error
      await executeDB(
        env,
        'UPDATE Requirement SET status = ?, updatedAt = ? WHERE id = ?',
        ['draft', new Date().toISOString(), requirementId]
      );
      throw llmError;
    }

  } catch (error) {
    safeError('Error analyzing requirement:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return         c.json(apiError('Failed to analyze requirement', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

/**
 * POST /api/requirements-analysis/batch - Analyze multiple requirements
 * 
 * Request body:
 * - requirementIds: string[] (required) - Array of requirement IDs to analyze
 * - stopOnError: boolean (optional) - Stop processing on first error (default: false)
 * 
 * Response:
 * - results: Array of individual analysis results
 * - errors: Array of errors for failed analyses
 */
requirementsAnalysis.post('/batch', async (c) => {
  try {
    const body = await c.req.json();
    const { requirementIds, stopOnError } = body;

    if (!requirementIds || !Array.isArray(requirementIds) || requirementIds.length === 0) {
      return         c.json(apiError('Missing or invalid field: requirementIds (must be a non-empty array)', ERROR_CODES.BAD_REQUEST), 400);
    }

    const results: Array<{
      requirementId: string;
      success: boolean;
      analysis?: AnalysisResult;
      entities?: DomainEntityRow[];
      relations?: EntityRelationRow[];
      error?: string;
    }> = [];

    for (const requirementId of requirementIds) {
      try {
        // Re-use the single analysis logic by creating a sub-request
        const env = c.env;

        // Fetch the requirement
        const requirement = await queryOne<RequirementRow>(
          env,
          'SELECT * FROM Requirement WHERE id = ?',
          [requirementId]
        );

        if (!requirement) {
          results.push({
            requirementId,
            success: false,
            error: 'Requirement not found',
          });
          if (stopOnError) break;
          continue;
        }

        // Check if already analyzed
        if (requirement.status === 'confirmed') {
          results.push({
            requirementId,
            success: false,
            error: 'Requirement already confirmed',
          });
          if (stopOnError) break;
          continue;
        }

        // Update status to analyzing
        await executeDB(
          env,
          'UPDATE Requirement SET status = ?, updatedAt = ? WHERE id = ?',
          ['analyzing', new Date().toISOString(), requirementId]
        );

        try {
          // Create LLM service
          const llmService = createLLMService(env);

          const userPrompt = `Please analyze the following software requirement and extract structured information:

Requirement:
"""
${requirement.rawInput}
"""

Extract all domain entities, their relationships, and provide a structured analysis.`;

          const messages: ChatMessage[] = [
            { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ];

          const response = await llmService.chat({
            messages,
            temperature: 0.3,
            maxTokens: 4096,
            responseFormat: 'json_object',
          });

          const analysisResult = parseAnalysisResponse(response.content);

          if (!analysisResult) {
            throw new Error('Failed to parse LLM analysis response');
          }

          // Delete existing analysis
          await deleteExistingAnalysis(env, requirementId);

          // Create domain entities
          const entityNameToId = await createDomainEntities(
            env,
            requirement.projectId,
            requirementId,
            analysisResult.entities
          );

          // Create entity relations
          const relationsCreated = await createEntityRelations(
            env,
            requirement.projectId,
            entityNameToId,
            analysisResult.relations
          );

          // Update requirement
          const parsedData = JSON.stringify({
            ...analysisResult,
            analyzedAt: new Date().toISOString(),
            entitiesCreated: analysisResult.entities.length,
            relationsCreated,
          });

          await executeDB(
            env,
            'UPDATE Requirement SET parsedData = ?, status = ?, priority = ?, updatedAt = ? WHERE id = ?',
            [parsedData, 'clarified', analysisResult.suggestedPriority, new Date().toISOString(), requirementId]
          );

          // Fetch created entities and relations
          const createdEntities = await queryDB<DomainEntityRow>(
            env,
            'SELECT * FROM DomainEntity WHERE requirementId = ? ORDER BY createdAt',
            [requirementId]
          );

          const entityIds = createdEntities.map(e => e.id);
          let createdRelations: EntityRelationRow[] = [];

          if (entityIds.length > 0) {
            const placeholders = entityIds.map(() => '?').join(',');
            createdRelations = await queryDB<EntityRelationRow>(
              env,
              `SELECT * FROM EntityRelation WHERE sourceEntityId IN (${placeholders}) OR targetEntityId IN (${placeholders}) ORDER BY createdAt`,
              [...entityIds, ...entityIds]
            );
          }

          results.push({
            requirementId,
            success: true,
            analysis: analysisResult,
            entities: createdEntities,
            relations: createdRelations,
          });

        } catch (analysisError) {
          // Reset status on error
          await executeDB(
            env,
            'UPDATE Requirement SET status = ?, updatedAt = ? WHERE id = ?',
            ['draft', new Date().toISOString(), requirementId]
          );
          throw analysisError;
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          requirementId,
          success: false,
          error: errorMessage,
        });
        if (stopOnError) break;
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return c.json({
      success: true,
      summary: {
        total: requirementIds.length,
        succeeded: successCount,
        failed: errorCount,
      },
      results,
    }, 200);

  } catch (error) {
    safeError('Error in batch analysis:', error);
    return         c.json(apiError('Failed to perform batch analysis', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

/**
 * GET /api/requirements-analysis/:requirementId - Get analysis results for a requirement
 * 
 * Response:
 * - requirement: RequirementRow
 * - analysis: AnalysisResult (parsed from parsedData)
 * - entities: DomainEntityRow[]
 * - relations: EntityRelationRow[]
 */
requirementsAnalysis.get('/:requirementId', async (c) => {
  try {
    const requirementId = c.req.param('requirementId');
    const env = c.env;

    // Fetch the requirement
    const requirement = await queryOne<RequirementRow>(
      env,
      'SELECT * FROM Requirement WHERE id = ?',
      [requirementId]
    );

    if (!requirement) {
      return         c.json(apiError('Requirement not found', ERROR_CODES.NOT_FOUND), 404);
    }

    // Parse analysis result from parsedData
    let analysis: AnalysisResult | null = null;
    if (requirement.parsedData) {
      try {
        analysis = JSON.parse(requirement.parsedData);
      } catch {
        // Invalid JSON in parsedData
      }
    }

    // Fetch associated entities
    const entities = await queryDB<DomainEntityRow>(
      env,
      'SELECT * FROM DomainEntity WHERE requirementId = ? ORDER BY createdAt',
      [requirementId]
    );

    // Fetch relations for these entities
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

    return c.json({
      success: true,
      requirement,
      analysis,
      entities,
      relations,
    }, 200);

  } catch (error) {
    safeError('Error fetching analysis:', error);
    return         c.json(apiError('Failed to fetch analysis', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

/**
 * DELETE /api/requirements-analysis/:requirementId - Delete analysis results
 * 
 * Deletes all domain entities and relations associated with the requirement,
 * and resets the requirement status to draft.
 */
requirementsAnalysis.delete('/:requirementId', async (c) => {
  try {
    const requirementId = c.req.param('requirementId');
    const env = c.env;

    // Fetch the requirement
    const requirement = await queryOne<RequirementRow>(
      env,
      'SELECT * FROM Requirement WHERE id = ?',
      [requirementId]
    );

    if (!requirement) {
      return         c.json(apiError('Requirement not found', ERROR_CODES.NOT_FOUND), 404);
    }

    // Delete existing analysis
    await deleteExistingAnalysis(env, requirementId);

    // Reset requirement status
    await executeDB(
      env,
      'UPDATE Requirement SET parsedData = NULL, status = ?, updatedAt = ? WHERE id = ?',
      ['draft', new Date().toISOString(), requirementId]
    );

    return c.json({
      success: true,
      message: 'Analysis results deleted successfully',
      requirementId,
    }, 200);

  } catch (error) {
    safeError('Error deleting analysis:', error);
    return         c.json(apiError('Failed to delete analysis', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

export default requirementsAnalysis;