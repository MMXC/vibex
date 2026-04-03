/**
 * ShortcutEditModal - 快捷键编辑弹窗
 */
// @ts-nocheck


'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useShortcutStore, formatKeyDisplay, parseKeyEvent } from '@/stores/shortcutStore';
import { X, AlertTriangle } from 'lucide-react';
import styles from './shortcuts.module.css';

export function ShortcutEditModal() {
  const {
    editingAction,
    capturedKey,
    conflictInfo,
    shortcuts,
    cancelEditing,
    captureKey,
    saveShortcut,
  } = useShortcutStore();

  const inputRef = useRef<HTMLDivElement>(null);

  const shortcut = shortcuts.find((s) => s.action === editingAction);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Prevent default for most keys to avoid triggering browser shortcuts
      if (e.key !== 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }

      if (e.key === 'Escape') {
        cancelEditing();
        return;
      }

      const keyString = parseKeyEvent(e.nativeEvent);
      captureKey(keyString);
    },
    [captureKey, cancelEditing]
  );

  useEffect(() => {
    if (editingAction && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingAction]);

  if (!editingAction || !shortcut) {
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={cancelEditing}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>修改快捷键</h3>
          <button className={styles.closeBtn} onClick={cancelEditing}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>操作</label>
            <span className={styles.modalValue}>{shortcut.description}</span>
          </div>

          <div className={styles.modalField}>
            <label className={styles.modalLabel}>当前</label>
            <kbd className={styles.key}>
              {formatKeyDisplay(shortcut.currentKey)}
            </kbd>
          </div>

          <div className={styles.modalField}>
            <label className={styles.modalLabel}>请按下新的快捷键</label>
            <div
              ref={inputRef}
              className={`${styles.keyCapture} ${
                capturedKey ? styles.keyCaptureActive : ''
              }`}
              tabIndex={0}
              onKeyDown={handleKeyDown}
            >
              {capturedKey ? (
                <kbd className={styles.key}>
                  {formatKeyDisplay(capturedKey)}
                </kbd>
              ) : (
                <span className={styles.keyPlaceholder}>
                  点击此处，然后按下快捷键...
                </span>
              )}
            </div>
          </div>

          {conflictInfo?.hasConflict && (
            <div className={styles.conflictWarning}>
              <AlertTriangle size={16} />
              <div>
                <strong>冲突</strong>
                <p>
                  此快捷键已被「{conflictInfo.conflictingDescription}」使用
                </p>
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={cancelEditing}>
            取消
          </button>
          <button
            className={styles.saveBtn}
            onClick={saveShortcut}
            disabled={!capturedKey || conflictInfo?.hasConflict}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
