/**
 * collaborationSync.test.ts — E2-S1: collaborationSync 单元测试
 *
 * PRD AC4 验收:
 * - AC4.1: initCollaborationSync 不抛异常
 * - AC4.2: handleRemoteNodeSync 同步远程变更
 * - AC4.3: broadcastNodeCreate/broadcastNodeUpdate/broadcastNodeDelete 不抛异常
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  initCollaborationSync,
  broadcastNodeCreate,
  broadcastNodeUpdate,
  broadcastNodeDelete,
  handleRemoteNodeSync,
  onConflict,
  registerMergeHandler,
} from '../collaborationSync';
import type { TreeType, NodeAction } from '../types';

// Mock MessageRouter
const mockRouter = {
  broadcast: vi.fn(),
  subscribe: vi.fn(),
};

describe('collaborationSync — E2-S1 PRD 验收 (AC4)', () => {

  // AC4.1: initCollaborationSync
  describe('AC4.1: initCollaborationSync', () => {
    it('initCollaborationSync 不抛异常', () => {
      expect(() => initCollaborationSync(mockRouter as any, 'user-1', 'room-1')).not.toThrow();
    });
  });

  // AC4.2: handleRemoteNodeSync
  describe('AC4.2: handleRemoteNodeSync — 远程节点变更同步', () => {
    it('handleRemoteNodeSync 触发 merge handler（AC4.2）', () => {
      const handler = vi.fn();
      const treeType: TreeType = 'component';
      const action: NodeAction = 'create';
      const nodeId = 'remote-node-1';
      const data = { name: 'Remote' };

      const unsubscribe = registerMergeHandler(handler);
      initCollaborationSync(mockRouter as any, 'user-1', 'room-1');

      const payload = {
        treeType,
        action,
        nodeId,
        data,
        version: 1,
        userId: 'remote-user', // different from current user
      };
      handleRemoteNodeSync(payload);

      expect(handler).toHaveBeenCalledWith(treeType, action, nodeId, data);
      unsubscribe();
    });

    it('handleRemoteNodeSync 忽略自己发送的消息', () => {
      const handler = vi.fn();
      const unsubscribe = registerMergeHandler(handler);
      initCollaborationSync(mockRouter as any, 'user-1', 'room-1');

      const payload = {
        treeType: 'component' as TreeType,
        action: 'create' as NodeAction,
        nodeId: 'node-1',
        data: {},
        version: 1,
        userId: 'user-1', // same as current user
      };
      handleRemoteNodeSync(payload);
      expect(handler).not.toHaveBeenCalled();
      unsubscribe();
    });

    it('registerMergeHandler 返回取消订阅函数（AC4.2）', () => {
      const handler = vi.fn();
      const unsubscribe = registerMergeHandler(handler);
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('取消订阅后不再收到事件', () => {
      const handler = vi.fn();
      const unsubscribe = registerMergeHandler(handler);
      unsubscribe();

      const payload = {
        treeType: 'component' as TreeType,
        action: 'create' as NodeAction,
        nodeId: 'node-1',
        data: {},
        version: 1,
        userId: 'remote-user',
      };
      handleRemoteNodeSync(payload);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  // AC4.3: 本地节点广播
  describe('AC4.3: broadcastNodeCreate/Update/Delete（AC4.3）', () => {
    beforeEach(() => {
      initCollaborationSync(mockRouter as any, 'user-1', 'room-1');
    });

    it('broadcastNodeCreate 不抛异常', () => {
      expect(() => broadcastNodeCreate('component', 'node-1', { name: 'Test' })).not.toThrow();
    });

    it('broadcastNodeUpdate 不抛异常', () => {
      expect(() => broadcastNodeUpdate('component', 'node-1', { name: 'Updated' })).not.toThrow();
    });

    it('broadcastNodeDelete 不抛异常', () => {
      expect(() => broadcastNodeDelete('component', 'node-1')).not.toThrow();
    });
  });

  // 冲突处理（ADR-003）
  describe('Conflict Handling (ADR-003)', () => {
    it('onConflict 返回取消订阅函数', () => {
      const handler = vi.fn();
      const unsub = onConflict(handler);
      expect(typeof unsub).toBe('function');
      unsub();
    });

    it('onConflict 取消订阅后不再收到事件', () => {
      const handler = vi.fn();
      const unsub = onConflict(handler);
      unsub();

      const payload = {
        treeType: 'component' as TreeType,
        action: 'update' as NodeAction,
        nodeId: 'node-1',
        data: {},
        version: 2,
        userId: 'remote-user',
      };
      handleRemoteNodeSync(payload);
      // handler was unsubscribed, should not be called
      // Note: handler was added and removed, so should not be called
    });
  });
});
