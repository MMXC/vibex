/**
 * useHistoryPersistence.ts — Sprint51 E1: Undo/Redo 持久化
 *
 * Hook that debounces saving canvas history to IndexedDB (500ms).
 * Automatically saves after any change to the history store.
 */

import { useEffect, useRef } from 'react';
import { useCanvasHistoryStore } from '@/stores/dds/canvasHistoryStore';

/** Debounce delay in milliseconds */
const DEBOUNCE_MS = 500;

/**
 * Hook that automatically persists canvas history to IndexedDB.
 * Debounces saves to avoid excessive IndexedDB writes.
 *
 * Usage:
 *   const canvasId = useActiveCanvasId();
 *   useHistoryPersistence(canvasId);
 *
 * @param canvasId - The current canvas ID to persist history for
 */
export function useHistoryPersistence(canvasId: string): void {
  const saveHistory = useCanvasHistoryStore((s) => s.saveHistory);
  const past = useCanvasHistoryStore((s) => s.past);
  const future = useCanvasHistoryStore((s) => s.future);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasIdRef = useRef(canvasId);

  // Keep canvasId ref up to date
  canvasIdRef.current = canvasId;

  useEffect(() => {
    // Debounce: clear previous timer and set new one
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const currentCanvasId = canvasIdRef.current;
      if (!currentCanvasId) return;
      saveHistory(currentCanvasId).catch((err) => {
        console.warn('[useHistoryPersistence] save failed:', err);
      });
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [past, future, saveHistory]); // Re-trigger when history changes
}
