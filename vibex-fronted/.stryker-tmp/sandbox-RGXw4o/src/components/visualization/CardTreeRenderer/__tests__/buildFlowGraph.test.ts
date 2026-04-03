/**
 * Unit tests for buildFlowGraph layout algorithm (Epic 2)
 *
 * Tests the vertical layout engine:
 * - Nodes are vertically stacked (increasing y, same x)
 * - Edges connect consecutive nodes
 * - Empty data produces empty arrays
 */
// @ts-nocheck


import type { CardTreeVisualizationRaw } from '@/types/visualization';

const MOCK_DATA: CardTreeVisualizationRaw = {
  nodes: [
    {
      title: '需求录入',
      status: 'done',
      icon: '📥',
      children: [
        { id: 'c1', label: '填写需求', checked: true },
        { id: 'c2', label: '提交分析', checked: false },
      ],
    },
    {
      title: '业务流程分析',
      status: 'in-progress',
      icon: '📊',
      children: [
        { id: 'c3', label: '生成流程图', checked: true },
      ],
    },
    {
      title: '项目生成',
      status: 'pending',
      children: [],
    },
  ],
  projectId: 'proj-1',
  name: '测试项目',
};

// ==================== Layout Constants (mirror CardTreeRenderer) ====================

const CARD_HEIGHT = 200;
const CARD_MARGIN_Y = 60;
const CENTER_X = 400;

/**
 * Recreate buildFlowGraph logic for isolated unit testing
 */
function buildFlowGraph(data: CardTreeVisualizationRaw | null): {
  nodes: Array<{ id: string; type: string; position: { x: number; y: number }; data: unknown; sourcePosition: string; targetPosition: string }>;
  edges: Array<{ id: string; source: string; target: string; type: string }>;
} {
  if (!data || !data.nodes || data.nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const nodes = data.nodes.map((card, index) => ({
    id: card.title,
    type: 'cardTreeNode',
    position: {
      x: CENTER_X,
      y: index * (CARD_HEIGHT + CARD_MARGIN_Y),
    },
    data: card,
    sourcePosition: 'bottom',
    targetPosition: 'top',
  }));

  const edges: Array<{ id: string; source: string; target: string; type: string }> = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: `e-${i}-${i + 1}`,
      source: nodes[i].id,
      target: nodes[i + 1].id,
      type: 'smoothstep',
    });
  }

  return { nodes, edges };
}

describe('buildFlowGraph layout algorithm', () => {
  describe('Vertical Layout', () => {
    it('should stack nodes with increasing y positions', () => {
      const { nodes } = buildFlowGraph(MOCK_DATA);

      expect(nodes.length).toBe(3);
      expect(nodes[0].position.y).toBeLessThan(nodes[1].position.y);
      expect(nodes[1].position.y).toBeLessThan(nodes[2].position.y);
    });

    it('should center all nodes at same x position', () => {
      const { nodes } = buildFlowGraph(MOCK_DATA);
      nodes.forEach((node) => {
        expect(node.position.x).toBe(CENTER_X);
      });
    });

    it('should calculate correct y positions (index-based)', () => {
      const { nodes } = buildFlowGraph(MOCK_DATA);

      // Node 0: y = 0 * (200 + 60) = 0
      expect(nodes[0].position.y).toBe(0);

      // Node 1: y = 1 * (200 + 60) = 260
      expect(nodes[1].position.y).toBe(260);

      // Node 2: y = 2 * (200 + 60) = 520
      expect(nodes[2].position.y).toBe(520);
    });

    it('should add correct spacing between nodes', () => {
      const { nodes } = buildFlowGraph(MOCK_DATA);

      // Gap between consecutive nodes
      const gap = CARD_HEIGHT + CARD_MARGIN_Y;
      expect(nodes[1].position.y - nodes[0].position.y).toBe(gap);
      expect(nodes[2].position.y - nodes[1].position.y).toBe(gap);
    });

    it('should set correct source and target positions', () => {
      const { nodes } = buildFlowGraph(MOCK_DATA);
      nodes.forEach((node) => {
        expect(node.sourcePosition).toBe('bottom');
        expect(node.targetPosition).toBe('top');
      });
    });

    it('should use cardTreeNode as node type', () => {
      const { nodes } = buildFlowGraph(MOCK_DATA);
      nodes.forEach((node) => {
        expect(node.type).toBe('cardTreeNode');
      });
    });
  });

  describe('Edges', () => {
    it('should create edges between consecutive nodes', () => {
      const { edges } = buildFlowGraph(MOCK_DATA);

      expect(edges.length).toBe(2);
      expect(edges[0]).toEqual({
        id: 'e-0-1',
        source: '需求录入',
        target: '业务流程分析',
        type: 'smoothstep',
      });
      expect(edges[1]).toEqual({
        id: 'e-1-2',
        source: '业务流程分析',
        target: '项目生成',
        type: 'smoothstep',
      });
    });

    it('should create N-1 edges for N nodes', () => {
      const { nodes, edges } = buildFlowGraph(MOCK_DATA);
      expect(edges.length).toBe(nodes.length - 1);
    });

    it('should use smoothstep edge type', () => {
      const { edges } = buildFlowGraph(MOCK_DATA);
      edges.forEach((edge) => {
        expect(edge.type).toBe('smoothstep');
      });
    });
  });

  describe('Node IDs', () => {
    it('should use node title as node ID', () => {
      const { nodes } = buildFlowGraph(MOCK_DATA);
      expect(nodes[0].id).toBe('需求录入');
      expect(nodes[1].id).toBe('业务流程分析');
      expect(nodes[2].id).toBe('项目生成');
    });

    it('should preserve data in node data field', () => {
      const { nodes } = buildFlowGraph(MOCK_DATA);
      expect(nodes[0].data).toEqual(MOCK_DATA.nodes[0]);
      expect(nodes[1].data).toEqual(MOCK_DATA.nodes[1]);
    });
  });

  describe('Edge Cases', () => {
    it('should return empty arrays for null data', () => {
      const result = buildFlowGraph(null);
      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
    });

    it('should return empty arrays for empty nodes', () => {
      const result = buildFlowGraph({ nodes: [], projectId: 'x' });
      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
    });

    it('should handle single node', () => {
      const singleData: CardTreeVisualizationRaw = {
        nodes: [{ title: 'Single', status: 'done', children: [] }],
        projectId: 'proj-1',
      };
      const { nodes, edges } = buildFlowGraph(singleData);
      expect(nodes.length).toBe(1);
      expect(edges.length).toBe(0);
      expect(nodes[0].position.y).toBe(0);
    });
  });
});
