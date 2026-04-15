import { describe, it, expect } from 'vitest';
import { computeSnapshotDiff } from '../snapshotDiff';
import type { CanvasSnapshot } from '../types';

const makeSnap = (ctx: string[], flow: string[], comp: string[]): CanvasSnapshot => ({
  snapshotId: 'test',
  projectId: 'p1',
  createdAt: new Date().toISOString(),
  data: '',
  contextNodes: ctx.map((name, i) => ({ nodeId: `c${i}`, name, description: '', type: 'core' })),
  flowNodes: flow.map((name, i) => ({ nodeId: `f${i}`, name, description: '' })),
  componentNodes: comp.map((name, i) => ({ nodeId: `co${i}`, name, description: '', type: 'atomic' })),
});

describe('snapshotDiff', () => {
  it('detects added nodes', () => {
    const a = makeSnap(['A'], ['FA'], ['CoA']);
    const b = makeSnap(['A', 'B'], ['FA', 'FB'], ['CoA', 'CoB']);
    const r = computeSnapshotDiff(a, b);
    expect(r.summary.contextsAdded).toBe(1);
    expect(r.summary.contextsRemoved).toBe(0);
    expect(r.summary.flowsAdded).toBe(1);
    expect(r.summary.componentsAdded).toBe(1);
  });
  it('detects removed nodes', () => {
    const a = makeSnap(['A', 'B'], ['FA', 'FB'], ['CoA', 'CoB']);
    const b = makeSnap(['A'], ['FA'], ['CoA']);
    const r = computeSnapshotDiff(a, b);
    expect(r.summary.contextsRemoved).toBe(1);
    expect(r.summary.flowsRemoved).toBe(1);
    expect(r.summary.componentsRemoved).toBe(1);
  });
  it('handles empty snapshots', () => {
    const a = makeSnap([], [], []);
    const b = makeSnap([], [], []);
    const r = computeSnapshotDiff(a, b);
    expect(r.summary.contextsAdded).toBe(0);
    expect(r.summary.contextsRemoved).toBe(0);
  });
  it('marks unchanged nodes correctly', () => {
    const a = makeSnap(['A'], ['FA'], ['CoA']);
    const b = makeSnap(['A'], ['FA'], ['CoA']);
    const r = computeSnapshotDiff(a, b);
    expect(r.contextDiff).toHaveLength(0);
    expect(r.flowDiff).toHaveLength(0);
    expect(r.componentDiff).toHaveLength(0);
  });
});
