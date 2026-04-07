/**
 * crossStoreSync — cross-store subscriptions to keep stores in sync
 *
 * E1: Extracted from canvasStore.ts cross-store subscription block.
 * Avoids circular dependencies by using one-way subscriptions.
 *
 * Epic: canvas-canvasstore-migration / E1-canvasStore清理
 * AGENTS.md: §2.1 crossStoreSync Template
 */

import { useContextStore } from './stores/contextStore';
import { useFlowStore } from './stores/flowStore';
import { useUIStore } from './stores/uiStore';

/** Returns an unsubscribe function */
export function initCrossStoreSync(): () => void {
  const unsubs: Array<() => void> = [];

  // --- Sync centerExpand when activeTree changes ---
  let _prevActiveTree: string | null = null;
  unsubs.push(
    useContextStore.subscribe((state) => {
      const activeTree = state.activeTree as string | null;
      if (activeTree !== _prevActiveTree) {
        _prevActiveTree = activeTree;
        if (activeTree === 'flow' || activeTree === 'component') {
          useUIStore.getState().setCenterExpand('expand-left');
        } else if (activeTree === null) {
          useUIStore.getState().setCenterExpand('default');
        }
      }
    })
  );

  // --- Sync recomputeActiveTree when flow nodes change ---
  unsubs.push(
    useFlowStore.subscribe((_state) => {
      const ctxState = useContextStore.getState();
      if (typeof ctxState.recomputeActiveTree === 'function') {
        ctxState.recomputeActiveTree();
      }
    })
  );

  return () => unsubs.forEach((fn) => fn());
}
