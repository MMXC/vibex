/**
 * exampleData.test.ts — Unit tests for loadExampleData (F-1.1 ~ F-1.3)
 *
 * Epic: vibex-canvas-analysis / dev-epic1
 * Tests: loadExampleData sets all three trees + advances phase,
 *        all nodes confirmed, ProjectBar button enabled/disabled correctly
 */
// @ts-nocheck


import { useCanvasStore } from '@/lib/canvas/canvasStore';
import { areAllConfirmed } from '@/lib/canvas/cascade';

describe('loadExampleData (F-1.1 ~ F-1.3)', () => {
  beforeEach(() => {
    // Reset store to known state
    const store = useCanvasStore.getState();
    store.clearDragPositions();
    store.clearBoundedGroups();
    store.clearCanvasData?.();
    useCanvasStore.setState({
      contextNodes: [],
      flowNodes: [],
      componentNodes: [],
      phase: 'input',
    });
  });

  // ── F-1.1: example-canvas.json has complete three-tree structure ────────────

  describe('F-1.1: example-canvas.json structure', () => {
    it('example data file exports non-empty arrays', async () => {
      // Dynamic import to test the actual file
      const data = await import('@/data/example-canvas.json');
      expect(data.contextNodes).toBeDefined();
      expect(data.flowNodes).toBeDefined();
      expect(data.componentNodes).toBeDefined();
    });

    it('context nodes are non-empty', async () => {
      const data = await import('@/data/example-canvas.json');
      expect(data.contextNodes.length).toBeGreaterThan(0);
    });

    it('flow nodes are non-empty', async () => {
      const data = await import('@/data/example-canvas.json');
      expect(data.flowNodes.length).toBeGreaterThan(0);
    });

    it('component nodes are non-empty', async () => {
      const data = await import('@/data/example-canvas.json');
      expect(data.componentNodes.length).toBeGreaterThan(0);
    });

    it('all context nodes have confirmed=true (raw JSON uses confirmed field)', async () => {
      const data = await import('@/data/example-canvas.json');
      const allConfirmed = data.contextNodes.every((n) => n.confirmed === true);
      expect(allConfirmed).toBe(true);
    });

    it('all flow nodes have confirmed=true (raw JSON uses confirmed field)', async () => {
      const data = await import('@/data/example-canvas.json');
      const allConfirmed = data.flowNodes.every((n) => n.confirmed === true);
      expect(allConfirmed).toBe(true);
    });

    it('all component nodes have confirmed=true (raw JSON uses confirmed field)', async () => {
      const data = await import('@/data/example-canvas.json');
      const allConfirmed = data.componentNodes.every((n) => n.confirmed === true);
      expect(allConfirmed).toBe(true);
    });

    it('all nodes have status=confirmed', async () => {
      const data = await import('@/data/example-canvas.json');
      const allConfirmed = [
        ...data.contextNodes,
        ...data.flowNodes,
        ...data.componentNodes,
      ].every((n: { status: string }) => n.status === 'confirmed');
      expect(allConfirmed).toBe(true);
    });
  });

  // ── F-1.2: loadExampleData action sets all three trees ────────────────────

  describe('F-1.2: loadExampleData sets all three trees', () => {
    it('loadExampleData populates contextNodes', () => {
      useCanvasStore.getState().loadExampleData();
      const { contextNodes } = useCanvasStore.getState();
      expect(contextNodes.length).toBeGreaterThan(0);
    });

    it('loadExampleData populates flowNodes', () => {
      useCanvasStore.getState().loadExampleData();
      const { flowNodes } = useCanvasStore.getState();
      expect(flowNodes.length).toBeGreaterThan(0);
    });

    it('loadExampleData populates componentNodes', () => {
      useCanvasStore.getState().loadExampleData();
      const { componentNodes } = useCanvasStore.getState();
      expect(componentNodes.length).toBeGreaterThan(0);
    });

    it('loadExampleData advances phase to context', () => {
      useCanvasStore.getState().loadExampleData();
      const { phase } = useCanvasStore.getState();
      expect(phase).toBe('context');
    });

    it('loaded context nodes are all confirmed', () => {
      useCanvasStore.getState().loadExampleData();
      const { contextNodes } = useCanvasStore.getState();
      expect(areAllConfirmed(contextNodes)).toBe(true);
    });

    it('loaded flow nodes are all confirmed', () => {
      useCanvasStore.getState().loadExampleData();
      const { flowNodes } = useCanvasStore.getState();
      expect(areAllConfirmed(flowNodes)).toBe(true);
    });

    it('loaded component nodes are all confirmed', () => {
      useCanvasStore.getState().loadExampleData();
      const { componentNodes } = useCanvasStore.getState();
      expect(areAllConfirmed(componentNodes)).toBe(true);
    });

    it('flow nodes have steps with isActive set after migration', () => {
      useCanvasStore.getState().loadExampleData();
      const { flowNodes } = useCanvasStore.getState();
      for (const flow of flowNodes) {
        expect(flow.steps.length).toBeGreaterThan(0);
        expect(flow.steps.every((s) => s.isActive !== false)).toBe(true);
      }
    });
  });

  // ── F-1.3: ProjectBar areAllConfirmed condition ────────────────────────────

  describe('F-1.3: ProjectBar areAllConfirmed condition', () => {
    it('areAllConfirmed returns true when all trees have confirmed nodes', () => {
      useCanvasStore.getState().loadExampleData();
      const { contextNodes, flowNodes, componentNodes } = useCanvasStore.getState();

      const allConfirmed =
        areAllConfirmed(contextNodes) &&
        areAllConfirmed(flowNodes) &&
        areAllConfirmed(componentNodes) &&
        contextNodes.length > 0 &&
        flowNodes.length > 0 &&
        componentNodes.length > 0;

      expect(allConfirmed).toBe(true);
    });

    it('areAllConfirmed returns false when contextNodes is empty', () => {
      useCanvasStore.setState({
        contextNodes: [],
        flowNodes: [{ nodeId: 'f1', name: 'Flow', steps: [], isActive: true, status: 'confirmed', children: [] }],
        componentNodes: [{ nodeId: 'c1', name: 'Comp', type: 'page', props: {}, api: { method: 'GET', path: '/', params: [] }, children: [], isActive: true, status: 'confirmed' }],
      });

      const { contextNodes, flowNodes, componentNodes } = useCanvasStore.getState();
      const allConfirmed =
        areAllConfirmed(contextNodes) &&
        areAllConfirmed(flowNodes) &&
        areAllConfirmed(componentNodes) &&
        contextNodes.length > 0 &&
        flowNodes.length > 0 &&
        componentNodes.length > 0;

      expect(allConfirmed).toBe(false);
    });

    it('areAllConfirmed returns false when a node is not active', () => {
      useCanvasStore.setState({
        contextNodes: [{ nodeId: 'c1', name: 'Ctx', description: '', type: 'core', isActive: false, status: 'pending', children: [] }],
        flowNodes: [{ nodeId: 'f1', name: 'Flow', steps: [], isActive: true, status: 'confirmed', children: [] }],
        componentNodes: [{ nodeId: 'c2', name: 'Comp', type: 'page', props: {}, api: { method: 'GET', path: '/', params: [] }, children: [], isActive: true, status: 'confirmed' }],
      });

      const { contextNodes, flowNodes, componentNodes } = useCanvasStore.getState();
      const allConfirmed =
        areAllConfirmed(contextNodes) &&
        areAllConfirmed(flowNodes) &&
        areAllConfirmed(componentNodes) &&
        contextNodes.length > 0 &&
        flowNodes.length > 0 &&
        componentNodes.length > 0;

      expect(allConfirmed).toBe(false);
    });
  });
});
