// Database connection pool management for Vibex
// Supports both D1 (Cloudflare Workers) and Prisma (local development)

import { PrismaClient, Prisma } from '@prisma/client';

// ============================================
// D1 Types (Cloudflare Workers)
// ============================================

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

// Environment bindings type
interface Env {
  DB: D1Database;
  ENVIRONMENT?: string;
  JWT_SECRET: string;
  MINIMAX_API_KEY: string;
  MINIMAX_API_BASE?: string;
  MINIMAX_MODEL?: string;
}

// ============================================
// Connection Pool Configuration
// ============================================

interface PoolConfig {
  maxConnections: number;
  minConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  maxLifetime: number;
  retryAttempts: number;
  retryDelay: number;
}

const defaultPoolConfig: PoolConfig = {
  maxConnections: 10,
  minConnections: 2,
  connectionTimeout: 10000,
  idleTimeout: 30000,
  maxLifetime: 60000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// ============================================
// Prisma Connection Pool Manager
// ============================================

class PrismaPoolManager {
  private client: PrismaClient | null = null;
  private config: PoolConfig;
  private isHealthy: boolean = false;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 30000; // 30 seconds

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = { ...defaultPoolConfig, ...config };
  }

  getClient(): PrismaClient {
    if (!this.client) {
      this.client = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        datasources: {
          db: {
            url: process.env.DATABASE_URL || 'file:./dev.db',
          },
        },
      });
      
      // Configure connection pool via Prisma
      // Note: Prisma handles connection pooling internally
      // These settings are passed via DATABASE_URL or connection limit in some deployments
    }
    return this.client;
  }

  async healthCheck(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return this.isHealthy;
    }

    try {
      await this.client?.$queryRawUnsafe('SELECT 1');
      this.isHealthy = true;
      this.lastHealthCheck = now;
    } catch (error) {
      console.error('Prisma health check failed:', error);
      this.isHealthy = false;
    }

    return this.isHealthy;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.$disconnect();
      this.client = null;
      this.isHealthy = false;
    }
  }

  isConnected(): boolean {
    return this.client !== null && this.isHealthy;
  }

  getStats() {
    return {
      isHealthy: this.isHealthy,
      lastHealthCheck: this.lastHealthCheck,
      config: this.config,
    };
  }
}

// ============================================
// D1 Connection Manager (for Cloudflare Workers)
// ============================================

class D1ConnectionManager {
  private env: Env | null = null;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(retryAttempts: number = 3, retryDelay: number = 1000) {
    this.retryAttempts = retryAttempts;
    this.retryDelay = retryDelay;
  }

  setEnv(env: Env): void {
    this.env = env;
  }

  getEnv(): Env | null {
    return this.env;
  }

  isAvailable(): boolean {
    return this.env?.DB !== undefined;
  }

  async executeWithRetry<T>(
    operation: (db: D1Database) => Promise<T>,
    customRetryAttempts?: number
  ): Promise<T> {
    const attempts = customRetryAttempts ?? this.retryAttempts;
    
    for (let i = 0; i < attempts; i++) {
      try {
        if (!this.env?.DB) {
          throw new Error('D1 database not available');
        }
        return await operation(this.env.DB);
      } catch (error) {
        if (i === attempts - 1) throw error;
        
        const delay = this.retryDelay * Math.pow(2, i); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Max retry attempts reached');
  }
}

// ============================================
// Database Pool Singleton
// ============================================

let prismaPoolManager: PrismaPoolManager | null = null;
let d1ConnectionManager: D1ConnectionManager | null = null;

function getPrismaPoolManager(): PrismaPoolManager {
  if (!prismaPoolManager) {
    prismaPoolManager = new PrismaPoolManager();
  }
  return prismaPoolManager;
}

function getD1ConnectionManager(): D1ConnectionManager {
  if (!d1ConnectionManager) {
    d1ConnectionManager = new D1ConnectionManager();
  }
  return d1ConnectionManager;
}

// Initialize with environment
export function initializeDB(env: Env | undefined): void {
  if (env?.DB) {
    const d1Manager = getD1ConnectionManager();
    d1Manager.setEnv(env);
  }
}

// ============================================
// Database Query Functions with Connection Pooling
// ============================================

/**
 * Execute a query that returns multiple rows
 */
export async function queryDB<T = unknown>(
  env: Env | undefined,
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  if (env?.DB) {
    // Use D1 with retry mechanism
    const d1Manager = getD1ConnectionManager();
    d1Manager.setEnv(env);
    
    return d1Manager.executeWithRetry(async (db) => {
      const stmt = db.prepare(sql).bind(...params);
      const result = await stmt.all<T>();
      return result.results;
    });
  } else {
    // Fallback to Prisma with connection pool
    const prismaManager = getPrismaPoolManager();
    const prisma = prismaManager.getClient();
    
    try {
      const result = await prisma.$queryRawUnsafe<T[]>(sql, ...params);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Prisma query error:', error);
      throw error;
    }
  }
}

/**
 * Execute a query that returns a single row
 */
export async function queryOne<T = unknown>(
  env: Env | undefined,
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  if (env?.DB) {
    const d1Manager = getD1ConnectionManager();
    d1Manager.setEnv(env);
    
    return d1Manager.executeWithRetry(async (db) => {
      const stmt = db.prepare(sql).bind(...params);
      return await stmt.first<T>();
    });
  } else {
    const results = await queryDB<T>(env, sql, params);
    return results.length > 0 ? results[0] : null;
  }
}

/**
 * Execute an INSERT, UPDATE, or DELETE operation
 */
export async function executeDB(
  env: Env | undefined,
  sql: string,
  params: unknown[] = []
): Promise<{ changes: number; lastInsertRowid: number | bigint }> {
  if (env?.DB) {
    const d1Manager = getD1ConnectionManager();
    d1Manager.setEnv(env);
    
    return d1Manager.executeWithRetry(async (db) => {
      const stmt = db.prepare(sql).bind(...params);
      const result = await stmt.run();
      return {
        changes: result.meta?.changes || 0,
        lastInsertRowid: result.meta?.last_row_id || 0,
      };
    });
  } else {
    const prismaManager = getPrismaPoolManager();
    const prisma = prismaManager.getClient();
    
    try {
      const result = await prisma.$executeRawUnsafe(sql, ...params);
      return { changes: result, lastInsertRowid: 0 };
    } catch (error) {
      console.error('Prisma execute error:', error);
      throw error;
    }
  }
}

/**
 * Execute multiple operations in a transaction
 */
export async function transactionDB(
  env: Env | undefined,
  operations: Array<{ sql: string; params: unknown[] }>
): Promise<{ changes: number; lastInsertRowid: number | bigint }> {
  if (env?.DB) {
    // D1 doesn't support explicit transactions in the same way
    // Execute operations sequentially
    let totalChanges = 0;
    let lastRowId: number | bigint = 0;
    
    for (const op of operations) {
      const result = await executeDB(env, op.sql, op.params);
      totalChanges += result.changes;
      lastRowId = result.lastInsertRowid;
    }
    
    return { changes: totalChanges, lastInsertRowid: lastRowId };
  } else {
    // Use Prisma transaction
    const prismaManager = getPrismaPoolManager();
    const prisma = prismaManager.getClient();
    
    return prisma.$transaction(async (tx) => {
      let totalChanges = 0;
      let lastRowId: number | bigint = 0;
      
      for (const op of operations) {
        const result = await tx.$executeRawUnsafe(op.sql, ...op.params);
        totalChanges += result;
      }
      
      return { changes: totalChanges, lastInsertRowid: lastRowId };
    }) as Promise<{ changes: number; lastInsertRowid: number | bigint }>;
  }
}

// ============================================
// Health Check and Pool Status
// ============================================

/**
 * Check database health
 */
export async function healthCheckDB(env: Env | undefined): Promise<{
  status: 'healthy' | 'unhealthy';
  type: 'd1' | 'prisma' | 'none';
  details?: unknown;
}> {
  if (env?.DB) {
    try {
      const d1Manager = getD1ConnectionManager();
      d1Manager.setEnv(env);
      
      await d1Manager.executeWithRetry(async (db) => {
        const stmt = db.prepare('SELECT 1 as health');
        await stmt.first();
      }, 1);
      
      return { status: 'healthy', type: 'd1' };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        type: 'd1',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  } else {
    try {
      const prismaManager = getPrismaPoolManager();
      const isHealthy = await prismaManager.healthCheck();
      
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        type: 'prisma',
        details: prismaManager.getStats(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        type: 'prisma',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Get connection pool status
 */
export function getPoolStatus(): {
  prisma: ReturnType<PrismaPoolManager['getStats']>;
  d1: { available: boolean };
} {
  return {
    prisma: getPrismaPoolManager().getStats(),
    d1: { available: getD1ConnectionManager().isAvailable() },
  };
}

/**
 * Disconnect all pool connections (for graceful shutdown)
 */
export async function disconnectDB(): Promise<void> {
  const prismaManager = getPrismaPoolManager();
  await prismaManager.disconnect();
}

// ============================================
// Utility Functions
// ============================================

/**
 * Generate a CUID-like ID
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `c${timestamp}${random}`;
}

/**
 * Escape SQL string to prevent SQL injection
 */
export function escapeSQL(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Build parameterized query string
 */
export function buildParameterizedQuery(
  baseQuery: string,
  conditions: Record<string, unknown>,
  orderBy?: string,
  limit?: number,
  offset?: number
): { sql: string; params: unknown[] } {
  const params: unknown[] = [];
  const whereClauses: string[] = [];

  for (const [key, value] of Object.entries(conditions)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        whereClauses.push(`${key} IN (${value.map(() => '?').join(', ')})`);
        params.push(...value);
      } else if (typeof value === 'string' && value.includes('%')) {
        // LIKE pattern
        whereClauses.push(`${key} LIKE ?`);
        params.push(value);
      } else {
        whereClauses.push(`${key} = ?`);
        params.push(value);
      }
    }
  }

  let sql = baseQuery;
  if (whereClauses.length > 0) {
    sql += ' WHERE ' + whereClauses.join(' AND ');
  }
  if (orderBy) {
    sql += ` ORDER BY ${orderBy}`;
  }
  if (limit !== undefined) {
    sql += ` LIMIT ${limit}`;
  }
  if (offset !== undefined) {
    sql += ` OFFSET ${offset}`;
  }

  return { sql, params };
}

// ============================================
// Export Types
// ============================================

export type { Env, D1Database, D1PreparedStatement, D1Result, PoolConfig };
