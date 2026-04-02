/**
 * uiStore unit tests — Epic 2
 * Tests panel collapse, expand mode, drag state, and drawer state.
 */
import { useUIStore } from './uiStore';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      contextPanelCollapsed: false,
      flowPanelCollapsed: false,
      componentPanelCollapsed: false,
      leftExpand: 'default',
      centerExpand: 'default',
      rightExpand: 'default',
      expandMode: 'normal',
      draggedNodeId: null,
      dragOverNodeId: null,
      draggedPositions: {},
      isDragging: false,
      leftDrawerOpen: false,
      rightDrawerOpen: false,
      leftDrawerWidth: 300,
      rightDrawerWidth: 360,
    });
  });

  describe('panel collapse', () => {
    it('should toggle context panel', () => {
      expect(useUIStore.getState().contextPanelCollapsed).toBe(false);
      useUIStore.getState().toggleContextPanel();
      expect(useUIStore.getState().contextPanelCollapsed).toBe(true);
      useUIStore.getState().toggleContextPanel();
      expect(useUIStore.getState().contextPanelCollapsed).toBe(false);
    });

    it('should toggle flow panel', () => {
      expect(useUIStore.getState().flowPanelCollapsed).toBe(false);
      useUIStore.getState().toggleFlowPanel();
      expect(useUIStore.getState().flowPanelCollapsed).toBe(true);
    });

    it('should toggle component panel', () => {
      expect(useUIStore.getState().componentPanelCollapsed).toBe(false);
      useUIStore.getState().toggleComponentPanel();
      expect(useUIStore.getState().componentPanelCollapsed).toBe(true);
    });
  });

  describe('expand mode', () => {
    it('should set expand mode', () => {
      expect(useUIStore.getState().expandMode).toBe('normal');
      useUIStore.getState().setExpandMode('maximize');
      expect(useUIStore.getState().expandMode).toBe('maximize');
      useUIStore.getState().setExpandMode('expand-both');
      expect(useUIStore.getState().expandMode).toBe('expand-both');
    });

    it('should toggle maximize', () => {
      expect(useUIStore.getState().expandMode).toBe('normal');
      useUIStore.getState().toggleMaximize();
      expect(useUIStore.getState().expandMode).toBe('maximize');
      useUIStore.getState().toggleMaximize();
      expect(useUIStore.getState().expandMode).toBe('normal');
    });

    it('should get grid template', () => {
      expect(useUIStore.getState().getGridTemplate()).toBe('1fr 1fr 1fr');
    });

    it('should reset expand', () => {
      useUIStore.getState().setExpandMode('maximize');
      useUIStore.getState().setLeftExpand('expand-left');
      useUIStore.getState().setCenterExpand('expand-right');
      useUIStore.getState().resetExpand();
      const s = useUIStore.getState();
      expect(s.leftExpand).toBe('default');
      expect(s.centerExpand).toBe('default');
      expect(s.rightExpand).toBe('default');
      expect(s.expandMode).toBe('normal');
    });
  });

  describe('togglePanel cycles', () => {
    it('should cycle left expand: default → expand-right → default', () => {
      useUIStore.getState().setLeftExpand('default');
      useUIStore.getState().togglePanel('left');
      expect(useUIStore.getState().leftExpand).toBe('expand-right');
      useUIStore.getState().togglePanel('left');
      expect(useUIStore.getState().leftExpand).toBe('default');
    });

    it('should cycle right expand: default → expand-left → default', () => {
      useUIStore.getState().setRightExpand('default');
      useUIStore.getState().togglePanel('right');
      expect(useUIStore.getState().rightExpand).toBe('expand-left');
      useUIStore.getState().togglePanel('right');
      expect(useUIStore.getState().rightExpand).toBe('default');
    });

    it('should cycle center expand: default → expand-left → expand-right → default', () => {
      useUIStore.getState().setCenterExpand('default');
      useUIStore.getState().togglePanel('center');
      expect(useUIStore.getState().centerExpand).toBe('expand-left');
      useUIStore.getState().togglePanel('center');
      expect(useUIStore.getState().centerExpand).toBe('expand-right');
      useUIStore.getState().togglePanel('center');
      expect(useUIStore.getState().centerExpand).toBe('default');
    });

    it('should set expand state individually', () => {
      useUIStore.getState().setLeftExpand('expand-right');
      useUIStore.getState().setCenterExpand('expand-left');
      useUIStore.getState().setRightExpand('expand-left');
      expect(useUIStore.getState().leftExpand).toBe('expand-right');
      expect(useUIStore.getState().centerExpand).toBe('expand-left');
      expect(useUIStore.getState().rightExpand).toBe('expand-left');
    });
  });

  describe('drag state', () => {
    it('should start drag', () => {
      expect(useUIStore.getState().isDragging).toBe(false);
      expect(useUIStore.getState().draggedNodeId).toBeNull();
      useUIStore.getState().startDrag('node-1');
      expect(useUIStore.getState().draggedNodeId).toBe('node-1');
      expect(useUIStore.getState().isDragging).toBe(true);
    });

    it('should end drag', () => {
      useUIStore.getState().startDrag('node-1');
      useUIStore.getState().endDrag('node-1', { x: 100, y: 200 });
      expect(useUIStore.getState().draggedNodeId).toBeNull();
      expect(useUIStore.getState().isDragging).toBe(false);
      expect(useUIStore.getState().draggedPositions['node-1']).toEqual({ x: 100, y: 200 });
    });

    it('should set drag over', () => {
      expect(useUIStore.getState().dragOverNodeId).toBeNull();
      useUIStore.getState().setDragOver('node-2');
      expect(useUIStore.getState().dragOverNodeId).toBe('node-2');
      useUIStore.getState().setDragOver(null);
      expect(useUIStore.getState().dragOverNodeId).toBeNull();
    });

    it('should update dragged position', () => {
      useUIStore.getState().updateDraggedPosition('node-1', { x: 50, y: 75 });
      expect(useUIStore.getState().draggedPositions['node-1']).toEqual({ x: 50, y: 75 });
    });

    it('should clear all drag positions', () => {
      useUIStore.getState().startDrag('node-1');
      useUIStore.getState().updateDraggedPosition('node-1', { x: 10, y: 20 });
      useUIStore.getState().clearDragPositions();
      expect(useUIStore.getState().draggedPositions).toEqual({});
      expect(useUIStore.getState().isDragging).toBe(false);
    });

    it('should clear single drag position', () => {
      useUIStore.getState().updateDraggedPosition('node-1', { x: 10, y: 20 });
      useUIStore.getState().updateDraggedPosition('node-2', { x: 30, y: 40 });
      useUIStore.getState().clearDragPosition('node-1');
      expect(useUIStore.getState().draggedPositions['node-1']).toBeUndefined();
      expect(useUIStore.getState().draggedPositions['node-2']).toEqual({ x: 30, y: 40 });
    });
  });

  describe('drawer state', () => {
    it('should toggle left drawer', () => {
      expect(useUIStore.getState().leftDrawerOpen).toBe(false);
      useUIStore.getState().toggleLeftDrawer();
      expect(useUIStore.getState().leftDrawerOpen).toBe(true);
    });

    it('should toggle right drawer', () => {
      expect(useUIStore.getState().rightDrawerOpen).toBe(false);
      useUIStore.getState().toggleRightDrawer();
      expect(useUIStore.getState().rightDrawerOpen).toBe(true);
    });

    it('should open right drawer', () => {
      expect(useUIStore.getState().rightDrawerOpen).toBe(false);
      useUIStore.getState().openRightDrawer();
      expect(useUIStore.getState().rightDrawerOpen).toBe(true);
    });

    it('should clamp drawer width', () => {
      useUIStore.getState().setLeftDrawerWidth(50);
      expect(useUIStore.getState().leftDrawerWidth).toBe(100);
      useUIStore.getState().setLeftDrawerWidth(500);
      expect(useUIStore.getState().leftDrawerWidth).toBe(400);
      useUIStore.getState().setRightDrawerWidth(250);
      expect(useUIStore.getState().rightDrawerWidth).toBe(250);
    });
  });
});
