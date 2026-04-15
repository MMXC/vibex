/**
 * useRehydrateCanvasStores — E6 Three-Tree Persistence
 *
 * E6: Zustand stores rehydrate from localStorage on page load.
 * Since all three canvas stores use `skipHydration: true`, we manually
 * trigger rehydration after the component mounts.
 *
 * Usage:
 *   const { isRehydrated, rehydrate } = useRehydrateCanvasStores();
 */

import { useState, useEffect } from 'react';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';

/**
 * Rehydrate all three canvas stores from localStorage.
 * Returns a promise that resolves when all stores have rehydrated.
 */
async function rehydrateAllStores(): Promise<void> {
  const stores = [useContextStore, useFlowStore, useComponentStore];
  await Promise.all(stores.map((store) => store.persist.rehydrate()));
}

/**
 * Hook to rehydrate canvas Zustand stores from localStorage.
 * Handles the `skipHydration: true` case by manually triggering rehydration.
 */
export function useRehydrateCanvasStores() {
  const [isRehydrated, setIsRehydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function doRehydrate() {
      try {
        await rehydrateAllStores();
        if (!cancelled) {
          setIsRehydrated(true);
        }
      } catch (err) {
        console.warn('[useRehydrateCanvasStores] Rehydration failed:', err);
        // Don't block the app — treat as non-rehydrated state
        if (!cancelled) setIsRehydrated(true);
      }
    }

    doRehydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  return { isRehydrated };
}
