/**
 * AI Client Service - Frontend AI Capabilities Interface
 * 
 * A client-side service that provides unified AI capabilities for the VibeX frontend.
 * Communicates with backend AI endpoints and supports streaming responses.
 * 
 * Features:
 * - Unified interface for all AI operations
 * - Streaming support for real-time responses
 * - Chat completion with conversation history
 * - Requirements analysis and entity extraction
 * - UI generation capabilities
 * - Error handling and retry logic
 * 
 * @module services/ai-client
 */

// ==================== Types ====================

/**
 * AI Service configuration options
 */
export interface AIClientConfig {
  /** Base URL for AI API endpoints */
  baseURL?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
}

/**
 * Chat message for conversation
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Chat request options
 */
export interface ChatRequest {
  message: string;
  conversationId?: string;
  history?: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

/**
 * Chat response
 */
export interface ChatResponse {
  content: string;
  conversationId?: string;
  usage?: TokenUsage;
}

/**
 * Streaming chat chunk
 */
export interface StreamChunk {
  content: string;
  done: boolean;
  error?: string;
}

/**
 * Token usage statistics
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
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
 * AI operation result
 */
export interface AIResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Stream callback type
 */
export type StreamCallback = (chunk: StreamChunk) => void;

// ==================== Default Configuration ====================

const DEFAULT_CONFIG: Required<AIClientConfig> = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top/api',
  timeout: 60000,
  maxRetries: 3,
  retryDelay: 1000,
};

// ==================== AI Client Class ====================

/**
 * Main AI Client class providing unified AI capabilities
 */
export class AIClient {
  private config: Required<AIClientConfig>;
  private abortController: AbortController | null = null;

  constructor(config?: AIClientConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==================== Private Methods ====================

  /**
   * Get authentication token from localStorage
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  /**
   * Build headers for API requests
   */
  private buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Execute request with retry logic
   */
  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit,
    retries: number = this.config.maxRetries
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        await this.delay(this.config.retryDelay);
        return this.fetchWithRetry<T>(url, options, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('503') ||
        message.includes('502') ||
        message.includes('500')
      );
    }
    return false;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if currently online
   */
  public isOnline(): boolean {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  }

  /**
   * Abort ongoing streaming request
   */
  public abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  // ==================== Chat Methods ====================

  /**
   * Send a chat message and get a response
   */
  async chat(request: ChatRequest): Promise<AIResult<ChatResponse>> {
    if (!this.isOnline()) {
      return {
        success: false,
        error: 'Offline - cannot send message',
      };
    }

    try {
      const result = await this.fetchWithRetry<{ content: string; conversationId?: string; usage?: TokenUsage }>(
        `${this.config.baseURL}/chat`,
        {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify({
            message: request.message,
            conversationId: request.conversationId,
            history: request.history,
            temperature: request.temperature,
            maxTokens: request.maxTokens,
          }),
        }
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Chat failed',
      };
    }
  }

  /**
   * Send a chat message with streaming response
   */
  async chatStream(
    request: ChatRequest,
    onChunk: StreamCallback
  ): Promise<AIResult<void>> {
    if (!this.isOnline()) {
      return {
        success: false,
        error: 'Offline - cannot send message',
      };
    }

    this.abortController = new AbortController();

    try {
      const response = await fetch(`${this.config.baseURL}/chat`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({
          message: request.message,
          conversationId: request.conversationId,
          history: request.history,
          temperature: request.temperature,
          maxTokens: request.maxTokens,
          stream: true,
        }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          onChunk({ content: '', done: true });
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onChunk({ content: '', done: true });
              break;
            }

            try {
              const parsed = JSON.parse(data);
              onChunk({
                content: parsed.content || parsed.delta || '',
                done: false,
              });
            } catch {
              // Skip invalid JSON
            }
          } else if (line.trim()) {
            // Try parsing as plain JSON
            try {
              const parsed = JSON.parse(line);
              onChunk({
                content: parsed.content || parsed.delta || '',
                done: false,
              });
            } catch {
              // Skip invalid data
            }
          }
        }
      }

      return { success: true };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: true };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stream failed',
      };
    } finally {
      this.abortController = null;
    }
  }

  // ==================== Requirements Analysis Methods ====================

  /**
   * Analyze a requirement and extract structured information
   */
  async analyzeRequirements(
    requirementText: string,
    options?: { temperature?: number }
  ): Promise<AIResult<RequirementsAnalysisResult>> {
    if (!this.isOnline()) {
      return {
        success: false,
        error: 'Offline - cannot analyze requirements',
      };
    }

    try {
      const result = await this.fetchWithRetry<RequirementsAnalysisResult>(
        `${this.config.baseURL}/ai/analyze-requirements`,
        {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify({
            requirementText,
            temperature: options?.temperature ?? 0.3,
          }),
        }
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Requirements analysis failed',
      };
    }
  }

  /**
   * Generate clarification questions for a requirement
   */
  async generateClarificationQuestions(
    requirementText: string,
    maxQuestions: number = 5
  ): Promise<AIResult<ClarificationQuestion[]>> {
    if (!this.isOnline()) {
      return {
        success: false,
        error: 'Offline - cannot generate questions',
      };
    }

    try {
      const result = await this.fetchWithRetry<ClarificationQuestion[]>(
        `${this.config.baseURL}/ai/clarification-questions`,
        {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify({
            requirementText,
            maxQuestions,
          }),
        }
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate questions',
      };
    }
  }

  // ==================== Entity Extraction Methods ====================

  /**
   * Extract entities from text
   */
  async extractEntities(
    text: string,
    options?: { temperature?: number }
  ): Promise<AIResult<ExtractedEntity[]>> {
    if (!this.isOnline()) {
      return {
        success: false,
        error: 'Offline - cannot extract entities',
      };
    }

    try {
      const result = await this.fetchWithRetry<ExtractedEntity[]>(
        `${this.config.baseURL}/ai/extract-entities`,
        {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify({
            text,
            temperature: options?.temperature ?? 0.3,
          }),
        }
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Entity extraction failed',
      };
    }
  }

  /**
   * Analyze relations between entities
   */
  async analyzeRelations(
    entities: ExtractedEntity[],
    context?: string
  ): Promise<AIResult<ExtractedRelation[]>> {
    if (!this.isOnline()) {
      return {
        success: false,
        error: 'Offline - cannot analyze relations',
      };
    }

    try {
      const result = await this.fetchWithRetry<ExtractedRelation[]>(
        `${this.config.baseURL}/ai/analyze-relations`,
        {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify({
            entities,
            context,
          }),
        }
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Relation analysis failed',
      };
    }
  }

  // ==================== UI Generation Methods ====================

  /**
   * Generate UI components from description
   */
  async generateUI(
    description: string,
    options?: {
      framework?: 'react' | 'vue' | 'svelte' | 'vanilla';
      uiLibrary?: 'shadcn' | 'tailwind' | 'mui' | 'antd' | 'none';
      platforms?: ('mobile' | 'tablet' | 'desktop')[];
    }
  ): Promise<AIResult<UIGenerationResult>> {
    if (!this.isOnline()) {
      return {
        success: false,
        error: 'Offline - cannot generate UI',
      };
    }

    try {
      const result = await this.fetchWithRetry<UIGenerationResult>(
        `${this.config.baseURL}/ai/generate-ui`,
        {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify({
            description,
            framework: options?.framework ?? 'react',
            uiLibrary: options?.uiLibrary ?? 'tailwind',
            platforms: options?.platforms ?? ['desktop', 'tablet', 'mobile'],
          }),
        }
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'UI generation failed',
      };
    }
  }

  /**
   * Generate UI with streaming response
   */
  async generateUIStream(
    description: string,
    onChunk: StreamCallback,
    options?: {
      framework?: 'react' | 'vue' | 'svelte' | 'vanilla';
      uiLibrary?: 'shadcn' | 'tailwind' | 'mui' | 'antd' | 'none';
      platforms?: ('mobile' | 'tablet' | 'desktop')[];
    }
  ): Promise<AIResult<void>> {
    if (!this.isOnline()) {
      return {
        success: false,
        error: 'Offline - cannot generate UI',
      };
    }

    this.abortController = new AbortController();

    try {
      const response = await fetch(`${this.config.baseURL}/ai/generate-ui/stream`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({
          description,
          framework: options?.framework ?? 'react',
          uiLibrary: options?.uiLibrary ?? 'tailwind',
          platforms: options?.platforms ?? ['desktop', 'tablet', 'mobile'],
        }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          onChunk({ content: '', done: true });
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onChunk({ content: '', done: true });
              break;
            }

            try {
              const parsed = JSON.parse(data);
              onChunk({
                content: parsed.content || '',
                done: false,
              });
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      return { success: true };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: true };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'UI generation stream failed',
      };
    } finally {
      this.abortController = null;
    }
  }

  // ==================== Text Processing Methods ====================

  /**
   * Summarize text
   */
  async summarize(
    text: string,
    maxLength?: number
  ): Promise<AIResult<string>> {
    if (!this.isOnline()) {
      return {
        success: false,
        error: 'Offline - cannot summarize',
      };
    }

    try {
      const result = await this.fetchWithRetry<{ summary: string }>(
        `${this.config.baseURL}/ai/summarize`,
        {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify({
            text,
            maxLength,
          }),
        }
      );

      return {
        success: true,
        data: result.summary,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Summarization failed',
      };
    }
  }

  /**
   * Translate text
   */
  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<AIResult<string>> {
    if (!this.isOnline()) {
      return {
        success: false,
        error: 'Offline - cannot translate',
      };
    }

    try {
      const result = await this.fetchWithRetry<{ translation: string }>(
        `${this.config.baseURL}/ai/translate`,
        {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify({
            text,
            targetLanguage,
            sourceLanguage,
          }),
        }
      );

      return {
        success: true,
        data: result.translation,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Translation failed',
      };
    }
  }

  /**
   * Classify text into categories
   */
  async classify(
    text: string,
    categories: string[]
  ): Promise<AIResult<string>> {
    if (!this.isOnline()) {
      return {
        success: false,
        error: 'Offline - cannot classify',
      };
    }

    try {
      const result = await this.fetchWithRetry<{ category: string }>(
        `${this.config.baseURL}/ai/classify`,
        {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify({
            text,
            categories,
          }),
        }
      );

      return {
        success: true,
        data: result.category,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Classification failed',
      };
    }
  }

  // ==================== JSON Generation Methods ====================

  /**
   * Generate structured JSON output
   */
  async generateJSON<T = unknown>(
    prompt: string,
    schema?: Record<string, unknown>
  ): Promise<AIResult<T>> {
    if (!this.isOnline()) {
      return {
        success: false,
        error: 'Offline - cannot generate JSON',
      };
    }

    try {
      const result = await this.fetchWithRetry<T>(
        `${this.config.baseURL}/ai/generate-json`,
        {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify({
            prompt,
            schema,
          }),
        }
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'JSON generation failed',
      };
    }
  }

  /**
   * Analyze text and extract structured information
   */
  async analyzeText<T = unknown>(
    text: string,
    schema: Record<string, unknown>
  ): Promise<AIResult<T>> {
    return this.generateJSON<T>(
      `Analyze the following text:\n\n"""${text}"""`,
      schema
    );
  }

  // ==================== Utility Methods ====================

  /**
   * Check AI service health
   */
  async checkHealth(): Promise<AIResult<{ status: string; providers: string[] }>> {
    try {
      const result = await this.fetchWithRetry<{ status: string; providers: string[] }>(
        `${this.config.baseURL}/ai/health`,
        {
          method: 'GET',
          headers: this.buildHeaders(),
        }
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
      };
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AIClientConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<AIClientConfig> {
    return { ...this.config };
  }
}

// ==================== Singleton Instance ====================

let defaultInstance: AIClient | null = null;

/**
 * Get or create the default AI Client instance
 */
export function getAIClient(config?: AIClientConfig): AIClient {
  if (!defaultInstance) {
    defaultInstance = new AIClient(config);
  }
  return defaultInstance;
}

/**
 * Reset the default instance (useful for testing)
 */
export function resetAIClient(): void {
  defaultInstance = null;
}

/**
 * Create a new AI Client instance
 */
export function createAIClient(config?: AIClientConfig): AIClient {
  return new AIClient(config);
}

// ==================== Convenience Functions ====================

/**
 * Quick chat function using default client
 */
export async function quickChat(
  message: string,
  history?: ChatMessage[]
): Promise<string> {
  const client = getAIClient();
  const result = await client.chat({ message, history });
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Chat failed');
  }
  
  return result.data.content;
}

/**
 * Quick requirements analysis using default client
 */
export async function quickAnalyzeRequirements(
  requirementText: string
): Promise<RequirementsAnalysisResult> {
  const client = getAIClient();
  const result = await client.analyzeRequirements(requirementText);
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Requirements analysis failed');
  }
  
  return result.data;
}

/**
 * Quick entity extraction using default client
 */
export async function quickExtractEntities(
  text: string
): Promise<ExtractedEntity[]> {
  const client = getAIClient();
  const result = await client.extractEntities(text);
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Entity extraction failed');
  }
  
  return result.data;
}

// ==================== Export Default Instance ====================

export const aiClient = new AIClient();
export default aiClient;