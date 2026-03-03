/**
 * LLM Service Layer
 * 
 * Provides a unified interface for LLM API calls to MiniMax.
 * Supports both streaming and non-streaming modes with proper error handling.
 * 
 * @module services/llm
 */

import { CloudflareEnv } from '../lib/env';

/**
 * Message role types for LLM conversations
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * Chat message structure
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
  name?: string;
}

/**
 * LLM Request options
 */
export interface LLMRequestOptions {
  /** API key (will use env if not provided) */
  apiKey?: string;
  /** API base URL */
  apiBase?: string;
  /** Model name */
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
}

/**
 * LLM Response (non-streaming)
 */
export interface LLMResponse {
  /** Generated content */
  content: string;
  /** Finish reason */
  finishReason: 'stop' | 'length' | 'content_filter' | null;
  /** Usage statistics */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Raw API response */
  raw: any;
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
}

/**
 * LLM Service class
 */
export class LLMService {
  private apiKey: string;
  private apiBase: string;
  private model: string;

  /**
   * Create a new LLM Service instance
   */
  constructor(env: CloudflareEnv) {
    this.apiKey = env.MINIMAX_API_KEY;
    this.apiBase = env.MINIMAX_API_BASE || 'https://api.minimax.chat/v1';
    this.model = env.MINIMAX_MODEL || 'abab6.5s-chat';
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (!this.apiKey) {
      throw new Error('MINIMAX_API_KEY is not configured');
    }
  }

  /**
   * Merge options with defaults
   */
  private mergeOptions(options: LLMRequestOptions): Required<LLMRequestOptions> {
    return {
      apiKey: options.apiKey || this.apiKey,
      apiBase: options.apiBase || this.apiBase,
      model: options.model || this.model,
      messages: options.messages,
      stream: options.stream ?? false,
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 4096,
      topP: options.topP ?? 1,
      stop: options.stop ?? [],
      responseFormat: options.responseFormat ?? 'text',
    };
  }

  /**
   * Send a non-streaming chat request
   */
  async chat(options: LLMRequestOptions): Promise<LLMResponse> {
    this.validateConfig();
    const opts = this.mergeOptions(options);

    const url = `${opts.apiBase}/text/chatcompletion_v2`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.apiKey}`,
    };

    const body = JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      stream: false,
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      top_p: opts.topP,
      stop: opts.stop.length > 0 ? opts.stop : undefined,
      ...(opts.responseFormat === 'json_object' && { response_format: { type: 'json_object' } }),
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MiniMax API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      const choice = data.choices?.[0];
      return {
        content: choice?.message?.content || '',
        finishReason: choice?.finish_reason || null,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        raw: data,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`LLM request failed: ${errorMessage}`);
    }
  }

  /**
   * Send a streaming chat request
   * Returns an async generator that yields chunks
   */
  async *streamChat(options: LLMRequestOptions): AsyncGenerator<LLMStreamChunk> {
    this.validateConfig();
    const opts = this.mergeOptions({ ...options, stream: true });

    const url = `${opts.apiBase}/text/chatcompletion_v2`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.apiKey}`,
    };

    const body = JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      stream: true,
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      top_p: opts.topP,
      stop: opts.stop.length > 0 ? opts.stop : undefined,
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        yield {
          content: '',
          done: true,
          error: `MiniMax API error: ${response.status} - ${errorText}`,
        };
        return;
      }

      if (!response.body) {
        yield {
          content: '',
          done: true,
          error: 'No response body from MiniMax API',
        };
        return;
      }

      const decoder = new TextDecoder();
      const reader = response.body.getReader();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Yield remaining buffer
            if (buffer.trim()) {
              try {
                const parsed = JSON.parse(buffer);
                if (parsed.choices?.[0]?.delta?.content) {
                  yield {
                    content: parsed.choices[0].delta.content,
                    done: false,
                  };
                }
              } catch {
                // Skip invalid JSON
              }
            }
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
              yield { content: '', done: true };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;
              
              if (delta?.content) {
                yield {
                  content: delta.content,
                  done: false,
                };
              }

              // Check for finish reason in the chunk
              if (parsed.choices?.[0]?.finish_reason) {
                yield {
                  content: '',
                  done: true,
                  finishReason: parsed.choices[0].finish_reason,
                  usage: parsed.usage ? {
                    promptTokens: parsed.usage.prompt_tokens,
                    completionTokens: parsed.usage.completion_tokens,
                    totalTokens: parsed.usage.total_tokens,
                  } : undefined,
                };
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
      yield {
        content: '',
        done: true,
        error: `Stream error: ${errorMessage}`,
      };
    }
  }

  /**
   * Create a streaming response compatible with Hono/Cloudflare
   */
  async createStreamingResponse(
    options: LLMRequestOptions,
    onChunk?: (chunk: LLMStreamChunk) => void
  ): Promise<Response> {
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const chunk of thisLLMService.streamChat(options)) {
            if (onChunk) {
              onChunk(chunk);
            }

            if (chunk.error) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ error: chunk.error })}\n\n`)
              );
            } else {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: chunk.content, done: chunk.done })}\n\n`)
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

    // Bind streamChat to preserve 'this' context
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const thisLLMService = this;

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }
}

/**
 * Factory function to create an LLM service instance
 */
export function createLLMService(env: CloudflareEnv): LLMService {
  return new LLMService(env);
}

// Re-export types for convenience
export type { CloudflareEnv } from '../lib/env';

// Alias for backward compatibility
export type Env = CloudflareEnv;
