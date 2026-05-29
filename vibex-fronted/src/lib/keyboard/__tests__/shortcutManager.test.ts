/**
 * ShortcutManager Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock mousetrap
vi.mock('mousetrap', () => {
  const boundKeys = new Map<string, (e: KeyboardEvent) => void>();
  return {
    default: {
      bind: vi.fn((key: string, handler: (e: KeyboardEvent) => void) => {
        boundKeys.set(key, handler);
      }),
      unbind: vi.fn((key: string) => {
        boundKeys.delete(key);
      }),
      _boundKeys: boundKeys,
    },
  };
});

import {
  shortcutManager,
  normalizeShortcut,
  keyboardEventToMousetrap,
  isReservedShortcut,
  getReservedDescription,
} from '../shortcutManager';

describe('ShortcutManager', () => {
  beforeEach(() => {
    shortcutManager.unbindAll();
    shortcutManager.init();
  });

  describe('init', () => {
    it('should initialize without errors', () => {
      expect(() => shortcutManager.init()).not.toThrow();
    });

    it('should not be paused after init', () => {
      shortcutManager.init();
      expect(shortcutManager.isPaused()).toBe(false);
    });
  });

  describe('pause/resume', () => {
    it('should pause and resume correctly', () => {
      shortcutManager.init();
      expect(shortcutManager.isPaused()).toBe(false);
      shortcutManager.pause();
      expect(shortcutManager.isPaused()).toBe(true);
      shortcutManager.resume();
      expect(shortcutManager.isPaused()).toBe(false);
    });
  });

  describe('bind/unbind', () => {
    it('should store bindings after bind', () => {
      shortcutManager.init();
      const handler = vi.fn();
      shortcutManager.bind('Cmd+Z', 'undo', handler);
      const bindings = shortcutManager.getBindings();
      expect(bindings).toHaveLength(1);
      expect(bindings[0].action).toBe('undo');
      expect(bindings[0].key).toBe('Cmd+Z');
    });

    it('should not bind duplicate keys', () => {
      shortcutManager.init();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      shortcutManager.bind('Cmd+S', 'save', handler1);
      shortcutManager.bind('Cmd+S', 'save2', handler2);
      const bindings = shortcutManager.getBindings();
      expect(bindings).toHaveLength(1);
    });

    it('should remove binding after unbind', () => {
      shortcutManager.init();
      const handler = vi.fn();
      shortcutManager.bind('Cmd+A', 'selectAll', handler);
      shortcutManager.unbind('Cmd+A');
      const bindings = shortcutManager.getBindings();
      expect(bindings).toHaveLength(0);
    });

    it('should unbind all bindings', () => {
      shortcutManager.init();
      shortcutManager.bind('Cmd+A', 'selectAll', vi.fn());
      shortcutManager.bind('Cmd+B', 'toggleSidebar', vi.fn());
      shortcutManager.unbindAll();
      expect(shortcutManager.getBindings()).toHaveLength(0);
    });
  });

  describe('checkGlobalConflict', () => {
    it('should detect system reserved shortcuts', () => {
      expect(shortcutManager.checkGlobalConflict('Cmd+w').hasConflict).toBe(true);
      expect(shortcutManager.checkGlobalConflict('Cmd+r').hasConflict).toBe(true);
      expect(shortcutManager.checkGlobalConflict('F12').hasConflict).toBe(true);
      expect(shortcutManager.checkGlobalConflict('Escape').hasConflict).toBe(true);
    });

    it('should return system action description for reserved shortcuts', () => {
      const result = shortcutManager.checkGlobalConflict('Cmd+f');
      expect(result.hasConflict).toBe(true);
      expect(result.systemAction).toBe('Cmd+f');
      expect(result.description).toBe('页面搜索');
    });

    it('should return no conflict for custom shortcuts', () => {
      const result = shortcutManager.checkGlobalConflict('Cmd+Shift+K');
      expect(result.hasConflict).toBe(false);
    });
  });

  describe('rebind', () => {
    it('should rebind from old key to new key', () => {
      shortcutManager.init();
      const handler = vi.fn();
      shortcutManager.bind('Cmd+K', 'search', handler);
      shortcutManager.rebind('Cmd+K', 'Cmd+/', 'search', handler);
      const bindings = shortcutManager.getBindings();
      expect(bindings).toHaveLength(1);
      expect(bindings[0].key).toBe('Cmd+/');
    });
  });
});

describe('Helper functions', () => {
  describe('normalizeShortcut', () => {
    it('should normalize cmd to Cmd', () => {
      expect(normalizeShortcut('cmd+k')).toBe('Cmd+k');
    });

    it('should normalize command to Cmd', () => {
      expect(normalizeShortcut('command+k')).toBe('Cmd+k');
    });

    it('should normalize ctrl to Ctrl', () => {
      expect(normalizeShortcut('ctrl+s')).toBe('Ctrl+s');
    });

    it('should normalize meta to Cmd', () => {
      expect(normalizeShortcut('meta+v')).toBe('Cmd+v');
    });

    it('should preserve Shift and Alt casing', () => {
      expect(normalizeShortcut('shift+a')).toBe('Shift+a');
      expect(normalizeShortcut('alt+b')).toBe('Alt+b');
    });
  });

  describe('keyboardEventToMousetrap', () => {
    it('should convert Ctrl+key to Cmd+key format', () => {
      const event = {
        key: 'z',
        metaKey: false,
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
      } as KeyboardEvent;
      expect(keyboardEventToMousetrap(event)).toBe('Cmd+z');
    });

    it('should convert Cmd+Shift+key', () => {
      const event = {
        key: 'Z',
        metaKey: true,
        ctrlKey: false,
        altKey: false,
        shiftKey: true,
      } as KeyboardEvent;
      expect(keyboardEventToMousetrap(event)).toBe('Cmd+Shift+Z');
    });

    it('should convert Alt+key', () => {
      const event = {
        key: 'b',
        metaKey: false,
        ctrlKey: false,
        altKey: true,
        shiftKey: false,
      } as KeyboardEvent;
      expect(keyboardEventToMousetrap(event)).toBe('Alt+b');
    });

    it('should convert space key', () => {
      const event = {
        key: ' ',
        metaKey: false,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
      } as KeyboardEvent;
      expect(keyboardEventToMousetrap(event)).toBe('Space');
    });

    it('should handle function keys', () => {
      const event = {
        key: 'F5',
        metaKey: false,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
      } as KeyboardEvent;
      // No modifier keys = just the key
      expect(keyboardEventToMousetrap(event)).toBe('F5');
    });
  });

  describe('isReservedShortcut', () => {
    it('should return true for reserved shortcuts', () => {
      expect(isReservedShortcut('Cmd+w')).toBe(true);
      expect(isReservedShortcut('Cmd+r')).toBe(true);
      expect(isReservedShortcut('F5')).toBe(true);
      expect(isReservedShortcut('F11')).toBe(true);
    });

    it('should return false for non-reserved shortcuts', () => {
      expect(isReservedShortcut('Cmd+Shift+K')).toBe(false);
      expect(isReservedShortcut('Cmd+1')).toBe(false);
    });
  });

  describe('getReservedDescription', () => {
    it('should return description for reserved shortcuts', () => {
      expect(getReservedDescription('Cmd+,')).toBe('浏览器设置');
      expect(getReservedDescription('Cmd+s')).toBe('保存页面（浏览器）');
    });

    it('should return undefined for non-reserved shortcuts', () => {
      expect(getReservedDescription('Cmd+Shift+K')).toBeUndefined();
    });
  });
});
