/**
 * canvasPreviewStore unit tests — E3 Preview-Edit Sync
 * Tests preview state management and sync functionality.
 */
import { useCanvasPreviewStore } from './canvasPreviewStore';
import { useComponentStore } from './componentStore';

describe('useCanvasPreviewStore', () => {
  beforeEach(() => {
    // Reset stores before each test
    useCanvasPreviewStore.setState({
      activeNodeId: null,
      previewSchema: null,
      syncEnabled: true,
    });
    useComponentStore.setState({
      selectedNodeIds: [],
    });
  });

  describe('activeNodeId', () => {
    it('should initialize with null activeNodeId', () => {
      expect(useCanvasPreviewStore.getState().activeNodeId).toBeNull();
    });

    it('should set activeNodeId via setActiveNode', () => {
      useCanvasPreviewStore.getState().setActiveNode('node-123');
      expect(useCanvasPreviewStore.getState().activeNodeId).toBe('node-123');
    });

    it('should clear activeNodeId when set to null', () => {
      useCanvasPreviewStore.getState().setActiveNode('node-123');
      useCanvasPreviewStore.getState().setActiveNode(null);
      expect(useCanvasPreviewStore.getState().activeNodeId).toBeNull();
    });

    it('should clear activeNodeId via clearActiveNode', () => {
      useCanvasPreviewStore.getState().setActiveNode('node-123');
      useCanvasPreviewStore.getState().clearActiveNode();
      expect(useCanvasPreviewStore.getState().activeNodeId).toBeNull();
    });
  });

  describe('syncEnabled', () => {
    it('should initialize with syncEnabled true', () => {
      expect(useCanvasPreviewStore.getState().syncEnabled).toBe(true);
    });

    it('should toggle syncEnabled via toggleSync', () => {
      expect(useCanvasPreviewStore.getState().syncEnabled).toBe(true);
      useCanvasPreviewStore.getState().toggleSync();
      expect(useCanvasPreviewStore.getState().syncEnabled).toBe(false);
      useCanvasPreviewStore.getState().toggleSync();
      expect(useCanvasPreviewStore.getState().syncEnabled).toBe(true);
    });

    it('should set syncEnabled via setSyncEnabled', () => {
      useCanvasPreviewStore.getState().setSyncEnabled(false);
      expect(useCanvasPreviewStore.getState().syncEnabled).toBe(false);
      useCanvasPreviewStore.getState().setSyncEnabled(true);
      expect(useCanvasPreviewStore.getState().syncEnabled).toBe(true);
    });
  });

  describe('previewSchema', () => {
    it('should initialize with null previewSchema', () => {
      expect(useCanvasPreviewStore.getState().previewSchema).toBeNull();
    });

    it('should set previewSchema via setPreviewSchema', () => {
      const schema = { root: 'page-1', elements: {} };
      useCanvasPreviewStore.getState().setPreviewSchema(schema);
      expect(useCanvasPreviewStore.getState().previewSchema).toEqual(schema);
    });
  });

  describe('sync to componentStore', () => {
    it('should sync activeNode to componentStore.selectedNodeIds when syncEnabled=true', () => {
      useCanvasPreviewStore.setState({ syncEnabled: true });
      useCanvasPreviewStore.getState().setActiveNode('comp-1');
      expect(useComponentStore.getState().selectedNodeIds).toContain('comp-1');
    });

    it('should NOT sync activeNode to componentStore when syncEnabled=false', () => {
      useCanvasPreviewStore.setState({ syncEnabled: false });
      useCanvasPreviewStore.getState().setActiveNode('comp-1');
      expect(useComponentStore.getState().selectedNodeIds).not.toContain('comp-1');
    });

    it('should not duplicate nodeId if already selected', () => {
      useCanvasPreviewStore.setState({ syncEnabled: true });
      // Pre-select the node
      useComponentStore.getState().setSelectedNodeIds(['comp-1']);
      
      useCanvasPreviewStore.getState().setActiveNode('comp-1');
      
      // Should still only have one entry
      const selected = useComponentStore.getState().selectedNodeIds;
      expect(selected.filter(id => id === 'comp-1').length).toBe(1);
    });

    it('should not sync when activeNode is null', () => {
      useCanvasPreviewStore.setState({ syncEnabled: true });
      useCanvasPreviewStore.getState().setActiveNode(null);
      expect(useComponentStore.getState().selectedNodeIds).toHaveLength(0);
    });
  });
});
