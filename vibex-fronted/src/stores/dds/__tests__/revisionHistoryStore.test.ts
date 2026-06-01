/**
 * revisionHistoryStore.test.ts — Sprint52 E3: Undo/Redo 协作冲突处理
 *
 * Tests for E3 revision-based conflict handling:
 * 1. baseRevision increments on execute()
 * 2. setBaseRevision() updates revision
 * 3. saveHistoryWithRevision() throws RevisionMismatchError on conflict
 * 4. loadHistoryWithRevision() returns revision
 * 5. Conflict callback is invoked on revision conflict
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCanvasHistoryStore } from '../canvasHistoryStore';
import type { Command, RevisionMismatchError } from '../canvasHistoryStore';

// Mock historyDB
vi.mock('@/lib/canvas/historyDB', () => ({
  saveHistoryWithRevision: vi.fn(),
  loadHistoryWithRevision: vi.fn(),
  saveHistoryToDB: vi.fn(),
  loadHistoryFromDB: vi.fn(),
  clearHistoryFromDB: vi.fn(),
}));

const makeCmd = (id: string): Command => ({
  id,
  timestamp: Date.now(),
  execute: vi.fn(),
  rollback: vi.fn(),
  description: `cmd-${id}`,
});

describe('canvasHistoryStore — E3: Revision Conflict Handling', () => {
  beforeEach(() => {
    useCanvasHistoryStore.setState({
      past: [],
      future: [],
      isPerforming: false,
      baseRevision: 0,
      onRevisionConflict: null,
    });
  });

  // ---- baseRevision increments ----

  it('baseRevision starts at 0', () => {
    expect(useCanvasHistoryStore.getState().baseRevision).toBe(0);
  });

  it('execute() increments baseRevision by 1', () => {
    const store = useCanvasHistoryStore.getState();
    store.execute(makeCmd('c1'));
    expect(useCanvasHistoryStore.getState().baseRevision).toBe(1);
  });

  it('execute() increments baseRevision for each command', () => {
    const store = useCanvasHistoryStore.getState();
    store.execute(makeCmd('c1'));
    store.execute(makeCmd('c2'));
    store.execute(makeCmd('c3'));
    expect(useCanvasHistoryStore.getState().baseRevision).toBe(3);
  });

  it('undo() does NOT increment baseRevision', () => {
    const store = useCanvasHistoryStore.getState();
    store.execute(makeCmd('c1'));
    store.execute(makeCmd('c2'));
    expect(useCanvasHistoryStore.getState().baseRevision).toBe(2);
    store.undo();
    expect(useCanvasHistoryStore.getState().baseRevision).toBe(2);
  });

  it('redo() does NOT increment baseRevision', () => {
    const store = useCanvasHistoryStore.getState();
    store.execute(makeCmd('c1'));
    store.execute(makeCmd('c2'));
    store.undo();
    expect(useCanvasHistoryStore.getState().baseRevision).toBe(2);
    store.redo();
    expect(useCanvasHistoryStore.getState().baseRevision).toBe(2);
  });

  // ---- setBaseRevision ----

  it('setBaseRevision() updates revision', () => {
    const store = useCanvasHistoryStore.getState();
    store.execute(makeCmd('c1'));
    expect(useCanvasHistoryStore.getState().baseRevision).toBe(1);
    store.setBaseRevision(5);
    expect(useCanvasHistoryStore.getState().baseRevision).toBe(5);
  });

  it('setBaseRevision() with remote higher revision + local changes triggers conflict callback (discard-local)', () => {
    const handler = vi.fn(() => 'discard-local' as const);
    useCanvasHistoryStore.setState({
      onRevisionConflict: handler,
      baseRevision: 1,
      past: [makeCmd('c1')], // local unsaved changes
    });
    const store = useCanvasHistoryStore.getState();
    store.setBaseRevision(5);
    expect(handler).toHaveBeenCalledWith(1, 5);
    // discard-local: clears local and accepts remote
    expect(useCanvasHistoryStore.getState().baseRevision).toBe(5);
    expect(useCanvasHistoryStore.getState().past).toHaveLength(0);
    expect(useCanvasHistoryStore.getState().future).toHaveLength(0);
  });

  it('setBaseRevision() with remote higher revision + no local changes just updates revision', () => {
    const handler = vi.fn();
    useCanvasHistoryStore.setState({ onRevisionConflict: handler, baseRevision: 0, past: [] });
    const store = useCanvasHistoryStore.getState();
    store.setBaseRevision(3);
    expect(handler).not.toHaveBeenCalled();
    expect(useCanvasHistoryStore.getState().baseRevision).toBe(3);
  });

  it('setBaseRevision() with no callback + conflict just sets revision', () => {
    useCanvasHistoryStore.setState({ onRevisionConflict: null, baseRevision: 1, past: [makeCmd('c1')] });
    const store = useCanvasHistoryStore.getState();
    store.setBaseRevision(5);
    expect(useCanvasHistoryStore.getState().baseRevision).toBe(5);
  });

  // ---- RevisionMismatchError ----

  it('RevisionMismatchError has correct properties', async () => {
    const { RevisionMismatchError } = await import('../canvasHistoryStore');
    const err = new RevisionMismatchError('canvas-1', 3, 5);
    expect(err.canvasId).toBe('canvas-1');
    expect(err.expectedRevision).toBe(3);
    expect(err.actualRevision).toBe(5);
    expect(err.message).toContain('canvas-1');
    expect(err.message).toContain('3');
    expect(err.message).toContain('5');
    expect(err.name).toBe('RevisionMismatchError');
  });

  it('RevisionMismatchError accepts custom message', async () => {
    const { RevisionMismatchError } = await import('../canvasHistoryStore');
    const err = new RevisionMismatchError('canvas-1', 2, 4, 'Custom conflict message');
    expect(err.message).toBe('Custom conflict message');
  });

  // ---- saveHistoryWithRevision (mocked) ----

  it('saveHistoryWithRevision calls dbSaveWithRevision with current baseRevision', async () => {
    // Ensure window.indexedDB is defined so the store doesn't early-return
    Object.defineProperty(window, 'indexedDB', { value: {}, writable: true });
    const { saveHistoryWithRevision: dbMock } = await import('@/lib/canvas/historyDB');
    (dbMock as ReturnType<typeof vi.fn>).mockResolvedValue(2);

    useCanvasHistoryStore.setState({ baseRevision: 1 });
    const store = useCanvasHistoryStore.getState();
    store.execute(makeCmd('c1')); // baseRevision now 2
    await store.saveHistoryWithRevision('canvas-1');

    expect(dbMock).toHaveBeenCalledWith('canvas-1', expect.any(Array), expect.any(Array), 2);
  });

  // ---- loadHistoryWithRevision (mocked) ----

  it('loadHistoryWithRevision returns { past, future, revision }', async () => {
    Object.defineProperty(window, 'indexedDB', { value: {}, writable: true });
    const { loadHistoryWithRevision: dbMock } = await import('@/lib/canvas/historyDB');
    const mockResult = {
      past: [{ id: 'c1', timestamp: 1000 }],
      future: [],
      revision: 5,
    };
    (dbMock as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

    const result = await useCanvasHistoryStore.getState().loadHistoryWithRevision('canvas-1');
    expect(result).toEqual(mockResult);
    expect(result?.revision).toBe(5);
  });

  // ---- setRevisionConflictHandler ----

  it('setRevisionConflictHandler registers the callback', () => {
    const handler = vi.fn(() => 'merge' as const);
    const store = useCanvasHistoryStore.getState();
    store.setRevisionConflictHandler(handler);
    expect(useCanvasHistoryStore.getState().onRevisionConflict).toBe(handler);
  });

  it('setRevisionConflictHandler(null) clears the callback', () => {
    useCanvasHistoryStore.setState({ onRevisionConflict: vi.fn() });
    const store = useCanvasHistoryStore.getState();
    store.setRevisionConflictHandler(null);
    expect(useCanvasHistoryStore.getState().onRevisionConflict).toBeNull();
  });
});
