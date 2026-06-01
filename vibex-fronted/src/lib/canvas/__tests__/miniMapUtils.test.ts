/**
 * miniMapUtils vitest — S51-E3: MiniMap node coloring + sampling
 */
import { describe, it, expect } from 'vitest';
import type { Node } from '@xyflow/react';
import {
  getMiniMapNodeColorKey,
  getMiniMapNodeColor,
  sampleNodesForMiniMap,
  MINI_MAP_COLORS,
} from '../miniMapUtils';

function makeNode(overrides: Partial<Node['data']> & { type?: string; id?: string; position?: { x: number; y: number } } = {}): Node {
  return {
    id: overrides.id ?? `node-${Math.random()}`,
    type: overrides.type,
    position: overrides.position ?? { x: 0, y: 0 },
    data: overrides,
    measured: { width: 200, height: 60 },
  } as unknown as Node;
}

describe('getMiniMapNodeColorKey', () => {
  it('returns user-story for user-story type', () => {
    const node = makeNode({ type: 'user-story' });
    expect(getMiniMapNodeColorKey(node)).toBe('user-story');
  });
  it('returns bounded-context for bounded-context type', () => {
    const node = makeNode({ type: 'bounded-context' });
    expect(getMiniMapNodeColorKey(node)).toBe('bounded-context');
  });
  it('returns flow-step:start for flow-step with start subtype', () => {
    const node = makeNode({ type: 'flow-step', nodeType: 'start' });
    expect(getMiniMapNodeColorKey(node)).toBe('flow-step:start');
  });
  it('returns flow-step:end for flow-step with end subtype', () => {
    const node = makeNode({ type: 'flow-step', nodeType: 'end' });
    expect(getMiniMapNodeColorKey(node)).toBe('flow-step:end');
  });
  it('returns flow-step:process for flow-step with process subtype', () => {
    const node = makeNode({ type: 'flow-step', nodeType: 'process' });
    expect(getMiniMapNodeColorKey(node)).toBe('flow-step:process');
  });
  it('returns flow-step:process for flow-step without subtype', () => {
    const node = makeNode({ type: 'flow-step' });
    expect(getMiniMapNodeColorKey(node)).toBe('flow-step:process');
  });
  it('returns default for unrecognized type', () => {
    const node = makeNode({ type: 'unknown-type' });
    expect(getMiniMapNodeColorKey(node)).toBe('default');
  });
});

describe('getMiniMapNodeColor', () => {
  it('returns blue for user-story nodes', () => {
    const node = makeNode({ type: 'user-story' });
    expect(getMiniMapNodeColor(node)).toBe('#3b82f6');
  });
  it('returns purple for bounded-context nodes', () => {
    const node = makeNode({ type: 'bounded-context' });
    expect(getMiniMapNodeColor(node)).toBe('#8b5cf6');
  });
  it('returns green for flow-step start nodes', () => {
    const node = makeNode({ type: 'flow-step', nodeType: 'start' });
    expect(getMiniMapNodeColor(node)).toBe('#22c55e');
  });
  it('returns red for flow-step end nodes', () => {
    const node = makeNode({ type: 'flow-step', nodeType: 'end' });
    expect(getMiniMapNodeColor(node)).toBe('#ef4444');
  });
  it('returns gray for flow-step process nodes', () => {
    const node = makeNode({ type: 'flow-step', nodeType: 'process' });
    expect(getMiniMapNodeColor(node)).toBe('#6b7280');
  });
  it('returns slate for unknown node types', () => {
    const node = makeNode({ type: 'alien-node' });
    expect(getMiniMapNodeColor(node)).toBe('#64748b');
  });
});

describe('sampleNodesForMiniMap', () => {
  it('returns all nodes when count is 100 or fewer', () => {
    const nodes = Array.from({ length: 50 }, (_, i) =>
      makeNode({ id: `n${i}`, type: 'user-story', position: { x: i * 10, y: 0 } })
    );
    expect(sampleNodesForMiniMap(nodes).length).toBe(50);
  });
  it('samples nodes when count > 100 — result is significantly reduced', () => {
    const nodes = Array.from({ length: 200 }, (_, i) =>
      makeNode({ id: `n${i}`, type: 'user-story', position: { x: i * 10, y: 0 } })
    );
    const sampled = sampleNodesForMiniMap(nodes);
    expect(sampled.length).toBeLessThan(150);
    expect(sampled.length).toBeGreaterThan(0);
  });
  it('returns all nodes for empty array', () => {
    expect(sampleNodesForMiniMap([])).toEqual([]);
  });
  it('preserves at least some nodes from the input set', () => {
    const nodes = Array.from({ length: 102 }, (_, i) =>
      makeNode({ id: `n${i}`, type: 'flow-step', nodeType: 'process', position: { x: i * 5, y: i * 5 } })
    );
    const sampled = sampleNodesForMiniMap(nodes);
    expect(sampled.length).toBeLessThan(110);
    expect(sampled.length).toBeGreaterThan(0);
  });
});

describe('MINI_MAP_COLORS constants', () => {
  it('has all required node type colors defined', () => {
    expect(MINI_MAP_COLORS['user-story']).toBe('#3b82f6');
    expect(MINI_MAP_COLORS['bounded-context']).toBe('#8b5cf6');
    expect(MINI_MAP_COLORS['flow-step:start']).toBe('#22c55e');
    expect(MINI_MAP_COLORS['flow-step:end']).toBe('#ef4444');
    expect(MINI_MAP_COLORS['flow-step:process']).toBe('#6b7280');
    expect(MINI_MAP_COLORS['default']).toBe('#64748b');
  });
});
