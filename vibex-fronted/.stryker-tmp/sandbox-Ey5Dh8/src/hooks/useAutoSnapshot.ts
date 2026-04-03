/**
 * Auto Snapshot Hook
 * 
 * Automatically creates snapshots when significant state changes occur.
 * This provides version history for the confirmation flow.
 */
// @ts-nocheck


import { useEffect, useRef, useCallback } from 'react';
import { useConfirmationStore } from '@/stores/confirmationStore';

// Debounce delay for auto-snapshot (ms)
const AUTO_SNAPSHOT_DEBOUNCE = 2000;

/**
 * Hook to enable automatic snapshots on state changes
 * 
 * @param enabled - Whether auto-snapshot is enabled
 * @param debounceMs - Debounce delay in milliseconds
 */
export function useAutoSnapshot(
  enabled: boolean = true,
  debounceMs: number = AUTO_SNAPSHOT_DEBOUNCE
) {
  const saveSnapshot = useConfirmationStore(state => state.saveSnapshot);
  const currentStep = useConfirmationStore(state => state.currentStep);
  const requirementText = useConfirmationStore(state => state.requirementText);
  const boundedContexts = useConfirmationStore(state => state.boundedContexts);
  const domainModels = useConfirmationStore(state => state.domainModels);
  const businessFlow = useConfirmationStore(state => state.businessFlow);
  
  const lastSnapshotRef = useRef<string>('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate a hash of the current state to detect changes
  const getStateHash = useCallback(() => {
    return JSON.stringify({
      step: currentStep,
      reqLen: requirementText?.length,
      contexts: boundedContexts?.length,
      models: domainModels?.length,
    });
  }, [currentStep, requirementText, boundedContexts, domainModels]);

  useEffect(() => {
    if (!enabled) return;

    const stateHash = getStateHash();
    
    // Skip if state hasn't changed since last snapshot
    if (stateHash === lastSnapshotRef.current) return;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the snapshot creation
    debounceTimerRef.current = setTimeout(() => {
      saveSnapshot();
      lastSnapshotRef.current = getStateHash();
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [enabled, getStateHash, saveSnapshot, debounceMs]);

  // Manual trigger for immediate snapshot (e.g., on explicit save)
  const triggerSnapshot = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    saveSnapshot();
    lastSnapshotRef.current = getStateHash();
  }, [saveSnapshot, getStateHash]);

  return { triggerSnapshot };
}

/**
 * Hook to get version history statistics
 */
export function useVersionHistory() {
  const history = useConfirmationStore(state => state.history);
  const historyIndex = useConfirmationStore(state => state.historyIndex);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    totalSnapshots: history.length,
    currentIndex: historyIndex,
    canUndo,
    canRedo,
    snapshots: history,
  };
}

/**
 * Hook to restore to a specific version
 */
export function useVersionRestore() {
  const undo = useConfirmationStore(state => state.undo);
  const redo = useConfirmationStore(state => state.redo);
  const jumpToSnapshot = useConfirmationStore(state => state.jumpToSnapshot);
  const historyIndex = useConfirmationStore(state => state.historyIndex);
  const history = useConfirmationStore(state => state.history);

  return {
    undo,
    redo,
    jumpToSnapshot: (index: number) => {
      if (index >= 0 && index < history.length) {
        const diff = index - historyIndex;
        if (diff < 0) {
          // Need to undo
          for (let i = 0; i < Math.abs(diff); i++) {
            undo();
          }
        } else if (diff > 0) {
          // Need to redo
          for (let i = 0; i < diff; i++) {
            redo();
          }
        }
      }
    },
    historyIndex,
    totalSnapshots: history.length,
  };
}
