/**
 * DDD State Sync Middleware
 *
 * Cross-slice sync manager for the three DDD stores:
 * - contextSlice  (bounded contexts)
 * - modelSlice    (domain models)
 * Note: businessFlows are managed by confirmationStore which handles its own persistence.
 *
 * Responsibilities:
 * 1. Listen to state changes across the three slices
 * 2. Sync cross-slice references (context → model, model → flow)
 * 3. Persist snapshots to sessionStorage on every change
 * 4. Restore state from sessionStorage on page navigation
 *
 * Architecture: ADR-001 Epic 2
 */

import {
  persistSnapshot,
  restoreSnapshot,
  clearSnapshot,
  type PersistedDDDState,
} from './sessionStorageAdapter';

export type { PersistedDDDState };

// ==================== Types ====================

/** Selector type for a DDD store slice — accepts both plain stores and Zustand UseBoundStore */
type StoreSlice<T = object> = {
  getState: () => T;
  subscribe: (fn: (state: T, prevState: T) => void) => () => void;
};

// ==================== Sync Rules ====================

/**
 * Compute a stable sync key from context slice data.
 * Downstream slices can detect upstream changes by tracking this key.
 */
export function computeContextSyncKey(contexts: unknown[]): string {
  const ids = (contexts as Array<{ id: string }>)
    .map(c => (c as { id: string })?.id)
    .filter(Boolean)
    .join(',');
  return `ctx-sync:${ids}`;
}

/**
 * Compute a stable sync key from model slice data.
 */
export function computeModelSyncKey(models: unknown[]): string {
  const ids = (models as Array<{ id: string }>)
    .map(m => (m as { id: string })?.id)
    .filter(Boolean)
    .join(',');
  return `model-sync:${ids}`;
}

/**
 * Compute a stable sync key from flow data.
 */
export function computeFlowSyncKey(flows: unknown[]): string {
  const ids = (flows as Array<{ id: string }>)
    .map(f => (f as { id: string })?.id)
    .filter(Boolean)
    .join(',');
  return `flow-sync:${ids}`;
}

// ==================== State Sync Manager ====================

/**
 * DDD State Sync Manager
 *
 * Singleton that coordinates cross-slice subscriptions and sessionStorage
 * persistence for the three DDD stores.
 */
class DDDStateSyncManager {
  private _registered = false;
  private _unsubscribers: Array<() => void> = [];
  private _currentRoute = '';
  private _syncKeys = {
    context: '',
    model: '',
    flow: '',
  };

  /**
   * Register all three DDD store slices.
   * Called once on first mount; subsequent calls are no-ops.
   */
  register(
    contextStore: StoreSlice<object>,
    modelStore: StoreSlice<object>,
    _designStore: StoreSlice<object> | undefined
  ): void {
    if (this._registered) return;
    this._registered = true;

    // --- Subscribe to context slice changes ---
    const unsubContext = contextStore.subscribe((state, prev) => {
      const contexts = (state['boundedContexts'] ?? []) as unknown[];
      const prevContexts = (prev['boundedContexts'] ?? []) as unknown[];
      if (contexts === prevContexts) return;
      this._syncKeys.context = computeContextSyncKey(contexts);
      this._persistAll(contextStore, modelStore, _designStore);
    });
    this._unsubscribers.push(unsubContext);

    // --- Subscribe to model slice changes ---
    const unsubModel = modelStore.subscribe((state, prev) => {
      const models = (state['domainModels'] ?? []) as unknown[];
      const prevModels = (prev['domainModels'] ?? []) as unknown[];
      if (models === prevModels) return;
      this._syncKeys.model = computeModelSyncKey(models);
      this._persistAll(contextStore, modelStore, _designStore);
    });
    this._unsubscribers.push(unsubModel);

    // --- Listen to browser navigation (popstate) ---
    if (typeof window !== 'undefined') {
      const handlePopstate = () => {
        const newRoute = window.location.pathname;
        if (newRoute !== this._currentRoute) {
          this._currentRoute = newRoute;
          this._persistAll(contextStore, modelStore, _designStore);
        }
      };
      window.addEventListener('popstate', handlePopstate);
      this._unsubscribers.push(() => window.removeEventListener('popstate', handlePopstate));
    }
  }

  private _persistAll(
    contextStore: StoreSlice<object>,
    modelStore: StoreSlice<object>,
    _designStore: StoreSlice<object> | undefined
  ): void {
    const ctx = contextStore.getState();
    const model = modelStore.getState();
    // confirmationStore handles its own persistence via history/undo

    const state: PersistedDDDState = {
      boundedContexts: (ctx['boundedContexts'] ?? []) as unknown[],
      contextMermaidCode: (ctx['contextMermaidCode'] ?? '') as string,
      selectedContextIds: (ctx['selectedContextIds'] ?? []) as string[],
      domainModels: (model['domainModels'] ?? []) as unknown[],
      modelMermaidCode: (model['modelMermaidCode'] ?? '') as string,
      selectedModelIds: (model['selectedModelIds'] ?? []) as string[],
      businessFlows: [],
      requirementText: '',
      _lastSync: Date.now(),
    };

    persistSnapshot(state);
  }

  /**
   * Restore DDD state from sessionStorage on page navigation.
   *
   * When the user navigates to a DDD page that has no data in the store,
   * this checks sessionStorage and restores the snapshot if available.
   *
   * @returns true if any data was restored, false otherwise.
   */
  checkAndRestore(
    route: string,
    contextStore: {
      getState: () => Record<string, unknown>;
      setBoundedContexts?: (c: unknown[]) => void;
      setContextMermaidCode?: (c: string) => void;
      setSelectedContextIds?: (ids: string[]) => void;
    },
    modelStore: {
      getState: () => Record<string, unknown>;
      setDomainModels?: (m: unknown[]) => void;
      setModelMermaidCode?: (c: string) => void;
      setSelectedModelIds?: (ids: string[]) => void;
    },
    _designStore: {
      getState: () => Record<string, unknown>;
    } | undefined
  ): boolean {
    const snapshot = restoreSnapshot();
    if (!snapshot) return false;

    let restored = false;

    // Restore bounded contexts
    if (route.includes('bounded-context') || route.includes('context')) {
      const ctx = contextStore.getState();
      if (!((ctx['boundedContexts'] as unknown[])?.length) && snapshot.boundedContexts?.length) {
        contextStore.setBoundedContexts?.(snapshot.boundedContexts);
        if (snapshot.contextMermaidCode) {
          contextStore.setContextMermaidCode?.(snapshot.contextMermaidCode);
        }
        if (snapshot.selectedContextIds?.length) {
          contextStore.setSelectedContextIds?.(snapshot.selectedContextIds);
        }
        restored = true;
      }
    }

    // Restore domain models
    if (route.includes('domain-model')) {
      const model = modelStore.getState();
      if (!((model['domainModels'] as unknown[])?.length) && snapshot.domainModels?.length) {
        modelStore.setDomainModels?.(snapshot.domainModels);
        if (snapshot.modelMermaidCode) {
          modelStore.setModelMermaidCode?.(snapshot.modelMermaidCode);
        }
        if (snapshot.selectedModelIds?.length) {
          modelStore.setSelectedModelIds?.(snapshot.selectedModelIds);
        }
        restored = true;
      }
    }

    // confirmationStore manages its own persistence via history/undo

    return restored;
  }

  /** Get current sync keys (for React hooks to subscribe to) */
  getSyncKeys(): { context: string; model: string; flow: string } {
    return { ...this._syncKeys };
  }

  /** Unregister all subscriptions. Call on app unmount or logout. */
  unregister(): void {
    this._unsubscribers.forEach(unsub => {
      try { unsub(); } catch { /* ignore */ }
    });
    this._unsubscribers = [];
    this._registered = false;
  }
}

// ==================== Singleton ====================

export const dddStateSyncManager = new DDDStateSyncManager();

// ==================== Public API ====================

/**
 * Initialize cross-slice state sync.
 * Call once at app startup with all three DDD store references.
 */
export function initDDDStateSync(
  contextStore: StoreSlice<object>,
  modelStore: StoreSlice<object>,
  _designStore?: StoreSlice<object>
): void {
  dddStateSyncManager.register(contextStore, modelStore, _designStore);
}

/**
 * Restore DDD state from sessionStorage.
 * Call from DDD page components on mount.
 * Returns true if any data was restored.
 */
export function checkDDDStateRestore(
  route: string,
  contextStore: Parameters<typeof dddStateSyncManager.checkAndRestore>[1],
  modelStore: Parameters<typeof dddStateSyncManager.checkAndRestore>[2],
  _designStore?: Parameters<typeof dddStateSyncManager.checkAndRestore>[3]
): boolean {
  return dddStateSyncManager.checkAndRestore(route, contextStore, modelStore, _designStore);
}

/**
 * Clear the sessionStorage snapshot.
 * Call on explicit logout or "new project".
 */
export function clearDDDSnapshot(): void {
  clearSnapshot();
  dddStateSyncManager.unregister();
}

/**
 * Get current cross-slice sync keys.
 * Used by hooks to trigger re-renders when upstream data changes.
 */
export function useDDDSyncKeys(): { context: string; model: string; flow: string } {
  return dddStateSyncManager.getSyncKeys();
}
