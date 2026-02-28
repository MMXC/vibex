// D1 Database wrapper for Cloudflare Workers
// Falls back to Prisma for local development

import { PrismaClient } from '@prisma/client';

// D1 bindings type
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

// Environment bindings
interface Env {
  DB: D1Database;
  ENVIRONMENT?: string;
  JWT_SECRET: string;
  MINIMAX_API_KEY: string;
  MINIMAX_API_BASE?: string;
  MINIMAX_MODEL?: string;
}

// Prisma client for local development
let prisma: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

// D1-compatible query helper
export async function queryDB<T = unknown>(
  env: Env | undefined,
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  if (env?.DB) {
    // Use D1
    const stmt = env.DB.prepare(sql).bind(...params);
    const result = await stmt.all<T>();
    return result.results;
  } else {
    // Fallback to Prisma for local development
    const p = getPrisma();
    // For Prisma, we need to use raw queries
    const result = await p.$queryRawUnsafe<T[]>(sql, ...params);
    return result;
  }
}

export async function queryOne<T = unknown>(
  env: Env | undefined,
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  if (env?.DB) {
    const stmt = env.DB.prepare(sql).bind(...params);
    return await stmt.first<T>();
  } else {
    const results = await queryDB<T>(env, sql, params);
    return results.length > 0 ? results[0] : null;
  }
}

export async function executeDB(
  env: Env | undefined,
  sql: string,
  params: unknown[] = []
): Promise<{ changes: number; lastInsertRowid: number | bigint }> {
  if (env?.DB) {
    const stmt = env.DB.prepare(sql).bind(...params);
    const result = await stmt.run();
    return {
      changes: result.meta?.changes || 0,
      lastInsertRowid: result.meta?.last_row_id || 0,
    };
  } else {
    const p = getPrisma();
    const result = await p.$executeRawUnsafe(sql, ...params);
    return { changes: result, lastInsertRowid: 0 };
  }
}

// Helper to generate CUID-like IDs
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `c${timestamp}${random}`;
}

// Export environment type
export type { Env, D1Database, D1PreparedStatement, D1Result };