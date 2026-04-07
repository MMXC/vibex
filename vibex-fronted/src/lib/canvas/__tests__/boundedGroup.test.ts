/**
 * boundedGroup.test.ts — Unit tests for BoundedGroup slice (E4)
 *
 * Epic E4: vibex-canvas-expandable-20260327
 * Tests: addBoundedGroup, removeBoundedGroup, toggleBoundedGroupVisibility,
 *        updateBoundedGroupLabel, addNodeToGroup, removeNodeFromGroup,
 *        clearBoundedGroups, draggedPositions persistence
 *
 * References:
 *   AGENTS.md § Dev Constraints — "单元测试路径: src/lib/canvas/__tests__/boundedGroup.test.ts"
 */

import { useCanvasStore } from '@/lib/canvas/canvasStore';
import type { Node } from '@xyflow/react';
import { computeGroupBBoxes } from '@/components/canvas/groups/BoundedGroupOverlay';
import type { BoundedGroup, BoundedGroupBBox } from '@/lib/canvas/types';

// =============================================================================
// BoundedGroup Slice Tests
// =============================================================================

describe('BoundedGroupSlice (E4)', () => {
  beforeEach(() => {
    // Reset store
    useCanvasStore.getState().clearBoundedGroups();
    useCanvasStore.setState({
      boundedGroups: [],
    });
  });

  afterEach(() => {
    useCanvasStore.getState().clearBoundedGroups();
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('starts with empty boundedGroups', () => {
      expect(useCanvasStore.getState().boundedGroups).toEqual([]);
    });
  });

  // ── addBoundedGroup ───────────────────────────────────────────────────────

  describe('addBoundedGroup', () => {
    it('adds a new group with auto-generated id', () => {
      const { addBoundedGroup } = useCanvasStore.getState();
      addBoundedGroup({ label: '患者管理', treeType: 'context', nodeIds: ['node-1', 'node-2'] });

      const groups = useCanvasStore.getState().boundedGroups;
      expect(groups).toHaveLength(1);
      expect(groups[0].label).toBe('患者管理');
      expect(groups[0].treeType).toBe('context');
      expect(groups[0].nodeIds).toEqual(['node-1', 'node-2']);
      expect(groups[0].groupId).toBeDefined();
      expect(groups[0].groupId.length).toBeGreaterThan(0);
      expect(groups[0].visible).not.toBe(false); // defaults to undefined (truthy)
    });

    it('adds multiple groups with unique ids', () => {
      const { addBoundedGroup } = useCanvasStore.getState();
      addBoundedGroup({ label: 'Group A', treeType: 'context', nodeIds: ['n1'] });
      addBoundedGroup({ label: 'Group B', treeType: 'flow', nodeIds: ['n2'] });

      const groups = useCanvasStore.getState().boundedGroups;
      expect(groups).toHaveLength(2);
      expect(groups[0].groupId).not.toBe(groups[1].groupId);
    });

    it('accepts optional color override', () => {
      const { addBoundedGroup } = useCanvasStore.getState();
      addBoundedGroup({ label: 'Custom', treeType: 'context', nodeIds: [], color: '#ff0000' });

      const group = useCanvasStore.getState().boundedGroups[0];
      expect(group.color).toBe('#ff0000');
    });
  });

  // ── removeBoundedGroup ────────────────────────────────────────────────────

  describe('removeBoundedGroup', () => {
    it('removes a group by id', () => {
      const { addBoundedGroup, removeBoundedGroup } = useCanvasStore.getState();
      addBoundedGroup({ label: 'Group A', treeType: 'context', nodeIds: ['n1'] });
      const id = useCanvasStore.getState().boundedGroups[0].groupId;
      addBoundedGroup({ label: 'Group B', treeType: 'flow', nodeIds: ['n2'] });

      removeBoundedGroup(id);

      const groups = useCanvasStore.getState().boundedGroups;
      expect(groups).toHaveLength(1);
      expect(groups[0].label).toBe('Group B');
    });

    it('does nothing for non-existent id', () => {
      const { addBoundedGroup, removeBoundedGroup } = useCanvasStore.getState();
      addBoundedGroup({ label: 'Group A', treeType: 'context', nodeIds: [] });

      expect(() => removeBoundedGroup('non-existent-id')).not.toThrow();
      expect(useCanvasStore.getState().boundedGroups).toHaveLength(1);
    });
  });

  // ── toggleBoundedGroupVisibility ──────────────────────────────────────────

  describe('toggleBoundedGroupVisibility', () => {
    it('sets visible to false when toggled from undefined', () => {
      const { addBoundedGroup, toggleBoundedGroupVisibility } = useCanvasStore.getState();
      addBoundedGroup({ label: 'Group', treeType: 'context', nodeIds: [] });
      const id = useCanvasStore.getState().boundedGroups[0].groupId;

      toggleBoundedGroupVisibility(id);

      expect(useCanvasStore.getState().boundedGroups[0].visible).toBe(false);
    });

    it('sets visible=true when toggled again from false', () => {
      const { addBoundedGroup, toggleBoundedGroupVisibility } = useCanvasStore.getState();
      addBoundedGroup({ label: 'Group', treeType: 'context', nodeIds: [] });
      const id = useCanvasStore.getState().boundedGroups[0].groupId;

      toggleBoundedGroupVisibility(id);
      expect(useCanvasStore.getState().boundedGroups[0].visible).toBe(false);
      toggleBoundedGroupVisibility(id);
      expect(useCanvasStore.getState().boundedGroups[0].visible).toBe(true); // false → true
    });
  });

  // ── updateBoundedGroupLabel ───────────────────────────────────────────────

  describe('updateBoundedGroupLabel', () => {
    it('updates group label', () => {
      const { addBoundedGroup, updateBoundedGroupLabel } = useCanvasStore.getState();
      addBoundedGroup({ label: 'Old Label', treeType: 'context', nodeIds: [] });
      const id = useCanvasStore.getState().boundedGroups[0].groupId;

      updateBoundedGroupLabel(id, 'New Label');

      expect(useCanvasStore.getState().boundedGroups[0].label).toBe('New Label');
    });

    it('does nothing for non-existent id', () => {
      const { addBoundedGroup, updateBoundedGroupLabel } = useCanvasStore.getState();
      addBoundedGroup({ label: 'Group', treeType: 'context', nodeIds: [] });

      updateBoundedGroupLabel('non-existent', 'New');
      expect(useCanvasStore.getState().boundedGroups[0].label).toBe('Group');
    });
  });

  // ── addNodeToGroup ────────────────────────────────────────────────────────

  describe('addNodeToGroup', () => {
    it('adds a node to a group', () => {
      const { addBoundedGroup, addNodeToGroup } = useCanvasStore.getState();
      addBoundedGroup({ label: 'Group', treeType: 'context', nodeIds: ['n1'] });
      const id = useCanvasStore.getState().boundedGroups[0].groupId;

      addNodeToGroup(id, 'n2');

      expect(useCanvasStore.getState().boundedGroups[0].nodeIds).toEqual(['n1', 'n2']);
    });

    it('does not add duplicate node ids', () => {
      const { addBoundedGroup, addNodeToGroup } = useCanvasStore.getState();
      addBoundedGroup({ label: 'Group', treeType: 'context', nodeIds: ['n1'] });
      const id = useCanvasStore.getState().boundedGroups[0].groupId;

      addNodeToGroup(id, 'n1');

      const nodeIds = useCanvasStore.getState().boundedGroups[0].nodeIds;
      expect(nodeIds.filter(n => n === 'n1')).toHaveLength(1);
    });
  });

  // ── removeNodeFromGroup ───────────────────────────────────────────────────

  describe('removeNodeFromGroup', () => {
    it('removes a node from a group', () => {
      const { addBoundedGroup, removeNodeFromGroup } = useCanvasStore.getState();
      addBoundedGroup({ label: 'Group', treeType: 'context', nodeIds: ['n1', 'n2'] });
      const id = useCanvasStore.getState().boundedGroups[0].groupId;

      removeNodeFromGroup(id, 'n1');

      expect(useCanvasStore.getState().boundedGroups[0].nodeIds).toEqual(['n2']);
    });
  });

  // ── clearBoundedGroups ────────────────────────────────────────────────────

  describe('clearBoundedGroups', () => {
    it('removes all groups', () => {
      const { addBoundedGroup, clearBoundedGroups } = useCanvasStore.getState();
      addBoundedGroup({ label: 'G1', treeType: 'context', nodeIds: [] });
      addBoundedGroup({ label: 'G2', treeType: 'flow', nodeIds: [] });

      clearBoundedGroups();

      expect(useCanvasStore.getState().boundedGroups).toEqual([]);
    });
  });

  // ── Full lifecycle ────────────────────────────────────────────────────────

  describe('full lifecycle', () => {
    it('create → assign nodes → toggle → remove', () => {
      const store = useCanvasStore.getState();
      const get = () => useCanvasStore.getState();

      // Create two groups
      store.addBoundedGroup({ label: 'Domain A', treeType: 'context', nodeIds: [] });
      store.addBoundedGroup({ label: 'Domain B', treeType: 'context', nodeIds: [] });
      expect(get().boundedGroups).toHaveLength(2);

      const groupIdA = get().boundedGroups[0].groupId;
      const groupIdB = get().boundedGroups[1].groupId;

      // Assign nodes
      store.addNodeToGroup(groupIdA, 'card-1');
      store.addNodeToGroup(groupIdA, 'card-2');
      store.addNodeToGroup(groupIdB, 'card-3');

      expect(get().boundedGroups[0].nodeIds).toEqual(['card-1', 'card-2']);
      expect(get().boundedGroups[1].nodeIds).toEqual(['card-3']);

      // Toggle visibility (undefined → false)
      store.toggleBoundedGroupVisibility(groupIdA);
      expect(get().boundedGroups[0].visible).toBe(false); // hidden
      expect(get().boundedGroups[1].visible).toBeUndefined();

      // Update label
      store.updateBoundedGroupLabel(groupIdA, 'Domain A (confirmed)');
      expect(get().boundedGroups[0].label).toBe('Domain A (confirmed)');

      // Remove a node
      store.removeNodeFromGroup(groupIdA, 'card-1');
      expect(get().boundedGroups[0].nodeIds).toEqual(['card-2']);

      // Remove group A
      store.removeBoundedGroup(groupIdA);
      expect(get().boundedGroups).toHaveLength(1);
      expect(get().boundedGroups[0].label).toBe('Domain B');

      // Clear remaining
      store.clearBoundedGroups();
      expect(get().boundedGroups).toHaveLength(0);
    });
  });
});

// =============================================================================
// computeGroupBBoxes Tests
// =============================================================================

describe('computeGroupBBoxes', () => {
  const mockNodes: Node[] = [
    { id: 'card-1', type: 'cardTreeNode', position: { x: 100, y: 0 }, data: {}, sourcePosition: 0, targetPosition: 0 },
    { id: 'card-2', type: 'cardTreeNode', position: { x: 100, y: 260 }, data: {}, sourcePosition: 0, targetPosition: 0 },
    { id: 'card-3', type: 'cardTreeNode', position: { x: 400, y: 0 }, data: {}, sourcePosition: 0, targetPosition: 0 },
    { id: 'ungrouped', type: 'cardTreeNode', position: { x: 700, y: 0 }, data: {}, sourcePosition: 0, targetPosition: 0 },
  ];

  const makeGroup = (partial: Partial<BoundedGroup>): BoundedGroup =>
    ({ groupId: 'g1', label: 'Test', treeType: 'context', nodeIds: [], visible: true, ...partial });

  it('returns empty array when no groups provided', () => {
    const result = computeGroupBBoxes(mockNodes, []);
    expect(result).toEqual([]);
  });

  it('computes correct bbox for a single card', () => {
    const groups = [makeGroup({ groupId: 'g1', label: 'Single', nodeIds: ['card-1'] })];
    const result = computeGroupBBoxes(mockNodes, groups);

    expect(result).toHaveLength(1);
    const bbox = result[0];
    expect(bbox.groupId).toBe('g1');
    // With CARD_HEIGHT=200, CARD_WIDTH=240, PADDING=12, LABEL_HEIGHT~18
    // card-1: x=100, y=0
    // minX=maxX=100, minY=maxY=0, CARD_WIDTH=240, CARD_HEIGHT=200, PAD=12, LABEL_H=19
    // x = 100-12 = 88, y = 0-19-12 = -31
    // width = maxX(100+240) - minX(100) + 24 = 264
    // height = maxY(0+200) - minY(0) + 24 = 224
    expect(bbox.x).toBeCloseTo(88, 0);
    expect(bbox.width).toBeCloseTo(264, 0);
  });

  it('computes bbox encompassing multiple cards', () => {
    const groups = [makeGroup({ groupId: 'g1', label: 'Two Cards', nodeIds: ['card-1', 'card-2'] })];
    const result = computeGroupBBoxes(mockNodes, groups);

    expect(result).toHaveLength(1);
    const bbox = result[0];
    // card-1 at y=0, card-2 at y=260
    // LABEL_HEIGHT = 11 + 4*2 = 19, PADDING = 12
    // minX = 100-12 = 88, minY = 0-19-12 = -31
    // maxX = 100+240 = 340, maxY = 260+200 = 460
    // width = maxX - minX + pad*2 = 340 - 100 + 24 = 264
    // height = maxY - minY + pad*2 = 460 - 0 + 24 = 484
    expect(bbox.x).toBeCloseTo(88, 0);
    expect(bbox.y).toBeCloseTo(-31, 0);
    expect(bbox.width).toBeCloseTo(264, 0);
    expect(bbox.height).toBeCloseTo(484, 0);
    expect(bbox.nodeIds).toEqual(['card-1', 'card-2']);
  });

  it('skips groups with no nodeIds', () => {
    const groups = [makeGroup({ groupId: 'g1', label: 'Empty', nodeIds: [] })];
    const result = computeGroupBBoxes(mockNodes, groups);
    expect(result).toHaveLength(0);
  });

  it('skips groups with hidden=false', () => {
    const groups = [makeGroup({ groupId: 'g1', label: 'Hidden', nodeIds: ['card-1'], visible: false })];
    const result = computeGroupBBoxes(mockNodes, groups);
    expect(result).toHaveLength(0);
  });

  it('skips groups where no nodes match', () => {
    const groups = [makeGroup({ groupId: 'g1', label: 'No Match', nodeIds: ['non-existent'] })];
    const result = computeGroupBBoxes(mockNodes, groups);
    expect(result).toHaveLength(0);
  });

  it('computes multiple independent groups', () => {
    const groups = [
      makeGroup({ groupId: 'g1', label: 'Group A', nodeIds: ['card-1'] }),
      makeGroup({ groupId: 'g2', label: 'Group B', nodeIds: ['card-3'] }),
    ];
    const result = computeGroupBBoxes(mockNodes, groups);

    expect(result).toHaveLength(2);
    expect(result[0].groupId).toBe('g1');
    expect(result[1].groupId).toBe('g2');
  });

  it('bbox includes all nodes in a group', () => {
    const groups = [makeGroup({ groupId: 'g1', label: 'All Context', nodeIds: ['card-1', 'card-2', 'card-3'] })];
    const result = computeGroupBBoxes(mockNodes, groups);

    const bbox = result[0];
    expect(bbox.nodeIds).toHaveLength(3);
    expect(bbox.nodeIds).toContain('card-1');
    expect(bbox.nodeIds).toContain('card-2');
    expect(bbox.nodeIds).toContain('card-3');
  });
});
