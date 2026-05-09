/**
 * canvasHistoryStore — Unit Tests
 * P001: U5-P001
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCanvasHistoryStore, MAX_HISTORY, type Command } from '../canvasHistoryStore';

describe('canvasHistoryStore — P001 U5', () => {
  beforeEach(() => {
    useCanvasHistoryStore.setState({ past: [], future: [], isPerforming: false });
  });

  // ---- execute ----

  it('execute pushes command to past and clears future', () => {
    const cmd: Command = {
      id: 'c1',
      execute: vi.fn(),
      rollback: vi.fn(),
      timestamp: Date.now(),
    };
    useCanvasHistoryStore.getState().execute(cmd);
    expect(useCanvasHistoryStore.getState().past).toHaveLength(1);
    expect(useCanvasHistoryStore.getState().future).toHaveLength(0);
    expect(cmd.execute).toHaveBeenCalled();
  });

  it('execute calls cmd.execute()', () => {
    const fn = vi.fn();
    const cmd: Command = { id: 'c1', execute: fn, rollback: vi.fn(), timestamp: Date.now() };
    useCanvasHistoryStore.getState().execute(cmd);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  // ---- undo ----

  it('undo calls rollback and moves command to future', () => {
    const rollbackFn = vi.fn();
    const cmd: Command = {
      id: 'c1',
      execute: vi.fn(),
      rollback: rollbackFn,
      timestamp: Date.now(),
    };
    useCanvasHistoryStore.getState().execute(cmd);

    useCanvasHistoryStore.getState().undo();
    expect(rollbackFn).toHaveBeenCalled();
    expect(useCanvasHistoryStore.getState().past).toHaveLength(0);
    expect(useCanvasHistoryStore.getState().future).toContain(cmd);
  });

  it('undo does nothing when past is empty', () => {
    const rollbackFn = vi.fn();
    const cmd: Command = { id: 'c1', execute: vi.fn(), rollback: rollbackFn, timestamp: Date.now() };
    useCanvasHistoryStore.getState().undo();
    expect(rollbackFn).not.toHaveBeenCalled();
  });

  // ---- redo ----

  it('redo calls execute on the command and moves to past', () => {
    const executeFn = vi.fn();
    const cmd: Command = {
      id: 'c1',
      execute: executeFn,
      rollback: vi.fn(),
      timestamp: Date.now(),
    };
    useCanvasHistoryStore.getState().execute(cmd);
    useCanvasHistoryStore.getState().undo();

    executeFn.mockClear();
    useCanvasHistoryStore.getState().redo();
    expect(executeFn).toHaveBeenCalled();
    expect(useCanvasHistoryStore.getState().past).toContain(cmd);
    expect(useCanvasHistoryStore.getState().future).toHaveLength(0);
  });

  it('redo does nothing when future is empty', () => {
    const executeFn = vi.fn();
    useCanvasHistoryStore.getState().redo();
    expect(executeFn).not.toHaveBeenCalled();
  });

  // ---- 50-step limit ----

  it('past is capped at MAX_HISTORY', () => {
    for (let i = 0; i < MAX_HISTORY + 10; i++) {
      const cmd: Command = {
        id: `c${i}`,
        execute: vi.fn(),
        rollback: vi.fn(),
        timestamp: Date.now(),
      };
      useCanvasHistoryStore.getState().execute(cmd);
    }
    expect(useCanvasHistoryStore.getState().past).toHaveLength(MAX_HISTORY);
  });

  it('oldest command is evicted when limit exceeded', () => {
    const first: Command = {
      id: 'first',
      execute: vi.fn(),
      rollback: vi.fn(),
      timestamp: Date.now(),
    };
    useCanvasHistoryStore.getState().execute(first);

    // Add MAX_HISTORY more to push total to MAX_HISTORY + 1 → first is evicted
    for (let i = 0; i < MAX_HISTORY; i++) {
      const cmd: Command = {
        id: `c${i}`,
        execute: vi.fn(),
        rollback: vi.fn(),
        timestamp: Date.now(),
      };
      useCanvasHistoryStore.getState().execute(cmd);
    }

    expect(useCanvasHistoryStore.getState().past).not.toContain(first);
    expect(useCanvasHistoryStore.getState().past).toHaveLength(MAX_HISTORY);
  });

  // ---- clear ----

  it('clear empties both past and future', () => {
    const cmd: Command = { id: 'c1', execute: vi.fn(), rollback: vi.fn(), timestamp: Date.now() };
    useCanvasHistoryStore.getState().execute(cmd);
    useCanvasHistoryStore.getState().undo();
    useCanvasHistoryStore.getState().clear();
    expect(useCanvasHistoryStore.getState().past).toHaveLength(0);
    expect(useCanvasHistoryStore.getState().future).toHaveLength(0);
  });

  // ---- canUndo / canRedo ----

  it('canUndo true when past has items', () => {
    expect(useCanvasHistoryStore.getState().canUndo()).toBe(false);
    const cmd: Command = { id: 'c1', execute: vi.fn(), rollback: vi.fn(), timestamp: Date.now() };
    useCanvasHistoryStore.getState().execute(cmd);
    expect(useCanvasHistoryStore.getState().canUndo()).toBe(true);
  });

  it('canRedo true when future has items', () => {
    expect(useCanvasHistoryStore.getState().canRedo()).toBe(false);
    const cmd: Command = { id: 'c1', execute: vi.fn(), rollback: vi.fn(), timestamp: Date.now() };
    useCanvasHistoryStore.getState().execute(cmd);
    useCanvasHistoryStore.getState().undo();
    expect(useCanvasHistoryStore.getState().canRedo()).toBe(true);
  });

  // ---- isPerforming guard ----

  it('execute is skipped when isPerforming is true', () => {
    useCanvasHistoryStore.setState({ isPerforming: true });
    const fn = vi.fn();
    const cmd: Command = { id: 'c1', execute: fn, rollback: vi.fn(), timestamp: Date.now() };
    useCanvasHistoryStore.getState().execute(cmd);
    expect(fn).not.toHaveBeenCalled();
    expect(useCanvasHistoryStore.getState().past).toHaveLength(0);
  });

  it('undo is skipped when isPerforming is true', () => {
    useCanvasHistoryStore.setState({ isPerforming: true });
    const rollbackFn = vi.fn();
    const cmd: Command = { id: 'c1', execute: vi.fn(), rollback: rollbackFn, timestamp: Date.now() };
    useCanvasHistoryStore.getState().execute(cmd);
    useCanvasHistoryStore.getState().undo();
    expect(rollbackFn).not.toHaveBeenCalled();
  });

  it('redo is skipped when isPerforming is true', () => {
    useCanvasHistoryStore.setState({ isPerforming: true });
    const executeFn = vi.fn();
    const cmd: Command = { id: 'c1', execute: executeFn, rollback: vi.fn(), timestamp: Date.now() };
    useCanvasHistoryStore.getState().execute(cmd);
    useCanvasHistoryStore.getState().undo();
    useCanvasHistoryStore.getState().redo();
    expect(executeFn).not.toHaveBeenCalled();
  });

  // ---- execute clears future ----

  it('execute clears future (new command after undo)', () => {
    const cmd1: Command = { id: 'c1', execute: vi.fn(), rollback: vi.fn(), timestamp: Date.now() };
    const cmd2: Command = { id: 'c2', execute: vi.fn(), rollback: vi.fn(), timestamp: Date.now() };
    useCanvasHistoryStore.getState().execute(cmd1);
    useCanvasHistoryStore.getState().undo();
    // future now has cmd1
    expect(useCanvasHistoryStore.getState().future).toContain(cmd1);
    useCanvasHistoryStore.getState().execute(cmd2);
    // execute clears future — standard undo/redo behavior
    expect(useCanvasHistoryStore.getState().future).toHaveLength(0);
    expect(useCanvasHistoryStore.getState().past).toContain(cmd2);
    expect(useCanvasHistoryStore.getState().past).not.toContain(cmd1);
  });
});