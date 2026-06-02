/**
 * ConflictDialog.tsx — Sprint53 E2: Undo/Redo 协作冲突处理
 *
 * 三选项冲突对话框：
 * - Discard Local: 丢弃本地修改，采用远程版本
 * - Merge: 保留两者（追加到未来栈，支持后续 redo）
 * - Discard Remote: 丢弃远程修改，保留本地版本
 *
 * 由 canvasHistoryStore.triggerConflictToast() 调用触发
 */

'use client';

import React, { useCallback, useState } from 'react';
import styles from './ConflictDialog.module.css';

// ============================================================================
// Types
// ============================================================================

export type ConflictResolution = 'discard-local' | 'merge' | 'discard-remote';

export interface ConflictDialogProps {
  /** 对话框打开状态 */
  isOpen: boolean;
  /** 画布 ID */
  canvasId: string;
  /** 本地 revision 版本号 */
  localRevision: number;
  /** 远程 revision 版本号 */
  remoteRevision: number;
  /** 用户选择解决方式后的回调 */
  onResolve: (resolution: ConflictResolution) => void;
  /** 关闭对话框（不解决冲突） */
  onClose: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function ConflictDialog({
  isOpen,
  canvasId,
  localRevision,
  remoteRevision,
  onResolve,
  onClose,
}: ConflictDialogProps) {
  const [selected, setSelected] = useState<ConflictResolution | null>(null);

  const handleResolve = useCallback(
    (resolution: ConflictResolution) => {
      setSelected(resolution);
      onResolve(resolution);
    },
    [onResolve]
  );

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      data-testid="conflict-dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Undo/Redo 协作冲突"
    >
      <div className={styles.dialog} data-testid="conflict-dialog">
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title} data-testid="dialog-title">
            ⚠️ 协作冲突检测到
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            data-testid="dialog-close"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        {/* Conflict info */}
        <div className={styles.conflictInfo} data-testid="conflict-info">
          <div className={styles.versionRow}>
            <span className={styles.versionBadge}>
              <span className={styles.versionLabel}>本地版本</span>
              <span className={styles.versionNum} data-testid="local-revision">
                {localRevision}
              </span>
            </span>
            <span className={styles.vs}>vs</span>
            <span className={styles.versionBadge}>
              <span className={styles.versionLabel}>远程版本</span>
              <span className={styles.versionNum} data-testid="remote-revision">
                {remoteRevision}
              </span>
            </span>
          </div>
          <p className={styles.explanation}>
            另一用户在您编辑期间修改了画布。请选择如何解决冲突：
          </p>
        </div>

        {/* Action buttons */}
        <div className={styles.actions} data-testid="dialog-actions">
          <button
            type="button"
            className={`${styles.actionBtn} ${styles['actionBtn--discard-local']}`}
            onClick={() => handleResolve('discard-local')}
            data-testid="btn-discard-local"
          >
            <span className={styles.btnIcon}>🔄</span>
            <span className={styles.btnTitle}>Discard Local</span>
            <span className={styles.btnDesc}>放弃本地修改，采用远程版本</span>
          </button>

          <button
            type="button"
            className={`${styles.actionBtn} ${styles['actionBtn--merge']}`}
            onClick={() => handleResolve('merge')}
            data-testid="btn-merge"
          >
            <span className={styles.btnIcon}>⇄</span>
            <span className={styles.btnTitle}>Merge</span>
            <span className={styles.btnDesc}>保留两者，远程追加到 redo 栈</span>
          </button>

          <button
            type="button"
            className={`${styles.actionBtn} ${styles['actionBtn--discard-remote']}`}
            onClick={() => handleResolve('discard-remote')}
            data-testid="btn-discard-remote"
          >
            <span className={styles.btnIcon}>💾</span>
            <span className={styles.btnTitle}>Discard Remote</span>
            <span className={styles.btnDesc}>丢弃远程修改，保留本地版本</span>
          </button>
        </div>

        {/* Selected indicator */}
        {selected && (
          <div className={styles.selectedIndicator} data-testid="selected-action">
            已选择: {selected === 'discard-local' ? 'Discard Local（采用远程）' : selected === 'discard-remote' ? 'Discard Remote（保留本地）' : 'Merge（合并两者）'}
          </div>
        )}
      </div>
    </div>
  );
}
