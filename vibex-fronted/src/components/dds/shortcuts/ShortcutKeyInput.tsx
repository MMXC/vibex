/**
 * ShortcutKeyInput.tsx — Keyboard Shortcut Key Capture Input
 * Sprint52 E5: 键盘快捷键自定义 UI
 *
 * Input field that captures keydown events and displays the key combination.
 * Shows conflict warning when the same key is already bound to another action.
 */
'use client';

import React, { memo, useCallback, useRef } from 'react';
import { useShortcutStore } from '@/stores/shortcutStore';
import styles from './ShortcutKeyInput.module.css';

interface ShortcutKeyInputProps {
  /** Action being edited */
  action: string;
  /** Current key display */
  currentKey: string;
  /** Whether this input is active */
  isActive: boolean;
  /** Conflict info if any */
  conflictInfo?: { hasConflict: boolean; conflictingDescription?: string } | null;
  /** Called when user presses a key */
  onCapture: (key: string) => void;
  /** Called when user clicks save */
  onSave: () => void;
  /** Called when user clicks cancel */
  onCancel: () => void;
}

/** Normalize a KeyboardEvent to a key combo string */
function normalizeKeyCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  if (e.metaKey) parts.push('Cmd');

  // Get the key
  let key = e.key;
  if (key === ' ') key = 'Space';
  if (key === 'ArrowUp') key = 'Up';
  if (key === 'ArrowDown') key = 'Down';
  if (key === 'ArrowLeft') key = 'Left';
  if (key === 'ArrowRight') key = 'Right';
  if (key.length === 1) key = key.toUpperCase();

  // Skip modifier-only presses
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
    return parts.length > 1 ? parts.join('+') + '+' + key : '';
  }

  if (parts.length === 0) return key;
  return parts.join('+') + '+' + key;
}

export const ShortcutKeyInput = memo<ShortcutKeyInputProps>(
  ({ action, currentKey, isActive, conflictInfo, onCapture, onSave, onCancel }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.key === 'Escape') {
          onCancel();
          return;
        }

        if (e.key === 'Enter') {
          if (!conflictInfo?.hasConflict) {
            onSave();
          }
          return;
        }

        const combo = normalizeKeyCombo(e.nativeEvent);
        if (combo) {
          onCapture(combo);
        }
      },
      [conflictInfo, onCapture, onSave, onCancel]
    );

    const handleFocus = useCallback(() => {
      inputRef.current?.focus();
    }, []);

    return (
      <div className={styles.wrapper}>
        <input
          ref={inputRef}
          type="text"
          className={`${styles.input} ${conflictInfo?.hasConflict ? styles.inputConflict : ''}`}
          value={isActive ? '按下快捷键...' : currentKey}
          readOnly
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          aria-label={`快捷键: ${action}`}
          aria-describedby={conflictInfo?.hasConflict ? `${action}-conflict` : undefined}
        />
        {isActive && (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={onSave}
              disabled={!!conflictInfo?.hasConflict}
              title="保存"
            >
              ✓
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onCancel}
              title="取消"
            >
              ✕
            </button>
          </div>
        )}
        {conflictInfo?.hasConflict && (
          <span id={`${action}-conflict`} className={styles.conflict} role="alert">
            ⚠️ 冲突: {conflictInfo.conflictingDescription}
          </span>
        )}
      </div>
    );
  }
);

ShortcutKeyInput.displayName = 'ShortcutKeyInput';
