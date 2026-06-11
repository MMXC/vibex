/**
 * batchCanvasStore.test.ts — Sprint87 E3: batchCanvasStore tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useBatchCanvasStore } from '../batchCanvasStore';

describe('batchCanvasStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useBatchCanvasStore.getState().clearSelection();
  });

  // ---- setSelection ----

  describe('setSelection', () => {
    it('sets selected node IDs', () => {
      useBatchCanvasStore.getState().setSelection(['node-1', 'node-2']);
      expect(useBatchCanvasStore.getState().selectedNodeIds.has('node-1')).toBe(true);
      expect(useBatchCanvasStore.getState().selectedNodeIds.has('node-2')).toBe(true);
    });

    it('enables batch mode when 2+ nodes selected', () => {
      useBatchCanvasStore.getState().setSelection(['node-1', 'node-2']);
      expect(useBatchCanvasStore.getState().isBatchMode).toBe(true);
    });

    it('disables batch mode when < 2 nodes selected', () => {
      useBatchCanvasStore.getState().setSelection(['node-1']);
      expect(useBatchCanvasStore.getState().isBatchMode).toBe(false);
    });

    it('replaces previous selection', () => {
      useBatchCanvasStore.getState().setSelection(['node-1']);
      useBatchCanvasStore.getState().setSelection(['node-2', 'node-3']);
      expect(useBatchCanvasStore.getState().selectedNodeIds.has('node-1')).toBe(false);
      expect(useBatchCanvasStore.getState().selectedNodeIds.has('node-2')).toBe(true);
    });
  });

  // ---- toggleNode ----

  describe('toggleNode', () => {
    it('selects a node that was not selected', () => {
      useBatchCanvasStore.getState().toggleNode('node-1');
      expect(useBatchCanvasStore.getState().selectedNodeIds.has('node-1')).toBe(true);
    });

    it('deselects a node that was selected', () => {
      useBatchCanvasStore.getState().toggleNode('node-1');
      useBatchCanvasStore.getState().toggleNode('node-1');
      expect(useBatchCanvasStore.getState().selectedNodeIds.has('node-1')).toBe(false);
    });

    it('enables batch mode after second toggle', () => {
      useBatchCanvasStore.getState().toggleNode('node-1');
      expect(useBatchCanvasStore.getState().isBatchMode).toBe(false);
      useBatchCanvasStore.getState().toggleNode('node-2');
      expect(useBatchCanvasStore.getState().isBatchMode).toBe(true);
    });
  });

  // ---- clearSelection ----

  describe('clearSelection', () => {
    it('clears all selections', () => {
      useBatchCanvasStore.getState().setSelection(['node-1', 'node-2', 'node-3']);
      useBatchCanvasStore.getState().clearSelection();
      expect(useBatchCanvasStore.getState().selectedNodeIds.size).toBe(0);
    });

    it('disables batch mode after clearing', () => {
      useBatchCanvasStore.getState().setSelection(['node-1', 'node-2']);
      useBatchCanvasStore.getState().clearSelection();
      expect(useBatchCanvasStore.getState().isBatchMode).toBe(false);
    });
  });

  // ---- addToSelection ----

  describe('addToSelection', () => {
    it('adds a node without removing existing', () => {
      useBatchCanvasStore.getState().addToSelection('node-1');
      useBatchCanvasStore.getState().addToSelection('node-2');
      expect(useBatchCanvasStore.getState().selectedNodeIds.size).toBe(2);
    });

    it('enables batch mode when second node added', () => {
      useBatchCanvasStore.getState().addToSelection('node-1');
      expect(useBatchCanvasStore.getState().isBatchMode).toBe(false);
      useBatchCanvasStore.getState().addToSelection('node-2');
      expect(useBatchCanvasStore.getState().isBatchMode).toBe(true);
    });
  });

  // ---- removeFromSelection ----

  describe('removeFromSelection', () => {
    it('removes a selected node', () => {
      useBatchCanvasStore.getState().setSelection(['node-1', 'node-2']);
      useBatchCanvasStore.getState().removeFromSelection('node-1');
      expect(useBatchCanvasStore.getState().selectedNodeIds.has('node-1')).toBe(false);
      expect(useBatchCanvasStore.getState().selectedNodeIds.has('node-2')).toBe(true);
    });

    it('disables batch mode when selection drops below 2', () => {
      useBatchCanvasStore.getState().setSelection(['node-1', 'node-2']);
      useBatchCanvasStore.getState().removeFromSelection('node-1');
      expect(useBatchCanvasStore.getState().isBatchMode).toBe(false);
    });
  });

  // ---- getSelectedCount ----

  describe('getSelectedCount', () => {
    it('returns correct count', () => {
      expect(useBatchCanvasStore.getState().getSelectedCount()).toBe(0);
      useBatchCanvasStore.getState().setSelection(['a', 'b', 'c']);
      expect(useBatchCanvasStore.getState().getSelectedCount()).toBe(3);
    });
  });

  // ---- isSelected ----

  describe('isSelected', () => {
    it('returns true for selected node', () => {
      useBatchCanvasStore.getState().setSelection(['node-1']);
      expect(useBatchCanvasStore.getState().isSelected('node-1')).toBe(true);
    });

    it('returns false for unselected node', () => {
      useBatchCanvasStore.getState().setSelection(['node-1']);
      expect(useBatchCanvasStore.getState().isSelected('node-2')).toBe(false);
    });
  });
});
