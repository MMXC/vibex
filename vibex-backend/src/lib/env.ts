// Environment variables for Cloudflare Workers and local development

export interface CloudflareEnv {
  DB: D1Database;
  ENVIRONMENT: string;
  JWT_SECRET: string;
  MINIMAX_API_KEY: string;
  MINIMAX_API_BASE?: string;
  MINIMAX_MODEL?: string;
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
    DB: {} as D1Database,
    ENVIRONMENT: 'development',
    JWT_SECRET: process.env.JWT_SECRET || 'vibex-dev-secret',
    MINIMAX_API_KEY: process.env.MINIMAX_API_KEY || '',
    MINIMAX_API_BASE: process.env.MINIMAX_API_BASE || 'https://api.minimax.chat/v1',
    MINIMAX_MODEL: process.env.MINIMAX_MODEL || 'abab6.5s-chat',
  };
}

export type { D1Database, D1PreparedStatement, D1Result };