/**
 * collaborationSync 模块测试
 *
 * 覆盖场景:
 * - 初始化设置当前用户和房间
 * - 获取当前用户 ID
 * - 广播节点创建/更新/删除
 * - 未初始化时不抛错
 *
 * E2-S1: WebSocket 节点同步测试
 * 参考: docs/vibex-fourth/IMPLEMENTATION_PLAN.md §5.1
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('collaborationSync', () => {
  // Mock MessageRouter — must include broadcast method
  const mockRouter = {
    send: vi.fn(),
    broadcast: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    // Re-import to reset module state
    const mod = await import('@/lib/canvas/collaborationSync');
    Object.assign(mod, {});
  });

  describe('initCollaborationSync', () => {
    it('should store userId and roomId', async () => {
      const { initCollaborationSync, getCurrentUserId } = await import('@/lib/canvas/collaborationSync');
      initCollaborationSync(mockRouter as never, 'user-123', 'room-abc');
      expect(getCurrentUserId()).toBe('user-123');
    });

    it('should not throw with null router', async () => {
      const { initCollaborationSync } = await import('@/lib/canvas/collaborationSync');
      expect(() => initCollaborationSync(null as never, 'user-1', 'room-1')).not.toThrow();
    });
  });

  describe('getCurrentUserId', () => {
    it('should return empty string before init', async () => {
      const { getCurrentUserId } = await import('@/lib/canvas/collaborationSync');
      expect(getCurrentUserId()).toBe('');
    });
  });

  describe('broadcastNodeCreate', () => {
    it('should not throw before init', async () => {
      const { broadcastNodeCreate } = await import('@/lib/canvas/collaborationSync');
      expect(() =>
        broadcastNodeCreate('ctx-1', 'component', 'node-abc', { name: 'Test' }, 1)
      ).not.toThrow();
    });

    it('should send message via router after init', async () => {
      const { initCollaborationSync, broadcastNodeCreate } = await import('@/lib/canvas/collaborationSync');
      initCollaborationSync(mockRouter as never, 'user-1', 'room-1');
      broadcastNodeCreate('ctx-1', 'component', 'node-abc', { name: 'Test' }, 1);
      expect(mockRouter.broadcast).toHaveBeenCalled();
    });
  });

  describe('broadcastNodeUpdate', () => {
    it('should not throw before init', async () => {
      const { broadcastNodeUpdate } = await import('@/lib/canvas/collaborationSync');
      expect(() =>
        broadcastNodeUpdate('ctx-1', 'component', 'node-abc', { name: 'Updated' }, 2)
      ).not.toThrow();
    });

    it('should send message via router after init', async () => {
      const { initCollaborationSync, broadcastNodeUpdate } = await import('@/lib/canvas/collaborationSync');
      initCollaborationSync(mockRouter as never, 'user-1', 'room-1');
      broadcastNodeUpdate('ctx-1', 'component', 'node-abc', { name: 'Updated' }, 2);
      expect(mockRouter.broadcast).toHaveBeenCalled();
    });
  });

  describe('broadcastNodeDelete', () => {
    it('should not throw before init', async () => {
      const { broadcastNodeDelete } = await import('@/lib/canvas/collaborationSync');
      expect(() =>
        broadcastNodeDelete('ctx-1', 'component', 'node-abc', 1)
      ).not.toThrow();
    });

    it('should send message via router after init', async () => {
      const { initCollaborationSync, broadcastNodeDelete } = await import('@/lib/canvas/collaborationSync');
      initCollaborationSync(mockRouter as never, 'user-1', 'room-1');
      broadcastNodeDelete('ctx-1', 'component', 'node-abc', 1);
      expect(mockRouter.broadcast).toHaveBeenCalled();
    });
  });
});
