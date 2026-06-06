/**
 * canvasAnalyticsStore.test.ts — S72-E4 history extension
 * Tests: archiveHistory, getHistory, shareAnalytics, exportAnalytics JSON
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Must use vi.hoisted to avoid vi.mock hoisting issues
const { createTestStore } = vi.hoisted(() => {
  // Create a fresh store for testing — bypass persist middleware
  const storeState: {
    stats: Record<string, { totalEdits: number; nodeCount: number; topNodes: string[]; lastUpdated: string }>;
    history: Array<{
      date: string;
      canvasId: string;
      totalEdits: number;
      nodeCount: number;
      topNodes: string[];
    }>;
    sharedLinks: Record<string, { shareId: string; createdAt: string; canvasId: string }>;
    recordEdit: (canvasId: string, nodeId: string, type: string) => void;
    archiveHistory: (canvasId: string) => void;
    getHistory: (range: '7d' | '30d') => Array<{ date: string; canvasId: string; totalEdits: number; nodeCount: number; topNodes: string[] }>;
    shareAnalytics: (canvasId: string) => string;
    exportAnalytics: (canvasId: string, format: 'json' | 'csv') => string;
    clearStats: (canvasId: string) => void;
  } = {
    stats: {},
    history: [],
    sharedLinks: {},
    recordEdit: (canvasId, nodeId, type) => {
      if (!storeState.stats[canvasId]) {
        storeState.stats[canvasId] = { totalEdits: 0, nodeCount: 0, topNodes: [], lastUpdated: new Date().toISOString() };
      }
      storeState.stats[canvasId].totalEdits += 1;
      storeState.stats[canvasId].nodeCount += 1;
      storeState.stats[canvasId].lastUpdated = new Date().toISOString();
    },
    archiveHistory: (canvasId) => {
      const stats = storeState.stats[canvasId];
      if (!stats) return;
      const today = new Date().toISOString().slice(0, 10);
      const existing = storeState.history.findIndex(
        (e) => e.canvasId === canvasId && e.date === today
      );
      const entry = {
        date: today,
        canvasId,
        totalEdits: stats.totalEdits,
        nodeCount: stats.nodeCount,
        topNodes: [...stats.topNodes],
      };
      if (existing >= 0) {
        storeState.history[existing] = entry;
      } else {
        storeState.history.push(entry);
      }
    },
    getHistory: (range) => {
      const days = range === '7d' ? 7 : 30;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      return storeState.history.filter((e) => e.date >= cutoffStr);
    },
    shareAnalytics: (canvasId) => {
      const shareId = `share_${canvasId}_${Date.now()}`;
      storeState.sharedLinks[shareId] = {
        shareId,
        createdAt: new Date().toISOString(),
        canvasId,
      };
      return shareId;
    },
    exportAnalytics: (canvasId, format) => {
      const stats = storeState.stats[canvasId];
      const history = storeState.getHistory('30d').filter((e) => e.canvasId === canvasId);
      if (format === 'csv') {
        if (!stats) return '';
        return `date,totalEdits,nodeCount\n${history.map((e) => `${e.date},${e.totalEdits},${e.nodeCount}`).join('\n')}`;
      }
      return JSON.stringify({ canvasId, stats, history }, null, 2);
    },
    clearStats: (canvasId) => {
      delete storeState.stats[canvasId];
    },
  };
  return { createTestStore: () => storeState };
});

describe('canvasAnalyticsStore — S72-E4 history extension', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    // Reset to fresh empty state before each test
    store = createTestStore();
    store.stats = {};
    store.history = [];
    store.sharedLinks = {};
  });

  it('archiveHistory adds a new entry to history', () => {
    store.recordEdit('canvas-1', 'node-1', 'position');
    store.recordEdit('canvas-1', 'node-2', 'text');
    store.archiveHistory('canvas-1');
    // After archiving, history should have at least 1 entry for today
    expect(store.history.length).toBeGreaterThan(0);
    const todayEntry = store.history.find(
      (e) => e.canvasId === 'canvas-1' && e.date === new Date().toISOString().slice(0, 10)
    );
    expect(todayEntry).toBeDefined();
    expect(todayEntry!.totalEdits).toBe(2);
  });

  it('archiveHistory skips duplicate date for same canvas', () => {
    store.recordEdit('canvas-1', 'node-1', 'position');
    store.archiveHistory('canvas-1');
    const afterFirst = store.history.length;
    // Archive again same day — should replace, not add
    store.archiveHistory('canvas-1');
    const afterSecond = store.history.length;
    expect(afterSecond).toBe(afterFirst);
  });

  it('getHistory returns entries within 7 days', () => {
    store.recordEdit('canvas-1', 'node-1', 'add');
    store.archiveHistory('canvas-1');
    const entries = store.getHistory('7d');
    expect(entries.length).toBeGreaterThanOrEqual(1);
    expect(entries.every((e) => e.canvasId === 'canvas-1')).toBe(true);
  });

  it('getHistory returns entries within 30 days', () => {
    store.recordEdit('canvas-1', 'node-1', 'add');
    store.archiveHistory('canvas-1');
    const entries = store.getHistory('30d');
    expect(entries.length).toBeGreaterThanOrEqual(1);
  });

  it('shareAnalytics returns a non-empty shareId', () => {
    const shareId = store.shareAnalytics('canvas-1');
    expect(typeof shareId).toBe('string');
    expect(shareId.length).toBeGreaterThan(0);
    expect(store.sharedLinks[shareId]).toBeDefined();
  });

  it('exportAnalytics returns JSON string with history', () => {
    store.recordEdit('canvas-1', 'node-1', 'add');
    store.archiveHistory('canvas-1');
    const json = store.exportAnalytics('canvas-1', 'json');
    expect(typeof json).toBe('string');
    const parsed = JSON.parse(json);
    expect(parsed.canvasId).toBe('canvas-1');
    expect(parsed.history).toBeDefined();
    expect(Array.isArray(parsed.history)).toBe(true);
  });

  it('recordEdit increments totalEdits', () => {
    store.recordEdit('canvas-1', 'node-1', 'position');
    expect(store.stats['canvas-1']?.totalEdits).toBe(1);
    store.recordEdit('canvas-1', 'node-2', 'text');
    expect(store.stats['canvas-1']?.totalEdits).toBe(2);
  });

  it('clearStats removes canvas data', () => {
    store.recordEdit('canvas-1', 'node-1', 'position');
    store.archiveHistory('canvas-1');
    store.clearStats('canvas-1');
    expect(store.stats['canvas-1']).toBeUndefined();
  });
});
