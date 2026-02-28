// Environment variables for Cloudflare Workers and local development

export interface CloudflareEnv {
  DB: D1Database;
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

// Get environment variables - works in both Cloudflare Workers and local development
export function getEnv(): CloudflareEnv {
  // For Cloudflare Workers, variables are in globalThis.env
  const cfEnv = (globalThis as any).env;
  
  if (cfEnv?.DB) {
    return cfEnv as CloudflareEnv;
  }

  // For local development, read from process.env
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('❌ FATAL: JWT_SECRET environment variable is not set!');
    console.error('   Please set JWT_SECRET before starting the server.');
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required');
    }
  }
  
  return {
    DB: {} as D1Database,
    JWT_SECRET: jwtSecret,
    MINIMAX_API_KEY: process.env.MINIMAX_API_KEY || '',
    MINIMAX_API_BASE: process.env.MINIMAX_API_BASE,
    MINIMAX_MODEL: process.env.MINIMAX_MODEL,
  };
}

export type { D1Database, D1PreparedStatement, D1Result };