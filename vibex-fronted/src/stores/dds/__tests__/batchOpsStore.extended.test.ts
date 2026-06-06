/**
 * batchOpsStore.extended.test.ts — S72-E2: batchOpsStore template batch ops extension tests
 *
 * Vitest patterns:
 * - Zustand dual-interface mock: vi.hoisted() + Object.assign for .getState()
 * - GlobalThis indexedDB guard bypass
 * - Module-level singleton: vi.resetModules() in beforeEach
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============================================
// Mock indexedDB before any store imports
// ============================================

const mockIDB = {
  open: vi.fn(),
};
Object.defineProperty(globalThis, 'indexedDB', {
  value: mockIDB,
  writable: true,
  configurable: true,
});

// ============================================
// Import after mock is set
// ============================================

import { useBatchOpsStore } from '@/stores/dds/batchOpsStore';

// ============================================
// Helper: mock templateStore for delete/export actions
// ============================================

const mockTemplateStore = {
  templates: [
    { id: 'tpl-1', name: 'Template 1', category: 'business' as const, tags: [], description: '' },
    { id: 'tpl-2', name: 'Template 2', category: 'tech' as const, tags: [], description: '' },
    { id: 'tpl-3', name: 'Template 3', category: 'design' as const, tags: [], description: '' },
  ],
};

vi.mock('@/stores/templateStore', () => ({
  useTemplateStore: Object.assign(
    vi.fn(() => mockTemplateStore),
    {
      getState: () => mockTemplateStore,
    }
  ),
}));

describe('batchOpsStore — S72-E2 template batch operations', () => {
  beforeEach(() => {
    vi.resetModules();
    useBatchOpsStore.getState().reset();
  });

  describe('initial state', () => {
    it('isPanelOpen starts false', () => {
      expect(useBatchOpsStore.getState().isPanelOpen).toBe(false);
    });

    it('selectedTemplateIds starts empty', () => {
      expect(useBatchOpsStore.getState().selectedTemplateIds).toEqual([]);
    });

    it('isOperating starts false', () => {
      expect(useBatchOpsStore.getState().isOperating).toBe(false);
    });
  });

  describe('openPanel / closePanel', () => {
    it('openPanel sets isPanelOpen to true', () => {
      useBatchOpsStore.getState().openPanel();
      expect(useBatchOpsStore.getState().isPanelOpen).toBe(true);
    });

    it('closePanel sets isPanelOpen to false and clears selection', () => {
      useBatchOpsStore.getState().openPanel();
      useBatchOpsStore.getState().selectAllTemplates(['tpl-1', 'tpl-2']);
      useBatchOpsStore.getState().closePanel();
      const state = useBatchOpsStore.getState();
      expect(state.isPanelOpen).toBe(false);
      expect(state.selectedTemplateIds).toEqual([]);
    });
  });

  describe('selectAllTemplates', () => {
    it('selectAllTemplates sets all given IDs', () => {
      useBatchOpsStore.getState().selectAllTemplates(['tpl-1', 'tpl-2', 'tpl-3']);
      expect(useBatchOpsStore.getState().selectedTemplateIds).toEqual(['tpl-1', 'tpl-2', 'tpl-3']);
    });

    it('selectAllTemplates replaces previous selection', () => {
      useBatchOpsStore.getState().selectAllTemplates(['tpl-1']);
      useBatchOpsStore.getState().selectAllTemplates(['tpl-2', 'tpl-3']);
      expect(useBatchOpsStore.getState().selectedTemplateIds).toEqual(['tpl-2', 'tpl-3']);
    });
  });

  describe('clearSelection', () => {
    it('clearSelection empties selectedTemplateIds', () => {
      useBatchOpsStore.getState().selectAllTemplates(['tpl-1', 'tpl-2']);
      useBatchOpsStore.getState().clearSelection();
      expect(useBatchOpsStore.getState().selectedTemplateIds).toEqual([]);
    });
  });

  describe('toggleTemplateSelection', () => {
    it('adds templateId if not selected', () => {
      useBatchOpsStore.getState().toggleTemplateSelection('tpl-1');
      expect(useBatchOpsStore.getState().selectedTemplateIds).toEqual(['tpl-1']);
    });

    it('removes templateId if already selected', () => {
      useBatchOpsStore.getState().selectAllTemplates(['tpl-1', 'tpl-2']);
      useBatchOpsStore.getState().toggleTemplateSelection('tpl-1');
      expect(useBatchOpsStore.getState().selectedTemplateIds).toEqual(['tpl-2']);
    });

    it('idempotent: toggling same ID twice returns to original state', () => {
      useBatchOpsStore.getState().toggleTemplateSelection('tpl-1');
      useBatchOpsStore.getState().toggleTemplateSelection('tpl-1');
      expect(useBatchOpsStore.getState().selectedTemplateIds).toEqual([]);
    });
  });

  describe('deleteSelectedTemplates', () => {
    it('deleteSelectedTemplates sets isOperating then clears selection', () => {
      useBatchOpsStore.getState().selectAllTemplates(['tpl-1', 'tpl-2']);
      useBatchOpsStore.getState().deleteSelectedTemplates();
      expect(useBatchOpsStore.getState().isOperating).toBe(false);
      expect(useBatchOpsStore.getState().selectedTemplateIds).toEqual([]);
    });

    it('deleteSelectedTemplates does nothing when nothing selected', () => {
      const state = useBatchOpsStore.getState();
      expect(state.selectedTemplateIds).toHaveLength(0);
      // Should not throw
      state.deleteSelectedTemplates();
      expect(useBatchOpsStore.getState().isOperating).toBe(false);
    });
  });

  describe('moveSelectedToFolder', () => {
    it('moveSelectedToFolder does not throw with selection', () => {
      useBatchOpsStore.getState().selectAllTemplates(['tpl-1']);
      expect(() => useBatchOpsStore.getState().moveSelectedToFolder('folder-1')).not.toThrow();
      expect(useBatchOpsStore.getState().isOperating).toBe(false);
    });

    it('moveSelectedToFolder does nothing when nothing selected', () => {
      expect(() => useBatchOpsStore.getState().moveSelectedToFolder('folder-1')).not.toThrow();
    });
  });

  describe('exportSelectedTemplates', () => {
    it('exportSelectedTemplates does nothing when nothing selected', () => {
      const state = useBatchOpsStore.getState();
      expect(state.selectedTemplateIds).toHaveLength(0);
      // Should not throw (no window.URL methods in test env)
      state.exportSelectedTemplates('csv');
      state.exportSelectedTemplates('json');
    });
  });

  describe('reset', () => {
    it('reset restores all S72-E2 fields to default', () => {
      useBatchOpsStore.getState().openPanel();
      useBatchOpsStore.getState().selectAllTemplates(['tpl-1', 'tpl-2']);
      useBatchOpsStore.getState().setIsOperating(true);
      useBatchOpsStore.getState().reset();
      const state = useBatchOpsStore.getState();
      expect(state.isPanelOpen).toBe(false);
      expect(state.selectedTemplateIds).toEqual([]);
      expect(state.isOperating).toBe(false);
    });
  });
});
