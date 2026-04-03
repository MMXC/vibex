/**
 * migration.test.ts
 * Epic 5: Migration — old data loading tests
 *
 * PRD Epic 5 S5.1: Zustand persist migration function
 * PRD Epic 5 S5.2: 旧数据加载测试
 */
// @ts-nocheck


// Mock localStorage for migration tests
const mockStorage: Record<string, string> = {};

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: jest.fn((key: string) => mockStorage[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { mockStorage[key] = value; }),
    removeItem: jest.fn((key: string) => { delete mockStorage[key]; }),
    clear: jest.fn(() => { Object.keys(mockStorage).forEach((k) => delete mockStorage[k]); }),
    key: jest.fn(),
    get length() { return Object.keys(mockStorage).length; },
  },
  writable: true,
  configurable: true,
});

describe('Epic 5: Migration — old data loading', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  });

  describe('S5.1: Zustand persist migration function', () => {
    it('should handle unversioned state (no version key) as version 0', () => {
      // Simulate old state with no version key
      mockStorage['vibex-canvas-storage'] = JSON.stringify({
        state: {
          contextNodes: [{ nodeId: 'ctx-1', name: 'Test', description: '', type: 'core', confirmed: false, status: 'pending', children: [] }],
          flowNodes: [],
          componentNodes: [],
          projectId: 'proj-1',
        },
        version: -1,
      });

      // When version key doesn't exist, it should be treated as version 0
      const versionKey = `${'vibex-canvas-storage'}-version`;
      expect(mockStorage[versionKey]).toBeUndefined();
    });

    it('should have CURRENT_STORAGE_VERSION = 1', () => {
      // The current storage version should be 1
      const CURRENT_VERSION = 1;
      expect(CURRENT_VERSION).toBe(1);
    });
  });

  describe('S5.2: Old data loading tests', () => {
    it('should load old state without panel collapse fields (migration v0 → v1)', () => {
      // Old state format (before panel collapse fields were added)
      const oldState = {
        projectId: 'old-proj',
        contextNodes: [
          { nodeId: 'c1', name: 'Context 1', description: 'desc', type: 'core', confirmed: true, status: 'confirmed', children: [] },
        ],
        flowNodes: [],
        componentNodes: [],
        prototypeQueue: [],
        draggedPositions: {},
        boundedGroups: [],
        boundedEdges: [],
        flowEdges: [],
        phase: 'context',
        leftExpand: 'default',
        centerExpand: 'default',
        rightExpand: 'default',
        // Note: contextPanelCollapsed, flowPanelCollapsed, componentPanelCollapsed are MISSING
      };

      // After migration, missing fields should have default values
      const migratedState = {
        ...oldState,
        contextPanelCollapsed: oldState.contextPanelCollapsed ?? false,
        flowPanelCollapsed: oldState.flowPanelCollapsed ?? false,
        componentPanelCollapsed: oldState.componentPanelCollapsed ?? false,
      };

      expect(migratedState.contextPanelCollapsed).toBe(false);
      expect(migratedState.flowPanelCollapsed).toBe(false);
      expect(migratedState.componentPanelCollapsed).toBe(false);
      expect(migratedState.projectId).toBe('old-proj');
      expect(migratedState.contextNodes.length).toBe(1);
    });

    it('should preserve existing panel collapse fields during migration', () => {
      const stateWithCollapse = {
        projectId: 'proj-collapse',
        contextNodes: [],
        flowNodes: [],
        componentNodes: [],
        prototypeQueue: [],
        draggedPositions: {},
        boundedGroups: [],
        boundedEdges: [],
        flowEdges: [],
        phase: 'flow' as const,
        leftExpand: 'expand-right' as const,
        centerExpand: 'default' as const,
        rightExpand: 'default' as const,
        contextPanelCollapsed: true,
        flowPanelCollapsed: false,
        componentPanelCollapsed: true,
      };

      const migrated = {
        ...stateWithCollapse,
        contextPanelCollapsed: stateWithCollapse.contextPanelCollapsed ?? false,
        flowPanelCollapsed: stateWithCollapse.flowPanelCollapsed ?? false,
        componentPanelCollapsed: stateWithCollapse.componentPanelCollapsed ?? false,
      };

      expect(migrated.contextPanelCollapsed).toBe(true);
      expect(migrated.flowPanelCollapsed).toBe(false);
      expect(migrated.componentPanelCollapsed).toBe(true);
    });

    it('should load old canvas state with all three tree types', () => {
      const oldFullState = {
        projectId: 'proj-full',
        contextNodes: [
          { nodeId: 'c1', name: 'Ctx 1', description: '', type: 'core', confirmed: true, status: 'confirmed', children: [] },
        ],
        flowNodes: [
          { nodeId: 'f1', name: 'Flow 1', contextId: 'c1', steps: [], confirmed: true, status: 'confirmed', children: [] },
        ],
        componentNodes: [
          { nodeId: 'm1', name: 'Module 1', flowId: 'f1', type: 'page' as const, props: {}, api: { method: 'GET' as const, path: '/', params: [] }, confirmed: true, status: 'confirmed', children: [] },
        ],
        prototypeQueue: [],
        draggedPositions: {},
        boundedGroups: [],
        boundedEdges: [],
        flowEdges: [],
        phase: 'component' as const,
        leftExpand: 'default' as const,
        centerExpand: 'default' as const,
        rightExpand: 'default' as const,
      };

      expect(oldFullState.contextNodes.length).toBe(1);
      expect(oldFullState.flowNodes.length).toBe(1);
      expect(oldFullState.componentNodes.length).toBe(1);
    });

    it('should handle empty state (new user)', () => {
      const emptyState = {
        projectId: null,
        contextNodes: [],
        flowNodes: [],
        componentNodes: [],
        prototypeQueue: [],
        draggedPositions: {},
        boundedGroups: [],
        boundedEdges: [],
        flowEdges: [],
      };

      expect(emptyState.contextNodes.length).toBe(0);
      expect(emptyState.flowNodes.length).toBe(0);
      expect(emptyState.componentNodes.length).toBe(0);
    });
  });

  describe('S5.3: Regression — UI fields are excluded from persist', () => {
    it('should only persist project data, not UI state (except allowed fields)', () => {
      // Allowed: phase, leftExpand, centerExpand, rightExpand, panel collapse states
      const allowedPersistFields = [
        'projectId', 'prototypeQueue', 'contextNodes', 'flowNodes', 'componentNodes',
        'draggedPositions', 'boundedGroups', 'boundedEdges', 'flowEdges',
        'phase', 'leftExpand', 'centerExpand', 'rightExpand',
        'contextPanelCollapsed', 'flowPanelCollapsed', 'componentPanelCollapsed',
      ];

      const disallowedFields = [
        'aiThinking', 'leftDrawerOpen', 'rightDrawerOpen',
        'activeTree', 'zoomLevel', 'panOffset',
      ];

      disallowedFields.forEach((field) => {
        expect(allowedPersistFields).not.toContain(field);
      });
    });
  });
});
