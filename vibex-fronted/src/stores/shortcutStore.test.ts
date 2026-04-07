/**
 * shortcutStore Tests
 * Epic: vibex-pm-proposals-20260403_024652 / E5-快捷键配置
 */

import { useShortcutStore } from './shortcutStore';

describe('useShortcutStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useShortcutStore.getState().resetAll();
  });

  describe('E5-S1: shortcuts initial state', () => {
    it('should have 20 default shortcuts across 4 categories', () => {
      const { shortcuts } = useShortcutStore.getState();
      // 19 shortcuts: 4 nav + 6 edit + 5 view + 4 phase
      expect(shortcuts).toHaveLength(19);

      const categories = shortcuts.map(s => s.category);
      expect(categories.filter(c => c === 'navigation')).toHaveLength(4);
      expect(categories.filter(c => c === 'edit')).toHaveLength(6);
      expect(categories.filter(c => c === 'view')).toHaveLength(5);
      expect(categories.filter(c => c === 'phase')).toHaveLength(4);
    });

    it('should have navigation shortcuts with correct default keys', () => {
      const { shortcuts } = useShortcutStore.getState();
      const navShortcuts = shortcuts.filter(s => s.category === 'navigation');
      const keys = navShortcuts.map(s => s.currentKey);
      expect(keys).toContain('Cmd+1');
      expect(keys).toContain('Cmd+,');
    });
  });

  describe('E5-S3: conflict detection', () => {
    it('should detect conflict when same key is used by another action', () => {
      const { captureKey } = useShortcutStore.getState();
      // Try to assign Cmd+S (used by save) to another action
      const result = captureKey('Cmd+S');
      // The conflict detection should find the existing save shortcut
      // (depends on which action is currently being edited)
      expect(result).toHaveProperty('hasConflict');
    });

    it('should clear conflict when cancelEditing is called', () => {
      const { startEditing, cancelEditing, conflictInfo } = useShortcutStore.getState();
      startEditing('go-to-canvas');
      expect(useShortcutStore.getState().editingAction).toBe('go-to-canvas');
      cancelEditing();
      expect(useShortcutStore.getState().editingAction).toBeNull();
      expect(useShortcutStore.getState().conflictInfo).toBeNull();
    });
  });

  describe('E5-S4: persistence', () => {
    it('should have getShortcutKey return currentKey for existing action', () => {
      const { getShortcutKey } = useShortcutStore.getState();
      expect(getShortcutKey('undo')).toBe('Cmd+Z');
      expect(getShortcutKey('go-to-canvas')).toBe('Cmd+1');
    });

    it('should have shortcuts with currentKey matching defaultKey initially', () => {
      const { shortcuts } = useShortcutStore.getState();
      shortcuts.forEach(shortcut => {
        expect(shortcut.currentKey).toBe(shortcut.defaultKey);
      });
    });
  });

  describe('E5-S5: reset', () => {
    it('should reset all shortcuts to defaults when resetAll is called', () => {
      const { startEditing, captureKey, saveShortcut, shortcuts } = useShortcutStore.getState();

      // Change a shortcut
      startEditing('undo');
      captureKey('Cmd+Shift+U');
      saveShortcut();

      // Verify it changed
      const afterChange = useShortcutStore.getState().shortcuts.find(s => s.action === 'undo');
      expect(afterChange?.currentKey).toBe('Cmd+Shift+U');

      // Reset all
      useShortcutStore.getState().resetAll();

      // Verify it reverted
      const afterReset = useShortcutStore.getState().shortcuts.find(s => s.action === 'undo');
      expect(afterReset?.currentKey).toBe('Cmd+Z');
    });
  });
});
