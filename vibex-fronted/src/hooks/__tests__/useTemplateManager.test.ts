'use client';

/**
 * useTemplateManager — E4 Template Version Management
 * Vitest: export/import/history functions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTemplateManager } from '../useTemplateManager';
import type { RequirementTemplate } from '@/data/templates/types';

// Fresh store per test — localStorage mock that actually works
let store: Record<string, string> = {};
const getLs = () => store;
const mkMock = () => {
  store = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
};

const localStorageMock = mkMock();

beforeEach(() => {
  // Create a fresh store for each test
  const fresh = mkMock();
  Object.keys(localStorageMock).forEach(k => {
    (localStorageMock as Record<string, unknown>)[k] = (fresh as Record<string, unknown>)[k];
  });
  vi.clearAllMocks();
  Object.defineProperty(window, 'localStorage', { value: localStorageMock, configurable: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

const makeTemplate = (id = 'tpl-001', overrides: Partial<RequirementTemplate> = {}): RequirementRequirement => ({
  id,
  name: 'Test Template',
  description: 'A test template',
  category: 'saas',
  scenes: [],
  tags: ['test'],
  items: [],
  ...overrides,
}) as RequirementTemplate;

describe('useTemplateManager — E4 version management', () => {
  describe('importTemplate', () => {
    it('parses valid JSON template', async () => {
      const { result } = renderHook(() => useTemplateManager());
      const file = new File(
        [JSON.stringify({ id: 'tpl-x', name: 'Imported', description: 'desc', items: [] })],
        'test.json',
        { type: 'application/json' }
      );
      const data = await result.current.importTemplate(file);
      expect(data.id).toBe('tpl-x');
      expect(data.name).toBe('Imported');
    });

    it('throws on invalid JSON', async () => {
      const { result } = renderHook(() => useTemplateManager());
      const file = new File(['not json'], 'test.json', { type: 'application/json' });
      await expect(result.current.importTemplate(file)).rejects.toThrow('Invalid JSON');
    });

    it('throws on missing required fields', async () => {
      const { result } = renderHook(() => useTemplateManager());
      const file = new File(
        [JSON.stringify({ id: 'tpl-x', name: '' })],
        'test.json',
        { type: 'application/json' }
      );
      await expect(result.current.importTemplate(file)).rejects.toThrow('Invalid template format');
    });
  });

  describe('createSnapshot / getHistory', () => {
    it('stores and retrieves snapshots in desc timestamp order', () => {
      const { result } = renderHook(() => useTemplateManager());
      const tpl = makeTemplate('snap-tpl');
      result.current.createSnapshot('snap-tpl', tpl, 'v1');
      result.current.createSnapshot('snap-tpl', { ...tpl, name: 'Updated' } as RequirementTemplate, 'v2');

      const history = result.current.getHistory('snap-tpl');
      expect(history).toHaveLength(2);
      expect(history[0].label).toBe('v2');
      expect(history[1].label).toBe('v1');
    });

    it('returns empty array for unknown templateId', () => {
      const { result } = renderHook(() => useTemplateManager());
      expect(result.current.getHistory('nonexistent')).toEqual([]);
    });

    it('prunes oldest when exceeding MAX_SNAPSHOTS (10)', () => {
      const { result } = renderHook(() => useTemplateManager());
      const tpl = makeTemplate('snap-prune');
      for (let i = 1; i <= 12; i++) {
        result.current.createSnapshot('snap-prune', { ...tpl, name: `v${i}` } as RequirementTemplate, `v${i}`);
      }
      const history = result.current.getHistory('snap-prune');
      expect(history).toHaveLength(10);
      expect(history[0].label).toBe('v12');
    });
  });

  describe('deleteSnapshot', () => {
    it('removes a specific snapshot and leaves others intact', () => {
      const { result } = renderHook(() => useTemplateManager());
      const tpl = makeTemplate('del-snap');
      result.current.createSnapshot('del-snap', tpl, 'keep');
      result.current.createSnapshot('del-snap', { ...tpl, name: 'to-delete' } as RequirementTemplate, 'delete-me');

      const history = result.current.getHistory('del-snap');
      expect(history).toHaveLength(2);
      const toDelete = history.find(h => h.label === 'delete-me')!;

      result.current.deleteSnapshot('del-snap', toDelete.id);
      const after = result.current.getHistory('del-snap');
      expect(after).toHaveLength(1);
      expect(after[0].label).toBe('keep');
    });

    it('is idempotent for missing snapshotId', () => {
      const { result } = renderHook(() => useTemplateManager());
      const tpl = makeTemplate('del-snap2');
      result.current.createSnapshot('del-snap2', tpl, 'only');
      expect(() => result.current.deleteSnapshot('del-snap2', 'not-found-id')).not.toThrow();
      expect(result.current.getHistory('del-snap2')).toHaveLength(1);
    });
  });
});
