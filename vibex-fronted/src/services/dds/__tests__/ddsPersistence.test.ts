/**
 * Unit tests for DDS Persistence Service
 * Epic6: 数据持久化
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { DDSExportData } from '../ddsPersistence';

// ============================================
// validateImportData Tests
// ============================================

describe('validateImportData', () => {
  it('should accept valid DDSExportData', async () => {
    const { validateImportData } = await import('../ddsPersistence');
    const valid: DDSExportData = {
      version: 1,
      projectId: 'proj-123',
      projectName: 'Test Project',
      chapters: {
        requirement: { cards: [], edges: [] },
        context: { cards: [], edges: [] },
        flow: { cards: [], edges: [] },
        api: { cards: [], edges: [] },
      },
      chatHistory: [],
      exportedAt: '2026-04-16T00:00:00.000Z',
      source: 'dds-canvas',
    };
    expect(validateImportData(valid)).toBe(true);
  });

  it('should reject null/undefined', async () => {
    const { validateImportData } = await import('../ddsPersistence');
    expect(validateImportData(null)).toBe(false);
    expect(validateImportData(undefined)).toBe(false);
  });

  it('should reject non-object data', async () => {
    const { validateImportData } = await import('../ddsPersistence');
    expect(validateImportData('string')).toBe(false);
    expect(validateImportData(123)).toBe(false);
    expect(validateImportData([])).toBe(false);
  });

  it('should reject data with wrong version', async () => {
    const { validateImportData } = await import('../ddsPersistence');
    const invalid = {
      version: 2,
      projectId: 'proj-123',
      chapters: {
        requirement: { cards: [], edges: [] },
        context: { cards: [], edges: [] },
        flow: { cards: [], edges: [] },
        api: { cards: [], edges: [] },
      },
      chatHistory: [],
    };
    expect(validateImportData(invalid)).toBe(false);
  });

  it('should reject data without projectId string', async () => {
    const { validateImportData } = await import('../ddsPersistence');
    const invalid = {
      version: 1,
      projectId: 123,
      chapters: {
        requirement: { cards: [], edges: [] },
        context: { cards: [], edges: [] },
        flow: { cards: [], edges: [] },
        api: { cards: [], edges: [] },
      },
      chatHistory: [],
    };
    expect(validateImportData(invalid)).toBe(false);
  });

  it('should reject data without chapters', async () => {
    const { validateImportData } = await import('../ddsPersistence');
    const invalid = {
      version: 1,
      projectId: 'proj-123',
      chapters: null,
      chatHistory: [],
    };
    expect(validateImportData(invalid)).toBe(false);
  });

  it('should reject data without chatHistory array', async () => {
    const { validateImportData } = await import('../ddsPersistence');
    const invalid = {
      version: 1,
      projectId: 'proj-123',
      chapters: {
        requirement: { cards: [], edges: [] },
        context: { cards: [], edges: [] },
        flow: { cards: [], edges: [] },
        api: { cards: [], edges: [] },
      },
      chatHistory: 'not an array',
    };
    expect(validateImportData(invalid)).toBe(false);
  });

  it('should accept data with cards and edges', async () => {
    const { validateImportData } = await import('../ddsPersistence');
    const withCards: DDSExportData = {
      version: 1,
      projectId: 'proj-456',
      projectName: 'Project with Cards',
      chapters: {
        requirement: {
          cards: [{ id: 'card-1', type: 'requirement' } as unknown as never],
          edges: [],
        },
        context: { cards: [], edges: [] },
        flow: { cards: [], edges: [] },
      },
      chatHistory: [{ role: 'user', content: 'hello' } as unknown as never],
      exportedAt: '2026-04-16T00:00:00.000Z',
      source: 'dds-canvas',
    };
    expect(validateImportData(withCards)).toBe(true);
  });
});

// ============================================
// localStorage quickSave/quickLoad
// ============================================

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    get length() { return Object.keys(store).length; },
    getItem(key: string) { return store[key] ?? null; },
    setItem(key: string, value: string) { store[key] = value; },
    removeItem(key: string) { delete store[key]; },
    clear() { store = {}; },
    key(i: number) { return Object.keys(store)[i] ?? null; },
  };
})();

describe('localStorage quickSave/quickLoad', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Re-mock localStorage for each test
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it('should store and retrieve data via localStorage', async () => {
    const { quickSave, quickLoad } = await import('../ddsPersistence');

    const chapters = {
      requirement: { cards: [{ id: 'c1', type: 'requirement' } as unknown as never], edges: [] },
      context: { cards: [], edges: [] },
      flow: { cards: [], edges: [] },
      api: { cards: [], edges: [] },
    };

    quickSave('proj-1', 'My Project', chapters, []);
    const loaded = quickLoad('proj-1');

    expect(loaded).not.toBeNull();
    expect(loaded?.projectId).toBe('proj-1');
    expect(loaded?.projectName).toBe('My Project');
    expect(loaded?.chapters.requirement.cards).toHaveLength(1);
  });

  it('should return null for unknown project', async () => {
    const { quickLoad } = await import('../ddsPersistence');
    const result = quickLoad('nonexistent');
    expect(result).toBeNull();
  });

  it('should update existing project data', async () => {
    const { quickSave, quickLoad } = await import('../ddsPersistence');
    const baseChapters = {
      requirement: { cards: [], edges: [] },
      context: { cards: [], edges: [] },
      flow: { cards: [], edges: [] },
      api: { cards: [], edges: [] },
    };

    quickSave('proj-2', 'Project A', baseChapters, []);
    quickSave('proj-2', 'Project B', {
      requirement: { cards: [{ id: 'c2', type: 'requirement' } as unknown as never], edges: [] },
      context: { cards: [], edges: [] },
      flow: { cards: [], edges: [] },
      api: { cards: [], edges: [] },
    }, []);

    const loaded = quickLoad('proj-2');
    expect(loaded?.projectName).toBe('Project B');
    expect(loaded?.chapters.requirement.cards).toHaveLength(1);
  });

  it('should clear localStorage for a project', async () => {
    const { quickSave, quickLoad, clearLocalStorage } = await import('../ddsPersistence');
    const chapters = {
      requirement: { cards: [], edges: [] },
      context: { cards: [], edges: [] },
      flow: { cards: [], edges: [] },
      api: { cards: [], edges: [] },
    };

    quickSave('proj-3', 'Test', chapters, []);
    expect(quickLoad('proj-3')).not.toBeNull();
    clearLocalStorage('proj-3');
    expect(quickLoad('proj-3')).toBeNull();
  });
});

// ============================================
// IndexedDB unavailability
// ============================================

describe('IndexedDB unavailability', () => {
  it('should handle IndexedDB being unavailable gracefully', async () => {
    const { getStorageInfo } = await import('../ddsPersistence');
    const info = await getStorageInfo();
    // Our mock has indexedDB as undefined
    expect(info.indexedDBAvailable).toBe(false);
    expect(info.indexedDBSnapshotCount).toBe(0);
    expect(info.localStorageAvailable).toBe(true);
  });
});
