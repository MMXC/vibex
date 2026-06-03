/**
 * wsConflictHandler.ts — Sprint58 E5: WebSocket 冲突消息处理
 *
 * 职责：
 * - 监听 WebSocket 的 conflict:detected 消息
 * - 解析冲突数据，写入 conflictStore
 * - 触发 ConflictDialog 弹窗
 *
 * 由 useCollaboration.ts 或 WebSocket 消息处理器调用。
 */

import { useConflictStore } from '@/stores/dds/conflictStore';

export interface WSConflictMessage {
  type: 'conflict:detected';
  payload: {
    canvasId: string;
    localRevision: number;
    remoteRevision: number;
    local: unknown;
    remote: unknown;
  };
}

/**
 * 处理 WebSocket 冲突消息。
 * 由 WS 消息路由器在收到 conflict:detected 消息时调用。
 */
export function handleWSConflictMessage(msg: WSConflictMessage): void {
  const { canvasId, localRevision, remoteRevision, local, remote } = msg.payload;

  useConflictStore.getState().setConflict({
    canvasId,
    localRevision,
    remoteRevision,
    local,
    remote,
  });

  console.debug('[wsConflictHandler] Conflict detected and stored:', {
    canvasId,
    localRevision,
    remoteRevision,
  });
}

/**
 * 发送冲突解决消息到 WebSocket。
 * 由 ConflictDialog 在用户选择策略后调用。
 */
export function sendConflictResolution(
  ws: WebSocket | null,
  canvasId: string,
  strategy: 'local' | 'remote' | 'manual',
  manualContent?: string
): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn('[wsConflictHandler] WebSocket not available for conflict resolution');
    return;
  }

  ws.send(
    JSON.stringify({
      type: 'conflict:resolve',
      payload: {
        canvasId,
        strategy,
        ...(strategy === 'manual' && manualContent !== undefined
          ? { mergedContent: manualContent }
          : {}),
      },
    })
  );

  // 清除本地冲突状态
  useConflictStore.getState().clearConflict();
}
