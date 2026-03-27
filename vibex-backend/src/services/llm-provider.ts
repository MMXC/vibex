/**
 * LLM Provider Service
 * 
 * A high-level abstraction layer for multiple LLM providers.
 * Provides unified interface for LLM operations with provider management,
 * configuration, and fallback support.
 * 
 * Features:
 * - Multiple provider support (MiniMax, OpenAI-compatible APIs)
 * - Provider selection and automatic fallback
 * - Configuration management per provider
 * - Common LLM operations (chat, streaming, structured output)
 * - Token usage tracking
 * - Error handling and retry logic
 * 
 * @module services/llm-provider
 */

import { CloudflareEnv } from '../lib/env';

// ==================== Types ====================

/**
 * Supported LLM providers
 */
export type LLMProviderType = 'minimax' | 'openai' | 'anthropic' | 'custom';

/**
 * Message role types for LLM conversations
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'function';

/**
 * Chat message structure
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
  name?: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
}

/**
 * Function definition for tool calling
 */
export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  /** Provider type */
  type: LLMProviderType;
  /** API key */
  apiKey: string;
  /** API base URL */
  apiBase: string;
  /** Default model for this provider */
  defaultModel: string;
  /** Available models */
  models: string[];
  /** Whether this provider is enabled */
  enabled: boolean;
  /** Priority for fallback (lower = higher priority) */
  priority: number;
  /** Max tokens per request */
  maxTokens: number;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Retry attempts */
  retryAttempts: number;
  /** Rate limit requests per minute */
  rateLimit?: number;
}

/**
 * LLM Request options
 */
export interface LLMRequestOptions {
  /** Override provider */
  provider?: LLMProviderType;
  /** Override model */
  model?: string;
  /** Conversation messages */
  messages: ChatMessage[];
  /** Enable streaming response */
  stream?: boolean;
  /** Temperature parameter (0-2) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Top-p sampling */
  topP?: number;
  /** Stop sequences */
  stop?: string[];
  /** JSON response format */
  responseFormat?: 'text' | 'json_object';
  /** Functions for tool calling */
  functions?: FunctionDefinition[];
  /** Force a specific function call */
  functionCall?: 'auto' | 'none' | { name: string };
  /** Additional provider-specific options */
  extra?: Record<string, unknown>;
}

/**
 * LLM Response (non-streaming)
 */
export interface LLMResponse {
  /** Generated content */
  content: string;
  /** Finish reason */
  finishReason: 'stop' | 'length' | 'content_filter' | 'function_call' | null;
  /** Function call if any */
  functionCall?: {
    name: string;
    arguments: string;
  };
  /** Usage statistics */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Provider used */
  provider: LLMProviderType;
  /** Model used */
  model: string;
  /** Raw API response */
  raw: unknown;
}

/**
 * Stream chunk from LLM
 */
export interface LLMStreamChunk {
  /** Content delta */
  content: string;
  /** Whether this is the last chunk */
  done: boolean;
  /** Finish reason (only in last chunk) */
  finishReason?: 'stop' | 'length' | 'content_filter';
  /** Usage (only in last chunk) */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Error if any */
  error?: string;
  /** Provider used */
  provider?: LLMProviderType;
  /** Model used */
  model?: string;
}

/**
 * Token usage record for tracking
 */
export interface TokenUsage {
  provider: LLMProviderType;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  timestamp: Date;
}

/**
 * Provider health status
 */
export interface ProviderHealth {
  provider: LLMProviderType;
  healthy: boolean;
  lastCheck: Date;
  errorCount: number;
  lastError?: string;
  avgResponseTime?: number;
}

// ==================== Default Configurations ====================

const DEFAULT_PROVIDERS: Record<string, Partial<ProviderConfig>> = {
  minimax: {
    type: 'minimax',
    apiBase: 'https://api.minimax.chat/v1',
    defaultModel: 'MiniMax-M2.7-highspeed',
    models: ['abab6.5s-chat', 'abab6.5g-chat', 'abab6.5t-chat', 'MiniMax-M2.5-highspeed'],
    maxTokens: 8192,
    timeout: 60000,
    retryAttempts: 3,
    priority: 1,
  },
  openai: {
    type: 'openai',
    apiBase: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    maxTokens: 4096,
    timeout: 60000,
    retryAttempts: 3,
    priority: 2,
  },
  anthropic: {
    type: 'anthropic',
    apiBase: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    maxTokens: 4096,
    timeout: 60000,
    retryAttempts: 3,
    priority: 3,
  },
};

// ==================== LLM Provider Class ====================

/**
 * Main LLM Provider Service class
 */
export class LLMProviderService {
  private providers: Map<LLMProviderType, ProviderConfig> = new Map();
  private tokenUsage: TokenUsage[] = [];
  private healthStatus: Map<LLMProviderType, ProviderHealth> = new Map();
  private env: CloudflareEnv;

  constructor(env: CloudflareEnv) {
    this.env = env;
    this.initializeProviders();
  }

  /**
   * Initialize providers from environment variables
   */
  private initializeProviders(): void {
    // MiniMax provider (primary)
    if (this.env.MINIMAX_API_KEY) {
      this.registerProvider({
        ...DEFAULT_PROVIDERS.minimax,
        type: 'minimax',
        apiKey: this.env.MINIMAX_API_KEY,
        apiBase: this.env.MINIMAX_API_BASE || DEFAULT_PROVIDERS.minimax.apiBase!,
        defaultModel: this.env.MINIMAX_MODEL || DEFAULT_PROVIDERS.minimax.defaultModel!,
        enabled: true,
      } as ProviderConfig);
    }

    // Additional providers can be added via environment
    // OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.
    const openaiKey = this.env.OPENAI_API_KEY;
    if (openaiKey) {
      this.registerProvider({
        ...DEFAULT_PROVIDERS.openai,
        type: 'openai',
        apiKey: openaiKey,
        enabled: true,
      } as ProviderConfig);
    }

    const anthropicKey = this.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      this.registerProvider({
        ...DEFAULT_PROVIDERS.anthropic,
        type: 'anthropic',
        apiKey: anthropicKey,
        enabled: true,
      } as ProviderConfig);
    }
  }

  /**
   * Register a new provider
   */
  registerProvider(config: ProviderConfig): void {
    this.providers.set(config.type, config);
    this.healthStatus.set(config.type, {
      provider: config.type,
      healthy: config.enabled,
      lastCheck: new Date(),
      errorCount: 0,
    });
  }

  /**
   * Get provider configuration
   */
  getProvider(type: LLMProviderType): ProviderConfig | undefined {
    return this.providers.get(type);
  }

  /**
   * Get all registered providers
   */
  getProviders(): ProviderConfig[] {
    return Array.from(this.providers.values()).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get available providers (enabled and healthy)
   */
  getAvailableProviders(): ProviderConfig[] {
    return this.getProviders().filter(p => {
      const health = this.healthStatus.get(p.type);
      return p.enabled && (health?.healthy ?? true);
    });
  }

  /**
   * Check if a provider is available
   */
  isProviderAvailable(type: LLMProviderType): boolean {
    const provider = this.providers.get(type);
    const health = this.healthStatus.get(type);
    return !!(provider?.enabled && (health?.healthy ?? true));
  }

  /**
   * Get the default provider (first available by priority)
   */
  getDefaultProvider(): ProviderConfig | undefined {
    const available = this.getAvailableProviders();
    return available[0];
  }

  /**
   * Select the best provider for a request
   */
  private selectProvider(options?: LLMRequestOptions): ProviderConfig {
    // If provider is specified and available, use it
    if (options?.provider) {
      const provider = this.providers.get(options.provider);
      if (provider?.enabled && this.isProviderAvailable(options.provider)) {
        return provider;
      }
    }

    // Otherwise, use the first available provider
    const available = this.getAvailableProviders();
    if (available.length === 0) {
      throw new Error('No LLM providers available');
    }

    return available[0];
  }

  /**
   * Build request body for a specific provider
   */
  private buildRequestBody(
    provider: ProviderConfig,
    options: LLMRequestOptions
  ): Record<string, unknown> {
    const model = options.model || provider.defaultModel;
    
    const body: Record<string, unknown> = {
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? provider.maxTokens,
      stream: options.stream ?? false,
    };

    if (options.topP !== undefined) {
      body.top_p = options.topP;
    }

    if (options.stop && options.stop.length > 0) {
      body.stop = options.stop;
    }

    // Note: Minimax does not support response_format: json_object
    // Only add for OpenAI-compatible providers
    if (options.responseFormat === 'json_object' && provider.type !== 'minimax') {
      body.response_format = { type: 'json_object' };
    }

    // Add functions for tool calling
    if (options.functions && options.functions.length > 0) {
      body.functions = options.functions;
      if (options.functionCall) {
        body.function_call = options.functionCall;
      }
    }

    // Provider-specific adjustments
    switch (provider.type) {
      case 'minimax':
        // MiniMax uses slightly different endpoint structure
        break;
      case 'anthropic':
        // Anthropic has different message format
        body.max_tokens = options.maxTokens ?? 4096;
        break;
    }

    return body;
  }

  /**
   * Build headers for a specific provider
   */
  private buildHeaders(provider: ProviderConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    switch (provider.type) {
      case 'minimax':
      case 'openai':
      case 'custom':
        headers['Authorization'] = `Bearer ${provider.apiKey}`;
        break;
      case 'anthropic':
        headers['x-api-key'] = provider.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        break;
    }

    return headers;
  }

  /**
   * Get the API endpoint for a provider
   */
  private getEndpoint(provider: ProviderConfig): string {
    switch (provider.type) {
      case 'minimax':
        return `${provider.apiBase}/text/chatcompletion_v2`;
      case 'openai':
      case 'custom':
        return `${provider.apiBase}/chat/completions`;
      case 'anthropic':
        return `${provider.apiBase}/messages`;
      default:
        return `${provider.apiBase}/chat/completions`;
    }
  }

  /**
   * Parse response from a provider
   */
  private parseResponse(
    provider: ProviderConfig,
    data: unknown,
    model: string
  ): LLMResponse {
    const response = data as Record<string, unknown>;
    
    switch (provider.type) {
      case 'minimax':
      case 'openai':
      case 'custom': {
        const choices = response.choices as Array<Record<string, unknown>> | undefined;
        const choice = choices?.[0];
        const message = choice?.message as Record<string, unknown> | undefined;
        const usage = response.usage as Record<string, number> | undefined;
        
        return {
          content: (message?.content as string) || '',
          finishReason: (choice?.finish_reason as LLMResponse['finishReason']) || null,
          functionCall: message?.function_call as LLMResponse['functionCall'],
          usage: {
            promptTokens: usage?.prompt_tokens || 0,
            completionTokens: usage?.completion_tokens || 0,
            totalTokens: usage?.total_tokens || 0,
          },
          provider: provider.type,
          model,
          raw: data,
        };
      }
      case 'anthropic': {
        const content = response.content as Array<Record<string, unknown>> | undefined;
        const firstContent = content?.[0];
        const usage = response.usage as Record<string, number> | undefined;
        
        return {
          content: (firstContent?.text as string) || '',
          finishReason: response.stop_reason as LLMResponse['finishReason'] || null,
          usage: {
            promptTokens: usage?.input_tokens || 0,
            completionTokens: usage?.output_tokens || 0,
            totalTokens: (usage?.input_tokens || 0) + (usage?.output_tokens || 0),
          },
          provider: provider.type,
          model,
          raw: data,
        };
      }
      default:
        throw new Error(`Unknown provider type: ${provider.type}`);
    }
  }

  /**
   * Update health status after a request
   */
  private updateHealth(
    provider: LLMProviderType,
    success: boolean,
    error?: string,
    responseTime?: number
  ): void {
    const health = this.healthStatus.get(provider);
    if (!health) return;

    health.lastCheck = new Date();
    
    if (success) {
      health.healthy = true;
      health.errorCount = 0;
      health.lastError = undefined;
      if (responseTime) {
        health.avgResponseTime = health.avgResponseTime
          ? (health.avgResponseTime + responseTime) / 2
          : responseTime;
      }
    } else {
      health.errorCount++;
      health.lastError = error;
      // Mark as unhealthy after 3 consecutive errors
      if (health.errorCount >= 3) {
        health.healthy = false;
      }
    }

    this.healthStatus.set(provider, health);
  }

  /**
   * Track token usage
   */
  private trackUsage(usage: TokenUsage): void {
    this.tokenUsage.push(usage);
    // Keep only last 1000 records
    if (this.tokenUsage.length > 1000) {
      this.tokenUsage = this.tokenUsage.slice(-1000);
    }
  }

  /**
   * Execute a request with retry and fallback
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    provider: ProviderConfig,
    attempts: number = provider.retryAttempts
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on client errors (4xx)
        if (lastError.message.includes('4')) {
          throw lastError;
        }

        // Wait before retry with exponential backoff
        if (i < attempts - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
      }
    }

    throw lastError;
  }

  /**
   * Send a non-streaming chat request
   */
  async chat(options: LLMRequestOptions): Promise<LLMResponse> {
    const provider = this.selectProvider(options);
    const model = options.model || provider.defaultModel;
    const startTime = Date.now();

    try {
      const url = this.getEndpoint(provider);
      const headers = this.buildHeaders(provider);
      const body = this.buildRequestBody(provider, { ...options, stream: false });

      const response = await this.executeWithRetry(
        async () => {
          const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(provider.timeout),
          });

          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`${provider.type} API error: ${res.status} - ${errorText}`);
          }

          return res.json();
        },
        provider
      );

      const result = this.parseResponse(provider, response, model);
      const responseTime = Date.now() - startTime;

      this.updateHealth(provider.type, true, undefined, responseTime);
      this.trackUsage({
        provider: provider.type,
        model: result.model,
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
        timestamp: new Date(),
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateHealth(provider.type, false, errorMessage);
      throw new Error(`LLM request failed: ${errorMessage}`);
    }
  }

  /**
   * Send a streaming chat request
   * Returns an async generator that yields chunks
   */
  async *streamChat(options: LLMRequestOptions): AsyncGenerator<LLMStreamChunk> {
    const provider = this.selectProvider(options);
    const model = options.model || provider.defaultModel;

    const url = this.getEndpoint(provider);
    const headers = this.buildHeaders(provider);
    const body = this.buildRequestBody(provider, { ...options, stream: true });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(provider.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        yield {
          content: '',
          done: true,
          error: `${provider.type} API error: ${response.status} - ${errorText}`,
          provider: provider.type,
          model,
        };
        this.updateHealth(provider.type, false, errorText);
        return;
      }

      if (!response.body) {
        yield {
          content: '',
          done: true,
          error: 'No response body from API',
          provider: provider.type,
          model,
        };
        this.updateHealth(provider.type, false, 'No response body');
        return;
      }

      const decoder = new TextDecoder();
      const reader = response.body.getReader();
      let buffer = '';
      let totalTokens = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            if (buffer.trim()) {
              try {
                const parsed = JSON.parse(buffer);
                const chunk = this.parseStreamChunk(provider, parsed, model);
                if (chunk.content) {
                  yield chunk;
                }
              } catch {
                // Skip invalid JSON
              }
            }
            yield { content: '', done: true, provider: provider.type, model };
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;

            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') {
              yield { content: '', done: true, provider: provider.type, model };
              this.updateHealth(provider.type, true);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const chunk = this.parseStreamChunk(provider, parsed, model);
              
              if (chunk.content) {
                totalTokens++;
                yield chunk;
              }

              if (chunk.done && chunk.usage) {
                this.trackUsage({
                  provider: provider.type,
                  model,
                  promptTokens: chunk.usage.promptTokens,
                  completionTokens: chunk.usage.completionTokens,
                  totalTokens: chunk.usage.totalTokens,
                  timestamp: new Date(),
                });
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateHealth(provider.type, false, errorMessage);
      yield {
        content: '',
        done: true,
        error: `Stream error: ${errorMessage}`,
        provider: provider.type,
        model,
      };
    }
  }

  /**
   * Parse a streaming chunk from a provider
   */
  private parseStreamChunk(
    provider: ProviderConfig,
    data: unknown,
    model: string
  ): LLMStreamChunk {
    const response = data as Record<string, unknown>;

    switch (provider.type) {
      case 'minimax':
      case 'openai':
      case 'custom': {
        const choices = response.choices as Array<Record<string, unknown>> | undefined;
        const choice = choices?.[0];
        const delta = choice?.delta as Record<string, unknown> | undefined;
        const usage = response.usage as Record<string, number> | undefined;

        return {
          content: (delta?.content as string) || '',
          done: choice?.finish_reason === 'stop' || choice?.finish_reason === 'length',
          finishReason: choice?.finish_reason as LLMStreamChunk['finishReason'],
          usage: usage ? {
            promptTokens: usage.prompt_tokens || 0,
            completionTokens: usage.completion_tokens || 0,
            totalTokens: usage.total_tokens || 0,
          } : undefined,
          provider: provider.type,
          model,
        };
      }
      case 'anthropic': {
        const type = response.type as string;
        const delta = response.delta as Record<string, unknown> | undefined;
        const usage = response.usage as Record<string, number> | undefined;

        return {
          content: type === 'content_block_delta' ? (delta?.text as string) || '' : '',
          done: type === 'message_stop',
          usage: usage ? {
            promptTokens: usage.input_tokens || 0,
            completionTokens: usage.output_tokens || 0,
            totalTokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
          } : undefined,
          provider: provider.type,
          model,
        };
      }
      default:
        return { content: '', done: false, provider: provider.type, model };
    }
  }

  /**
   * Create a streaming response compatible with Hono/Cloudflare
   */
  async createStreamingResponse(
    options: LLMRequestOptions,
    onChunk?: (chunk: LLMStreamChunk) => void
  ): Promise<Response> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const provider = this.selectProvider(options);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const chunk of self.streamChat(options)) {
            if (onChunk) {
              onChunk(chunk);
            }

            if (chunk.error) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ error: chunk.error })}\n\n`)
              );
            } else {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  content: chunk.content, 
                  done: chunk.done,
                  provider: chunk.provider,
                  model: chunk.model,
                })}\n\n`)
              );
            }

            if (chunk.done) {
              break;
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  // ==================== High-Level Operations ====================

  /**
   * Generate structured output using JSON mode
   */
  async generateJSON<T = unknown>(
    messages: ChatMessage[],
    options?: Partial<LLMRequestOptions>
  ): Promise<T> {
    const response = await this.chat({
      messages,
      responseFormat: 'json_object',
      temperature: options?.temperature ?? 0.3, // Lower temperature for structured output
      ...options,
    });

    try {
      return JSON.parse(response.content) as T;
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = response.content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as T;
      }
      throw new Error('Failed to parse JSON response');
    }
  }

  /**
   * Generate text with a system prompt
   */
  async generateText(
    systemPrompt: string,
    userMessage: string,
    options?: Partial<LLMRequestOptions>
  ): Promise<string> {
    const response = await this.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      ...options,
    });

    return response.content;
  }

  /**
   * Analyze text and extract structured information
   */
  async analyzeText<T = unknown>(
    text: string,
    schema: Record<string, unknown>,
    options?: Partial<LLMRequestOptions>
  ): Promise<T> {
    const systemPrompt = `You are an expert text analyzer. Extract structured information from the provided text according to the following schema:

${JSON.stringify(schema, null, 2)}

Respond with a valid JSON object that matches the schema.`;

    return this.generateJSON<T>(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze the following text:\n\n"""${text}"""` },
      ],
      options
    );
  }

  /**
   * Summarize text
   */
  async summarize(
    text: string,
    maxLength?: number,
    options?: Partial<LLMRequestOptions>
  ): Promise<string> {
    const systemPrompt = 'You are a skilled summarizer. Create a concise summary of the provided text.';
    const userMessage = maxLength
      ? `Summarize the following text in no more than ${maxLength} characters:\n\n"""${text}"""`
      : `Summarize the following text:\n\n"""${text}"""`;

    return this.generateText(systemPrompt, userMessage, options);
  }

  /**
   * Translate text
   */
  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string,
    options?: Partial<LLMRequestOptions>
  ): Promise<string> {
    const sourceHint = sourceLanguage ? `from ${sourceLanguage} ` : '';
    const systemPrompt = `You are a professional translator. Translate the provided text ${sourceHint}to ${targetLanguage}. Preserve the tone and meaning.`;
    
    return this.generateText(systemPrompt, text, options);
  }

  /**
   * Answer a question with context
   */
  async answerQuestion(
    question: string,
    context: string,
    options?: Partial<LLMRequestOptions>
  ): Promise<string> {
    const systemPrompt = 'You are a helpful assistant. Answer questions based on the provided context. If the answer is not in the context, say so.';
    const userMessage = `Context:\n"""${context}"""\n\nQuestion: ${question}`;

    return this.generateText(systemPrompt, userMessage, options);
  }

  /**
   * Classify text into categories
   */
  async classify(
    text: string,
    categories: string[],
    options?: Partial<LLMRequestOptions>
  ): Promise<string> {
    const systemPrompt = `You are a text classifier. Classify the provided text into one of the following categories: ${categories.join(', ')}. Respond with only the category name.`;
    
    return this.generateText(systemPrompt, text, {
      temperature: 0.1,
      ...options,
    });
  }

  /**
   * Generate multiple completions for comparison
   */
  async generateVariants(
    messages: ChatMessage[],
    count: number = 3,
    options?: Partial<LLMRequestOptions>
  ): Promise<string[]> {
    const promises = Array(count).fill(null).map(() =>
      this.chat({
        messages,
        temperature: options?.temperature ?? 0.9, // Higher temperature for variety
        ...options,
      })
    );

    const results = await Promise.all(promises);
    return results.map(r => r.content);
  }

  // ==================== Token Usage ====================

  /**
   * Get token usage statistics
   */
  getTokenUsage(): TokenUsage[] {
    return [...this.tokenUsage];
  }

  /**
   * Get token usage summary
   */
  getTokenUsageSummary(): {
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    byProvider: Record<LLMProviderType, { prompt: number; completion: number; total: number }>;
  } {
    const summary = {
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      byProvider: {} as Record<LLMProviderType, { prompt: number; completion: number; total: number }>,
    };

    for (const usage of this.tokenUsage) {
      summary.totalPromptTokens += usage.promptTokens;
      summary.totalCompletionTokens += usage.completionTokens;
      summary.totalTokens += usage.totalTokens;

      if (!summary.byProvider[usage.provider]) {
        summary.byProvider[usage.provider] = { prompt: 0, completion: 0, total: 0 };
      }
      summary.byProvider[usage.provider].prompt += usage.promptTokens;
      summary.byProvider[usage.provider].completion += usage.completionTokens;
      summary.byProvider[usage.provider].total += usage.totalTokens;
    }

    return summary;
  }

  /**
   * Clear token usage history
   */
  clearTokenUsage(): void {
    this.tokenUsage = [];
  }

  // ==================== Health Check ====================

  /**
   * Check health of all providers
   */
  async checkHealth(): Promise<ProviderHealth[]> {
    const results: ProviderHealth[] = [];
    const providerEntries = Array.from(this.providers.entries());

    for (const [type, provider] of providerEntries) {
      if (!provider.enabled) {
        results.push({
          provider: type,
          healthy: false,
          lastCheck: new Date(),
          errorCount: this.healthStatus.get(type)?.errorCount || 0,
          lastError: 'Provider is disabled',
        });
        continue;
      }

      try {
        const startTime = Date.now();
        
        // Simple health check with minimal tokens
        await this.chat({
          provider: type,
          messages: [{ role: 'user', content: 'Say "ok"' }],
          maxTokens: 5,
          temperature: 0,
        });

        const responseTime = Date.now() - startTime;
        
        results.push({
          provider: type,
          healthy: true,
          lastCheck: new Date(),
          errorCount: 0,
          avgResponseTime: responseTime,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          provider: type,
          healthy: false,
          lastCheck: new Date(),
          errorCount: (this.healthStatus.get(type)?.errorCount || 0) + 1,
          lastError: errorMessage,
        });
      }
    }

    // Update health status
    for (const result of results) {
      this.healthStatus.set(result.provider, result);
    }

    return results;
  }

  /**
   * Get current health status
   */
  getHealthStatus(): ProviderHealth[] {
    return Array.from(this.healthStatus.values());
  }
}

// ==================== Factory Function ====================

/**
 * Factory function to create an LLM Provider service instance
 */
export function createLLMProviderService(env: CloudflareEnv): LLMProviderService {
  return new LLMProviderService(env);
}

// ==================== Singleton Instance ====================

let defaultInstance: LLMProviderService | null = null;

/**
 * Get or create the default LLM Provider service instance
 */
export function getLLMProviderService(env: CloudflareEnv): LLMProviderService {
  if (!defaultInstance) {
    defaultInstance = new LLMProviderService(env);
  }
  return defaultInstance;
}

/**
 * Reset the default instance (useful for testing)
 */
export function resetLLMProviderService(): void {
  defaultInstance = null;
}

// ==================== Exports ====================

export type { CloudflareEnv } from '../lib/env';