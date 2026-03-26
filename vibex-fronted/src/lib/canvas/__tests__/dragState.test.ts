/**
 * dragState.test.ts — Unit tests for DragState slice (E3)
 *
 * Epic E3: vibex-canvas-expandable-20260327
 * Tests: startDrag, endDrag, setDragOver, updateDraggedPosition,
 *        clearDragPositions, clearDragPosition, draggedPositions persistence
 *
 * References:
 *   AGENTS.md § Dev Constraints — "单元测试路径: src/lib/canvas/__tests__/dragState.test.ts"
 */

import { useCanvasStore } from '@/lib/canvas/canvasStore';

describe('DragState (E3)', () => {
  beforeEach(() => {
    // Reset store — clear all drag state
    useCanvasStore.getState().clearDragPositions();
    // Reset all drag fields to known initial state
    useCanvasStore.setState({
      draggedNodeId: null,
      dragOverNodeId: null,
      draggedPositions: {},
      isDragging: false,
    });
  });

  afterEach(() => {
    useCanvasStore.getState().clearDragPositions();
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('has no dragged node id', () => {
      expect(useCanvasStore.getState().draggedNodeId).toBeNull();
    });

    it('has no drag-over node id', () => {
      expect(useCanvasStore.getState().dragOverNodeId).toBeNull();
    });

    it('has no dragged positions', () => {
      expect(Object.keys(useCanvasStore.getState().draggedPositions)).toHaveLength(0);
    });

    it('isDragging is false', () => {
      expect(useCanvasStore.getState().isDragging).toBe(false);
    });
  });

  // ── startDrag ─────────────────────────────────────────────────────────────

  describe('startDrag', () => {
    it('sets draggedNodeId and isDragging=true', () => {
      const { startDrag } = useCanvasStore.getState();
      startDrag('card-node-1');

      const state = useCanvasStore.getState();
      expect(state.draggedNodeId).toBe('card-node-1');
      expect(state.isDragging).toBe(true);
    });

    it('can change dragged node by calling startDrag again', () => {
      const { startDrag } = useCanvasStore.getState();
      startDrag('card-node-1');
      startDrag('card-node-2');

      expect(useCanvasStore.getState().draggedNodeId).toBe('card-node-2');
    });
  });

  // ── endDrag ───────────────────────────────────────────────────────────────

  describe('endDrag', () => {
    it('saves position and clears draggedNodeId + isDragging', () => {
      const { startDrag, endDrag } = useCanvasStore.getState();
      startDrag('card-node-1');

      endDrag('card-node-1', { x: 200, y: 400 });

      const state = useCanvasStore.getState();
      expect(state.draggedNodeId).toBeNull();
      expect(state.isDragging).toBe(false);
      expect(state.draggedPositions['card-node-1']).toEqual({ x: 200, y: 400 });
    });

    it('preserves positions of other nodes when ending drag', () => {
      const { endDrag } = useCanvasStore.getState();

      // Simulate multiple nodes have been dragged before
      useCanvasStore.setState({
        draggedPositions: {
          'card-node-0': { x: 100, y: 100 },
        },
      });

      endDrag('card-node-1', { x: 300, y: 500 });

      const positions = useCanvasStore.getState().draggedPositions;
      expect(positions['card-node-0']).toEqual({ x: 100, y: 100 });
      expect(positions['card-node-1']).toEqual({ x: 300, y: 500 });
    });

    it('overwrites previous position for the same node', () => {
      const { endDrag } = useCanvasStore.getState();

      endDrag('card-node-1', { x: 100, y: 200 });
      endDrag('card-node-1', { x: 300, y: 400 });

      const positions = useCanvasStore.getState().draggedPositions;
      expect(Object.keys(positions)).toHaveLength(1);
      expect(positions['card-node-1']).toEqual({ x: 300, y: 400 });
    });
  });

  // ── updateDraggedPosition ─────────────────────────────────────────────────

  describe('updateDraggedPosition', () => {
    it('updates position of a specific node during drag', () => {
      const { updateDraggedPosition } = useCanvasStore.getState();

      updateDraggedPosition('card-node-1', { x: 150, y: 250 });
      updateDraggedPosition('card-node-2', { x: 350, y: 450 });

      const positions = useCanvasStore.getState().draggedPositions;
      expect(positions['card-node-1']).toEqual({ x: 150, y: 250 });
      expect(positions['card-node-2']).toEqual({ x: 350, y: 450 });
    });

    it('overwrites previous position for the same node', () => {
      const { updateDraggedPosition } = useCanvasStore.getState();

      updateDraggedPosition('card-node-1', { x: 100, y: 100 });
      updateDraggedPosition('card-node-1', { x: 200, y: 200 });

      expect(useCanvasStore.getState().draggedPositions['card-node-1']).toEqual({ x: 200, y: 200 });
    });
  });

  // ── setDragOver ───────────────────────────────────────────────────────────

  describe('setDragOver', () => {
    it('sets dragOverNodeId', () => {
      const { setDragOver } = useCanvasStore.getState();
      setDragOver('target-node');

      expect(useCanvasStore.getState().dragOverNodeId).toBe('target-node');
    });

    it('can set dragOverNodeId to null', () => {
      const { setDragOver } = useCanvasStore.getState();
      setDragOver('target-node');
      setDragOver(null);

      expect(useCanvasStore.getState().dragOverNodeId).toBeNull();
    });
  });

  // ── clearDragPositions ───────────────────────────────────────────────────

  describe('clearDragPositions', () => {
    it('resets all drag state and positions', () => {
      const { startDrag, endDrag, clearDragPositions } = useCanvasStore.getState();

      // Set up some state
      startDrag('card-node-1');
      endDrag('card-node-1', { x: 100, y: 200 });
      useCanvasStore.setState({ dragOverNodeId: 'target-node' });

      clearDragPositions();

      const state = useCanvasStore.getState();
      expect(state.draggedNodeId).toBeNull();
      expect(state.dragOverNodeId).toBeNull();
      expect(Object.keys(state.draggedPositions)).toHaveLength(0);
      expect(state.isDragging).toBe(false);
    });
  });

  // ── clearDragPosition ─────────────────────────────────────────────────────

  describe('clearDragPosition', () => {
    it('removes position for a specific node', () => {
      const { endDrag, clearDragPosition } = useCanvasStore.getState();

      endDrag('card-node-1', { x: 100, y: 200 });
      endDrag('card-node-2', { x: 300, y: 400 });

      clearDragPosition('card-node-1');

      const positions = useCanvasStore.getState().draggedPositions;
      expect(positions['card-node-1']).toBeUndefined();
      expect(positions['card-node-2']).toEqual({ x: 300, y: 400 });
    });

    it('does nothing for non-existent node', () => {
      const { clearDragPosition } = useCanvasStore.getState();
      expect(() => clearDragPosition('non-existent')).not.toThrow();
    });
  });

  // ── Persist via partialize ────────────────────────────────────────────────
  // The draggedPositions are included in the store's partialize config,
  // meaning they survive page refresh. We verify the store shape matches
  // what partialize expects.

  describe('partialize compatibility', () => {
    it('draggedPositions is a plain object (JSON-serializable)', () => {
      const { draggedPositions } = useCanvasStore.getState();

      // Should be serializable to JSON (no class instances, no functions)
      expect(() => JSON.stringify(draggedPositions)).not.toThrow();
    });

    it('can store many nodes with positions', () => {
      const { updateDraggedPosition } = useCanvasStore.getState();

      for (let i = 0; i < 10; i++) {
        updateDraggedPosition(`card-node-${i}`, { x: i * 100, y: i * 200 });
      }

      const positions = useCanvasStore.getState().draggedPositions;
      expect(Object.keys(positions)).toHaveLength(10);
    });
  });

  // ── Full drag lifecycle ───────────────────────────────────────────────────

  describe('full drag lifecycle', () => {
    it('complete cycle: start → drag → end → clear', () => {
      // Zustand: always get fresh state reference for assertions
      const get = () => useCanvasStore.getState();

      // 1. Start drag
      useCanvasStore.getState().startDrag('card-node-1');
      expect(get().draggedNodeId).toBe('card-node-1');
      expect(get().isDragging).toBe(true);

      // 2. Update position during drag
      useCanvasStore.getState().updateDraggedPosition('card-node-1', { x: 50, y: 100 });
      useCanvasStore.getState().updateDraggedPosition('card-node-1', { x: 100, y: 200 });
      expect(get().draggedPositions['card-node-1']).toEqual({ x: 100, y: 200 });

      // 3. Set drop target
      useCanvasStore.getState().setDragOver('card-node-2');
      expect(get().dragOverNodeId).toBe('card-node-2');

      // 4. End drag
      useCanvasStore.getState().endDrag('card-node-1', { x: 100, y: 200 });
      expect(get().draggedNodeId).toBeNull();
      expect(get().isDragging).toBe(false);
      expect(get().dragOverNodeId).toBe('card-node-2'); // dragOverNodeId persists after endDrag

      // 5. Clear all
      useCanvasStore.getState().clearDragPositions();
      expect(get().draggedNodeId).toBeNull();
      expect(get().dragOverNodeId).toBeNull();
      expect(Object.keys(get().draggedPositions)).toHaveLength(0);
    });
  });
});
