/**
 * useCanvasEvents — unit tests
 *
 * Coverage target: > 70% branch coverage
 * Epic: canvas-split-hooks / E5-useCanvasEvents
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useCanvasEvents } from './useCanvasEvents';

// =============================================================================
// Mock dependencies
// =============================================================================

// Mock useCanvasState (E1 dependency)
jest.mock('./useCanvasState', () => {
  let mockExpandMode: 'normal' | 'expand-both' | 'maximize' = 'normal';
  const mockToggleMaximize = jest.fn();
  return {
    useCanvasState: jest.fn(() => ({
      expandMode: mockExpandMode,
      handlers: {
        toggleMaximize: mockToggleMaximize,
      },
    })),
    __setExpandMode: (mode: 'normal' | 'expand-both' | 'maximize') => {
      mockExpandMode = mode;
    },
    __getToggleMaximize: () => mockToggleMaximize,
  };
});

// Mock stores
jest.mock('@/lib/canvas/stores/contextStore', () => ({
  useContextStore: jest.fn((selector?: (s: any) => unknown) =>
    selector
      ? selector({
          activeTree: 'context',
          setActiveTree: jest.fn(),
        })
      : { setActiveTree: jest.fn() }
  ),
}));

jest.mock('@/lib/canvas/stores/flowStore', () => ({
  useFlowStore: jest.fn((selector?: (s: any) => unknown) =>
    selector ? selector({ flowNodes: [] }) : {}
  ),
}));

jest.mock('@/lib/canvas/stores/componentStore', () => ({
  useComponentStore: jest.fn((selector?: (s: any) => unknown) =>
    selector ? selector({ componentNodes: [] }) : {}
  ),
}));

const { __setExpandMode, __getToggleMaximize } = jest.requireMock(
  './useCanvasState'
) as any;

afterEach(() => {
  __setExpandMode('normal');
  jest.clearAllMocks();
  document.body.innerHTML = '';
});

// =============================================================================
// Helper
// =============================================================================

function renderUseCanvasEvents() {
  return renderHook(() =>
    useCanvasEvents([], [], [])
  );
}

// =============================================================================
// Tests: Initial State
// =============================================================================

describe('useCanvasEvents — initial state', () => {
  it('returns isSearchOpen as false', () => {
    const { result } = renderUseCanvasEvents();
    expect(result.current.isSearchOpen).toBe(false);
  });

  it('returns isShortcutPanelOpen as false', () => {
    const { result } = renderUseCanvasEvents();
    expect(result.current.isShortcutPanelOpen).toBe(false);
  });

  it('returns search handlers', () => {
    const { result } = renderUseCanvasEvents();
    expect(result.current.search).toBeDefined();
    expect(typeof result.current.search.openSearch).toBe('function');
    expect(typeof result.current.search.closeSearch).toBe('function');
    expect(typeof result.current.search.onSearchSelect).toBe('function');
  });

  it('returns handlers object with toggleShortcutPanel', () => {
    const { result } = renderUseCanvasEvents();
    expect(result.current.handlers).toBeDefined();
    expect(typeof result.current.handlers.toggleShortcutPanel).toBe('function');
  });

  it('handlers is memoized (stable reference across re-renders)', () => {
    const { result, rerender } = renderHook(() =>
      useCanvasEvents([], [], [])
    );
    const firstHandlers = result.current.handlers;
    rerender();
    expect(result.current.handlers).toBe(firstHandlers);
  });
});

// =============================================================================
// Tests: Search Dialog
// =============================================================================

describe('useCanvasEvents — search dialog', () => {
  it('openSearch sets isSearchOpen to true', () => {
    const { result } = renderUseCanvasEvents();
    act(() => {
      result.current.search.openSearch();
    });
    expect(result.current.isSearchOpen).toBe(true);
  });

  it('closeSearch sets isSearchOpen to false', () => {
    const { result } = renderUseCanvasEvents();
    act(() => {
      result.current.search.openSearch();
    });
    expect(result.current.isSearchOpen).toBe(true);
    act(() => {
      result.current.search.closeSearch();
    });
    expect(result.current.isSearchOpen).toBe(false);
  });

  it('openSearch is idempotent (safe to call multiple times)', () => {
    const { result } = renderUseCanvasEvents();
    act(() => {
      result.current.search.openSearch();
      result.current.search.openSearch();
      result.current.search.openSearch();
    });
    expect(result.current.isSearchOpen).toBe(true);
  });
});

// =============================================================================
// Tests: Shortcut Panel
// =============================================================================

describe('useCanvasEvents — shortcut panel', () => {
  it('toggleShortcutPanel flips isShortcutPanelOpen', () => {
    const { result } = renderUseCanvasEvents();
    expect(result.current.isShortcutPanelOpen).toBe(false);

    act(() => {
      result.current.handlers.toggleShortcutPanel();
    });
    expect(result.current.isShortcutPanelOpen).toBe(true);

    act(() => {
      result.current.handlers.toggleShortcutPanel();
    });
    expect(result.current.isShortcutPanelOpen).toBe(false);
  });
});

// =============================================================================
// Tests: Keyboard — F11 maximize
// =============================================================================

describe('useCanvasEvents — F11 keyboard shortcut', () => {
  it('F11 calls toggleMaximize from useCanvasState', () => {
    renderUseCanvasEvents();
    const toggleMaximize = __getToggleMaximize();

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'F11' });
      document.dispatchEvent(event);
    });

    expect(toggleMaximize).toHaveBeenCalledTimes(1);
  });

  it('F11 preventDefault is called', () => {
    renderUseCanvasEvents();

    const preventDefault = jest.fn();
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'F11' });
      jest.spyOn(event, 'preventDefault').mockImplementation(preventDefault);
      document.dispatchEvent(event);
    });

    expect(preventDefault).toHaveBeenCalled();
  });
});

// =============================================================================
// Tests: Keyboard — Escape (maximize only)
// =============================================================================

describe('useCanvasEvents — Escape keyboard shortcut', () => {
  it('Escape calls toggleMaximize when in maximize mode', () => {
    __setExpandMode('maximize');
    renderUseCanvasEvents();
    const toggleMaximize = __getToggleMaximize();

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
    });

    expect(toggleMaximize).toHaveBeenCalledTimes(1);
  });

  it('Escape does NOT call toggleMaximize when NOT in maximize mode', () => {
    __setExpandMode('normal');
    renderUseCanvasEvents();
    const toggleMaximize = __getToggleMaximize();

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
    });

    expect(toggleMaximize).not.toHaveBeenCalled();
  });
});

// =============================================================================
// Tests: Keyboard — Ctrl+F opens search
// =============================================================================

describe('useCanvasEvents — Ctrl+F keyboard shortcut', () => {
  it('Ctrl+F opens search dialog', () => {
    const { result } = renderUseCanvasEvents();

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'f', ctrlKey: true });
      document.dispatchEvent(event);
    });

    expect(result.current.isSearchOpen).toBe(true);
  });

  it('MetaKey+F opens search dialog (Mac)', () => {
    const { result } = renderUseCanvasEvents();

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'f', metaKey: true });
      document.dispatchEvent(event);
    });

    expect(result.current.isSearchOpen).toBe(true);
  });
});

// =============================================================================
// Tests: Keyboard — ? toggles shortcut panel (non-input context)
// =============================================================================

describe('useCanvasEvents — ? keyboard shortcut', () => {
  it('? toggles shortcut panel when body is focused', () => {
    const { result } = renderUseCanvasEvents();

    act(() => {
      const event = new KeyboardEvent('keydown', { key: '?' });
      document.dispatchEvent(event);
    });

    expect(result.current.isShortcutPanelOpen).toBe(true);
  });

  it('? does NOT toggle shortcut panel when INPUT is focused', () => {
    const { result } = renderUseCanvasEvents();

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    act(() => {
      const event = new KeyboardEvent('keydown', { key: '?' });
      document.dispatchEvent(event);
    });

    expect(result.current.isShortcutPanelOpen).toBe(false);

    input.remove();
  });

  it('? does NOT toggle shortcut panel when TEXTAREA is focused', () => {
    const { result } = renderUseCanvasEvents();

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();

    act(() => {
      const event = new KeyboardEvent('keydown', { key: '?' });
      document.dispatchEvent(event);
    });

    expect(result.current.isShortcutPanelOpen).toBe(false);

    textarea.remove();
  });

  it('? does NOT toggle when Ctrl/Shift/Meta is held', () => {
    const { result } = renderUseCanvasEvents();

    act(() => {
      const event = new KeyboardEvent('keydown', { key: '?', ctrlKey: true });
      document.dispatchEvent(event);
    });

    expect(result.current.isShortcutPanelOpen).toBe(false);
  });
});

// =============================================================================
// Tests: Keyboard — Escape closes shortcut panel
// =============================================================================

describe('useCanvasEvents — Escape closes shortcut panel', () => {
  it('Escape closes shortcut panel when open', () => {
    const { result } = renderUseCanvasEvents();

    act(() => {
      result.current.handlers.toggleShortcutPanel();
    });
    expect(result.current.isShortcutPanelOpen).toBe(true);

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
    });

    expect(result.current.isShortcutPanelOpen).toBe(false);
  });

  it('Escape does nothing when shortcut panel is already closed', () => {
    const { result } = renderUseCanvasEvents();
    expect(result.current.isShortcutPanelOpen).toBe(false);

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
    });

    expect(result.current.isShortcutPanelOpen).toBe(false);
  });
});

// =============================================================================
// Tests: onSearchSelect — node highlight
// =============================================================================

describe('useCanvasEvents — onSearchSelect', () => {
  it('calls setActiveTree with the result treeType', () => {
    const { result } = renderUseCanvasEvents();
    const setActiveTree = jest.fn();

    // Mock the store getState
    const contextStore = require('@/lib/canvas/stores/contextStore');
    contextStore.useContextStore.mockReturnValue({
      setActiveTree,
      activeTree: 'context',
    });

    act(() => {
      result.current.search.onSearchSelect({
        id: 'node-1',
        treeType: 'context',
      });
    });

    expect(setActiveTree).toHaveBeenCalledWith('context');
  });

  it('does not crash when no DOM node exists for the id', () => {
    const { result } = renderUseCanvasEvents();
    const setActiveTree = jest.fn();

    const contextStore = require('@/lib/canvas/stores/contextStore');
    contextStore.useContextStore.mockReturnValue({
      setActiveTree,
      activeTree: 'context',
    });

    // Should not throw — querySelector returns null gracefully
    act(() => {
      result.current.search.onSearchSelect({
        id: 'non-existent-node',
        treeType: 'flow',
      });
    });

    expect(setActiveTree).toHaveBeenCalledWith('flow');
  });
});
