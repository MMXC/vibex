/**
 * wsRevisionHandler.test.ts — Sprint53 E2: Undo/Redo 协作冲突处理
 *
 * 测试 revision:bump 和 revision:conflict WebSocket 消息处理
 * 使用 store 注入模式（避免动态 import mock 问题）
 */

import { describe, it, expect } from 'vitest';
import { handleRevisionWSMessage } from '../wsRevisionHandler';

describe('wsRevisionHandler', () => {
  describe('handleRevisionWSMessage — revision:bump', () => {
    it('calls setBaseRevision with correct revision number', () => {
      const calls: number[] = [];
      const store = {
        setBaseRevision: (revision: number) => calls.push(revision),
        triggerConflictToast: () => {},
      };

      const msg = {
        type: 'revision:bump' as const,
        payload: { canvasId: 'canvas-1', revision: 5 },
      };

      handleRevisionWSMessage(msg, store);

      expect(calls).toEqual([5]);
    });

    it('handles bump with zero revision', () => {
      const calls: number[] = [];
      const store = {
        setBaseRevision: (revision: number) => calls.push(revision),
        triggerConflictToast: () => {},
      };

      const msg = {
        type: 'revision:bump' as const,
        payload: { canvasId: 'canvas-1', revision: 0 },
      };

      handleRevisionWSMessage(msg, store);

      expect(calls).toEqual([0]);
    });
  });

  describe('handleRevisionWSMessage — revision:conflict', () => {
    it('calls triggerConflictToast with canvasId and revision numbers', () => {
      const calls: Array<{canvasId: string; remote: number; local: number}> = [];
      const store = {
        setBaseRevision: () => {},
        triggerConflictToast: (canvasId: string, remote: number, local: number) =>
          calls.push({ canvasId, remote, local }),
      };

      const msg = {
        type: 'revision:conflict' as const,
        payload: {
          canvasId: 'canvas-1',
          remoteRevision: 10,
          localRevision: 7,
        },
      };

      handleRevisionWSMessage(msg, store);

      expect(calls).toEqual([{ canvasId: 'canvas-1', remote: 10, local: 7 }]);
    });

    it('handles conflict with same local and remote revision', () => {
      const calls: Array<{canvasId: string; remote: number; local: number}> = [];
      const store = {
        setBaseRevision: () => {},
        triggerConflictToast: (canvasId: string, remote: number, local: number) =>
          calls.push({ canvasId, remote, local }),
      };

      const msg = {
        type: 'revision:conflict' as const,
        payload: {
          canvasId: 'canvas-2',
          remoteRevision: 5,
          localRevision: 5,
        },
      };

      handleRevisionWSMessage(msg, store);

      expect(calls).toEqual([{ canvasId: 'canvas-2', remote: 5, local: 5 }]);
    });

    it('does not call setBaseRevision on conflict', () => {
      const setCalls: number[] = [];
      const toastCalls: Array<{canvasId: string; remote: number; local: number}> = [];
      const store = {
        setBaseRevision: (r: number) => setCalls.push(r),
        triggerConflictToast: (canvasId: string, remote: number, local: number) =>
          toastCalls.push({ canvasId, remote, local }),
      };

      const msg = {
        type: 'revision:conflict' as const,
        payload: {
          canvasId: 'canvas-3',
          remoteRevision: 12,
          localRevision: 3,
        },
      };

      handleRevisionWSMessage(msg, store);

      expect(setCalls).toHaveLength(0);
      expect(toastCalls).toHaveLength(1);
    });
  });

  describe('handleRevisionWSMessage — unknown type', () => {
    it('does not throw for unknown message type (default case)', () => {
      const consoleSpy = { warn: vi.fn() };
      const store = {
        setBaseRevision: () => {},
        triggerConflictToast: () => {},
      };
      // @ts-expect-error testing unknown type
      const msg = { type: 'revision:unknown', payload: {} };

      expect(() => handleRevisionWSMessage(msg, store)).not.toThrow();
    });
  });
});
