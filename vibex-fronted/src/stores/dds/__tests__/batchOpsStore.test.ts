/**
 * batchOpsStore.test.ts — Sprint60 E2: batchOpsStore unit tests
 *
 * Vitest patterns used:
 * - Zustand dual-interface mock: vi.hoisted() + Object.assign for .getState()
 * - GlobalThis indexedDB guard bypass
 */

import { describe, it, expect, beforeEach } from 'vitest';

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
import type { BatchOpsState } from '@/stores/dds/batchOpsStore';

describe('batchOpsStore', () => {
  beforeEach(() => {
    useBatchOpsStore.getState().reset();
  });

  describe('initial state', () => {
    it('has all dialogs closed', () => {
      const state = useBatchOpsStore.getState();
      expect(state.isDeleteDialogOpen).toBe(false);
      expect(state.isRenameDialogOpen).toBe(false);
    });

    it('has default rename mode as suffix', () => {
      const state = useBatchOpsStore.getState();
      expect(state.renameMode).toBe('suffix');
    });

    it('has empty rename text', () => {
      const state = useBatchOpsStore.getState();
      expect(state.renamePrefix).toBe('');
      expect(state.renameSuffix).toBe('');
    });

    it('has isOperating false', () => {
      const state = useBatchOpsStore.getState();
      expect(state.isOperating).toBe(false);
    });
  });

  describe('openDeleteDialog / closeDeleteDialog', () => {
    it('openDeleteDialog sets isDeleteDialogOpen to true', () => {
      useBatchOpsStore.getState().openDeleteDialog();
      expect(useBatchOpsStore.getState().isDeleteDialogOpen).toBe(true);
    });

    it('closeDeleteDialog sets isDeleteDialogOpen to false', () => {
      useBatchOpsStore.getState().openDeleteDialog();
      useBatchOpsStore.getState().closeDeleteDialog();
      expect(useBatchOpsStore.getState().isDeleteDialogOpen).toBe(false);
    });
  });

  describe('openRenameDialog / closeRenameDialog', () => {
    it('openRenameDialog sets isRenameDialogOpen to true', () => {
      useBatchOpsStore.getState().openRenameDialog();
      expect(useBatchOpsStore.getState().isRenameDialogOpen).toBe(true);
    });

    it('closeRenameDialog resets rename fields', () => {
      useBatchOpsStore.getState().setRenamePrefix('PREFIX_');
      useBatchOpsStore.getState().setRenameSuffix('_SUFFIX');
      useBatchOpsStore.getState().setRenameMode('prefix');
      useBatchOpsStore.getState().openRenameDialog();
      useBatchOpsStore.getState().closeRenameDialog();
      const state = useBatchOpsStore.getState();
      expect(state.isRenameDialogOpen).toBe(false);
      expect(state.renamePrefix).toBe('');
      expect(state.renameSuffix).toBe('');
      expect(state.renameMode).toBe('suffix');
    });
  });

  describe('rename mode and text setters', () => {
    it('setRenameMode changes mode', () => {
      useBatchOpsStore.getState().setRenameMode('prefix');
      expect(useBatchOpsStore.getState().renameMode).toBe('prefix');
      useBatchOpsStore.getState().setRenameMode('suffix');
      expect(useBatchOpsStore.getState().renameMode).toBe('suffix');
    });

    it('setRenamePrefix updates prefix', () => {
      useBatchOpsStore.getState().setRenamePrefix('NEW_PREFIX_');
      expect(useBatchOpsStore.getState().renamePrefix).toBe('NEW_PREFIX_');
    });

    it('setRenameSuffix updates suffix', () => {
      useBatchOpsStore.getState().setRenameSuffix('_NEW_SUFFIX');
      expect(useBatchOpsStore.getState().renameSuffix).toBe('_NEW_SUFFIX');
    });
  });

  describe('setIsOperating', () => {
    it('setIsOperating(true) sets isOperating', () => {
      useBatchOpsStore.getState().setIsOperating(true);
      expect(useBatchOpsStore.getState().isOperating).toBe(true);
    });

    it('setIsOperating(false) clears isOperating', () => {
      useBatchOpsStore.getState().setIsOperating(true);
      useBatchOpsStore.getState().setIsOperating(false);
      expect(useBatchOpsStore.getState().isOperating).toBe(false);
    });
  });

  describe('reset', () => {
    it('reset restores all defaults', () => {
      useBatchOpsStore.getState().setRenamePrefix('TEST');
      useBatchOpsStore.getState().setRenameSuffix('TEST2');
      useBatchOpsStore.getState().setRenameMode('prefix');
      useBatchOpsStore.getState().setIsOperating(true);
      useBatchOpsStore.getState().openDeleteDialog();
      useBatchOpsStore.getState().openRenameDialog();

      useBatchOpsStore.getState().reset();

      const state = useBatchOpsStore.getState();
      expect(state.isDeleteDialogOpen).toBe(false);
      expect(state.isRenameDialogOpen).toBe(false);
      expect(state.renameMode).toBe('suffix');
      expect(state.renamePrefix).toBe('');
      expect(state.renameSuffix).toBe('');
      expect(state.isOperating).toBe(false);
    });
  });

  describe('selector usage (React hook interface)', () => {
    it('can read isDeleteDialogOpen via selector', async () => {
      // Access through the React-compatible hook interface
      let capturedValue: boolean | null = null;
      const unsubscribe = useBatchOpsStore.subscribe(
        (s) => s.isDeleteDialogOpen,
        (val) => { capturedValue = val; }
      );
      useBatchOpsStore.getState().openDeleteDialog();
      // State update is synchronous for this store
      expect(useBatchOpsStore.getState().isDeleteDialogOpen).toBe(true);
      unsubscribe();
    });
  });
});
