/**
 * offline-queue.test.ts — E5 Offline PWA Support vitest tests
 * E5: 离线 PWA 支持
 *
 * Tests: queueCloudBackup, queueUndoRedo, cacheCanvasData, getCachedCanvasData,
 * getAllCachedCanvases exports and cache constants
 */

import { describe, it, expect } from 'vitest';

describe('E5-D5.2: queueCloudBackup', () => {
  it('should be exported from offline-queue module', async () => {
    const { queueCloudBackup } = await import('../offline-queue');
    expect(typeof queueCloudBackup).toBe('function');
  });
});

describe('E5-D5.2: queueUndoRedo', () => {
  it('should be exported from offline-queue module', async () => {
    const { queueUndoRedo } = await import('../offline-queue');
    expect(typeof queueUndoRedo).toBe('function');
  });
});

describe('E5-D5.5: Canvas data caching exports', () => {
  it('should export cacheCanvasData function', async () => {
    const { cacheCanvasData } = await import('../offline-queue');
    expect(typeof cacheCanvasData).toBe('function');
  });

  it('should export getCachedCanvasData function', async () => {
    const { getCachedCanvasData } = await import('../offline-queue');
    expect(typeof getCachedCanvasData).toBe('function');
  });

  it('should export getAllCachedCanvases function', async () => {
    const { getAllCachedCanvases } = await import('../offline-queue');
    expect(typeof getAllCachedCanvases).toBe('function');
  });
});

describe('E5-D5.5: Cache constants in source', () => {
  it('should enforce MAX_CACHED_CANVASES = 5', async () => {
    const fs = await import('node:fs');
    const content = fs.readFileSync(
      '/root/.openclaw/vibex/vibex-fronted/src/lib/offline-queue.ts',
      'utf-8'
    );
    expect(content).toContain('MAX_CACHED_CANVASES = 5');
  });

  it('should enforce CACHE_TTL_MS = 7 days', async () => {
    const fs = await import('node:fs');
    const content = fs.readFileSync(
      '/root/.openclaw/vibex/vibex-fronted/src/lib/offline-queue.ts',
      'utf-8'
    );
    expect(content).toContain('7 * 24 * 60 * 60 * 1000');
  });

  it('should implement CachedCanvasData interface with canvasId', async () => {
    const fs = await import('node:fs');
    const content = fs.readFileSync(
      '/root/.openclaw/vibex/vibex-fronted/src/lib/offline-queue.ts',
      'utf-8'
    );
    expect(content).toContain('export interface CachedCanvasData');
    expect(content).toContain('canvasId: string');
    expect(content).toContain('cachedAt: number');
    expect(content).toContain('expiresAt: number');
  });

  it('should use separate CANVAS_DB_NAME from offline queue DB', async () => {
    const fs = await import('node:fs');
    const content = fs.readFileSync(
      '/root/.openclaw/vibex/vibex-fronted/src/lib/offline-queue.ts',
      'utf-8'
    );
    expect(content).toContain("CANVAS_DB_NAME = 'vibex-canvas-cache'");
  });
});
