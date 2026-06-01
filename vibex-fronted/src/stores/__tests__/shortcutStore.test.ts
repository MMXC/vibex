/**
 * shortcutStore.test.ts — Sprint52 E5: 键盘快捷键可配置化
 * Tests: conflict detection, reset, save, capture
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useShortcutStore } from '@/stores/shortcutStore';

// Reset store between tests
function resetStore() {
  act(() => {
    useShortcutStore.getState().loadDefaults();
  });
}

describe('shortcutStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('loadDefaults', () => {
    it('restores all shortcuts to their default keys', () => {
      // Change a shortcut
      act(() => {
        const store = useShortcutStore.getState();
        store.startEditing('undo');
        store.captureKey('Cmd+Shift+U');
        store.saveShortcut();
      });

      // Verify changed
      const afterChange = useShortcutStore.getState().getShortcutKey('undo');
      expect(afterChange).toBe('Cmd+Shift+U');

      // Reset
      act(() => {
        useShortcutStore.getState().resetToDefault('undo');
      });

      // Verify restored
      const afterReset = useShortcutStore.getState().getShortcutKey('undo');
      expect(afterReset).toBe('Cmd+Z');
    });

    it('resetAll restores all shortcuts', () => {
      // Change two shortcuts
      act(() => {
        const store = useShortcutStore.getState();
        store.startEditing('undo');
        store.captureKey('Ctrl+Q');
        store.saveShortcut();
      });
      act(() => {
        const store = useShortcutStore.getState();
        store.startEditing('save');
        store.captureKey('Ctrl+Shift+S');
        store.saveShortcut();
      });

      act(() => {
        useShortcutStore.getState().resetAll();
      });

      expect(useShortcutStore.getState().getShortcutKey('undo')).toBe('Cmd+Z');
      expect(useShortcutStore.getState().getShortcutKey('save')).toBe('Cmd+S');
    });
  });

  describe('conflict detection', () => {
    it('detectConflict returns conflict info when key is already assigned', () => {
      let result: { hasConflict: boolean } = { hasConflict: false };

      act(() => {
        const store = useShortcutStore.getState();
        store.startEditing('undo');
        // Capture a key already used by 'copy' (Cmd+C)
        result = store.captureKey('Cmd+C');
      });

      expect(result.hasConflict).toBe(true);
      expect(useShortcutStore.getState().conflictInfo?.hasConflict).toBe(true);
      expect(useShortcutStore.getState().conflictInfo?.conflictingAction).toBe('copy');
    });

    it('no conflict when key is free', () => {
      let result: { hasConflict: boolean } = { hasConflict: false };

      act(() => {
        const store = useShortcutStore.getState();
        store.startEditing('undo');
        result = store.captureKey('Cmd+Shift+U');
      });

      expect(result.hasConflict).toBe(false);
    });

    it('saveShortcut blocks saving when conflict exists', () => {
      act(() => {
        const store = useShortcutStore.getState();
        store.startEditing('undo');
        store.captureKey('Cmd+C'); // conflicts with copy
        store.saveShortcut();
      });

      // undo should still be Cmd+Z (not overwritten)
      expect(useShortcutStore.getState().getShortcutKey('undo')).toBe('Cmd+Z');
    });

    it('saveShortcut applies key when no conflict', () => {
      act(() => {
        const store = useShortcutStore.getState();
        store.startEditing('undo');
        store.captureKey('Cmd+Shift+U');
        store.saveShortcut();
      });

      expect(useShortcutStore.getState().getShortcutKey('undo')).toBe('Cmd+Shift+U');
    });
  });

  describe('getShortcutKey', () => {
    it('returns currentKey for a known action', () => {
      expect(useShortcutStore.getState().getShortcutKey('undo')).toBe('Cmd+Z');
      expect(useShortcutStore.getState().getShortcutKey('save')).toBe('Cmd+S');
    });

    it('returns falsy for unknown action', () => {
      expect(useShortcutStore.getState().getShortcutKey('nonexistent')).toBeFalsy();
    });
  });

  describe('cancelEditing', () => {
    it('clears editing state without saving', () => {
      act(() => {
        const store = useShortcutStore.getState();
        store.startEditing('undo');
        store.captureKey('Cmd+Shift+X');
      });

      expect(useShortcutStore.getState().editingAction).toBe('undo');
      expect(useShortcutStore.getState().capturedKey).toBe('Cmd+Shift+X');

      act(() => {
        useShortcutStore.getState().cancelEditing();
      });

      expect(useShortcutStore.getState().editingAction).toBeNull();
      expect(useShortcutStore.getState().capturedKey).toBeNull();
      expect(useShortcutStore.getState().getShortcutKey('undo')).toBe('Cmd+Z'); // unchanged
    });
  });
});
