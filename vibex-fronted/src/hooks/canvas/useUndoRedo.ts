/**
 * useUndoRedo.ts — Undo/Redo state management hook
 * Sprint55 E5: 键盘快捷键激活 (Undo/Redo 绑定)
 *
 * Provides undo/redo state and operations for the canvas.
 */
import { useCallback, useRef } from 'react';

export interface UndoableState<T> {
  past: T[];
  present: T;
  future: T[];
}

export interface UseUndoRedoReturn<T> {
  /** Current state */
  present: T;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Undo the last change */
  undo: () => void;
  /** Redo the last undone change */
  redo: () => void;
  /** Record a new present state */
  setPresent: (state: T) => void;
  /** Reset to a specific state (clears past and future) */
  reset: (state: T) => void;
}

/**
 * useUndoRedo — simple undo/redo hook for canvas state.
 *
 * @param initialState - the initial present state
 * @param maxHistory - maximum number of undo steps (default: 50)
 */
export function useUndoRedo<T>(
  initialState: T,
  maxHistory: number = 50
): UseUndoRedoReturn<T> {
  const stateRef = useRef<UndoableState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const undo = useCallback(() => {
    const { past, present, future } = stateRef.current;
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    stateRef.current = {
      past: newPast,
      present: previous,
      future: [present, ...future],
    };
  }, []);

  const redo = useCallback(() => {
    const { past, present, future } = stateRef.current;
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    stateRef.current = {
      past: [...past, present],
      present: next,
      future: newFuture,
    };
  }, []);

  const setPresent = useCallback(
    (state: T) => {
      const { past, present } = stateRef.current;
      const newPast = [...past, present];
      // Trim past if it exceeds maxHistory
      if (newPast.length > maxHistory) {
        newPast.shift();
      }
      stateRef.current = {
        past: newPast,
        present: state,
        future: [],
      };
    },
    [maxHistory]
  );

  const reset = useCallback((state: T) => {
    stateRef.current = {
      past: [],
      present: state,
      future: [],
    };
  }, []);

  return {
    get present() {
      return stateRef.current.present;
    },
    get canUndo() {
      return stateRef.current.past.length > 0;
    },
    get canRedo() {
      return stateRef.current.future.length > 0;
    },
    undo,
    redo,
    setPresent,
    reset,
  };
}
