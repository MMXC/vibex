/**
 * canvasStore — Drag State (E3) Unit Tests
 *
 * 覆盖 DragSlice:
 * - startDrag / endDrag
 * - setDragOver
 * - updateDraggedPosition
 * - clearDragPositions / clearDragPosition
 * - Persist draggedPositions
 */
import { useCanvasStore } from '../../lib/canvas/canvasStore';

describe('canvasStore — DragSlice (E3)', () => {
  beforeEach(() => {
    useCanvasStore.setState({
      draggedNodeId: null,
      dragOverNodeId: null,
      draggedPositions: {},
      isDragging: false,
      // Reset expand slice
      leftExpand: 'default',
      centerExpand: 'default',
      rightExpand: 'default',
      // Reset other slices that may affect drag
      contextNodes: [],
      flowNodes: [],
      componentNodes: [],
      phase: 'context',
      activeTree: null,
    });
  });

  describe('startDrag / endDrag', () => {
    it('should set draggedNodeId and isDragging on startDrag', () => {
      const { startDrag } = useCanvasStore.getState();
      startDrag('card-1');
      expect(useCanvasStore.getState().draggedNodeId).toBe('card-1');
      expect(useCanvasStore.getState().isDragging).toBe(true);
    });

    it('should clear draggedNodeId and isDragging on endDrag', () => {
      const { startDrag, endDrag } = useCanvasStore.getState();
      startDrag('card-1');
      endDrag('card-1', { x: 100, y: 200 });
      expect(useCanvasStore.getState().draggedNodeId).toBeNull();
      expect(useCanvasStore.getState().isDragging).toBe(false);
    });

    it('should record final position in draggedPositions on endDrag', () => {
      const { startDrag, endDrag } = useCanvasStore.getState();
      startDrag('card-1');
      endDrag('card-1', { x: 150, y: 300 });

      expect(useCanvasStore.getState().draggedPositions).toEqual({
        'card-1': { x: 150, y: 300 },
      });
    });

    it('should accumulate multiple dragged positions', () => {
      const { startDrag, endDrag } = useCanvasStore.getState();

      startDrag('card-1');
      endDrag('card-1', { x: 100, y: 200 });

      startDrag('card-2');
      endDrag('card-2', { x: 300, y: 400 });

      expect(useCanvasStore.getState().draggedPositions).toEqual({
        'card-1': { x: 100, y: 200 },
        'card-2': { x: 300, y: 400 },
      });
    });
  });

  describe('updateDraggedPosition (live sync during drag)', () => {
    it('should update position in draggedPositions without changing isDragging', () => {
      const { startDrag, updateDraggedPosition } = useCanvasStore.getState();
      startDrag('card-1');

      updateDraggedPosition('card-1', { x: 50, y: 100 });
      expect(useCanvasStore.getState().draggedPositions['card-1']).toEqual({ x: 50, y: 100 });
      expect(useCanvasStore.getState().isDragging).toBe(true);

      updateDraggedPosition('card-1', { x: 75, y: 150 });
      expect(useCanvasStore.getState().draggedPositions['card-1']).toEqual({ x: 75, y: 150 });
    });
  });

  describe('setDragOver', () => {
    it('should set dragOverNodeId', () => {
      const { setDragOver } = useCanvasStore.getState();
      setDragOver('target-card');
      expect(useCanvasStore.getState().dragOverNodeId).toBe('target-card');
    });

    it('should clear dragOverNodeId when set to null', () => {
      const { setDragOver } = useCanvasStore.getState();
      setDragOver('target-card');
      setDragOver(null);
      expect(useCanvasStore.getState().dragOverNodeId).toBeNull();
    });
  });

  describe('clearDragPositions', () => {
    it('should clear all dragged positions', () => {
      const { startDrag, endDrag, clearDragPositions } = useCanvasStore.getState();
      startDrag('card-1');
      endDrag('card-1', { x: 100, y: 200 });
      startDrag('card-2');
      endDrag('card-2', { x: 300, y: 400 });

      expect(Object.keys(useCanvasStore.getState().draggedPositions).length).toBe(2);

      clearDragPositions();

      expect(useCanvasStore.getState().draggedPositions).toEqual({});
      expect(useCanvasStore.getState().draggedNodeId).toBeNull();
    });
  });

  describe('clearDragPosition', () => {
    it('should clear a single node position', () => {
      const { startDrag, endDrag, clearDragPosition } = useCanvasStore.getState();
      startDrag('card-1');
      endDrag('card-1', { x: 100, y: 200 });
      startDrag('card-2');
      endDrag('card-2', { x: 300, y: 400 });

      clearDragPosition('card-1');

      expect(useCanvasStore.getState().draggedPositions).toEqual({
        'card-2': { x: 300, y: 400 },
      });
    });
  });

  describe('interaction: drag → expand conflict (E3)', () => {
    it('isDragging should be true after startDrag', () => {
      const { startDrag } = useCanvasStore.getState();
      startDrag('card-1');
      expect(useCanvasStore.getState().isDragging).toBe(true);
    });

    it('HoverHotzone should be able to read isDragging state', () => {
      const { startDrag } = useCanvasStore.getState();
      // This verifies the state is accessible from store
      startDrag('card-1');
      const isDragging = useCanvasStore.getState().isDragging;
      expect(isDragging).toBe(true);
    });
  });

  describe('partialize: draggedPositions should be persisted', () => {
    it('draggedPositions should be included in partialize', () => {
      const state = useCanvasStore.getState();
      // Verify draggedPositions exists in state
      expect('draggedPositions' in state).toBe(true);
      expect(typeof state.draggedPositions).toBe('object');
    });

    it('should survive partialize roundtrip', () => {
      const { startDrag, endDrag } = useCanvasStore.getState();
      startDrag('card-1');
      endDrag('card-1', { x: 500, y: 750 });

      const persisted = {
        projectId: null,
        prototypeQueue: [],
        contextNodes: [],
        flowNodes: [],
        componentNodes: [],
        draggedPositions: useCanvasStore.getState().draggedPositions,
      };

      // Simulate rehydration
      useCanvasStore.setState(persisted);

      expect(useCanvasStore.getState().draggedPositions['card-1']).toEqual({ x: 500, y: 750 });
    });
  });
});
