/**
 * shortcutStore.e1.test.ts — S71-E1: 键盘快捷键可配置化
 * Tests: detectConflict, addBinding persistence, conflict via addBinding
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useShortcutStore, detectConflict, parseKeyEvent } from '@/stores/shortcutStore';

// IndexedDB guard for jsdom
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};
Object.defineProperty(globalThis, 'indexedDB', { value: mockIndexedDB });

function resetStore() {
  act(() => {
    useShortcutStore.getState().loadDefaults();
  });
}

describe('shortcutStore E1 — detectConflict', () => {
  beforeEach(() => {
    resetStore();
  });

  it('detectConflict returns hasConflict=false when key is free', () => {
    const result = detectConflict([], 'Cmd+Shift+K');
    expect(result.hasConflict).toBe(false);
  });

  it('detectConflict returns hasConflict=true when key conflicts with another action', () => {
    const result = detectConflict([], 'Cmd+C');
    expect(result.hasConflict).toBe(true);
    expect(result.conflictingAction).toBe('copy');
    expect(result.conflictingDescription).toBe('复制');
  });

  it('detectConflict excludes current action (no self-conflict)', () => {
    // Editing 'copy', checking Cmd+C should not conflict with itself
    const result = detectConflict([], 'Cmd+C', 'copy');
    expect(result.hasConflict).toBe(false);
  });

  it('detectConflict checks passed-in bindings list', () => {
    const bindings = [
      { action: 'my-action', key: 'Cmd+Shift+X' },
    ];
    // 'Cmd+Shift+X' is not in the store, should be free
    const free = detectConflict(bindings, 'Cmd+Alt+M');
    expect(free.hasConflict).toBe(false);

    // Now check a key in bindings
    const conflict = detectConflict(bindings, 'Cmd+Shift+X');
    expect(conflict.hasConflict).toBe(true);
    expect(conflict.conflictingAction).toBe('my-action');
  });

  it('detectConflict takes precedence: bindings list over store', () => {
    // Store has Cmd+C → copy, bindings has Cmd+Alt+M → custom-action
    const bindings = [{ action: 'custom-action', key: 'Cmd+M' }];
    const result = detectConflict(bindings, 'Cmd+M', 'some-other');
    expect(result.hasConflict).toBe(true);
    expect(result.conflictingAction).toBe('custom-action');
  });
});

describe('shortcutStore E1 — addBinding persistence', () => {
  beforeEach(() => {
    resetStore();
  });

  it('addBinding persists custom shortcut', async () => {
    let store = useShortcutStore.getState();
    const result = await act(async () => store.addBinding('save', 'ctrl+shift+s'));
    expect(result.success).toBe(true);

    store = useShortcutStore.getState();
    expect(store.getShortcutKey('save')).toBe('ctrl+shift+s');
  });

  it('addBinding blocks duplicate key (different action)', async () => {
    let store = useShortcutStore.getState();
    // Cmd+C is already assigned to 'copy'
    const result = await act(async () => store.addBinding('save', 'Cmd+C'));
    expect(result.success).toBe(false);
    expect(result.error).toContain('Duplicate');
    // save should still be Cmd+S
    expect(useShortcutStore.getState().getShortcutKey('save')).toBe('Cmd+S');
  });

  it('addBinding blocks unknown action', async () => {
    let store = useShortcutStore.getState();
    const result = await act(async () => store.addBinding('nonexistent', 'Cmd+Q'));
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown action');
  });

  it('removeBinding resets to default', async () => {
    let store = useShortcutStore.getState();
    await act(async () => store.addBinding('save', 'Cmd+Shift+S'));
    expect(useShortcutStore.getState().getShortcutKey('save')).toBe('Cmd+Shift+S');

    await act(async () => {
      useShortcutStore.getState().removeBinding('save');
    });
    expect(useShortcutStore.getState().getShortcutKey('save')).toBe('Cmd+S');
  });

  it('exportBindings returns only custom bindings', async () => {
    let store = useShortcutStore.getState();
    await act(async () => {
      await store.addBinding('save', 'Cmd+Shift+S');
    });
    await act(async () => {
      await store.addBinding('undo', 'Cmd+Alt+Z');
    });

    const json = useShortcutStore.getState().exportBindings();
    const data = JSON.parse(json);
    expect(data.version).toBe(1);
    expect(data.bindings).toHaveLength(2);
    const actions = data.bindings.map((b: { action: string }) => b.action);
    expect(actions).toContain('save');
    expect(actions).toContain('undo');
  });

  it('importBindings restores custom bindings', async () => {
    const importJson = JSON.stringify({
      version: 1,
      bindings: [
        { action: 'save', key: 'Cmd+Ctrl+S' },
        { action: 'copy', key: 'Cmd+Alt+C' },
      ],
    });

    let store = useShortcutStore.getState();
    await act(async () => {
      store.importBindings(importJson);
    });

    store = useShortcutStore.getState();
    expect(store.getShortcutKey('save')).toBe('Cmd+Ctrl+S');
    expect(store.getShortcutKey('copy')).toBe('Cmd+Alt+C');
  });

  it('importBindings reports errors for conflicts', async () => {
    // Try to import Cmd+C to both 'save' and 'copy' — second one conflicts
    const importJson = JSON.stringify({
      version: 1,
      bindings: [
        { action: 'save', key: 'Cmd+C' },    // conflicts with existing copy
        { action: 'undo', key: 'Cmd+Alt+Z' }, // valid
      ],
    });

    let store = useShortcutStore.getState();
    let result;
    await act(async () => {
      result = store.importBindings(importJson);
    });

    expect(result!.imported).toBe(1); // only undo was imported
    expect(result!.errors.length).toBeGreaterThan(0);
    expect(result!.errors[0]).toContain('Conflict');
  });
});

describe('shortcutStore E1 — parseKeyEvent', () => {
  it('parses Ctrl+key to Cmd+key', () => {
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
    }) as KeyboardEvent;
    expect(parseKeyEvent(event)).toBe('Cmd+s');
  });

  it('parses Cmd+Shift+key', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'S',
      metaKey: true,
      shiftKey: true,
      bubbles: true,
    }) as KeyboardEvent;
    expect(parseKeyEvent(event)).toBe('Cmd+Shift+S');
  });

  it('parses Alt+key', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'x',
      altKey: true,
      bubbles: true,
    }) as KeyboardEvent;
    expect(parseKeyEvent(event)).toBe('Alt+x');
  });

  it('parses space key', () => {
    const event = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
    }) as KeyboardEvent;
    // jsdom may set key as ' ' or 'Space'; accept both
    const result = parseKeyEvent(event);
    expect([' ', 'Space']).toContain(result);
  });

  it('parses arrow keys', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      metaKey: true,
      bubbles: true,
    }) as KeyboardEvent;
    expect(parseKeyEvent(event)).toBe('Cmd+ArrowRight');
  });
});
