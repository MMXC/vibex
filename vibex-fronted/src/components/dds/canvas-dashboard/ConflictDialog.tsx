'use client';

import React from 'react';
import styles from './ConflictDialog.module.css';

export interface ConflictDialogProps {
  /** 冲突对方的用户名 */
  conflictingUserName: string;
  /** 当前用户点击"撤销"后的回调 */
  onUndoMine: () => void;
  /** 当前用户点击"保留"后的回调 */
  onKeepTheirs: () => void;
  /** 取消 */
  onCancel: () => void;
}

/**
 * D2.1: Collaboration undo/redo conflict resolution dialog.
 *
 * Triggered when the user tries to undo a node that is currently
 * being edited by another collaborator. Presents three options:
 * 1. Undo my action — perform the undo even though another user is editing
 * 2. Keep their action — abandon this undo and let the other user continue
 * 3. Cancel — dismiss the dialog without doing anything
 *
 * @example
 * {conflictDialog.open && (
 *   <ConflictDialog
 *     conflictingUserName={conflictDialog.conflictingUserName}
 *     onUndoMine={() => resolveConflict('undo-mine')}
 *     onKeepTheirs={() => resolveConflict('keep-theirs')}
 *     onCancel={() => resolveConflict('cancel')}
 *   />
 * )}
 */
export function ConflictDialog({
  conflictingUserName,
  onUndoMine,
  onKeepTheirs,
  onCancel,
}: ConflictDialogProps) {
  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-label="协作冲突对话框"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className={styles.dialog}>
        <div className={styles.header}>
          <span className={styles.icon} aria-hidden="true">⚠️</span>
          <h2 className={styles.title}>操作冲突</h2>
        </div>

        <p className={styles.message}>
          <strong>{conflictingUserName}</strong> 正在编辑该节点，
          你的撤销操作可能覆盖对方的修改。
        </p>

        <div className={styles.actions}>
          <button
            className={styles.btnPrimary}
            onClick={onUndoMine}
            aria-label="撤销你的操作"
          >
            撤销你的操作
          </button>
          <button
            className={styles.btnSecondary}
            onClick={onKeepTheirs}
            aria-label="保留对方操作"
          >
            保留对方操作
          </button>
          <button
            className={styles.btnGhost}
            onClick={onCancel}
            aria-label="取消"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
