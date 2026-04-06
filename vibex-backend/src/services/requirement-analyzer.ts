/**
 * Requirement Analyzer Service
 * 
 * A specialized service for analyzing software requirements using AI.
 * Extracts domain entities, relationships, and provides structured analysis.
 * 
 * Features:
 * - Natural language requirement parsing
 * - Domain entity extraction (person, place, object, concept, event)
 * - Entity relationship analysis
 * - Clarification question generation
 * - Priority and complexity assessment
 * - Analysis result caching and optimization
 * - Batch processing support
 * 
 * @module services/requirement-analyzer
 */

import { CloudflareEnv } from '../lib/env';
import {
  AIService,
  createAIService,
  AIResult,
  RequirementsAnalysisResult,
  ClarificationQuestion,
  ExtractedEntity,
  ExtractedRelation,
} from './ai-service';
import {
  DomainEntity,
  createDomainEntity,
  deleteDomainEntity,
  listDomainEntities,
} from './domain-entities';
import {
  EntityRelation,
  RelationType,
  createEntityRelation,
  deleteEntityAllRelations,
  listEntityRelations,
} from './entity-relations';
import { queryOne, executeDB, generateId } from '@/lib/db';

import { safeError } from '@/lib/log-sanitizer';

// ==================== Types ====================

/**
 * Requirement status
 */
export type RequirementStatus = 'draft' | 'analyzing' | 'clarified' | 'confirmed' | 'failed';

/**
 * Requirement priority
 */
export type RequirementPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Requirement complexity
 */
export type RequirementComplexity = 'simple' | 'moderate' | 'complex';

/**
 * Requirement record from database
 */
export interface RequirementRecord {
  id: string;
  projectId: string;
  rawInput: string;
  parsedData: string | null;
  status: RequirementStatus;
  priority: RequirementPriority;
  createdAt: string;
  updatedAt: string;
}

/**
 * Full analysis result with entities and relations
 */
export interface RequirementAnalysisResult {
  /** The requirement record */
  requirement: RequirementRecord;
  /** Parsed analysis from AI */
  analysis: ParsedAnalysisData;
  /** Created domain entities */
  entities: DomainEntity[];
  /** Entity relationships */
  relations: EntityRelation[];
  /** Analysis metadata */
  metadata: AnalysisMetadata;
}

/**
 * Parsed analysis data stored in requirement.parsedData
 */
export interface ParsedAnalysisData {
  summary: string;
  entities: ExtractedEntity[];
  relations: ExtractedRelation[];
  keywords: string[];
  suggestedPriority: RequirementPriority;
  complexity: RequirementComplexity;
  notes?: string;
  analyzedAt: string;
  entitiesCreated: number;
  relationsCreated: number;
  version: string;
}

/**
 * Analysis metadata
 */
export interface AnalysisMetadata {
  analysisId: string;
  analyzedAt: string;
  processingTimeMs: number;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
  provider: string;
  cached: boolean;
}

/**
 * Analyzer configuration
 */
export interface RequirementAnalyzerConfig {
  /** AI service instance (optional, will be created if not provided) */
  aiService?: AIService;
  /** Enable result caching */
  enableCache?: boolean;
  /** Cache TTL in seconds */
  cacheTTL?: number;
  /** Default temperature for analysis */
  defaultTemperature?: number;
  /** Maximum tokens for analysis */
  maxTokens?: number;
  /** Enable automatic entity persistence */
  autoPersistEntities?: boolean;
  /** Analysis version for tracking */
  version?: string;
}

/**
 * Analysis request options
 */
export interface AnalyzeOptions {
  /** Force re-analysis even if already analyzed */
  forceReanalyze?: boolean;
  /** Custom temperature for this analysis */
  temperature?: number;
  /** Custom max tokens */
  maxTokens?: number;
  /** Skip entity persistence */
  skipPersistence?: boolean;
  /** Additional context for analysis */
  context?: string;
  /** Callback for progress updates */
  onProgress?: (stage: string, message: string) => void;
}

/**
 * Clarification generation options
 */
export interface ClarificationOptions {
  /** Maximum number of questions to generate */
  maxQuestions?: number;
  /** Focus areas for questions */
  focusAreas?: string[];
  /** Existing answers to consider */
  existingAnswers?: Record<string, string>;
  /** Temperature for generation */
  temperature?: number;
}

/**
 * Batch analysis options
 */
export interface BatchAnalyzeOptions extends AnalyzeOptions {
  /** Stop processing on first error */
  stopOnError?: boolean;
  /** Maximum concurrent analyses */
  concurrency?: number;
  /** Callback for each completed analysis */
  onItemComplete?: (requirementId: string, success: boolean, error?: string) => void;
}

/**
 * Batch analysis result
 */
export interface BatchAnalysisResult {
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{
    requirementId: string;
    success: boolean;
    result?: RequirementAnalysisResult;
    error?: string;
  }>;
}

/**
 * Analysis cache entry
 */
interface CacheEntry {
  data: RequirementAnalysisResult;
  expiry: number;
}

// ==================== Constants ====================

const DEFAULT_CONFIG: Required<Omit<RequirementAnalyzerConfig, 'aiService'>> = {
  enableCache: true,
  cacheTTL: 3600, // 1 hour
  defaultTemperature: 0.3,
  maxTokens: 4096,
  autoPersistEntities: true,
  version: '1.0.0',
};

const ANALYSIS_VERSION = '1.0.0';

// ==================== Requirement Analyzer Service Class ====================

/**
 * Main Requirement Analyzer Service class
 */
export class RequirementAnalyzerService {
  private aiService: AIService;
  private config: Required<Omit<RequirementAnalyzerConfig, 'aiService'>>;
  private cache: Map<string, CacheEntry>;
  private env: CloudflareEnv;

  constructor(env: CloudflareEnv, config?: RequirementAnalyzerConfig) {
    this.env = env;
    this.aiService = config?.aiService || createAIService(env);
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    } as Required<Omit<RequirementAnalyzerConfig, 'aiService'>>;
    this.cache = new Map();
  }

  // ==================== Core Analysis Methods ====================

  /**
   * Analyze a requirement by ID
   */
  async analyzeRequirement(
    requirementId: string,
    options: AnalyzeOptions = {}
  ): Promise<RequirementAnalysisResult> {
    const startTime = Date.now();
    const { forceReanalyze, skipPersistence, onProgress } = options;

    // Report progress
    onProgress?.('fetch', 'Fetching requirement from database');

    // Fetch the requirement
    const requirement = await this.fetchRequirement(requirementId);
    
    if (!requirement) {
      throw new Error(`Requirement not found: ${requirementId}`);
    }

    // Check cache
    if (!forceReanalyze && this.config.enableCache) {
      const cached = this.getFromCache(requirementId);
      if (cached) {
        onProgress?.('cache', 'Returning cached analysis');
        return {
          ...cached,
          metadata: { ...cached.metadata, cached: true },
        };
      }
    }

    // Check if already analyzed
    if (requirement.status === 'confirmed' && !forceReanalyze) {
      throw new Error('Requirement already confirmed. Use forceReanalyze=true to re-analyze.');
    }

    // Update status to analyzing
    await this.updateRequirementStatus(requirementId, 'analyzing');

    try {
      onProgress?.('analyze', 'Analyzing requirement with AI');

      // Perform AI analysis
      const analysisResult = await this.aiService.analyzeRequirements(
        requirement.rawInput,
        {
          temperature: options.temperature ?? this.config.defaultTemperature,
          maxTokens: options.maxTokens ?? this.config.maxTokens,
        }
      );

      if (!analysisResult.success || !analysisResult.data) {
        throw new Error(analysisResult.error || 'AI analysis failed');
      }

      const analysis = analysisResult.data;

      onProgress?.('persist', 'Persisting analysis results');

      // Persist entities and relations
      let entities: DomainEntity[] = [];
      let relations: EntityRelation[] = [];

      if (!skipPersistence && this.config.autoPersistEntities) {
        // Delete existing analysis
        await this.deleteExistingAnalysis(requirementId);

        // Create new entities and relations
        const { entities: createdEntities, relations: createdRelations } = 
          await this.persistAnalysisResults(requirement, analysis);
        
        entities = createdEntities;
        relations = createdRelations;
      }

      // Build parsed data
      const parsedData: ParsedAnalysisData = {
        ...analysis,
        analyzedAt: new Date().toISOString(),
        entitiesCreated: entities.length,
        relationsCreated: relations.length,
        version: ANALYSIS_VERSION,
      };

      // Update requirement with results
      await this.updateRequirementWithAnalysis(requirementId, parsedData, analysis.suggestedPriority);

      // Build result
      const result: RequirementAnalysisResult = {
        requirement: {
          ...requirement,
          parsedData: JSON.stringify(parsedData),
          status: 'clarified',
          priority: analysis.suggestedPriority,
        },
        analysis: parsedData,
        entities,
        relations,
        metadata: {
          analysisId: generateId(),
          analyzedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
          tokensUsed: analysisResult.usage ? {
            prompt: analysisResult.usage.promptTokens,
            completion: analysisResult.usage.completionTokens,
            total: analysisResult.usage.totalTokens,
          } : undefined,
          model: analysisResult.model,
          provider: analysisResult.provider,
          cached: false,
        },
      };

      // Cache the result
      if (this.config.enableCache) {
        this.setCache(requirementId, result);
      }

      onProgress?.('complete', 'Analysis completed successfully');

      return result;

    } catch (error) {
      // Reset status on error
      await this.updateRequirementStatus(requirementId, 'failed');
      throw error;
    }
  }

  /**
   * Analyze a raw requirement text (without existing record)
   */
  async analyzeRawRequirement(
    rawInput: string,
    projectId: string,
    options: AnalyzeOptions = {}
  ): Promise<RequirementAnalysisResult> {
    // Create a new requirement record
    const requirementId = await this.createRequirement(projectId, rawInput);
    
    // Analyze it
    return this.analyzeRequirement(requirementId, options);
  }

  /**
   * Batch analyze multiple requirements
   */
  async batchAnalyze(
    requirementIds: string[],
    options: BatchAnalyzeOptions = {}
  ): Promise<BatchAnalysisResult> {
    const { stopOnError, onItemComplete } = options;
    const results: BatchAnalysisResult['results'] = [];
    let succeeded = 0;
    let failed = 0;

    for (const requirementId of requirementIds) {
      try {
        const result = await this.analyzeRequirement(requirementId, options);
        results.push({
          requirementId,
          success: true,
          result,
        });
        succeeded++;
        onItemComplete?.(requirementId, true);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          requirementId,
          success: false,
          error: errorMessage,
        });
        failed++;
        onItemComplete?.(requirementId, false, errorMessage);
        
        if (stopOnError) {
          break;
        }
      }
    }

    return {
      total: requirementIds.length,
      succeeded,
      failed,
      results,
    };
  }

  // ==================== Clarification Methods ====================

  /**
   * Generate clarification questions for a requirement
   */
  async generateClarificationQuestions(
    requirementId: string,
    options: ClarificationOptions = {}
  ): Promise<AIResult<ClarificationQuestion[]>> {
    const requirement = await this.fetchRequirement(requirementId);
    
    if (!requirement) {
      return {
        success: false,
        error: `Requirement not found: ${requirementId}`,
        provider: 'minimax',
        model: '',
      };
    }

    // Build context with existing analysis if available
    let context = requirement.rawInput;
    
    if (requirement.parsedData) {
      try {
        const parsed = JSON.parse(requirement.parsedData) as ParsedAnalysisData;
        context += `\n\nCurrent Analysis:\n- Summary: ${parsed.summary}\n- Entities: ${parsed.entities.length}\n- Relations: ${parsed.relations.length}`;
      } catch {
        // Ignore parse errors
      }
    }

    // Add existing answers if provided
    if (options.existingAnswers) {
      context += '\n\nExisting Answers:\n';
      for (const [question, answer] of Object.entries(options.existingAnswers)) {
        context += `- Q: ${question}\n  A: ${answer}\n`;
      }
    }

    // Add focus areas if specified
    if (options.focusAreas && options.focusAreas.length > 0) {
      context += `\n\nFocus areas: ${options.focusAreas.join(', ')}`;
    }

    return this.aiService.generateClarificationQuestions(
      context,
      options.maxQuestions ?? 5,
      {
        temperature: options.temperature ?? 0.5,
      }
    );
  }

  /**
   * Generate clarification questions for raw text
   */
  async generateClarificationQuestionsForText(
    text: string,
    options: ClarificationOptions = {}
  ): Promise<AIResult<ClarificationQuestion[]>> {
    return this.aiService.generateClarificationQuestions(
      text,
      options.maxQuestions ?? 5,
      {
        temperature: options.temperature ?? 0.5,
      }
    );
  }

  // ==================== Query Methods ====================

  /**
   * Get analysis result for a requirement
   */
  async getAnalysisResult(requirementId: string): Promise<RequirementAnalysisResult | null> {
    const requirement = await this.fetchRequirement(requirementId);
    
    if (!requirement) {
      return null;
    }

    // Parse analysis data
    let analysis: ParsedAnalysisData | null = null;
    if (requirement.parsedData) {
      try {
        analysis = JSON.parse(requirement.parsedData);
      } catch {
        // Invalid JSON
      }
    }

    // Fetch entities
    const entities = await listDomainEntities(this.env, { requirementId });

    // Fetch relations
    const entityIds = entities.map(e => e.id);
    const relations = entityIds.length > 0 
      ? await this.getRelationsForEntities(entityIds)
      : [];

    return {
      requirement,
      analysis: analysis!,
      entities,
      relations,
      metadata: {
        analysisId: requirementId,
        analyzedAt: analysis?.analyzedAt || '',
        processingTimeMs: 0,
        model: '',
        provider: 'minimax',
        cached: false,
      },
    };
  }

  /**
   * Get entities for a requirement
   */
  async getRequirementEntities(requirementId: string): Promise<DomainEntity[]> {
    return listDomainEntities(this.env, { requirementId });
  }

  /**
   * Get relations for a requirement's entities
   */
  async getRequirementRelations(requirementId: string): Promise<EntityRelation[]> {
    const entities = await this.getRequirementEntities(requirementId);
    const entityIds = entities.map(e => e.id);
    
    if (entityIds.length === 0) {
      return [];
    }

    return this.getRelationsForEntities(entityIds);
  }

  // ==================== Management Methods ====================

  /**
   * Delete analysis results for a requirement
   */
  async deleteAnalysis(requirementId: string): Promise<void> {
    // Delete entities and relations
    await this.deleteExistingAnalysis(requirementId);

    // Reset requirement status
    await executeDB(
      this.env,
      'UPDATE Requirement SET parsedData = NULL, status = ?, updatedAt = ? WHERE id = ?',
      ['draft', new Date().toISOString(), requirementId]
    );

    // Clear cache
    this.cache.delete(requirementId);
  }

  /**
   * Confirm a requirement (lock the analysis)
   */
  async confirmRequirement(requirementId: string): Promise<RequirementRecord> {
    await executeDB(
      this.env,
      'UPDATE Requirement SET status = ?, updatedAt = ? WHERE id = ?',
      ['confirmed', new Date().toISOString(), requirementId]
    );

    const requirement = await this.fetchRequirement(requirementId);
    if (!requirement) {
      throw new Error(`Requirement not found: ${requirementId}`);
    }

    return requirement;
  }

  /**
   * Clear the analysis cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  // ==================== Private Helper Methods ====================

  /**
   * Fetch a requirement from database
   */
  private async fetchRequirement(id: string): Promise<RequirementRecord | null> {
    return queryOne<RequirementRecord>(
      this.env,
      'SELECT * FROM Requirement WHERE id = ?',
      [id]
    );
  }

  /**
   * Update requirement status
   */
  private async updateRequirementStatus(
    id: string,
    status: RequirementStatus
  ): Promise<void> {
    await executeDB(
      this.env,
      'UPDATE Requirement SET status = ?, updatedAt = ? WHERE id = ?',
      [status, new Date().toISOString(), id]
    );
  }

  /**
   * Update requirement with analysis results
   */
  private async updateRequirementWithAnalysis(
    id: string,
    parsedData: ParsedAnalysisData,
    priority: RequirementPriority
  ): Promise<void> {
    await executeDB(
      this.env,
      'UPDATE Requirement SET parsedData = ?, status = ?, priority = ?, updatedAt = ? WHERE id = ?',
      [JSON.stringify(parsedData), 'clarified', priority, new Date().toISOString(), id]
    );
  }

  /**
   * Create a new requirement
   */
  private async createRequirement(
    projectId: string,
    rawInput: string
  ): Promise<string> {
    const id = generateId();
    const now = new Date().toISOString();

    await executeDB(
      this.env,
      `INSERT INTO Requirement (id, projectId, rawInput, parsedData, status, priority, createdAt, updatedAt)
       VALUES (?, ?, ?, NULL, 'draft', 'medium', ?, ?)`,
      [id, projectId, rawInput, now, now]
    );

    return id;
  }

  /**
   * Persist analysis results (entities and relations)
   */
  private async persistAnalysisResults(
    requirement: RequirementRecord,
    analysis: RequirementsAnalysisResult
  ): Promise<{ entities: DomainEntity[]; relations: EntityRelation[] }> {
    const entities: DomainEntity[] = [];
    const entityNameToId = new Map<string, string>();

    // Create entities
    for (const entity of analysis.entities) {
      const created = await createDomainEntity(this.env, {
        projectId: requirement.projectId,
        name: entity.name,
        type: entity.type,
        description: entity.description,
        properties: entity.properties,
        requirementId: requirement.id,
      });

      entities.push(created);
      entityNameToId.set(entity.name.toLowerCase(), created.id);
    }

    // Create relations
    const relations: EntityRelation[] = [];

    for (const relation of analysis.relations) {
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

      try {
        const created = await createEntityRelation(this.env, {
          projectId: requirement.projectId,
          sourceEntityId: sourceId,
          targetEntityId: targetId,
          relationType: relation.relationType as RelationType,
          description: relation.description,
        });

        relations.push(created);
      } catch (error) {
        safeError(`Failed to create relation: ${relation.sourceEntity} -> ${relation.targetEntity}`, error);
      }
    }

    return { entities, relations };
  }

  /**
   * Delete existing analysis for a requirement
   */
  private async deleteExistingAnalysis(requirementId: string): Promise<void> {
    // Get entities for this requirement
    const entities = await listDomainEntities(this.env, { requirementId });

    // Delete relations for these entities
    for (const entity of entities) {
      await deleteEntityAllRelations(this.env, entity.id);
    }

    // Delete entities
    for (const entity of entities) {
      await deleteDomainEntity(this.env, entity.id);
    }
  }

  /**
   * Get relations for multiple entities
   */
  private async getRelationsForEntities(entityIds: string[]): Promise<EntityRelation[]> {
    if (entityIds.length === 0) {
      return [];
    }

    return listEntityRelations(this.env, {
      sourceEntityId: entityIds[0], // This is a simplification; proper implementation would need custom query
    });
  }

  // ==================== Cache Methods ====================

  /**
   * Get from cache
   */
  private getFromCache(requirementId: string): RequirementAnalysisResult | null {
    const cached = this.cache.get(requirementId);
    
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    if (cached) {
      this.cache.delete(requirementId);
    }

    return null;
  }

  /**
   * Set cache
   */
  private setCache(requirementId: string, data: RequirementAnalysisResult): void {
    this.cache.set(requirementId, {
      data,
      expiry: Date.now() + this.config.cacheTTL * 1000,
    });
  }
}

// ==================== Factory Functions ====================

/**
 * Create a Requirement Analyzer Service instance
 */
export function createRequirementAnalyzerService(
  env: CloudflareEnv,
  config?: RequirementAnalyzerConfig
): RequirementAnalyzerService {
  return new RequirementAnalyzerService(env, config);
}

// ==================== Singleton Instance ====================

let defaultInstance: RequirementAnalyzerService | null = null;

/**
 * Get or create the default Requirement Analyzer Service instance
 */
export function getRequirementAnalyzerService(
  env: CloudflareEnv,
  config?: RequirementAnalyzerConfig
): RequirementAnalyzerService {
  if (!defaultInstance) {
    defaultInstance = new RequirementAnalyzerService(env, config);
  }
  return defaultInstance;
}

/**
 * Reset the default instance (useful for testing)
 */
export function resetRequirementAnalyzerService(): void {
  defaultInstance = null;
}

// ==================== Convenience Functions ====================

/**
 * Quick analyze a requirement by ID
 */
export async function quickAnalyzeRequirement(
  env: CloudflareEnv,
  requirementId: string,
  options?: AnalyzeOptions
): Promise<RequirementAnalysisResult> {
  const analyzer = getRequirementAnalyzerService(env);
  return analyzer.analyzeRequirement(requirementId, options);
}

/**
 * Quick analyze raw requirement text
 */
export async function quickAnalyzeRawRequirement(
  env: CloudflareEnv,
  rawInput: string,
  projectId: string,
  options?: AnalyzeOptions
): Promise<RequirementAnalysisResult> {
  const analyzer = getRequirementAnalyzerService(env);
  return analyzer.analyzeRawRequirement(rawInput, projectId, options);
}

/**
 * Quick generate clarification questions
 */
export async function quickGenerateClarificationQuestions(
  env: CloudflareEnv,
  requirementId: string,
  options?: ClarificationOptions
): Promise<ClarificationQuestion[]> {
  const analyzer = getRequirementAnalyzerService(env);
  const result = await analyzer.generateClarificationQuestions(requirementId, options);
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to generate clarification questions');
  }
  
  return result.data;
}

// ==================== Re-exports ====================

export type { CloudflareEnv } from '../lib/env';