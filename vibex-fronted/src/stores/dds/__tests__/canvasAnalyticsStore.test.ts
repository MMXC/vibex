/**
 * canvasAnalyticsStore.test.ts — S71-E4
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasAnalyticsStore } from '../canvasAnalyticsStore';

describe('canvasAnalyticsStore', () => {
  beforeEach(() => {
    useCanvasAnalyticsStore.setState({ editingStats: {} });
  });

  it('recordEdit increments totalEdits', () => {
    useCanvasAnalyticsStore.getState().recordEdit('c1', 'n1', 'position');
    const stats = useCanvasAnalyticsStore.getState().getStats('c1');
    expect(stats.totalEdits).toBe(1);
  });

  it('recordEdit increments per-node count', () => {
    const { recordEdit } = useCanvasAnalyticsStore.getState();
    recordEdit('c1', 'n1', 'position');
    recordEdit('c1', 'n1', 'text');
    recordEdit('c1', 'n2', 'position');
    const stats = useCanvasAnalyticsStore.getState().getStats('c1');
    expect(stats.nodeEdits['n1']).toBe(2);
    expect(stats.nodeEdits['n2']).toBe(1);
  });

  it('getTopNodes returns nodes sorted by edit count', () => {
    const { recordEdit } = useCanvasAnalyticsStore.getState();
    recordEdit('c1', 'n1', 'position');
    recordEdit('c1', 'n1', 'text');
    recordEdit('c1', 'n2', 'position');
    recordEdit('c1', 'n3', 'position');
    const top = useCanvasAnalyticsStore.getState().getTopNodes('c1', 2);
    expect(top).toHaveLength(2);
    expect(top[0].nodeId).toBe('n1');
    expect(top[0].editCount).toBe(2);
    expect(top[1].nodeId).toBe('n2');
  });

  it('exportAnalytics returns CSV', () => {
    const { recordEdit } = useCanvasAnalyticsStore.getState();
    recordEdit('canvas-1', 'node-a', 'position');
    recordEdit('canvas-1', 'node-a', 'text');
    const csv = useCanvasAnalyticsStore.getState().exportAnalytics('canvas-1');
    expect(csv).toContain('canvasId,nodeId,editCount');
    expect(csv).toContain('canvas-1,node-a,2');
  });

  it('clearStats removes canvas data', () => {
    const { recordEdit, clearStats } = useCanvasAnalyticsStore.getState();
    recordEdit('c1', 'n1', 'position');
    clearStats('c1');
    const stats = useCanvasAnalyticsStore.getState().getStats('c1');
    expect(stats.totalEdits).toBe(0);
  });
});
