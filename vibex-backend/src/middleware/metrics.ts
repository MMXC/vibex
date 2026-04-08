/**
 * Metrics Middleware
 *
 * E2-S1: Records API latency per request with 5-minute rolling window
 * E2-S3: TTL cleanup every 5 minutes
 *
 * Constraints:
 * - No DB queries (in-memory only, no压测 path)
 * - No PII collection
 * - Fixed memory ceiling via TTL
 */

import type { Context, Next } from 'hono';

// ============================================================
// Types
// ============================================================

export interface LatencyRecord {
  timestamp: number; // Date.now()
  duration: number;  // ms
}

// ============================================================
// Percentile calculation
// ============================================================

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.ceil(p * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

export interface LatencyStats {
  p50: number;
  p95: number;
  p99: number;
  window: string;
  sampleCount: number;
}

// ============================================================
// Metrics Store — circular buffer with 5-minute TTL
// ============================================================

const TTL_MS = 5 * 60 * 1000; // 5 minutes

class MetricsStore {
  private records: LatencyRecord[] = [];
  private lastCleanup = Date.now();

  push(duration: number): void {
    const now = Date.now();
    this.records.push({ timestamp: now, duration });

    // Lazy cleanup: trigger when we have > 1000 records OR > TTL since last cleanup
    if (this.records.length > 1000 || now - this.lastCleanup > TTL_MS) {
      this.cleanup();
    }
  }

  cleanup(): void {
    const cutoff = Date.now() - TTL_MS;
    this.records = this.records.filter((r) => r.timestamp > cutoff);
    this.lastCleanup = Date.now();
  }

  getStats(): LatencyStats {
    this.cleanup();
    if (this.records.length === 0) {
      return { p50: 0, p95: 0, p99: 0, window: '5m', sampleCount: 0 };
    }
    const sorted = [...this.records.map((r) => r.duration)].sort((a, b) => a - b);
    return {
      p50: percentile(sorted, 0.50),
      p95: percentile(sorted, 0.95),
      p99: percentile(sorted, 0.99),
      window: '5m',
      sampleCount: this.records.length,
    };
  }
}

// Singleton — shared across all requests
export const metricsStore = new MetricsStore();

// ============================================================
// Middleware — records every API request latency
// ============================================================

export async function metricsMiddleware(c: Context, next: Next): Promise<Response> {
  const start = Date.now();
  const response = await next();
  const duration = Date.now() - start;
  metricsStore.push(duration);
  return response;
}

// ============================================================
// TTL Cleanup — scheduled every 5 minutes
// ============================================================

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

export function startMetricsCleanup(): void {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    metricsStore.cleanup();
  }, TTL_MS);
}

export function stopMetricsCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}
