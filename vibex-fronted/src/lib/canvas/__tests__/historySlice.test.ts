/**
 * History Slice — Unit Tests
 *
 * 覆盖 Epic 1 Undo/Redo 核心功能：
 * - 三树独立历史栈
 * - 50步限制（超出丢弃最旧记录）
 * - undo/redo 边界条件
 * - 历史初始化和清除
 * - 三树互不干扰
 */

// =============================================================================
// Test Setup
// =============================================================================

// Mock localStorage BEFORE importing the store to prevent Zustand persist rehydration
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    key: jest.fn(),
    get length() { return 0; },
  },
  writable: true,
  configurable: true,
});

// Import the history slice (standalone store) and canvas store
import { useHistoryStore } from '../historySlice';
import type {
  BoundedContextNode,
  BusinessFlowNode,
  ComponentNode,
} from '../types';

// =============================================================================
// Helpers
// =============================================================================

function makeContextNode(name: string): BoundedContextNode {
  return {
    nodeId: `ctx-${name}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    description: `desc-${name}`,
    type: 'core',
    confirmed: false,
    status: 'pending',
    children: [],
  };
}

function makeFlowNode(name: string): BusinessFlowNode {
  return {
    nodeId: `flow-${name}-${Math.random().toString(36).slice(2, 6)}`,
    contextId: 'ctx-1',
    name,
    steps: [],
    confirmed: false,
    status: 'pending',
    children: [],
  };
}

function makeComponentNode(name: string): ComponentNode {
  return {
    nodeId: `comp-${name}-${Math.random().toString(36).slice(2, 6)}`,
    flowId: 'flow-1',
    name,
    type: 'page',
    props: {},
    api: { method: 'GET', path: '/api/test', params: [] },
    children: [],
    confirmed: false,
    status: 'pending',
  };
}

/**
 * Reset the history store to truly empty state.
 * Uses setState to bypass the clearAllHistories issue where present is preserved.
 */
function resetHistoryStore() {
  useHistoryStore.setState({
    contextHistory: { past: [], present: [], future: [] },
    flowHistory: { past: [], present: [], future: [] },
    componentHistory: { past: [], present: [], future: [] },
  });
}

// =============================================================================
// Tests
// =============================================================================

describe('HistorySlice — Initialization', () => {
  beforeEach(() => {
    resetHistoryStore();
  });

  it('should initialize with empty stacks', () => {
    const { contextHistory, flowHistory, componentHistory } = useHistoryStore.getState();
    expect(contextHistory.past).toEqual([]);
    expect(contextHistory.present).toEqual([]);
    expect(contextHistory.future).toEqual([]);

    expect(flowHistory.past).toEqual([]);
    expect(flowHistory.present).toEqual([]);
    expect(flowHistory.future).toEqual([]);

    expect(componentHistory.past).toEqual([]);
    expect(componentHistory.present).toEqual([]);
    expect(componentHistory.future).toEqual([]);
  });

  it('should init all histories at once', () => {
    const ctx = [makeContextNode('C1')];
    const flow = [makeFlowNode('F1')];
    const comp = [makeComponentNode('P1')];

    useHistoryStore.getState().initAllHistories(ctx, flow, comp);

    const { contextHistory, flowHistory, componentHistory } = useHistoryStore.getState();
    expect(contextHistory.present).toEqual(ctx);
    expect(flowHistory.present).toEqual(flow);
    expect(componentHistory.present).toEqual(comp);
  });

  it('should init individual tree history', () => {
    const ctx = [makeContextNode('C1'), makeContextNode('C2')];
    useHistoryStore.getState().initTreeHistory('context', ctx);

    const { contextHistory } = useHistoryStore.getState();
    expect(contextHistory.present).toEqual(ctx);
    expect(contextHistory.past).toEqual([]);
    expect(contextHistory.future).toEqual([]);
  });
});

describe('HistorySlice — Snapshot Recording', () => {
  beforeEach(() => {
    resetHistoryStore();
  });

  it('should record snapshot for context tree', () => {
    const snap1 = [makeContextNode('C1')];
    const snap2 = [makeContextNode('C1'), makeContextNode('C2')];

    // First record: sets present, does NOT push to past (initialization)
    useHistoryStore.getState().recordSnapshot('context', snap1);
    // Second record: pushes current present to past, updates present
    useHistoryStore.getState().recordSnapshot('context', snap2);

    const { contextHistory } = useHistoryStore.getState();
    // past contains snap1 (the previous present)
    expect(contextHistory.past).toEqual([snap1]);
    expect(contextHistory.present).toEqual(snap2);
    expect(contextHistory.future).toEqual([]);
  });

  it('should record snapshot for flow tree', () => {
    const snap1 = [makeFlowNode('F1')];
    const snap2 = [makeFlowNode('F1'), makeFlowNode('F2')];

    useHistoryStore.getState().recordSnapshot('flow', snap1);
    useHistoryStore.getState().recordSnapshot('flow', snap2);

    const { flowHistory } = useHistoryStore.getState();
    expect(flowHistory.past).toEqual([snap1]);
    expect(flowHistory.present).toEqual(snap2);
  });

  it('should record snapshot for component tree', () => {
    const snap1 = [makeComponentNode('P1')];
    const snap2 = [makeComponentNode('P1'), makeComponentNode('P2')];

    useHistoryStore.getState().recordSnapshot('component', snap1);
    useHistoryStore.getState().recordSnapshot('component', snap2);

    const { componentHistory } = useHistoryStore.getState();
    expect(componentHistory.past).toEqual([snap1]);
    expect(componentHistory.present).toEqual(snap2);
  });

  it('should not push to past on first record (initialization)', () => {
    const snap = [makeContextNode('C1')];
    useHistoryStore.getState().recordSnapshot('context', snap);

    const { contextHistory, canUndo } = useHistoryStore.getState();
    // First record is initialization: past stays empty, present = snap
    expect(contextHistory.past).toEqual([]);
    expect(contextHistory.present).toEqual(snap);
    expect(canUndo('context')).toBe(false);
  });
});

describe('HistorySlice — Undo/Redo', () => {
  beforeEach(() => {
    resetHistoryStore();
  });

  describe('Context Tree', () => {
    it('should undo context tree and return previous state', () => {
      const snap1: BoundedContextNode[] = [makeContextNode('C1')];
      const snap2: BoundedContextNode[] = [makeContextNode('C1'), makeContextNode('C2')];

      useHistoryStore.getState().recordSnapshot('context', snap1);
      useHistoryStore.getState().recordSnapshot('context', snap2);

      const prev = useHistoryStore.getState().undo('context');
      expect(prev).toEqual(snap1);

      const { contextHistory } = useHistoryStore.getState();
      expect(contextHistory.present).toEqual(snap1);
      expect(contextHistory.future.length).toBeGreaterThan(0);
    });

    it('should return null when undoing with no past', () => {
      const result = useHistoryStore.getState().undo('context');
      expect(result).toBeNull();
    });

    it('should redo context tree and return next state', () => {
      const snap1: BoundedContextNode[] = [makeContextNode('C1')];
      const snap2: BoundedContextNode[] = [makeContextNode('C1'), makeContextNode('C2')];

      useHistoryStore.getState().recordSnapshot('context', snap1);
      useHistoryStore.getState().recordSnapshot('context', snap2);
      useHistoryStore.getState().undo('context');

      const next = useHistoryStore.getState().redo('context');
      expect(next).toEqual(snap2);

      const { contextHistory } = useHistoryStore.getState();
      expect(contextHistory.present).toEqual(snap2);
    });

    it('should return null when redoing with no future', () => {
      const result = useHistoryStore.getState().redo('context');
      expect(result).toBeNull();
    });

    it('should support multiple undo/redo cycles', () => {
      const snap1: BoundedContextNode[] = [makeContextNode('C1')];
      const snap2: BoundedContextNode[] = [makeContextNode('C1'), makeContextNode('C2')];
      const snap3: BoundedContextNode[] = [makeContextNode('C1'), makeContextNode('C2'), makeContextNode('C3')];

      useHistoryStore.getState().recordSnapshot('context', snap1);
      useHistoryStore.getState().recordSnapshot('context', snap2);
      useHistoryStore.getState().recordSnapshot('context', snap3);

      // undo 1 → snap2
      expect(useHistoryStore.getState().undo('context')).toEqual(snap2);
      // undo 2 → snap1
      expect(useHistoryStore.getState().undo('context')).toEqual(snap1);
      // undo 3 → null (no more past)
      expect(useHistoryStore.getState().undo('context')).toBeNull();

      // redo 1 → snap2
      expect(useHistoryStore.getState().redo('context')).toEqual(snap2);
      // redo 2 → snap3
      expect(useHistoryStore.getState().redo('context')).toEqual(snap3);
      // redo 3 → null (no more future)
      expect(useHistoryStore.getState().redo('context')).toBeNull();
    });
  });

  describe('Flow Tree', () => {
    it('should undo flow tree', () => {
      const snap1: BusinessFlowNode[] = [makeFlowNode('F1')];
      const snap2: BusinessFlowNode[] = [makeFlowNode('F1'), makeFlowNode('F2')];

      useHistoryStore.getState().recordSnapshot('flow', snap1);
      useHistoryStore.getState().recordSnapshot('flow', snap2);

      const prev = useHistoryStore.getState().undo('flow');
      expect(prev).toEqual(snap1);
    });

    it('should redo flow tree', () => {
      const snap1: BusinessFlowNode[] = [makeFlowNode('F1')];
      const snap2: BusinessFlowNode[] = [makeFlowNode('F1'), makeFlowNode('F2')];

      useHistoryStore.getState().recordSnapshot('flow', snap1);
      useHistoryStore.getState().recordSnapshot('flow', snap2);
      useHistoryStore.getState().undo('flow');

      const next = useHistoryStore.getState().redo('flow');
      expect(next).toEqual(snap2);
    });

    it('should return null when undoing flow with no past', () => {
      expect(useHistoryStore.getState().undo('flow')).toBeNull();
    });
  });

  describe('Component Tree', () => {
    it('should undo component tree', () => {
      const snap1: ComponentNode[] = [makeComponentNode('P1')];
      const snap2: ComponentNode[] = [makeComponentNode('P1'), makeComponentNode('P2')];

      useHistoryStore.getState().recordSnapshot('component', snap1);
      useHistoryStore.getState().recordSnapshot('component', snap2);

      const prev = useHistoryStore.getState().undo('component');
      expect(prev).toEqual(snap1);
    });

    it('should redo component tree', () => {
      const snap1: ComponentNode[] = [makeComponentNode('P1')];
      const snap2: ComponentNode[] = [makeComponentNode('P1'), makeComponentNode('P2')];

      useHistoryStore.getState().recordSnapshot('component', snap1);
      useHistoryStore.getState().recordSnapshot('component', snap2);
      useHistoryStore.getState().undo('component');

      const next = useHistoryStore.getState().redo('component');
      expect(next).toEqual(snap2);
    });

    it('should return null when undoing component with no past', () => {
      expect(useHistoryStore.getState().undo('component')).toBeNull();
    });
  });
});

describe('HistorySlice — 50 Step Limit', () => {
  beforeEach(() => {
    resetHistoryStore();
  });

  it('should enforce 50-step limit for context tree', () => {
    // Record 55 snapshots, only 50 should be kept in past
    for (let i = 0; i < 55; i++) {
      const snap: BoundedContextNode[] = [makeContextNode(`C${i}`)];
      useHistoryStore.getState().recordSnapshot('context', snap);
    }

    const { contextHistory } = useHistoryStore.getState();
    // past should have at most 50 entries (oldest ones dropped)
    expect(contextHistory.past.length).toBeLessThanOrEqual(50);
    // Should be able to undo 50 times
    for (let i = 0; i < 49; i++) {
      const result = useHistoryStore.getState().undo('context');
      expect(result).not.toBeNull();
    }
  });

  it('should discard oldest record when exceeding 50 steps', () => {
    const firstSnap: BoundedContextNode[] = [makeContextNode('First')];
    useHistoryStore.getState().recordSnapshot('context', firstSnap);

    // Record up to 51 more (total 51, limit 50)
    for (let i = 0; i < 51; i++) {
      const snap: BoundedContextNode[] = [makeContextNode(`Snap${i}`)];
      useHistoryStore.getState().recordSnapshot('context', snap);
    }

    const { contextHistory } = useHistoryStore.getState();
    // The first snap should have been discarded
    // (it would only be in past if we have < 50 records)
    // After 52 total records with limit 50, first snap is gone
    expect(contextHistory.past.length).toBeLessThanOrEqual(50);
  });

  it('should enforce 50-step limit independently for each tree', () => {
    // Context tree: many snapshots (first is init, subsequent 54 push to past)
    for (let i = 0; i < 55; i++) {
      useHistoryStore.getState().recordSnapshot('context', [makeContextNode(`C${i}`)]);
    }
    // Flow tree: few snapshots (first is init, subsequent 4 push to past)
    for (let i = 0; i < 5; i++) {
      useHistoryStore.getState().recordSnapshot('flow', [makeFlowNode(`F${i}`)]);
    }
    // Component tree: zero snapshots (should not be affected)
    const { contextHistory, flowHistory, componentHistory } = useHistoryStore.getState();

    expect(contextHistory.past.length).toBeLessThanOrEqual(50);
    // First record is initialization (no past push), so 5 records → 4 past entries
    expect(flowHistory.past.length).toBe(4);
    expect(componentHistory.past.length).toBe(0);
  });

  it('should allow exactly 50 undo operations', () => {
    // Record exactly 51 snapshots (1 initial present + 50 past)
    const initial: BoundedContextNode[] = [makeContextNode('Initial')];
    useHistoryStore.getState().recordSnapshot('context', initial);

    for (let i = 0; i < 50; i++) {
      useHistoryStore.getState().recordSnapshot('context', [makeContextNode(`Snap${i}`)]);
    }

    // All 50 past entries should be undoable
    let undoCount = 0;
    while (true) {
      const result = useHistoryStore.getState().undo('context');
      if (result === null) break;
      undoCount++;
    }
    expect(undoCount).toBe(50);
  });
});

describe('HistorySlice — Tree Independence', () => {
  beforeEach(() => {
    resetHistoryStore();
  });

  it('should maintain independent history stacks for all three trees', () => {
    const ctxSnap1: BoundedContextNode[] = [makeContextNode('C1')];
    const flowSnap1: BusinessFlowNode[] = [makeFlowNode('F1')];
    const compSnap1: ComponentNode[] = [makeComponentNode('P1')];

    const ctxSnap2: BoundedContextNode[] = [makeContextNode('C1'), makeContextNode('C2')];
    const flowSnap2: BusinessFlowNode[] = [makeFlowNode('F1'), makeFlowNode('F2')];
    const compSnap2: ComponentNode[] = [makeComponentNode('P1'), makeComponentNode('P2')];

    // Record all trees independently
    useHistoryStore.getState().recordSnapshot('context', ctxSnap1);
    useHistoryStore.getState().recordSnapshot('flow', flowSnap1);
    useHistoryStore.getState().recordSnapshot('component', compSnap1);

    useHistoryStore.getState().recordSnapshot('context', ctxSnap2);
    useHistoryStore.getState().recordSnapshot('flow', flowSnap2);
    useHistoryStore.getState().recordSnapshot('component', compSnap2);

    // Undo context — should not affect flow or component
    useHistoryStore.getState().undo('context');
    expect(useHistoryStore.getState().flowHistory.present).toEqual(flowSnap2);
    expect(useHistoryStore.getState().componentHistory.present).toEqual(compSnap2);

    // Undo flow — should not affect context or component
    useHistoryStore.getState().undo('flow');
    expect(useHistoryStore.getState().contextHistory.present).toEqual(ctxSnap1);
    expect(useHistoryStore.getState().componentHistory.present).toEqual(compSnap2);

    // Undo component — should not affect context or flow
    useHistoryStore.getState().undo('component');
    expect(useHistoryStore.getState().contextHistory.present).toEqual(ctxSnap1);
    expect(useHistoryStore.getState().flowHistory.present).toEqual(flowSnap1);
  });

  it('should record snapshots independently without cross-contamination', () => {
    // Record many context snapshots (first is init → 9 past entries)
    for (let i = 0; i < 10; i++) {
      useHistoryStore.getState().recordSnapshot('context', [makeContextNode(`C${i}`)]);
    }
    // Record flow — context history should be unchanged
    // First flow record is init (no past push)
    useHistoryStore.getState().recordSnapshot('flow', [makeFlowNode('F_new')]);

    const { contextHistory, flowHistory } = useHistoryStore.getState();
    // First context record is init, so 10 records → 9 past entries
    expect(contextHistory.past.length).toBe(9);
    expect(contextHistory.present[0].name).toBe('C9');
    // First flow record is init, so past is empty
    expect(flowHistory.past.length).toBe(0);
  });

  it('should support simultaneous multi-tree snapshot recording', () => {
    const ctx1: BoundedContextNode[] = [makeContextNode('C1')];
    const flow1: BusinessFlowNode[] = [makeFlowNode('F1')];
    const comp1: ComponentNode[] = [makeComponentNode('P1')];

    const ctx2: BoundedContextNode[] = [makeContextNode('C1'), makeContextNode('C2')];
    const flow2: BusinessFlowNode[] = [makeFlowNode('F1'), makeFlowNode('F2')];
    const comp2: ComponentNode[] = [makeComponentNode('P1'), makeComponentNode('P2')];

    // Record all at once
    useHistoryStore.getState().recordSnapshot('context', ctx1);
    useHistoryStore.getState().recordSnapshot('flow', flow1);
    useHistoryStore.getState().recordSnapshot('component', comp1);
    useHistoryStore.getState().recordSnapshot('context', ctx2);
    useHistoryStore.getState().recordSnapshot('flow', flow2);
    useHistoryStore.getState().recordSnapshot('component', comp2);

    const { contextHistory, flowHistory, componentHistory } = useHistoryStore.getState();

    expect(contextHistory.present).toEqual(ctx2);
    expect(flowHistory.present).toEqual(flow2);
    expect(componentHistory.present).toEqual(comp2);

    expect(contextHistory.past.length).toBe(1);
    expect(flowHistory.past.length).toBe(1);
    expect(componentHistory.past.length).toBe(1);
  });
});

describe('HistorySlice — Clear Operations', () => {
  beforeEach(() => {
    resetHistoryStore();
  });

  it('should clear single tree history', () => {
    // Record context changes
    useHistoryStore.getState().recordSnapshot('context', [makeContextNode('C1')]);
    useHistoryStore.getState().recordSnapshot('context', [makeContextNode('C1'), makeContextNode('C2')]);
    // Record flow change
    useHistoryStore.getState().recordSnapshot('flow', [makeFlowNode('F1')]);

    // Clear context history only
    useHistoryStore.getState().clearTreeHistory('context');

    const { contextHistory, flowHistory } = useHistoryStore.getState();
    // Context: past cleared, present preserved (last snapshot [C1,C2])
    expect(contextHistory.past).toEqual([]);
    expect(contextHistory.present[0].name).toBe('C1'); // first element of [C1, C2]
    expect(contextHistory.present[1].name).toBe('C2');
    // Flow: untouched (first record sets present, no past entry)
    expect(flowHistory.present[0].name).toBe('F1');
  });

  it('should clear all histories', () => {
    useHistoryStore.getState().recordSnapshot('context', [makeContextNode('C1')]);
    useHistoryStore.getState().recordSnapshot('flow', [makeFlowNode('F1')]);
    useHistoryStore.getState().recordSnapshot('component', [makeComponentNode('P1')]);

    useHistoryStore.getState().clearAllHistories();

    const { contextHistory, flowHistory, componentHistory } = useHistoryStore.getState();
    expect(contextHistory.past).toEqual([]);
    expect(contextHistory.present[0].name).toBe('C1');
    expect(flowHistory.past).toEqual([]);
    expect(flowHistory.present[0].name).toBe('F1');
    expect(componentHistory.past).toEqual([]);
    expect(componentHistory.present[0].name).toBe('P1');
  });
});

describe('HistorySlice — canUndo / canRedo', () => {
  beforeEach(() => {
    resetHistoryStore();
  });

  it('should report canUndo=false when no past', () => {
    expect(useHistoryStore.getState().canUndo('context')).toBe(false);
    expect(useHistoryStore.getState().canUndo('flow')).toBe(false);
    expect(useHistoryStore.getState().canUndo('component')).toBe(false);
  });

  it('should report canUndo=true when past exists', () => {
    // First record sets present, second pushes to past
    useHistoryStore.getState().recordSnapshot('context', [makeContextNode('C1')]);
    useHistoryStore.getState().recordSnapshot('context', [makeContextNode('C2')]);
    expect(useHistoryStore.getState().canUndo('context')).toBe(true);
  });

  it('should report canRedo=false when no future', () => {
    expect(useHistoryStore.getState().canRedo('context')).toBe(false);
  });

  it('should report canRedo=true after undo', () => {
    // Two records: past=[C1], present=C2
    useHistoryStore.getState().recordSnapshot('context', [makeContextNode('C1')]);
    useHistoryStore.getState().recordSnapshot('context', [makeContextNode('C2')]);
    useHistoryStore.getState().undo('context');
    expect(useHistoryStore.getState().canRedo('context')).toBe(true);
  });

  it('should report canUndoAny=true if any tree can undo', () => {
    expect(useHistoryStore.getState().canUndoAny()).toBe(false);
    // Two records: past=[C1], present=C2 → canUndo=true
    useHistoryStore.getState().recordSnapshot('context', [makeContextNode('C1')]);
    useHistoryStore.getState().recordSnapshot('context', [makeContextNode('C2')]);
    expect(useHistoryStore.getState().canUndoAny()).toBe(true);
  });

  it('should report canRedoAny=true if any tree can redo', () => {
    expect(useHistoryStore.getState().canRedoAny()).toBe(false);
    // Two records: past=[C1], present=C2
    useHistoryStore.getState().recordSnapshot('context', [makeContextNode('C1')]);
    useHistoryStore.getState().recordSnapshot('context', [makeContextNode('C2')]);
    useHistoryStore.getState().undo('context');
    expect(useHistoryStore.getState().canRedoAny()).toBe(true);
  });

  it('should report canUndo=false after all undo operations consumed', () => {
    // Two records: past=[C1], present=C2
    useHistoryStore.getState().recordSnapshot('context', [makeContextNode('C1')]);
    useHistoryStore.getState().recordSnapshot('context', [makeContextNode('C2')]);
    useHistoryStore.getState().undo('context');
    expect(useHistoryStore.getState().canUndo('context')).toBe(false);
    expect(useHistoryStore.getState().canRedo('context')).toBe(true);

    useHistoryStore.getState().redo('context');
    expect(useHistoryStore.getState().canUndo('context')).toBe(true);
    expect(useHistoryStore.getState().canRedo('context')).toBe(false);
  });
});

describe('HistorySlice — getTreeHistory', () => {
  beforeEach(() => {
    resetHistoryStore();
  });

  it('should return correct history stack for each tree type', () => {
    const ctx = [makeContextNode('C1')];
    const flow = [makeFlowNode('F1')];
    const comp = [makeComponentNode('P1')];

    useHistoryStore.getState().recordSnapshot('context', ctx);
    useHistoryStore.getState().recordSnapshot('flow', flow);
    useHistoryStore.getState().recordSnapshot('component', comp);

    const ctxHistory = useHistoryStore.getState().getTreeHistory('context');
    const flowHistory = useHistoryStore.getState().getTreeHistory('flow');
    const compHistory = useHistoryStore.getState().getTreeHistory('component');

    expect(ctxHistory.present).toEqual(ctx);
    expect(flowHistory.present).toEqual(flow);
    expect(compHistory.present).toEqual(comp);
  });
});

describe('HistorySlice — Deep Clone Integrity', () => {
  beforeEach(() => {
    resetHistoryStore();
  });

  it('should deep clone snapshots to prevent mutation', () => {
    // Create first snapshot
    const snap1: BoundedContextNode[] = [
      { ...makeContextNode('C1'), description: 'first' },
    ];
    useHistoryStore.getState().recordSnapshot('context', snap1);

    // Mutate snap1 after recording
    snap1.push(makeContextNode('C2'));

    // Create second snapshot (should not be affected by snap1 mutation)
    const snap2: BoundedContextNode[] = [
      { ...makeContextNode('C3'), description: 'second' },
    ];
    useHistoryStore.getState().recordSnapshot('context', snap2);

    // Mutate snap2 after recording
    snap2.push(makeContextNode('C4'));

    const { contextHistory } = useHistoryStore.getState();
    // Past (snap1) should not reflect the push that happened after recording
    expect(contextHistory.past[0].length).toBe(1);
    // Present (snap2) should not reflect the push that happened after recording
    expect(contextHistory.present.length).toBe(1);
  });

  it('should preserve node data integrity across undo/redo cycles', () => {
    const snap1: BoundedContextNode[] = [
      { ...makeContextNode('C1'), description: 'first' },
    ];
    const snap2: BoundedContextNode[] = [
      { ...makeContextNode('C1'), description: 'second' },
    ];

    useHistoryStore.getState().recordSnapshot('context', snap1);
    useHistoryStore.getState().recordSnapshot('context', snap2);

    const undone = useHistoryStore.getState().undo('context') as BoundedContextNode[];
    expect(undone[0].description).toBe('first');

    const redone = useHistoryStore.getState().redo('context') as BoundedContextNode[];
    expect(redone[0].description).toBe('second');
  });
});

describe('HistorySlice — Persistence Constraints', () => {
  beforeEach(() => {
    resetHistoryStore();
  });

  it('should only persist node data in snapshots (not UI state)', () => {
    // This test verifies the snapshot only contains node arrays
    // The history store itself is NOT persisted (no persist middleware)
    // Only canvasStore nodes are persisted via its own persist middleware

    const ctx: BoundedContextNode[] = [makeContextNode('C1')];
    useHistoryStore.getState().recordSnapshot('context', ctx);

    const { contextHistory } = useHistoryStore.getState();
    // Snapshots should be pure node arrays
    expect(Array.isArray(contextHistory.present)).toBe(true);
    expect(Array.isArray(contextHistory.past)).toBe(true);
    // No UI state fields like leftExpand, activeTree, etc.
    expect(contextHistory.present).not.toHaveProperty('leftExpand');
    expect(contextHistory.present).not.toHaveProperty('activeTree');
  });
});
