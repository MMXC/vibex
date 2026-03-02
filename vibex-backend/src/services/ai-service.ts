/**
 * AI Service - Unified AI Capabilities Interface
 * 
 * A high-level service layer that provides unified AI capabilities for the VibeX application.
 * Wraps the LLM Provider service with domain-specific operations and business logic.
 * 
 * Features:
 * - Unified interface for all AI operations
 * - Domain-specific AI capabilities (requirements analysis, entity extraction, etc.)
 * - Streaming support for real-time responses
 * - Built-in prompt templates for common tasks
 * - Result caching and optimization
 * - Error handling and fallback strategies
 * 
 * @module services/ai-service
 */

import { CloudflareEnv } from '../lib/env';
import {
  LLMProviderService,
  createLLMProviderService,
  ChatMessage,
  LLMRequestOptions,
  LLMResponse,
  LLMStreamChunk,
  LLMProviderType,
} from './llm-provider';

// ==================== Types ====================

/**
 * AI Service configuration options
 */
export interface AIServiceConfig {
  /** Default provider to use */
  defaultProvider?: LLMProviderType;
  /** Default model to use */
  defaultModel?: string;
  /** Default temperature for generation */
  defaultTemperature?: number;
  /** Maximum tokens for responses */
  maxTokens?: number;
  /** Enable response caching */
  enableCache?: boolean;
  /** Cache TTL in seconds */
  cacheTTL?: number;
  /** Enable fallback to alternative providers */
  enableFallback?: boolean;
  /** Timeout for AI operations in milliseconds */
  timeout?: number;
}

/**
 * Requirements analysis result
 */
export interface RequirementsAnalysisResult {
  summary: string;
  entities: ExtractedEntity[];
  relations: ExtractedRelation[];
  keywords: string[];
  suggestedPriority: 'low' | 'medium' | 'high' | 'critical';
  complexity: 'simple' | 'moderate' | 'complex';
  notes?: string;
}

/**
 * Extracted domain entity
 */
export interface ExtractedEntity {
  name: string;
  type: 'person' | 'place' | 'object' | 'concept' | 'event';
  description?: string;
  properties?: Record<string, unknown>;
}

/**
 * Extracted entity relation
 */
export interface ExtractedRelation {
  sourceEntity: string;
  targetEntity: string;
  relationType: string;
  description?: string;
}

/**
 * Clarification question
 */
export interface ClarificationQuestion {
  id: string;
  question: string;
  type: 'open' | 'choice' | 'multiple';
  options?: string[];
  category: string;
  priority: 'low' | 'medium' | 'high';
}

/**
 * UI Generation result
 */
export interface UIGenerationResult {
  componentStructure: ComponentNode;
  layoutSpecification: LayoutSpec;
  stylingRules: StyleRule[];
  code: string;
}

/**
 * Component node in UI structure
 */
export interface ComponentNode {
  name: string;
  props: Record<string, unknown>;
  children?: ComponentNode[];
}

/**
 * Layout specification
 */
export interface LayoutSpec {
  type: 'flex' | 'grid' | 'stack';
  direction?: 'row' | 'column';
  gap?: number;
  padding?: number;
  responsive?: {
    mobile?: Partial<LayoutSpec>;
    tablet?: Partial<LayoutSpec>;
    desktop?: Partial<LayoutSpec>;
  };
}

/**
 * Style rule
 */
export interface StyleRule {
  selector: string;
  properties: Record<string, string>;
  responsive?: {
    mobile?: Record<string, string>;
    tablet?: Record<string, string>;
    desktop?: Record<string, string>;
  };
}

/**
 * Chat context for multi-turn conversations
 */
export interface ChatContext {
  conversationId: string;
  projectId?: string;
  userId?: string;
  history: ChatMessage[];
  metadata?: Record<string, unknown>;
}

/**
 * Streaming callback for real-time responses
 */
export type StreamCallback = (chunk: LLMStreamChunk) => void;

/**
 * AI operation result with metadata
 */
export interface AIResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  provider: LLMProviderType;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latency?: number;
}

// ==================== Prompt Templates ====================

const PROMPTS = {
  requirementsAnalysis: `You are an expert requirements analyst. Your task is to analyze a software requirement and extract structured information.

You must respond with a valid JSON object in the following format:
{
  "summary": "A concise summary of the requirement (1-2 sentences)",
  "entities": [
    {
      "name": "EntityName",
      "type": "person|place|object|concept|event",
      "description": "Brief description of this entity",
      "properties": { "key": "value" }
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
6. Complexity is based on the number of entities, relations, and implementation difficulty`,

  clarificationQuestions: `You are an expert requirements analyst. Your task is to generate clarification questions for a software requirement.

Analyze the requirement and identify areas that need clarification. These may include:
- Ambiguous terms or concepts
- Missing technical details
- Unclear user interactions
- Data model ambiguities
- Edge cases not covered
- Performance requirements
- Security considerations
- Integration points

You must respond with a valid JSON object in the following format:
{
  "questions": [
    {
      "question": "The question text",
      "type": "open|choice|multiple",
      "options": ["option1", "option2"],
      "category": "functionality|data|ui|security|performance|integration|other",
      "priority": "low|medium|high"
    }
  ]
}

Guidelines:
1. Generate 3-7 focused questions that would help clarify the requirement
2. Use "open" type for free-form text answers
3. Use "choice" type when there are limited options (provide 2-5 options)
4. Use "multiple" type when multiple selections are allowed
5. Categories: functionality, data, ui, security, performance, integration, other
6. Priority reflects how critical the answer is to understanding the requirement
7. Questions should be specific and actionable`,

  entityExtraction: `You are an expert at extracting structured entities from text.

Extract all relevant entities from the provided text. Entities can be:
- Person: Users, actors, stakeholders
- Place: Locations, physical spaces
- Object: Data entities, resources, components
- Concept: Abstract ideas, processes, workflows
- Event: Actions, occurrences, triggers

Respond with a JSON array of entities:
[
  {
    "name": "EntityName",
    "type": "person|place|object|concept|event",
    "description": "Brief description",
    "properties": { "key": "value" }
  }
]`,

  relationAnalysis: `You are an expert at analyzing relationships between entities.

Given a list of entities, identify all meaningful relationships between them.

Relationship types:
- owns: Entity A owns or possesses Entity B
- uses: Entity A uses Entity B
- contains: Entity A contains Entity B
- depends-on: Entity A depends on Entity B
- implements: Entity A implements Entity B
- associates: Entity A is associated with Entity B
- related-to: General relationship

Respond with a JSON array of relations:
[
  {
    "sourceEntity": "EntityName1",
    "targetEntity": "EntityName2",
    "relationType": "owns|uses|contains|depends-on|implements|associates|related-to",
    "description": "Description of the relationship"
  }
]`,

  uiGeneration: `You are an expert UI/UX designer and frontend developer.

Generate a complete UI component structure based on the user's requirements.

Consider:
- Component hierarchy and composition
- Responsive design for mobile, tablet, and desktop
- Accessibility (WCAG guidelines)
- User experience best practices
- Performance optimization

Respond with a JSON object:
{
  "componentStructure": {
    "name": "ComponentName",
    "props": {},
    "children": []
  },
  "layoutSpecification": {
    "type": "flex|grid|stack",
    "direction": "row|column",
    "gap": 8,
    "padding": 16,
    "responsive": {}
  },
  "stylingRules": [
    {
      "selector": ".class",
      "properties": {},
      "responsive": {}
    }
  ],
  "code": "Complete code string"
}`,

  summarization: `You are an expert at summarizing text concisely and accurately.

Provide a clear, concise summary that captures the main points.

Guidelines:
- Keep the summary brief (2-4 sentences for short texts, 1 paragraph for longer texts)
- Focus on the most important information
- Maintain the original meaning and tone
- Use clear, simple language`,

  translation: `You are a professional translator.

Translate the provided text while:
- Preserving the original meaning and tone
- Using natural, fluent language in the target language
- Maintaining technical terms where appropriate
- Keeping formatting and structure intact`,
};

// ==================== AI Service Class ====================

/**
 * Main AI Service class providing unified AI capabilities
 */
export class AIService {
  private llmProvider: LLMProviderService;
  private config: Required<AIServiceConfig>;
  private cache: Map<string, { data: unknown; expiry: number }>;
  private env: CloudflareEnv;

  constructor(env: CloudflareEnv, config?: AIServiceConfig) {
    this.env = env;
    this.llmProvider = createLLMProviderService(env);
    
    // Default configuration
    this.config = {
      defaultProvider: config?.defaultProvider || 'minimax',
      defaultModel: config?.defaultModel || env.MINIMAX_MODEL || 'abab6.5s-chat',
      defaultTemperature: config?.defaultTemperature ?? 0.7,
      maxTokens: config?.maxTokens ?? 4096,
      enableCache: config?.enableCache ?? true,
      cacheTTL: config?.cacheTTL ?? 3600, // 1 hour
      enableFallback: config?.enableFallback ?? true,
      timeout: config?.timeout ?? 60000,
    };
    
    this.cache = new Map();
  }

  // ==================== Core Methods ====================

  /**
   * Execute an AI operation with caching, error handling, and fallback
   */
  private async executeWithFallback<T>(
    operation: string,
    fn: () => Promise<T>,
    cacheKey?: string
  ): Promise<AIResult<T>> {
    const startTime = Date.now();

    // Check cache
    if (cacheKey && this.config.enableCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        return {
          success: true,
          data: cached.data as T,
          provider: this.config.defaultProvider,
          model: this.config.defaultModel,
          latency: 0,
        };
      }
    }

    try {
      const result = await fn();
      const latency = Date.now() - startTime;

      // Cache result
      if (cacheKey && this.config.enableCache) {
        this.cache.set(cacheKey, {
          data: result,
          expiry: Date.now() + this.config.cacheTTL * 1000,
        });
      }

      return {
        success: true,
        data: result,
        provider: this.config.defaultProvider,
        model: this.config.defaultModel,
        latency,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage,
        provider: this.config.defaultProvider,
        model: this.config.defaultModel,
        latency: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate a cache key from operation and input
   */
  private generateCacheKey(operation: string, input: string): string {
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `${operation}:${hash}`;
  }

  /**
   * Parse JSON from LLM response with error handling
   */
  private parseJSON<T>(content: string): T | null {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (!jsonMatch) {
        return null;
      }
      return JSON.parse(jsonMatch[0]) as T;
    } catch {
      return null;
    }
  }

  // ==================== Chat Operations ====================

  /**
   * Send a chat message and get a response
   */
  async chat(
    message: string,
    context?: ChatContext,
    options?: Partial<LLMRequestOptions>
  ): Promise<AIResult<string>> {
    const messages: ChatMessage[] = context?.history || [];
    messages.push({ role: 'user', content: message });

    return this.executeWithFallback(
      'chat',
      async () => {
        const response = await this.llmProvider.chat({
          messages,
          temperature: options?.temperature ?? this.config.defaultTemperature,
          maxTokens: options?.maxTokens ?? this.config.maxTokens,
          ...options,
        });
        return response.content;
      }
    );
  }

  /**
   * Send a chat message with streaming response
   */
  async chatStream(
    message: string,
    onChunk: StreamCallback,
    context?: ChatContext,
    options?: Partial<LLMRequestOptions>
  ): Promise<void> {
    const messages: ChatMessage[] = context?.history || [];
    messages.push({ role: 'user', content: message });

    for await (const chunk of this.llmProvider.streamChat({
      messages,
      temperature: options?.temperature ?? this.config.defaultTemperature,
      maxTokens: options?.maxTokens ?? this.config.maxTokens,
      ...options,
    })) {
      onChunk(chunk);
      if (chunk.done || chunk.error) {
        break;
      }
    }
  }

  /**
   * Create a streaming Response object for HTTP endpoints
   */
  async createStreamingResponse(
    message: string,
    context?: ChatContext,
    options?: Partial<LLMRequestOptions>
  ): Promise<Response> {
    const messages: ChatMessage[] = context?.history || [];
    messages.push({ role: 'user', content: message });

    return this.llmProvider.createStreamingResponse({
      messages,
      temperature: options?.temperature ?? this.config.defaultTemperature,
      maxTokens: options?.maxTokens ?? this.config.maxTokens,
      ...options,
    });
  }

  // ==================== Requirements Analysis ====================

  /**
   * Analyze a requirement and extract structured information
   */
  async analyzeRequirements(
    requirementText: string,
    options?: Partial<LLMRequestOptions>
  ): Promise<AIResult<RequirementsAnalysisResult>> {
    const cacheKey = this.generateCacheKey('analyzeRequirements', requirementText);

    return this.executeWithFallback(
      'analyzeRequirements',
      async () => {
        const response = await this.llmProvider.chat({
          messages: [
            { role: 'system', content: PROMPTS.requirementsAnalysis },
            { role: 'user', content: `Analyze the following requirement:\n\n"""${requirementText}"""` },
          ],
          temperature: options?.temperature ?? 0.3,
          maxTokens: options?.maxTokens ?? 4096,
          responseFormat: 'json_object',
        });

        const result = this.parseJSON<RequirementsAnalysisResult>(response.content);
        
        if (!result) {
          throw new Error('Failed to parse requirements analysis result');
        }

        return result;
      },
      cacheKey
    );
  }

  /**
   * Generate clarification questions for a requirement
   */
  async generateClarificationQuestions(
    requirementText: string,
    maxQuestions: number = 5,
    options?: Partial<LLMRequestOptions>
  ): Promise<AIResult<ClarificationQuestion[]>> {
    const cacheKey = this.generateCacheKey('clarificationQuestions', `${requirementText}:${maxQuestions}`);

    return this.executeWithFallback(
      'generateClarificationQuestions',
      async () => {
        const response = await this.llmProvider.chat({
          messages: [
            { role: 'system', content: PROMPTS.clarificationQuestions },
            { role: 'user', content: `Generate clarification questions for:\n\n"""${requirementText}"""\n\nGenerate up to ${maxQuestions} questions.` },
          ],
          temperature: options?.temperature ?? 0.5,
          maxTokens: options?.maxTokens ?? 2048,
          responseFormat: 'json_object',
        });

        const result = this.parseJSON<{ questions: ClarificationQuestion[] }>(response.content);
        
        if (!result || !Array.isArray(result.questions)) {
          throw new Error('Failed to parse clarification questions');
        }

        // Add IDs to questions
        return result.questions.slice(0, maxQuestions).map((q, index) => ({
          ...q,
          id: `q_${Date.now()}_${index}`,
        }));
      },
      cacheKey
    );
  }

  // ==================== Entity Operations ====================

  /**
   * Extract entities from text
   */
  async extractEntities(
    text: string,
    options?: Partial<LLMRequestOptions>
  ): Promise<AIResult<ExtractedEntity[]>> {
    const cacheKey = this.generateCacheKey('extractEntities', text);

    return this.executeWithFallback(
      'extractEntities',
      async () => {
        const response = await this.llmProvider.chat({
          messages: [
            { role: 'system', content: PROMPTS.entityExtraction },
            { role: 'user', content: `Extract entities from:\n\n"""${text}"""` },
          ],
          temperature: options?.temperature ?? 0.3,
          maxTokens: options?.maxTokens ?? 2048,
          responseFormat: 'json_object',
        });

        const result = this.parseJSON<ExtractedEntity[]>(response.content);
        
        if (!result) {
          throw new Error('Failed to parse extracted entities');
        }

        return result;
      },
      cacheKey
    );
  }

  /**
   * Analyze relations between entities
   */
  async analyzeRelations(
    entities: ExtractedEntity[],
    context?: string,
    options?: Partial<LLMRequestOptions>
  ): Promise<AIResult<ExtractedRelation[]>> {
    const input = JSON.stringify(entities) + (context || '');
    const cacheKey = this.generateCacheKey('analyzeRelations', input);

    return this.executeWithFallback(
      'analyzeRelations',
      async () => {
        const entityList = entities.map(e => `- ${e.name} (${e.type}): ${e.description || 'No description'}`).join('\n');
        
        const response = await this.llmProvider.chat({
          messages: [
            { role: 'system', content: PROMPTS.relationAnalysis },
            { role: 'user', content: `Analyze relations between these entities:\n\n${entityList}\n\n${context ? `Context: ${context}` : ''}` },
          ],
          temperature: options?.temperature ?? 0.3,
          maxTokens: options?.maxTokens ?? 2048,
          responseFormat: 'json_object',
        });

        const result = this.parseJSON<ExtractedRelation[]>(response.content);
        
        if (!result) {
          throw new Error('Failed to parse extracted relations');
        }

        return result;
      },
      cacheKey
    );
  }

  // ==================== UI Generation ====================

  /**
   * Generate UI components from requirements
   */
  async generateUI(
    description: string,
    options?: {
      framework?: 'react' | 'vue' | 'svelte' | 'vanilla';
      uiLibrary?: 'shadcn' | 'tailwind' | 'mui' | 'antd' | 'none';
      platforms?: ('mobile' | 'tablet' | 'desktop')[];
    } & Partial<LLMRequestOptions>
  ): Promise<AIResult<UIGenerationResult>> {
    const cacheKey = this.generateCacheKey('generateUI', `${description}:${JSON.stringify(options)}`);

    return this.executeWithFallback(
      'generateUI',
      async () => {
        const framework = options?.framework || 'react';
        const uiLibrary = options?.uiLibrary || 'tailwind';
        const platforms = options?.platforms || ['desktop', 'tablet', 'mobile'];

        const response = await this.llmProvider.chat({
          messages: [
            { role: 'system', content: PROMPTS.uiGeneration },
            { role: 'user', content: `Generate UI for:\n\n"""${description}"""\n\nFramework: ${framework}\nUI Library: ${uiLibrary}\nPlatforms: ${platforms.join(', ')}` },
          ],
          temperature: options?.temperature ?? 0.5,
          maxTokens: options?.maxTokens ?? 4096,
          responseFormat: 'json_object',
        });

        const result = this.parseJSON<UIGenerationResult>(response.content);
        
        if (!result) {
          throw new Error('Failed to parse UI generation result');
        }

        return result;
      },
      cacheKey
    );
  }

  // ==================== Text Operations ====================

  /**
   * Summarize text
   */
  async summarize(
    text: string,
    maxLength?: number,
    options?: Partial<LLMRequestOptions>
  ): Promise<AIResult<string>> {
    const cacheKey = this.generateCacheKey('summarize', `${text}:${maxLength}`);

    return this.executeWithFallback(
      'summarize',
      async () => {
        return this.llmProvider.summarize(text, maxLength, {
          temperature: options?.temperature ?? 0.3,
          maxTokens: options?.maxTokens ?? 512,
        });
      },
      cacheKey
    );
  }

  /**
   * Translate text
   */
  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string,
    options?: Partial<LLMRequestOptions>
  ): Promise<AIResult<string>> {
    const cacheKey = this.generateCacheKey('translate', `${text}:${targetLanguage}:${sourceLanguage}`);

    return this.executeWithFallback(
      'translate',
      async () => {
        return this.llmProvider.translate(text, targetLanguage, sourceLanguage, {
          temperature: options?.temperature ?? 0.3,
          maxTokens: options?.maxTokens,
        });
      },
      cacheKey
    );
  }

  /**
   * Classify text into categories
   */
  async classify(
    text: string,
    categories: string[],
    options?: Partial<LLMRequestOptions>
  ): Promise<AIResult<string>> {
    const cacheKey = this.generateCacheKey('classify', `${text}:${categories.join(',')}`);

    return this.executeWithFallback(
      'classify',
      async () => {
        return this.llmProvider.classify(text, categories, {
          temperature: options?.temperature ?? 0.1,
          maxTokens: options?.maxTokens ?? 50,
        });
      },
      cacheKey
    );
  }

  /**
   * Answer a question based on context
   */
  async answerQuestion(
    question: string,
    context: string,
    options?: Partial<LLMRequestOptions>
  ): Promise<AIResult<string>> {
    const cacheKey = this.generateCacheKey('answerQuestion', `${question}:${context}`);

    return this.executeWithFallback(
      'answerQuestion',
      async () => {
        return this.llmProvider.answerQuestion(question, context, {
          temperature: options?.temperature ?? 0.3,
          maxTokens: options?.maxTokens,
        });
      },
      cacheKey
    );
  }

  // ==================== JSON Operations ====================

  /**
   * Generate structured JSON output
   */
  async generateJSON<T = unknown>(
    prompt: string,
    schema?: Record<string, unknown>,
    options?: Partial<LLMRequestOptions>
  ): Promise<AIResult<T>> {
    const cacheKey = this.generateCacheKey('generateJSON', `${prompt}:${JSON.stringify(schema)}`);

    return this.executeWithFallback(
      'generateJSON',
      async () => {
        const systemPrompt = schema
          ? `You are a JSON generator. Generate valid JSON matching the following schema:\n\n${JSON.stringify(schema, null, 2)}`
          : 'You are a JSON generator. Generate valid JSON.';

        const response = await this.llmProvider.chat({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: options?.temperature ?? 0.3,
          maxTokens: options?.maxTokens ?? this.config.maxTokens,
          responseFormat: 'json_object',
        });

        const result = this.parseJSON<T>(response.content);
        
        if (!result) {
          throw new Error('Failed to parse JSON response');
        }

        return result;
      },
      cacheKey
    );
  }

  /**
   * Analyze text and extract structured information
   */
  async analyzeText<T = unknown>(
    text: string,
    schema: Record<string, unknown>,
    options?: Partial<LLMRequestOptions>
  ): Promise<AIResult<T>> {
    return this.generateJSON<T>(
      `Analyze the following text:\n\n"""${text}"""`,
      schema,
      options
    );
  }

  // ==================== Utility Methods ====================

  /**
   * Get token usage statistics
   */
  getTokenUsage() {
    return this.llmProvider.getTokenUsageSummary();
  }

  /**
   * Clear the response cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get provider health status
   */
  async checkHealth() {
    return this.llmProvider.checkHealth();
  }

  /**
   * Get available providers
   */
  getAvailableProviders() {
    return this.llmProvider.getAvailableProviders();
  }

  /**
   * Check if a specific provider is available
   */
  isProviderAvailable(provider: LLMProviderType): boolean {
    return this.llmProvider.isProviderAvailable(provider);
  }

  /**
   * Generate text with a system prompt
   */
  async generateText(
    systemPrompt: string,
    userMessage: string,
    options?: Partial<LLMRequestOptions>
  ): Promise<AIResult<string>> {
    return this.executeWithFallback(
      'generateText',
      async () => {
        return this.llmProvider.generateText(systemPrompt, userMessage, {
          temperature: options?.temperature ?? this.config.defaultTemperature,
          maxTokens: options?.maxTokens ?? this.config.maxTokens,
        });
      }
    );
  }

  /**
   * Generate multiple variants of a response
   */
  async generateVariants(
    prompt: string,
    count: number = 3,
    options?: Partial<LLMRequestOptions>
  ): Promise<AIResult<string[]>> {
    return this.executeWithFallback(
      'generateVariants',
      async () => {
        return this.llmProvider.generateVariants(
          [{ role: 'user', content: prompt }],
          count,
          {
            temperature: options?.temperature ?? 0.9,
            maxTokens: options?.maxTokens ?? this.config.maxTokens,
          }
        );
      }
    );
  }
}

// ==================== Factory Functions ====================

/**
 * Create an AI Service instance
 */
export function createAIService(env: CloudflareEnv, config?: AIServiceConfig): AIService {
  return new AIService(env, config);
}

// ==================== Singleton Instance ====================

let defaultInstance: AIService | null = null;

/**
 * Get or create the default AI Service instance
 */
export function getAIService(env: CloudflareEnv, config?: AIServiceConfig): AIService {
  if (!defaultInstance) {
    defaultInstance = new AIService(env, config);
  }
  return defaultInstance;
}

/**
 * Reset the default instance (useful for testing)
 */
export function resetAIService(): void {
  defaultInstance = null;
}

// ==================== Convenience Functions ====================

/**
 * Quick chat function using default AI service
 */
export async function quickChat(
  env: CloudflareEnv,
  message: string,
  context?: ChatContext
): Promise<string> {
  const ai = getAIService(env);
  const result = await ai.chat(message, context);
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Chat failed');
  }
  
  return result.data;
}

/**
 * Quick requirements analysis using default AI service
 */
export async function quickAnalyzeRequirements(
  env: CloudflareEnv,
  requirementText: string
): Promise<RequirementsAnalysisResult> {
  const ai = getAIService(env);
  const result = await ai.analyzeRequirements(requirementText);
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Requirements analysis failed');
  }
  
  return result.data;
}

/**
 * Quick entity extraction using default AI service
 */
export async function quickExtractEntities(
  env: CloudflareEnv,
  text: string
): Promise<ExtractedEntity[]> {
  const ai = getAIService(env);
  const result = await ai.extractEntities(text);
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Entity extraction failed');
  }
  
  return result.data;
}

// ==================== Re-exports ====================

export type { CloudflareEnv } from '../lib/env';
export type {
  LLMProviderType,
  ChatMessage as LLMChatMessage,
  LLMResponse,
  LLMStreamChunk,
} from './llm-provider';