'use client';

/**
 * ImportConflictDialog — Canvas import conflict resolution
 * S81-E1: 画布导入格式支持
 *
 * Triggered when the user tries to import a canvas whose name
 * matches an already-existing canvas in the store.
 *
 * Options:
 * 1. 覆盖 — overwrite the existing canvas with the imported one
 * 2. 重命名 — import with a new name (user provides it)
 * 3. 取消 — abort the import
 */

import React, { useState } from 'react';
import type { ImportConflictAction } from '@/services/canvas/CanvasImporter';
import styles from './ImportConflictDialog.module.css';

export interface ImportConflictDialogProps {
  /** 导入的画布名称 */
  incomingName: string;
  /** 已存在画布的名称 */
  existingName: string;
  onAction: (action: ImportConflictAction, renamedName?: string) => void;
}

/**
 * ImportConflictDialog — modal for resolving name conflicts during canvas import.
 *
 * @example
 * {conflict && (
 *   <ImportConflictDialog
 *     incomingName={conflict.incomingName}
 *     existingName={conflict.existingName}
 *     onAction={(action, renamed) => { ... }}
 *   />
 * )}
 */
export function ImportConflictDialog({
  incomingName,
  existingName,
  onAction,
}: ImportConflictDialogProps) {
  const [renamedName, setRenamedName] = useState(`${incomingName} (副本)`);

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-label="画布名称冲突"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onAction('cancel'); }}
    >
      <div className={styles.dialog}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.icon} aria-hidden="true">⚠️</span>
          <h2 className={styles.title}>画布名称冲突</h2>
        </div>

        {/* Body */}
        <p className={styles.message}>
          导入的画布 <strong>{incomingName}</strong> 与已存在的画布名称相同。
          请选择处理方式：
        </p>

        <div className={styles.existingInfo}>
          <span className={styles.label}>已存在：</span>
          <span className={styles.existingName}>{existingName}</span>
        </div>

        {/* Rename input */}
        <div className={styles.renameSection}>
          <label className={styles.label} htmlFor="import-rename-input">
            重命名为：
          </label>
          <input
            id="import-rename-input"
            className={styles.renameInput}
            type="text"
            value={renamedName}
            onChange={(e) => setRenamedName(e.target.value)}
            aria-label="重命名画布名称"
          />
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.btnDanger}`}
            onClick={() => onAction('cover')}
            aria-label="覆盖已有画布"
          >
            覆盖
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => onAction('rename', renamedName)}
            aria-label="使用新名称导入"
            disabled={!renamedName.trim()}
          >
            重命名导入
          </button>
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={() => onAction('cancel')}
            aria-label="取消导入"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
