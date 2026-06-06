/**
 * shortcutStore Tests
 * S67-E4: 画布快捷键可配置化
 * 测试: addBinding/removeBinding/exportBindings/importBindings
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useShortcutStore } from './shortcutStore';

describe('useShortcutStore — S67-E4', () => {
  beforeEach(() => {
    // Reset store before each test
    useShortcutStore.getState().resetAll();
  });

  describe('D4.1/D4.2: addBinding', () => {
    it('should add a custom binding for an existing action', () => {
      const { addBinding, shortcuts } = useShortcutStore.getState();
      const result = addBinding('delete', 'Backspace');
      expect(result.success).toBe(true);
      const updated = useShortcutStore.getState().shortcuts.find(s => s.action === 'delete');
      expect(updated?.currentKey).toBe('Backspace');
    });

    it('should reject adding binding for unknown action', () => {
      const { addBinding } = useShortcutStore.getState();
      const result = addBinding('non-existent-action', 'Ctrl+Q');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown action');
    });

    it('should reject duplicate key binding', () => {
      const { addBinding } = useShortcutStore.getState();
      // Cmd+S is already used by 'save'
      const result = addBinding('copy', 'Cmd+S');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Duplicate key');
    });

    it('should allow same action to be re-bound to same key (no-op)', () => {
      const { addBinding } = useShortcutStore.getState();
      // 'undo' defaults to Cmd+Z — rebinding it to Cmd+Z should be fine (same action)
      const result = addBinding('undo', 'Cmd+Z');
      expect(result.success).toBe(true);
    });

    it('should allow binding when key is unused', () => {
      const { addBinding } = useShortcutStore.getState();
      const result = addBinding('zoom-in', 'Ctrl+=');
      expect(result.success).toBe(true);
      const updated = useShortcutStore.getState().shortcuts.find(s => s.action === 'zoom-in');
      expect(updated?.currentKey).toBe('Ctrl+=');
    });
  });

  describe('D4.3: removeBinding', () => {
    it('should reset custom binding to default key', () => {
      const store = useShortcutStore.getState();
      store.addBinding('undo', 'Ctrl+Shift+U');
      
      useShortcutStore.getState().removeBinding('undo');
      
      const updated = useShortcutStore.getState().shortcuts.find(s => s.action === 'undo');
      expect(updated?.currentKey).toBe('Cmd+Z');
    });

    it('should be no-op for unknown action', () => {
      expect(() => useShortcutStore.getState().removeBinding('unknown-action')).not.toThrow();
    });

    it('should be no-op when action is already at default', () => {
      useShortcutStore.getState().removeBinding('go-to-canvas');
      const updated = useShortcutStore.getState().shortcuts.find(s => s.action === 'go-to-canvas');
      expect(updated?.currentKey).toBe('Cmd+1');
    });
  });

  describe('D4.4: updateBinding (alias for addBinding)', () => {
    it('should update existing binding to new key', () => {
      const { addBinding } = useShortcutStore.getState();
      // First add
      addBinding('delete', 'Backspace');
      // Then update to another key
      const result = addBinding('delete', 'KeyX');
      expect(result.success).toBe(true);
      const updated = useShortcutStore.getState().shortcuts.find(s => s.action === 'delete');
      expect(updated?.currentKey).toBe('KeyX');
    });
  });

  describe('D4.5: exportBindings', () => {
    it('should export only custom bindings (currentKey != defaultKey)', () => {
      const store = useShortcutStore.getState();
      store.addBinding('delete', 'Backspace');
      store.addBinding('undo', 'Ctrl+Shift+U');
      // leave 'copy' at default (Cmd+C)
      
      const json = store.exportBindings();
      const data = JSON.parse(json);
      
      expect(data.version).toBe(1);
      expect(Array.isArray(data.bindings)).toBe(true);
      const customKeys = data.bindings.map((b: { action: string; key: string }) => b.key);
      expect(customKeys).toContain('Backspace');
      expect(customKeys).toContain('Ctrl+Shift+U');
      // Default bindings should NOT be exported
      expect(customKeys).not.toContain('Cmd+C');
    });

    it('should export empty bindings array when all at defaults', () => {
      const json = useShortcutStore.getState().exportBindings();
      const data = JSON.parse(json);
      expect(data.bindings).toHaveLength(0);
    });
  });

  describe('D4.5: importBindings', () => {
    it('should import valid bindings', () => {
      const store = useShortcutStore.getState();
      const json = JSON.stringify({
        version: 1,
        bindings: [
          { action: 'delete', key: 'Backspace' },
          { action: 'undo', key: 'Ctrl+Shift+U' },
        ],
      });
      
      const result = store.importBindings(json);
      
      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);
      expect(result.errors).toHaveLength(0);
      
      const deleteShortcut = useShortcutStore.getState().shortcuts.find(s => s.action === 'delete');
      expect(deleteShortcut?.currentKey).toBe('Backspace');
      
      const undoShortcut = useShortcutStore.getState().shortcuts.find(s => s.action === 'undo');
      expect(undoShortcut?.currentKey).toBe('Ctrl+Shift+U');
    });

    it('should report errors for unknown actions', () => {
      const store = useShortcutStore.getState();
      const json = JSON.stringify({
        version: 1,
        bindings: [
          { action: 'unknown-action', key: 'Ctrl+Q' },
        ],
      });
      
      const result = store.importBindings(json);
      
      expect(result.success).toBe(false);
      expect(result.imported).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Unknown action');
    });

    it('should report errors for duplicate key conflicts', () => {
      const store = useShortcutStore.getState();
      const json = JSON.stringify({
        version: 1,
        bindings: [
          { action: 'copy', key: 'Cmd+S' }, // Cmd+S is used by 'save'
        ],
      });
      
      const result = store.importBindings(json);
      
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Conflict');
    });

    it('should report errors for invalid JSON', () => {
      const { importBindings } = useShortcutStore.getState();
      const result = importBindings('not valid json');
      
      expect(result.success).toBe(false);
      expect(result.errors.some((e: string) => e.includes('JSON parse error'))).toBe(true);
    });

    it('should report errors for missing bindings array', () => {
      const { importBindings } = useShortcutStore.getState();
      const result = importBindings(JSON.stringify({ version: 1 }));
      
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('missing bindings array');
    });

    it('should report errors for malformed binding entries', () => {
      const { importBindings } = useShortcutStore.getState();
      const result = importBindings(JSON.stringify({
        version: 1,
        bindings: [{ action: 'undo' }], // missing 'key'
      }));
      
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should do partial import when some bindings valid and some invalid', () => {
      const store = useShortcutStore.getState();
      const json = JSON.stringify({
        version: 1,
        bindings: [
          { action: 'delete', key: 'Backspace' },        // valid
          { action: 'unknown-action', key: 'Ctrl+Q' },    // invalid
        ],
      });
      
      const result = store.importBindings(json);
      
      expect(result.imported).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.success).toBe(false);
      
      // The valid one should still be imported
      const deleteShortcut = useShortcutStore.getState().shortcuts.find(s => s.action === 'delete');
      expect(deleteShortcut?.currentKey).toBe('Backspace');
    });

    it('should round-trip: export then import preserves bindings', () => {
      const store = useShortcutStore.getState();
      store.addBinding('delete', 'Backspace');
      store.addBinding('undo', 'Ctrl+Shift+U');
      
      const exported = store.exportBindings();
      store.resetAll(); // Clear all
      
      const result = store.importBindings(exported);
      
      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);
      
      const deleteShortcut = useShortcutStore.getState().shortcuts.find(s => s.action === 'delete');
      expect(deleteShortcut?.currentKey).toBe('Backspace');
      
      const undoShortcut = useShortcutStore.getState().shortcuts.find(s => s.action === 'undo');
      expect(undoShortcut?.currentKey).toBe('Ctrl+Shift+U');
    });
  });

  describe('D4.8: shortcut conflict detection', () => {
    it('should detect conflict via addBinding', () => {
      const { addBinding } = useShortcutStore.getState();
      const result = addBinding('delete', 'Cmd+S'); // used by save
      expect(result.success).toBe(false);
      expect(result.error).toContain('Duplicate');
    });

    it('should allow binding when no conflict', () => {
      const { addBinding } = useShortcutStore.getState();
      const result = addBinding('delete', 'Ctrl+D');
      expect(result.success).toBe(true);
    });
  });

  describe('D4.9: localStorage persistence', () => {
    it('should update shortcuts in store state', () => {
      // Test the store state update directly (persistence tested separately)
      const store = useShortcutStore.getState();
      store.addBinding('delete', 'Backspace');
      
      // Read from store directly — verifies state update, not persistence
      const state = useShortcutStore.getState();
      const deleteShortcut = state.shortcuts.find(s => s.action === 'delete');
      expect(deleteShortcut?.currentKey).toBe('Backspace');
    });
  });
});
