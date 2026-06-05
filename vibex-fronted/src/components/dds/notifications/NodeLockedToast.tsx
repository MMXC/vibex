/**
 * NodeLockedToast — Toast notification when user tries to operate on a locked node
 * S66-E2: 协作者冲突检测与通知
 */

'use client';

import React from 'react';
import { useToast } from '@/components/ui/Toast';
import type { NodeLockInfo } from '@/lib/collaboration/presenceStore';

export interface NodeLockedToastOptions {
  nodeId: string;
  lockInfo: NodeLockInfo;
}

/**
 * Show a warning toast when an operation is blocked by a node lock.
 * Usage:
 *   const { showNodeLockedToast } = useNodeLockedToast();
 *   showNodeLockedToast({ nodeId: 'node-1', lockInfo });
 */
export function useNodeLockedToast() {
  const { showToast } = useToast();

  const showNodeLockedToast = React.useCallback(
    (options: NodeLockedToastOptions) => {
      const { lockInfo } = options;
      showToast(
        `节点已被 ${lockInfo.userName} 锁定，操作被阻止`,
        'warning',
        4000
      );
    },
    [showToast]
  );

  return { showNodeLockedToast };
}

/**
 * Utility function to show a locked-node toast given only the lock info.
 * Can be called from anywhere without React hooks.
 */
export function showNodeLockedToastMessage(
  showToastFn: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void,
  lockInfo: NodeLockInfo
) {
  showToastFn(
    `节点已被 ${lockInfo.userName} 锁定，操作被阻止`,
    'warning',
    4000
  );
}
