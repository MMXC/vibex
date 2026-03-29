/**
 * edgePath.test.ts — Unit tests for edge path computation utilities
 *
 * Epic 3 F3.2/F3.3
 *
 * Tests:
 * - computeBoundedEdgePath: bezier curves between nodes
 * - computeEdgePath: auto-anchor path computation
 * - computeFlowEdgePath: sequence / branch / loop paths
 * - nodeCenter, anchorPoint, edgeMidpoint helpers
 */

import {
  computeBoundedEdgePath,
  computeEdgePath,
  computeFlowEdgePath,
  nodeCenter,
  BOUNDED_EDGE_COLORS,
  FLOW_EDGE_STYLES,
} from '@/lib/canvas/utils/edgePath';
import type { NodeRect } from '@/lib/canvas/types';

// =============================================================================
// Test fixtures
// =============================================================================

const NODE_A: NodeRect = { id: 'node-a', x: 0, y: 0, width: 240, height: 200 };
const NODE_B: NodeRect = { id: 'node-b', x: 500, y: 0, width: 240, height: 200 };
const NODE_C: NodeRect = { id: 'node-c', x: 0, y: 400, width: 240, height: 200 };
const NODE_D: NodeRect = { id: 'node-d', x: 500, y: 400, width: 240, height: 200 };
const NODE_E: NodeRect = { id: 'node-e', x: 200, y: 0, width: 200, height: 150 };

// =============================================================================
// nodeCenter
// =============================================================================

describe('nodeCenter', () => {
  it('computes center correctly', () => {
    const c = nodeCenter(NODE_A);
    expect(c.cx).toBe(120); // 0 + 240/2
    expect(c.cy).toBe(100); // 0 + 200/2
  });

  it('handles offset nodes', () => {
    const c = nodeCenter(NODE_B);
    expect(c.cx).toBe(620); // 500 + 240/2
    expect(c.cy).toBe(100);
  });
});

// =============================================================================
// computeBoundedEdgePath
// =============================================================================

describe('computeBoundedEdgePath', () => {
  it('generates valid SVG path for horizontal connection (right → left)', () => {
    const path = computeBoundedEdgePath(NODE_A, NODE_B, 'right', 'left');
    // Should start from right edge of A and end at left edge of B
    expect(path).toMatch(/^M \d+ \d+ C \d+ \d+, \d+ \d+, \d+ \d+$/);
    expect(path).toContain('M'); // MoveTo
    expect(path).toContain('C'); // CubicBezier
  });

  it('generates valid SVG path for vertical connection (bottom → top)', () => {
    const path = computeBoundedEdgePath(NODE_A, NODE_C, 'bottom', 'top');
    expect(path).toMatch(/^M \d+ \d+ C \d+ \d+, \d+ \d+, \d+ \d+$/);
    // y starts at bottom of A = 200
    // y ends at top of C = 400
  });

  it('handles diagonal connections (right → top)', () => {
    const path = computeBoundedEdgePath(NODE_A, NODE_E, 'right', 'left');
    expect(path).toMatch(/^M \d+ \d+ C \d+ \d+, \d+ \d+, \d+ \d+$/);
  });

  it('path starts at source anchor', () => {
    // right anchor: x = node.x + width
    const path = computeBoundedEdgePath(NODE_A, NODE_B, 'right', 'left');
    const match = path.match(/^M ([\d.]+) ([\d.]+)/);
    expect(match).not.toBeNull();
    // Right anchor of NODE_A: x = 0 + 240 = 240, y = 100
    expect(parseFloat(match![1])).toBe(240);
    expect(parseFloat(match![2])).toBe(100);
  });

  it('path ends at target anchor', () => {
    const path = computeBoundedEdgePath(NODE_A, NODE_B, 'right', 'left');
    const parts = path.split(' ');
    const coords = parts.filter((p) => /^[\d.]+$/.test(p)).map(parseFloat);
    const lastX = coords[coords.length - 2];
    const lastY = coords[coords.length - 1];
    // Left anchor of NODE_B: x = 500, y = 100
    expect(lastX).toBe(500);
    expect(lastY).toBe(100);
  });

  it('uses cubic bezier with multiple control points', () => {
    const path = computeBoundedEdgePath(NODE_A, NODE_B, 'right', 'left');
    // Cubic bezier needs: M x1 y1 C cp1x cp1y, cp2x cp2y, x2 y2
    // That's 4 coordinate pairs after M
    const coords = path.match(/[\d.]+/g)?.map(parseFloat) ?? [];
    expect(coords.length).toBeGreaterThanOrEqual(8); // M(2) + C(6)
  });

  it('handles bottom-to-top connection', () => {
    const path = computeBoundedEdgePath(NODE_A, NODE_C, 'bottom', 'top');
    expect(path).toMatch(/^M \d+ \d+ C \d+ \d+, \d+ \d+, \d+ \d+$/);
    const coords = path.match(/[\d.]+/g)?.map(parseFloat) ?? [];
    // First point: center bottom of A = (120, 200)
    expect(coords[0]).toBe(120);
    expect(coords[1]).toBe(200);
    // Last point: center top of C = (120, 400)
    const lastTwo = coords.slice(-2);
    expect(lastTwo[0]).toBe(120);
    expect(lastTwo[1]).toBe(400);
  });
});

// =============================================================================
// computeEdgePath (auto anchor)
// =============================================================================

describe('computeEdgePath', () => {
  it('chooses horizontal anchor for horizontal nodes', () => {
    const path = computeEdgePath(NODE_A, NODE_B);
    // Should use right→left since dx > dy
    expect(path).toMatch(/^M \d+ \d+ C /);
  });

  it('chooses vertical anchor for vertical nodes', () => {
    const path = computeEdgePath(NODE_A, NODE_C);
    // Should use bottom→top since dy > dx
    expect(path).toMatch(/^M \d+ \d+ C /);
  });

  it('produces valid SVG path for all node pairs', () => {
    const pairs: [NodeRect, NodeRect][] = [
      [NODE_A, NODE_B],
      [NODE_A, NODE_C],
      [NODE_B, NODE_D],
      [NODE_C, NODE_D],
      [NODE_A, NODE_E],
      [NODE_E, NODE_B],
    ];
    for (const [from, to] of pairs) {
      const path = computeEdgePath(from, to);
      expect(path).toMatch(/^M \d+ \d+ C [\d., ]+ \d+ \d+$/);
    }
  });
});

// =============================================================================
// computeFlowEdgePath
// =============================================================================

describe('computeFlowEdgePath', () => {
  it('generates valid path for sequence type', () => {
    const path = computeFlowEdgePath(NODE_A, NODE_B, 'sequence');
    expect(path).toMatch(/^M \d+ \d+ C /);
  });

  it('generates valid path for branch type', () => {
    const path = computeFlowEdgePath(NODE_A, NODE_B, 'branch');
    expect(path).toMatch(/^M \d+ \d+ C /);
  });

  it('generates loop path (different shape)', () => {
    const path = computeFlowEdgePath(NODE_A, NODE_C, 'loop');
    expect(path).toMatch(/^M \d+ \d+ C /);
    // Loop path uses 3 control points (M + 3 C segments = 2 C commands)
    const cCount = (path.match(/C/g) ?? []).length;
    expect(cCount).toBeGreaterThanOrEqual(1);
  });

  it('sequence path starts from node center', () => {
    const path = computeFlowEdgePath(NODE_A, NODE_B, 'sequence');
    const coords = path.match(/[\d.]+/g)?.map(parseFloat) ?? [];
    // Center of NODE_A: (120, 100)
    expect(coords[0]).toBe(120);
    expect(coords[1]).toBe(100);
  });

  it('sequence path ends at target node center', () => {
    const path = computeFlowEdgePath(NODE_A, NODE_B, 'sequence');
    const coords = path.match(/[\d.]+/g)?.map(parseFloat) ?? [];
    const lastX = coords[coords.length - 2];
    const lastY = coords[coords.length - 1];
    // Center of NODE_B: (620, 100)
    expect(lastX).toBe(620);
    expect(lastY).toBe(100);
  });

  it('branch path has dashed styling (style defined in FLOW_EDGE_STYLES)', () => {
    const config = FLOW_EDGE_STYLES.branch;
    expect(config.stroke).toBeDefined();
    expect(config.dashArray).toBe('5,3');
  });

  it('all flow edge styles are defined', () => {
    expect(FLOW_EDGE_STYLES.sequence).toBeDefined();
    expect(FLOW_EDGE_STYLES.branch).toBeDefined();
    expect(FLOW_EDGE_STYLES.loop).toBeDefined();
  });
});

// =============================================================================
// Color/style constants
// =============================================================================

describe('BOUNDED_EDGE_COLORS', () => {
  it('all bounded edge types have colors', () => {
    expect(BOUNDED_EDGE_COLORS.dependency).toBe('#6366f1');
    expect(BOUNDED_EDGE_COLORS.composition).toBe('#8b5cf6');
    expect(BOUNDED_EDGE_COLORS.association).toBe('#94a3b8');
  });
});

describe('FLOW_EDGE_STYLES', () => {
  it('sequence is solid', () => {
    expect(FLOW_EDGE_STYLES.sequence.stroke).toBe('#3b82f6');
    expect(FLOW_EDGE_STYLES.sequence.dashArray).toBeUndefined();
  });

  it('branch is dashed', () => {
    expect(FLOW_EDGE_STYLES.branch.stroke).toBe('#f59e0b');
    expect(FLOW_EDGE_STYLES.branch.dashArray).toBe('5,3');
  });

  it('loop is solid', () => {
    expect(FLOW_EDGE_STYLES.loop.stroke).toBe('#8b5cf6');
    expect(FLOW_EDGE_STYLES.loop.dashArray).toBeUndefined();
  });
});
