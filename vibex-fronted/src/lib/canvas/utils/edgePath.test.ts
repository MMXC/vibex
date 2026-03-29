/**
 * edgePath.test.ts — BoundedEdge / FlowEdge 贝塞尔曲线路径测试
 *
 * Epic 1: bestAnchor 单元测试覆盖
 */
import { bestAnchor, computeEdgePath, computeBoundedEdgePath } from './edgePath';
import type { NodeRect } from './types';

const card = (x: number, y: number, w = 280, h = 120): NodeRect => ({
  x, y, width: w, height: h,
});

describe('bestAnchor', () => {
  test('水平右: dx > 0, dy ≈ 0 → right→left', () => {
    const result = bestAnchor(card(0, 0), card(400, 10));
    expect(result.fromAnchor).toBe('right');
    expect(result.toAnchor).toBe('left');
  });

  test('水平左: dx < 0, dy ≈ 0 → left→right', () => {
    const result = bestAnchor(card(400, 0), card(0, 10));
    expect(result.fromAnchor).toBe('left');
    expect(result.toAnchor).toBe('right');
  });

  test('垂直下: dx ≈ 0, dy > 0 → bottom→top', () => {
    const result = bestAnchor(card(0, 0), card(10, 300));
    expect(result.fromAnchor).toBe('bottom');
    expect(result.toAnchor).toBe('top');
  });

  test('垂直上: dx ≈ 0, dy < 0 → top→bottom', () => {
    const result = bestAnchor(card(0, 300), card(10, 0));
    expect(result.fromAnchor).toBe('top');
    expect(result.toAnchor).toBe('bottom');
  });

  test('右下: dx > 0, dy > 0 → 水平锚点（dx >= dy*0.5 满足）', () => {
    const result = bestAnchor(card(0, 0), card(400, 300));
    expect(['right', 'left']).toContain(result.fromAnchor);
    expect(['left', 'right']).toContain(result.toAnchor);
  });

  test('右上: dx > 0, dy < 0 → 水平锚点', () => {
    const result = bestAnchor(card(0, 300), card(400, 0));
    expect(['right', 'left']).toContain(result.fromAnchor);
    expect(['left', 'right']).toContain(result.toAnchor);
  });

  test('左下: dx < 0, dy > 0 → 水平锚点', () => {
    const result = bestAnchor(card(400, 0), card(0, 300));
    expect(['right', 'left']).toContain(result.fromAnchor);
    expect(['left', 'right']).toContain(result.toAnchor);
  });

  test('左上: dx < 0, dy < 0 → 水平锚点', () => {
    const result = bestAnchor(card(400, 300), card(0, 0));
    expect(['right', 'left']).toContain(result.fromAnchor);
    expect(['left', 'right']).toContain(result.toAnchor);
  });

  test('临界: absDx == absDy → 水平锚点优先（threshold 0.5 使水平优先）', () => {
    const result = bestAnchor(card(0, 0), card(200, 200));
    expect(['right', 'left']).toContain(result.fromAnchor);
  });

  test('窄幅水平: dx 小但 dy 更小 → 水平锚点（threshold 0.5）', () => {
    // dx=50, dy=80 → absDx >= absDy*0.5 → 50 >= 40 → true → 水平
    const result = bestAnchor(card(0, 0), card(50, 80));
    expect(['right', 'left']).toContain(result.fromAnchor);
  });

  test('窄幅垂直: dx 很小，dy 较大 → 垂直锚点', () => {
    // dx=30, dy=200 → absDx >= absDy*0.5 → 30 >= 100 → false → 垂直
    const result = bestAnchor(card(0, 0), card(30, 200));
    expect(['bottom', 'top']).toContain(result.fromAnchor);
  });
});

describe('computeEdgePath', () => {
  test('生成有效 SVG path 字符串', () => {
    const path = computeEdgePath(card(0, 0), card(400, 200));
    expect(path).toMatch(/^M \d+ \d+ C \d+ \d+/);
    expect(path).toContain('C'); // Bezier curve
  });

  test('相同位置节点 → 仍生成路径', () => {
    const path = computeEdgePath(card(0, 0), card(0, 0));
    expect(path).toMatch(/^M/);
  });
});

describe('computeBoundedEdgePath', () => {
  test('指定 right→left 锚点生成路径', () => {
    const path = computeBoundedEdgePath(card(0, 0), card(400, 100), 'right', 'left');
    expect(path).toMatch(/^M/);
    expect(path).toContain('C');
  });

  test('指定 bottom→top 锚点生成路径', () => {
    const path = computeBoundedEdgePath(card(0, 0), card(100, 300), 'bottom', 'top');
    expect(path).toMatch(/^M/);
    expect(path).toContain('C');
  });
});
