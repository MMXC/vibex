/**
 * useCanvasRenderer Hook Tests
 *
 * 覆盖场景:
 * - nodeRects 计算（正常路径 + 边界条件）
 * - edges 计算（context/flow）
 * - TreeNode transforms
 * - 性能测试（100 节点 < 100ms）
 *
 * 参考: docs/proposals/20260405-1321/canvas-testing-strategy/
 */
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCanvasRenderer } from '../useCanvasRenderer';
import type { BoundedContextNode, BusinessFlowNode, ComponentNode } from '@/lib/canvas/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeContextNode = (overrides: Partial<BoundedContextNode> = {}): BoundedContextNode => ({
  nodeId: 'ctx-1',
  name: 'Test Context',
  description: '',
  type: 'core',
  status: 'draft',
  isActive: false,
  children: [],
  ...overrides,
});

const makeFlowNode = (overrides: Partial<BusinessFlowNode> = {}): BusinessFlowNode => ({
  nodeId: 'flow-1',
  name: 'Test Flow',
  contextId: 'ctx-1',
  steps: [],
  status: 'draft',
  children: [],
  ...overrides,
});

const makeComponentNode = (overrides: Partial<ComponentNode> = {}): ComponentNode => ({
  nodeId: 'comp-1',
  name: 'Test Component',
  flowId: 'flow-1',
  type: 'page',
  props: {},
  api: { method: 'GET', path: '/', params: [] },
  children: [],
  status: 'draft',
  ...overrides,
});

// ---------------------------------------------------------------------------
// Constants (must match useCanvasRenderer.ts)
// ---------------------------------------------------------------------------
const CARD_W = 240;
const CARD_H = 200;
const CARD_GAP = 16;

describe('useCanvasRenderer', () => {
  // -------------------------------------------------------------------------
  // nodeRects calculation
  // -------------------------------------------------------------------------
  describe('nodeRects calculation', () => {
    it('should return empty rects for empty nodes', () => {
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: [], flowNodes: [], componentNodes: [] })
      );
      expect(result.current.contextNodeRects).toEqual([]);
      expect(result.current.flowNodeRects).toEqual([]);
      expect(result.current.componentNodeRects).toEqual([]);
    });

    it('should compute rects for single context node at origin', () => {
      const ctxNodes = [makeContextNode({ nodeId: 'ctx-1' })];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: ctxNodes, flowNodes: [], componentNodes: [] })
      );
      expect(result.current.contextNodeRects).toHaveLength(1);
      expect(result.current.contextNodeRects[0].id).toBe('ctx-1');
      expect(result.current.contextNodeRects[0].x).toBe(0);
      expect(result.current.contextNodeRects[0].y).toBe(0);
    });

    it('should compute rects in 3-per-row grid layout', () => {
      const ctxNodes = [
        makeContextNode({ nodeId: 'ctx-0' }),
        makeContextNode({ nodeId: 'ctx-1' }),
        makeContextNode({ nodeId: 'ctx-2' }),
        makeContextNode({ nodeId: 'ctx-3' }),
      ];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: ctxNodes, flowNodes: [], componentNodes: [] })
      );
      const rects = result.current.contextNodeRects;
      expect(rects).toHaveLength(4);
      // row 0: x=0, x=256, x=512
      expect(rects[0].x).toBe(0);
      expect(rects[0].y).toBe(0);
      expect(rects[1].x).toBe(CARD_W + CARD_GAP);
      expect(rects[1].y).toBe(0);
      expect(rects[2].x).toBe(2 * (CARD_W + CARD_GAP));
      expect(rects[2].y).toBe(0);
      // row 1: y=CARD_H+CARD_GAP
      expect(rects[3].x).toBe(0);
      expect(rects[3].y).toBe(CARD_H + CARD_GAP);
    });

    it('should set correct fixed width and height for context rects', () => {
      const ctxNodes = [makeContextNode({ nodeId: 'ctx-1' })];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: ctxNodes, flowNodes: [], componentNodes: [] })
      );
      expect(result.current.contextNodeRects[0].width).toBe(CARD_W);
      expect(result.current.contextNodeRects[0].height).toBe(CARD_H);
    });

    it('should compute flow node rects independently', () => {
      const flowNodes = [makeFlowNode({ nodeId: 'flow-1' })];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: [], flowNodes, componentNodes: [] })
      );
      expect(result.current.flowNodeRects).toHaveLength(1);
      expect(result.current.flowNodeRects[0].x).toBe(0);
      expect(result.current.flowNodeRects[0].y).toBe(0);
    });

    it('should compute component node rects independently', () => {
      const componentNodes = [makeComponentNode({ nodeId: 'comp-1' })];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: [], flowNodes: [], componentNodes })
      );
      expect(result.current.componentNodeRects).toHaveLength(1);
      expect(result.current.componentNodeRects[0].x).toBe(0);
      expect(result.current.componentNodeRects[0].y).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // boundedEdges computation — all pairs of context nodes
  // -------------------------------------------------------------------------
  describe('boundedEdges computation', () => {
    it('should return empty edges for single context node', () => {
      const ctxNodes = [makeContextNode({ nodeId: 'ctx-1' })];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: ctxNodes, flowNodes: [], componentNodes: [] })
      );
      expect(result.current.boundedEdges).toEqual([]);
    });

    it('should create one edge for two nodes (one pair)', () => {
      const ctxNodes = [
        makeContextNode({ nodeId: 'ctx-1', type: 'core' }),
        makeContextNode({ nodeId: 'ctx-2', type: 'supporting' }),
      ];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: ctxNodes, flowNodes: [], componentNodes: [] })
      );
      expect(result.current.boundedEdges).toHaveLength(1);
      expect(result.current.boundedEdges[0].from.groupId).toBe('ctx-1');
      expect(result.current.boundedEdges[0].to.groupId).toBe('ctx-2');
    });

    it('should create 3 edges for 3 nodes (3 unique pairs)', () => {
      const ctxNodes = [
        makeContextNode({ nodeId: 'ctx-1', type: 'core' }),
        makeContextNode({ nodeId: 'ctx-2', type: 'supporting' }),
        makeContextNode({ nodeId: 'ctx-3', type: 'generic' }),
      ];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: ctxNodes, flowNodes: [], componentNodes: [] })
      );
      // 3 nodes → C(3,2) = 3 pairs
      expect(result.current.boundedEdges).toHaveLength(3);
    });

    it('should create 6 edges for 4 nodes (C(4,2)=6 pairs)', () => {
      const ctxNodes = [
        makeContextNode({ nodeId: 'ctx-1', type: 'core' }),
        makeContextNode({ nodeId: 'ctx-2', type: 'core' }),
        makeContextNode({ nodeId: 'ctx-3', type: 'supporting' }),
        makeContextNode({ nodeId: 'ctx-4', type: 'generic' }),
      ];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: ctxNodes, flowNodes: [], componentNodes: [] })
      );
      expect(result.current.boundedEdges).toHaveLength(6);
    });

    it('should assign valid edge type (dependency|association|composition)', () => {
      const ctxNodes = [
        makeContextNode({ nodeId: 'ctx-1', type: 'core' }),
        makeContextNode({ nodeId: 'ctx-2', type: 'core' }),
      ];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: ctxNodes, flowNodes: [], componentNodes: [] })
      );
      expect(['dependency', 'association', 'composition']).toContain(
        result.current.boundedEdges[0].type
      );
    });

    it('should use dependency type for core+supporting combination', () => {
      const ctxNodes = [
        makeContextNode({ nodeId: 'ctx-core', type: 'core' }),
        makeContextNode({ nodeId: 'ctx-support', type: 'supporting' }),
      ];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: ctxNodes, flowNodes: [], componentNodes: [] })
      );
      expect(result.current.boundedEdges[0].type).toBe('dependency');
    });

    it('should use association type for supporting+supporting combination', () => {
      const ctxNodes = [
        makeContextNode({ nodeId: 'ctx-1', type: 'supporting' }),
        makeContextNode({ nodeId: 'ctx-2', type: 'supporting' }),
      ];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: ctxNodes, flowNodes: [], componentNodes: [] })
      );
      expect(result.current.boundedEdges[0].type).toBe('association');
    });

    it('should assign unique ids to each edge', () => {
      const ctxNodes = [
        makeContextNode({ nodeId: 'ctx-1', type: 'core' }),
        makeContextNode({ nodeId: 'ctx-2', type: 'supporting' }),
        makeContextNode({ nodeId: 'ctx-3', type: 'generic' }),
      ];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: ctxNodes, flowNodes: [], componentNodes: [] })
      );
      const ids = result.current.boundedEdges.map((e) => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  // -------------------------------------------------------------------------
  // flowEdges computation — connects consecutive steps
  // -------------------------------------------------------------------------
  describe('flowEdges computation', () => {
    it('should return empty flowEdges for empty flow nodes', () => {
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: [], flowNodes: [], componentNodes: [] })
      );
      expect(result.current.flowEdges).toEqual([]);
    });

    it('should return empty flowEdges for single-step flow', () => {
      const flowNodes = [
        makeFlowNode({
          nodeId: 'flow-1',
          steps: [{ stepId: 'step-1', name: 'Step 1', actor: 'User', order: 0, type: 'normal' }],
        }),
      ];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: [], flowNodes, componentNodes: [] })
      );
      expect(result.current.flowEdges).toEqual([]);
    });

    it('should create sequence edge between two normal steps', () => {
      const flowNodes = [
        makeFlowNode({
          nodeId: 'flow-1',
          steps: [
            { stepId: 'step-1', name: 'Step 1', actor: 'User', order: 0, type: 'normal' },
            { stepId: 'step-2', name: 'Step 2', actor: 'User', order: 1, type: 'normal' },
          ],
        }),
      ];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: [], flowNodes, componentNodes: [] })
      );
      expect(result.current.flowEdges).toHaveLength(1);
      expect(result.current.flowEdges[0].from).toBe('step-1');
      expect(result.current.flowEdges[0].to).toBe('step-2');
      expect(result.current.flowEdges[0].type).toBe('sequence');
    });

    it('should create branch edge when one step has type=branch', () => {
      const flowNodes = [
        makeFlowNode({
          nodeId: 'flow-1',
          steps: [
            { stepId: 'step-1', name: 'Normal', actor: 'User', order: 0, type: 'normal' },
            { stepId: 'step-2', name: 'Branch Step', actor: 'User', order: 1, type: 'branch' },
          ],
        }),
      ];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: [], flowNodes, componentNodes: [] })
      );
      expect(result.current.flowEdges[0].type).toBe('branch');
    });

    it('should create loop edge when one step has type=loop with matching description', () => {
      const flowNodes = [
        makeFlowNode({
          nodeId: 'flow-1',
          steps: [
            { stepId: 'step-1', name: 'Start Loop', actor: 'User', order: 0, type: 'normal' },
            {
              stepId: 'step-2',
              name: 'Retry',
              actor: 'User',
              order: 1,
              type: 'loop',
              description: '回到: Start Loop',
            },
          ],
        }),
      ];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: [], flowNodes, componentNodes: [] })
      );
      // Should have 2 edges: sequence (step-1→step-2) + loop (step-2→step-1)
      expect(result.current.flowEdges.some((e) => e.type === 'loop')).toBe(true);
    });

    it('should not create extra loop edge if description does not match any prior step name', () => {
      const flowNodes = [
        makeFlowNode({
          nodeId: 'flow-1',
          steps: [
            { stepId: 'step-1', name: 'Step One', actor: 'User', order: 0, type: 'normal' },
            {
              stepId: 'step-2',
              name: 'Loop Step',
              actor: 'User',
              order: 1,
              type: 'loop',
              description: '回到: NonExistent',
            },
          ],
        }),
      ];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: [], flowNodes, componentNodes: [] })
      );
      // The sequence edge (step-1→step-2) still gets type 'loop' because toType==='loop'
      // But no extra loop-back edge is created since description doesn't match any prior step
      expect(result.current.flowEdges).toHaveLength(1);
      expect(result.current.flowEdges[0].type).toBe('loop');
    });

    it('should handle multiple flows independently', () => {
      const flowNodes = [
        makeFlowNode({
          nodeId: 'flow-1',
          steps: [
            { stepId: 's1', name: 'S1', actor: 'User', order: 0, type: 'normal' },
            { stepId: 's2', name: 'S2', actor: 'User', order: 1, type: 'normal' },
          ],
        }),
        makeFlowNode({
          nodeId: 'flow-2',
          steps: [
            { stepId: 's3', name: 'S3', actor: 'User', order: 0, type: 'normal' },
            { stepId: 's4', name: 'S4', actor: 'User', order: 1, type: 'normal' },
          ],
        }),
      ];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: [], flowNodes, componentNodes: [] })
      );
      // 1 sequence edge per flow (2 flows × 1 edge each = 2 total)
      expect(result.current.flowEdges).toHaveLength(2);
    });

    it('should assign unique ids to each flow edge', () => {
      const flowNodes = [
        makeFlowNode({
          nodeId: 'flow-1',
          steps: [
            { stepId: 's1', name: 'S1', actor: 'User', order: 0, type: 'normal' },
            { stepId: 's2', name: 'S2', actor: 'User', order: 1, type: 'normal' },
            { stepId: 's3', name: 'S3', actor: 'User', order: 2, type: 'normal' },
          ],
        }),
      ];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: [], flowNodes, componentNodes: [] })
      );
      const ids = result.current.flowEdges.map((e) => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  // -------------------------------------------------------------------------
  // TreeNode transforms
  // -------------------------------------------------------------------------
  describe('TreeNode transforms', () => {
    it('should transform context node to TreeNode with correct fields', () => {
      const ctxNodes = [
        makeContextNode({
          nodeId: 'ctx-1',
          name: 'My Context',
          type: 'core',
          status: 'confirmed',
          isActive: false,
          parentId: 'parent-1',
          children: ['child-1'],
        }),
      ];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: ctxNodes, flowNodes: [], componentNodes: [] })
      );
      const nodes = result.current.contextTreeNodes;
      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe('ctx-1');
      expect(nodes[0].label).toBe('My Context');
      expect(nodes[0].type).toBe('context');
      expect(nodes[0].status).toBe('confirmed');
      expect(nodes[0].confirmed).toBe(false); // isActive=false → confirmed=false
      expect(nodes[0].parentId).toBe('parent-1');
      expect(nodes[0].children).toEqual(['child-1']);
    });

    it('should set confirmed=true when isActive is true', () => {
      const ctxNodes = [makeContextNode({ nodeId: 'ctx-1', isActive: true })];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: ctxNodes, flowNodes: [], componentNodes: [] })
      );
      expect(result.current.contextTreeNodes[0].confirmed).toBe(true);
    });

    it('should set confirmed=true when isActive is undefined (default)', () => {
      const ctxNodes = [makeContextNode({ nodeId: 'ctx-1', isActive: undefined })];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: ctxNodes, flowNodes: [], componentNodes: [] })
      );
      expect(result.current.contextTreeNodes[0].confirmed).toBe(true);
    });

    it('should preserve original node in data field', () => {
      const ctxNodes = [
        makeContextNode({ nodeId: 'ctx-original', name: 'Original', type: 'generic' }),
      ];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: ctxNodes, flowNodes: [], componentNodes: [] })
      );
      const node = result.current.contextTreeNodes[0];
      expect(node.data).toBeDefined();
      expect((node.data as BoundedContextNode).nodeId).toBe('ctx-original');
    });

    it('should transform flow nodes to TreeNode format', () => {
      const flowNodes = [makeFlowNode({ nodeId: 'flow-1', name: 'Test Flow', status: 'generating' })];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: [], flowNodes, componentNodes: [] })
      );
      expect(result.current.flowTreeNodes).toHaveLength(1);
      expect(result.current.flowTreeNodes[0].id).toBe('flow-1');
      expect(result.current.flowTreeNodes[0].label).toBe('Test Flow');
      expect(result.current.flowTreeNodes[0].type).toBe('flow');
      expect(result.current.flowTreeNodes[0].status).toBe('generating');
    });

    it('should transform component nodes to TreeNode format', () => {
      const componentNodes = [
        makeComponentNode({ nodeId: 'comp-1', name: 'Button', type: 'form', status: 'pending' }),
      ];
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: [], flowNodes: [], componentNodes })
      );
      expect(result.current.componentTreeNodes).toHaveLength(1);
      expect(result.current.componentTreeNodes[0].id).toBe('comp-1');
      expect(result.current.componentTreeNodes[0].label).toBe('Button');
      expect(result.current.componentTreeNodes[0].type).toBe('component');
      expect(result.current.componentTreeNodes[0].status).toBe('pending');
    });

    it('should return empty arrays when all node lists are empty', () => {
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: [], flowNodes: [], componentNodes: [] })
      );
      expect(result.current.contextTreeNodes).toEqual([]);
      expect(result.current.flowTreeNodes).toEqual([]);
      expect(result.current.componentTreeNodes).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Memoization / stability
  // -------------------------------------------------------------------------
  describe('memoization', () => {
    it('should return stable references when inputs do not change', () => {
      const ctxNodes = [makeContextNode({ nodeId: 'ctx-1' })];
      const { result, rerender } = renderHook(() =>
        useCanvasRenderer({ contextNodes: ctxNodes, flowNodes: [], componentNodes: [] })
      );
      const firstRects = result.current.contextNodeRects;
      const firstEdges = result.current.boundedEdges;
      const firstTree = result.current.contextTreeNodes;

      // Rerender with same inputs (simulate React re-render)
      rerender();

      // All values should be referentially stable (useMemo)
      expect(result.current.contextNodeRects).toBe(firstRects);
      expect(result.current.boundedEdges).toBe(firstEdges);
      expect(result.current.contextTreeNodes).toBe(firstTree);
    });
  });

  // -------------------------------------------------------------------------
  // Performance
  // -------------------------------------------------------------------------
  describe('performance', () => {
    it('should compute rects for 100 nodes in under 100ms', () => {
      const ctxNodes = Array.from({ length: 100 }, (_, i) =>
        makeContextNode({ nodeId: `ctx-${i}` })
      );
      const flowNodes = Array.from({ length: 100 }, (_, i) =>
        makeFlowNode({ nodeId: `flow-${i}` })
      );
      const componentNodes = Array.from({ length: 100 }, (_, i) =>
        makeComponentNode({ nodeId: `comp-${i}` })
      );

      const start = performance.now();
      renderHook(() =>
        useCanvasRenderer({ contextNodes: ctxNodes, flowNodes, componentNodes })
      );
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
    });

    it('should compute bounded edges for 50 nodes (C(50,2)=1225 pairs) in under 100ms', () => {
      const ctxNodes = Array.from({ length: 50 }, (_, i) =>
        makeContextNode({ nodeId: `ctx-${i}`, type: i % 2 === 0 ? 'core' : 'supporting' })
      );
      const start = performance.now();
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: ctxNodes, flowNodes: [], componentNodes: [] })
      );
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
      // C(50,2) = 1225 pairs
      expect(result.current.boundedEdges).toHaveLength(1225);
    });

    it('should compute flow edges for 50 flows with 5 steps each in under 100ms', () => {
      const flowNodes = Array.from({ length: 50 }, (_, fi) =>
        makeFlowNode({
          nodeId: `flow-${fi}`,
          steps: Array.from({ length: 5 }, (_, si) => ({
            stepId: `flow-${fi}-step-${si}`,
            name: `Step ${si}`,
            actor: 'User',
            order: si,
            type: si === 2 ? 'branch' : 'normal' as const,
          })),
        })
      );
      const start = performance.now();
      const { result } = renderHook(() =>
        useCanvasRenderer({ contextNodes: [], flowNodes, componentNodes: [] })
      );
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
      // 50 flows × 4 edges each = 200 flow edges
      expect(result.current.flowEdges).toHaveLength(200);
    });
  });
});
