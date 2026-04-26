/**
 * ConflictBubble — 协作冲突提示气泡 / 仲裁弹窗
 * E8-S2: 升级版 ConflictBubble 集成 ConflictDialog
 *
 * 职责：
 * - 订阅 conflictStore.activeConflict
 * - 显示 ConflictDialog（玻璃态弹窗，双按钮仲裁）
 * - 处理 keep-local / use-remote 策略
 */

'use client';

import React, { useCallback } from 'react';
import { useConflictStore } from '@/lib/canvas/stores/conflictStore';
import { ConflictDialog } from '@/components/ConflictDialog';
import type { ConflictData } from '@/lib/canvas/stores/conflictStore';

/** 将 ConflictData 转换为 ConflictDialog 兼容格式 */
function toDialogProps(conflict: ConflictData) {
  return {
    serverSnapshot: {
      snapshotId: `remote-${conflict.nodeId}`,
      version: conflict.remoteVersion,
      createdAt: new Date().toISOString(),
      data: conflict.remoteData as Record<string, unknown>,
    },
    localData: conflict.localData as Record<string, unknown>,
  };
}

/**
 * ConflictBubble — 挂载在 Canvas 外层
 * 无冲突时不渲染任何内容
 */
export function ConflictBubble() {
  const activeConflict = useConflictStore((s) => s.activeConflict);
  const resolveKeepLocal = useConflictStore((s) => s.resolveKeepLocal);
  const resolveUseRemote = useConflictStore((s) => s.resolveUseRemote);
  const dismissConflict = useConflictStore((s) => s.dismissConflict);

  const handleKeepLocal = useCallback(() => {
    if (!activeConflict) return;
    resolveKeepLocal(activeConflict.nodeId);
    dismissConflict();
  }, [activeConflict, resolveKeepLocal, dismissConflict]);

  const handleUseRemote = useCallback(() => {
    if (!activeConflict) return;
    resolveUseRemote(activeConflict.nodeId);
    dismissConflict();
  }, [activeConflict, resolveUseRemote, dismissConflict]);

  const handleMerge = useCallback(() => {
    // E8-S2: merge 策略暂用 keep-local（后续可扩展）
    if (!activeConflict) return;
    resolveKeepLocal(activeConflict.nodeId);
    dismissConflict();
  }, [activeConflict, resolveKeepLocal, dismissConflict]);

  if (!activeConflict) return null;

  const dialogProps = toDialogProps(activeConflict);

  return (
    <ConflictDialog
      serverSnapshot={dialogProps.serverSnapshot as Parameters<typeof ConflictDialog>[0]['serverSnapshot']}
      localData={dialogProps.localData as Parameters<typeof ConflictDialog>[0]['localData']}
      onKeepLocal={handleKeepLocal}
      onUseServer={handleUseRemote}
      onMerge={handleMerge}
    />
  );
}

export default ConflictBubble;
