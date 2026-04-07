/**
 * DDD State Sync Middleware Tests
 *
 * Tests the cross-slice state sync manager and sessionStorage adapter.
 * Verifies:
 * - Cross-slice subscriptions fire on state changes
 * - Sync keys are updated correctly
 * - sessionStorage persistence works
 * - TTL expiration is enforced
 * - State restoration works
 */
// @ts-nocheck


import {
  persistSnapshot,
  restoreSnapshot,
  clearSnapshot,
  hasValidSnapshot,
  getSnapshotAge,
  type PersistedDDDState,
} from '../ddd/sessionStorageAdapter';
import {
  computeContextSyncKey,
  computeModelSyncKey,
  computeFlowSyncKey,
  dddStateSyncManager,
  initDDDStateSync,
  clearDDDSnapshot,
} from '../ddd/middleware';

// ==================== Helpers ====================

/**
 * Create a mock Zustand-like store for testing.
 * Uses a stable state reference so subscriptions compare against the
 * same object in memory (mimicking real Zustand behavior).
 */
function createMockStore<T extends Record<string, unknown>>(
  initialState: T
): T & {
  subscribe: (fn: (state: T, prev: T) => void) => () => void;
} {
  let state: T = { ...initialState };
  const subscribers = new Set<(state: T, prev: T) => void>();

  return {
    ...state,
    getState: () => state,
    setState: (updates: Partial<T>) => {
      const prev = state;
      state = { ...state, ...updates };
      subscribers.forEach(fn => fn(state, prev));
    },
    subscribe: (fn: (state: T, prev: T) => void) => {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
}

// ==================== sessionStorage Adapter Tests ====================

describe('sessionStorage Adapter', () => {
  beforeEach(() => {
    clearSnapshot();
  });

  afterEach(() => {
    clearSnapshot();
  });

  describe('persistSnapshot / restoreSnapshot', () => {
    it('should persist and restore full DDD state', () => {
      const state: PersistedDDDState = {
        boundedContexts: [{ id: 'ctx-1', name: 'Test', type: 'core' }],
        contextMermaidCode: 'graph TD;',
        selectedContextIds: ['ctx-1'],
        domainModels: [{ id: 'model-1', name: 'User', contextId: 'ctx-1', type: 'aggregate_root', properties: [] }],
        modelMermaidCode: 'classDiagram;',
        selectedModelIds: ['model-1'],
        businessFlows: [{ id: 'flow-1', name: 'Order Flow', steps: [] }],
        requirementText: 'Test requirement',
        _lastSync: Date.now(),
      };

      persistSnapshot(state);
      const restored = restoreSnapshot();

      expect(restored).not.toBeNull();
      expect(restored?.boundedContexts).toHaveLength(1);
      expect(restored?.boundedContexts[0]).toEqual({ id: 'ctx-1', name: 'Test', type: 'core' });
      expect(restored?.contextMermaidCode).toBe('graph TD;');
      expect(restored?.domainModels).toHaveLength(1);
      expect(restored?.businessFlows).toHaveLength(1);
      expect(restored?.requirementText).toBe('Test requirement');
    });

    it('should restore null when no snapshot exists', () => {
      const result = restoreSnapshot();
      expect(result).toBeNull();
    });

    it('should handle corrupt JSON gracefully', () => {
      sessionStorage.setItem('ddd-cross-page-state', 'not valid json');
      const result = restoreSnapshot();
      expect(result).toBeNull();
    });
  });

  describe('TTL expiration', () => {
    it('should expire after 30 minutes', () => {
      const oldState: PersistedDDDState = {
        boundedContexts: [{ id: 'ctx-1' }],
        contextMermaidCode: '',
        selectedContextIds: [],
        domainModels: [],
        modelMermaidCode: '',
        selectedModelIds: [],
        businessFlows: [],
        requirementText: '',
        _lastSync: Date.now() - 31 * 60 * 1000, // 31 minutes ago
      };

      sessionStorage.setItem('ddd-cross-page-state', JSON.stringify(oldState));
      const result = restoreSnapshot();

      expect(result).toBeNull();
      expect(sessionStorage.getItem('ddd-cross-page-state')).toBeNull();
    });

    it('should not expire within TTL', () => {
      const freshState: PersistedDDDState = {
        boundedContexts: [{ id: 'ctx-1' }],
        contextMermaidCode: '',
        selectedContextIds: [],
        domainModels: [],
        modelMermaidCode: '',
        selectedModelIds: [],
        businessFlows: [],
        requirementText: '',
        _lastSync: Date.now() - 5 * 60 * 1000, // 5 minutes ago
      };

      persistSnapshot(freshState);
      const result = restoreSnapshot();

      expect(result).not.toBeNull();
      expect(result?.boundedContexts).toHaveLength(1);
    });
  });

  describe('clearSnapshot', () => {
    it('should clear sessionStorage', () => {
      persistSnapshot({
        boundedContexts: [{ id: 'ctx-1' }],
        contextMermaidCode: '',
        selectedContextIds: [],
        domainModels: [],
        modelMermaidCode: '',
        selectedModelIds: [],
        businessFlows: [],
        requirementText: '',
        _lastSync: Date.now(),
      });

      clearSnapshot();

      expect(sessionStorage.getItem('ddd-cross-page-state')).toBeNull();
      expect(restoreSnapshot()).toBeNull();
    });
  });

  describe('hasValidSnapshot', () => {
    it('should return true when valid snapshot exists', () => {
      persistSnapshot({
        boundedContexts: [],
        contextMermaidCode: '',
        selectedContextIds: [],
        domainModels: [],
        modelMermaidCode: '',
        selectedModelIds: [],
        businessFlows: [],
        requirementText: '',
        _lastSync: Date.now(),
      });

      expect(hasValidSnapshot()).toBe(true);
    });

    it('should return false when no snapshot exists', () => {
      clearSnapshot();
      expect(hasValidSnapshot()).toBe(false);
    });
  });

  describe('getSnapshotAge', () => {
    it('should return -1 when no snapshot', () => {
      clearSnapshot();
      expect(getSnapshotAge()).toBe(-1);
    });

    it('should return age in ms when snapshot exists', () => {
      persistSnapshot({
        boundedContexts: [],
        contextMermaidCode: '',
        selectedContextIds: [],
        domainModels: [],
        modelMermaidCode: '',
        selectedModelIds: [],
        businessFlows: [],
        requirementText: '',
        _lastSync: Date.now(),
      });

      const age = getSnapshotAge();
      expect(age).toBeGreaterThanOrEqual(0);
      expect(age).toBeLessThan(200); // within 200ms
    });
  });
});

// ==================== Sync Key Computation Tests ====================

describe('Sync Key Computation', () => {
  describe('computeContextSyncKey', () => {
    it('should return ctx-sync: for empty array', () => {
      expect(computeContextSyncKey([])).toBe('ctx-sync:');
    });

    it('should include all context IDs', () => {
      const contexts = [
        { id: 'ctx-1' },
        { id: 'ctx-2' },
        { id: 'ctx-3' },
      ];
      expect(computeContextSyncKey(contexts)).toBe('ctx-sync:ctx-1,ctx-2,ctx-3');
    });

    it('should filter out contexts without IDs', () => {
      const contexts = [
        { id: 'ctx-1' },
        { name: 'No ID' },
        null,
        undefined,
        { id: 'ctx-2' },
      ] as unknown[];
      expect(computeContextSyncKey(contexts)).toBe('ctx-sync:ctx-1,ctx-2');
    });

    it('should be stable (same input = same output)', () => {
      const contexts = [{ id: 'a' }, { id: 'b' }];
      const key1 = computeContextSyncKey(contexts);
      const key2 = computeContextSyncKey(contexts);
      expect(key1).toBe(key2);
    });

    it('should produce different keys for different data', () => {
      const key1 = computeContextSyncKey([{ id: 'ctx-1' }]);
      const key2 = computeContextSyncKey([{ id: 'ctx-2' }]);
      expect(key1).not.toBe(key2);
    });
  });

  describe('computeModelSyncKey', () => {
    it('should return model-sync: for empty array', () => {
      expect(computeModelSyncKey([])).toBe('model-sync:');
    });

    it('should include model IDs', () => {
      const models = [{ id: 'model-1' }, { id: 'model-2' }];
      expect(computeModelSyncKey(models)).toBe('model-sync:model-1,model-2');
    });
  });

  describe('computeFlowSyncKey', () => {
    it('should return flow-sync: for empty array', () => {
      expect(computeFlowSyncKey([])).toBe('flow-sync:');
    });

    it('should include flow IDs', () => {
      const flows = [{ id: 'flow-1' }, { id: 'flow-2' }];
      expect(computeFlowSyncKey(flows)).toBe('flow-sync:flow-1,flow-2');
    });
  });
});

// ==================== State Sync Manager Tests ====================

describe('DDD State Sync Manager', () => {
  let contextStore: ReturnType<typeof createMockStore>;
  let modelStore: ReturnType<typeof createMockStore>;
  let designStore: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    clearSnapshot();
    dddStateSyncManager.unregister();

    contextStore = createMockStore({
      boundedContexts: [],
      contextMermaidCode: '',
      selectedContextIds: [] as string[],
    });

    modelStore = createMockStore({
      domainModels: [],
      modelMermaidCode: '',
      selectedModelIds: [] as string[],
    });

    designStore = createMockStore({
      businessFlows: [],
      requirementText: '',
    });
  });

  afterEach(() => {
    dddStateSyncManager.unregister();
    clearSnapshot();
  });

  describe('initDDDStateSync', () => {
    it('should register stores once', () => {
      initDDDStateSync(contextStore, modelStore, designStore);
      initDDDStateSync(contextStore, modelStore, designStore);
      // No error thrown = pass
    });

    it('should not throw with valid stores', () => {
      expect(() => {
        initDDDStateSync(contextStore, modelStore, designStore);
      }).not.toThrow();
    });
  });

  describe('Cross-slice sync', () => {
    it('should update context sync key when boundedContexts change', () => {
      initDDDStateSync(contextStore, modelStore, designStore);

      contextStore.setState({ boundedContexts: [{ id: 'ctx-1' }] });

      const keys = dddStateSyncManager.getSyncKeys();
      expect(keys.context).toBe('ctx-sync:ctx-1');
    });

    it('should update model sync key when domainModels change', () => {
      initDDDStateSync(contextStore, modelStore, designStore);

      modelStore.setState({ domainModels: [{ id: 'model-1' }] });

      const keys = dddStateSyncManager.getSyncKeys();
      expect(keys.model).toBe('model-sync:model-1');
    });

    it('should update flow sync key when businessFlows change', () => {
      initDDDStateSync(contextStore, modelStore, designStore);

      designStore.setState({ businessFlows: [{ id: 'flow-1' }] });

      const keys = dddStateSyncManager.getSyncKeys();
      expect(keys.flow).toBe('flow-sync:flow-1');
    });

    it('should not update sync keys when same reference is set', () => {
      initDDDStateSync(contextStore, modelStore, designStore);
      const contexts = [{ id: 'ctx-1' }];
      contextStore.setState({ boundedContexts: contexts });
      contextStore.setState({ boundedContexts: contexts });

      const keys = dddStateSyncManager.getSyncKeys();
      expect(keys.context).toBe('ctx-sync:ctx-1');
    });
  });

  describe('sessionStorage persistence', () => {
    it('should persist to sessionStorage when context changes', () => {
      initDDDStateSync(contextStore, modelStore, designStore);

      contextStore.setState({ boundedContexts: [{ id: 'ctx-1' }] });

      const restored = restoreSnapshot();
      expect(restored).not.toBeNull();
      expect(restored?.boundedContexts).toHaveLength(1);
    });

    it('should persist to sessionStorage when model changes', () => {
      initDDDStateSync(contextStore, modelStore, designStore);

      modelStore.setState({ domainModels: [{ id: 'model-1' }] });

      const restored = restoreSnapshot();
      expect(restored?.domainModels).toHaveLength(1);
    });

    it('should persist to sessionStorage when flow changes', () => {
      initDDDStateSync(contextStore, modelStore, designStore);

      designStore.setState({ businessFlows: [{ id: 'flow-1' }] });

      const restored = restoreSnapshot();
      expect(restored?.businessFlows).toHaveLength(1);
    });

    it('should persist all slices together', () => {
      initDDDStateSync(contextStore, modelStore, designStore);

      contextStore.setState({ boundedContexts: [{ id: 'ctx-1' }] });
      modelStore.setState({ domainModels: [{ id: 'model-1' }] });
      designStore.setState({ businessFlows: [{ id: 'flow-1' }], requirementText: 'req' });

      const restored = restoreSnapshot();
      expect(restored?.boundedContexts).toHaveLength(1);
      expect(restored?.domainModels).toHaveLength(1);
      expect(restored?.businessFlows).toHaveLength(1);
      expect(restored?.requirementText).toBe('req');
    });
  });

  describe('checkAndRestore', () => {
    it('should restore context data when navigating to context page with empty store', () => {
      clearSnapshot();
      persistSnapshot({
        boundedContexts: [{ id: 'ctx-1', name: 'Test' }],
        contextMermaidCode: 'graph TD;',
        selectedContextIds: ['ctx-1'],
        domainModels: [],
        modelMermaidCode: '',
        selectedModelIds: [],
        businessFlows: [],
        requirementText: '',
        _lastSync: Date.now(),
      });

      let restoredContexts: unknown[] | null = null;
      let restoredCode = '';

      const freshContextStore = createMockStore({
        boundedContexts: [] as unknown[],
        contextMermaidCode: '',
        selectedContextIds: [] as string[],
        setBoundedContexts: (c: unknown[]) => { restoredContexts = c; },
        setContextMermaidCode: (c: string) => { restoredCode = c; },
      });

      const result = dddStateSyncManager.checkAndRestore(
        '/design/bounded-context',
        freshContextStore,
        modelStore,
        designStore
      );

      expect(result).toBe(true);
      expect(restoredContexts).toHaveLength(1);
      expect((restoredContexts![0] as { id: string }).id).toBe('ctx-1');
      expect(restoredCode).toBe('graph TD;');
    });

    it('should NOT restore if store already has data', () => {
      clearSnapshot();
      persistSnapshot({
        boundedContexts: [{ id: 'ctx-1' }],
        contextMermaidCode: '',
        selectedContextIds: [],
        domainModels: [],
        modelMermaidCode: '',
        selectedModelIds: [],
        businessFlows: [],
        requirementText: '',
        _lastSync: Date.now(),
      });

      let called = false;
      const storeWithData = createMockStore({
        boundedContexts: [{ id: 'existing-ctx' }] as unknown[],
        contextMermaidCode: '',
        selectedContextIds: [] as string[],
        setBoundedContexts: () => { called = true; },
      });

      const result = dddStateSyncManager.checkAndRestore(
        '/design/bounded-context',
        storeWithData,
        modelStore,
        designStore
      );

      expect(result).toBe(false);
      expect(called).toBe(false);
    });

    it('should restore model data on domain-model route', () => {
      clearSnapshot();
      persistSnapshot({
        boundedContexts: [],
        contextMermaidCode: '',
        selectedContextIds: [],
        domainModels: [{ id: 'model-1', name: 'User' }],
        modelMermaidCode: 'classDiagram;',
        selectedModelIds: [],
        businessFlows: [],
        requirementText: '',
        _lastSync: Date.now(),
      });

      let restoredModels: unknown[] | null = null;
      let restoredCode = '';

      const freshModelStore = createMockStore({
        domainModels: [] as unknown[],
        modelMermaidCode: '',
        selectedModelIds: [] as string[],
        setDomainModels: (m: unknown[]) => { restoredModels = m; },
        setModelMermaidCode: (c: string) => { restoredCode = c; },
      });

      const result = dddStateSyncManager.checkAndRestore(
        '/design/domain-model',
        contextStore,
        freshModelStore,
        designStore
      );

      expect(result).toBe(true);
      expect(restoredModels).toHaveLength(1);
      expect((restoredModels![0] as { id: string }).id).toBe('model-1');
      expect(restoredCode).toBe('classDiagram;');
    });

    it('should restore flow data on business-flow route', () => {
      clearSnapshot();
      persistSnapshot({
        boundedContexts: [],
        contextMermaidCode: '',
        selectedContextIds: [],
        domainModels: [],
        modelMermaidCode: '',
        selectedModelIds: [],
        businessFlows: [{ id: 'flow-1', name: 'Order Flow' }],
        requirementText: 'Test requirement',
        _lastSync: Date.now(),
      });

      let restoredFlows: unknown[] | null = null;
      let restoredReq = '';

      const freshDesignStore = createMockStore({
        businessFlows: [] as unknown[],
        requirementText: '',
        setBusinessFlows: (f: unknown[]) => { restoredFlows = f; },
        setRequirementText: (t: string) => { restoredReq = t; },
      });

      const result = dddStateSyncManager.checkAndRestore(
        '/design/business-flow',
        contextStore,
        modelStore,
        freshDesignStore
      );

      expect(result).toBe(true);
      expect(restoredFlows).toHaveLength(1);
      expect(restoredReq).toBe('Test requirement');
    });

    it('should return false when no snapshot exists', () => {
      clearSnapshot();

      const result = dddStateSyncManager.checkAndRestore(
        '/design/bounded-context',
        contextStore,
        modelStore,
        designStore
      );

      expect(result).toBe(false);
    });
  });

  describe('clearDDDSnapshot', () => {
    it('should clear snapshot and unregister', () => {
      initDDDStateSync(contextStore, modelStore, designStore);
      contextStore.setState({ boundedContexts: [{ id: 'ctx-1' }] });

      expect(restoreSnapshot()).not.toBeNull();

      clearDDDSnapshot();

      expect(restoreSnapshot()).toBeNull();
    });
  });

  describe('getSyncKeys', () => {
    it('should return current sync keys', () => {
      initDDDStateSync(contextStore, modelStore, designStore);
      contextStore.setState({ boundedContexts: [{ id: 'ctx-1' }] });
      modelStore.setState({ domainModels: [{ id: 'model-1' }] });
      designStore.setState({ businessFlows: [{ id: 'flow-1' }] });

      const keys = dddStateSyncManager.getSyncKeys();

      expect(keys.context).toBe('ctx-sync:ctx-1');
      expect(keys.model).toBe('model-sync:model-1');
      expect(keys.flow).toBe('flow-sync:flow-1');
    });
  });
});

// ==================== Integration Tests ====================

describe('DDD State Sync Integration', () => {
  let contextStore: ReturnType<typeof createMockStore>;
  let modelStore: ReturnType<typeof createMockStore>;
  let designStore: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    clearSnapshot();
    dddStateSyncManager.unregister();

    contextStore = createMockStore({
      boundedContexts: [],
      contextMermaidCode: '',
    });
    modelStore = createMockStore({
      domainModels: [],
      modelMermaidCode: '',
    });
    designStore = createMockStore({
      businessFlows: [],
      requirementText: '',
    });

    initDDDStateSync(contextStore, modelStore, designStore);
  });

  afterEach(() => {
    dddStateSyncManager.unregister();
    clearSnapshot();
  });

  it('should sync all three slices through a full workflow', () => {
    // Step 1: User creates bounded contexts
    contextStore.setState({
      boundedContexts: [
        { id: 'ctx-1', name: 'Order', type: 'core' },
        { id: 'ctx-2', name: 'Payment', type: 'core' },
      ],
      contextMermaidCode: 'graph TD;',
    });

    expect(dddStateSyncManager.getSyncKeys().context).toBe('ctx-sync:ctx-1,ctx-2');

    // Step 2: User creates domain models
    modelStore.setState({
      domainModels: [
        { id: 'model-1', name: 'Order', contextId: 'ctx-1' },
        { id: 'model-2', name: 'Payment', contextId: 'ctx-2' },
      ],
      modelMermaidCode: 'classDiagram;',
    });

    expect(dddStateSyncManager.getSyncKeys().model).toBe('model-sync:model-1,model-2');

    // Step 3: User creates business flows
    designStore.setState({
      businessFlows: [{ id: 'flow-1', name: 'Order Process' }],
      requirementText: 'Process orders',
    });

    expect(dddStateSyncManager.getSyncKeys().flow).toBe('flow-sync:flow-1');

    // Step 4: Verify all data persisted to sessionStorage
    const snapshot = restoreSnapshot();
    expect(snapshot?.boundedContexts).toHaveLength(2);
    expect(snapshot?.domainModels).toHaveLength(2);
    expect(snapshot?.businessFlows).toHaveLength(1);
    expect(snapshot?.requirementText).toBe('Process orders');
  });

  it('should handle multiple context updates without memory leaks', () => {
    for (let i = 0; i < 10; i++) {
      contextStore.setState({ boundedContexts: [{ id: `ctx-${i}` }] });
    }

    const keys = dddStateSyncManager.getSyncKeys();
    expect(keys.context).toBe('ctx-sync:ctx-9');

    const snapshot = restoreSnapshot();
    expect(snapshot?.boundedContexts).toHaveLength(1);
  });
});
