// Environment variables for Cloudflare Workers and local development

// KVNamespace type (Cloudflare Workers built-in)
interface KVNamespace {
  get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'Uint8Array' }): Promise<string | ArrayBuffer | Uint8Array | null>;
  put(key: string, value: string, options?: { expirationTtl?: number; metadata?: unknown }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: { name: string; expiration?: number }[]; cursor?: string; list_complete: boolean }>;
}

export interface CloudflareEnv {
  DB: D1Database;
  ENVIRONMENT?: string;
  JWT_SECRET: string;
  MINIMAX_API_KEY: string;
  MINIMAX_API_BASE?: string;
  MINIMAX_MODEL?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_API_BASE?: string;
  ANTHROPIC_MODEL?: string;
  DOUBAO_API_KEY?: string;
  DOUBAO_API_BASE?: string;
  DOUBAO_MODEL?: string;
  COLLABORATION_KV?: KVNamespace;
  NOTIFICATION_KV?: KVNamespace;
  EXPORT_KV?: KVNamespace;
}

// D1 types
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = unknown>(): Promise<D1Result<T>>;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
}

interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta?: {
    changes?: number;
    last_row_id?: number;
  };
}

// For local development only - provides fallback env
export function getLocalEnv(): CloudflareEnv {
  return {
    DB: undefined as unknown as D1Database,
    ENVIRONMENT: 'development',
    JWT_SECRET: process.env.JWT_SECRET || 'vibex-dev-secret',
    MINIMAX_API_KEY: process.env.MINIMAX_API_KEY || '',
    MINIMAX_API_BASE: process.env.MINIMAX_API_BASE || 'https://api.minimax.chat/v1',
    MINIMAX_MODEL: process.env.MINIMAX_MODEL || 'abab6.5s-chat',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || undefined,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || undefined,
    ANTHROPIC_API_BASE: process.env.ANTHROPIC_API_BASE || undefined,
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || undefined,
    DOUBAO_API_KEY: process.env.DOUBAO_API_KEY || undefined,
    DOUBAO_API_BASE: process.env.DOUBAO_API_BASE || 'https://ark.cn-beijing.volces.com/api/coding/v3',
    DOUBAO_MODEL: process.env.DOUBAO_MODEL || 'Doubao-Seed-2.0-pro',
  };
}

// Alias for getLocalEnv - for backward compatibility
export const getEnv = getLocalEnv;

export type { D1Database, D1PreparedStatement, D1Result };
