/**
 * ShortcutEditor.tsx — Keyboard Shortcut Editor (Dedicated Key Recorder)
 * S67-E4: 画布快捷键可配置化
 *
 * Dedicated modal for recording a key combo and saving it to an action.
 * Standalone component that can be used independently or inside ShortcutSettingsPanel.
 */
'use client';

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useShortcutStore } from '@/stores/shortcutStore';
import styles from './ShortcutEditor.module.css';

interface ShortcutEditorProps {
  /** The action being edited */
  action: string;
  /** Description of the action */
  description: string;
  /** Current key */
  currentKey: string;
  /** Default key */
  defaultKey: string;
  /** Called when editor is closed */
  onClose: () => void;
}

/** Normalize a KeyboardEvent to a key combo string */
function normalizeKeyCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  if (e.metaKey) parts.push('Cmd');

  let key = e.key;
  if (key === ' ') key = 'Space';
  if (key === 'ArrowUp') key = 'Up';
  if (key === 'ArrowDown') key = 'Down';
  if (key === 'ArrowLeft') key = 'Left';
  if (key === 'ArrowRight') key = 'Right';
  if (key.length === 1) key = key.toUpperCase();

  if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
    return parts.length > 1 ? parts.join('+') + '+' + key : '';
  }

  if (parts.length === 0) return key;
  return parts.join('+') + '+' + key;
}

const KEY_DISPLAY: Record<string, string> = {
  Cmd: '⌘', Shift: '⇧', Alt: '⌥', Ctrl: '⌃',
  Delete: 'Delete', Backspace: '⌫', Escape: 'Esc',
  ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
};

function formatDisplayKey(key: string): string {
  return key.split('+').map(part => KEY_DISPLAY[part] ?? part).join('+');
}

export const ShortcutEditor = memo<ShortcutEditorProps>(
  ({ action, description, currentKey, defaultKey, onClose }) => {
    const [recordedKey, setRecordedKey] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);

    const shortcuts = useShortcutStore(s => s.shortcuts);
    const addBinding = useShortcutStore(s => s.addBinding);
    const removeBinding = useShortcutStore(s => s.removeBinding);

    // Find the conflict if any
    const conflict = recordedKey
      ? shortcuts.find(s => s.currentKey === recordedKey && s.action !== action)
      : null;

    useEffect(() => {
      inputRef.current?.focus();
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      const combo = normalizeKeyCombo(e.nativeEvent);
      if (combo) {
        setRecordedKey(combo);
        setIsListening(false);
      }
    }, [onClose]);

    const handleClear = useCallback(() => {
      setRecordedKey(null);
      setIsListening(true);
      inputRef.current?.focus();
    }, []);

    const handleSave = useCallback(() => {
      if (!recordedKey) return;
      if (conflict) {
        alert(`快捷键冲突: "${formatDisplayKey(recordedKey)}" 已被 "${conflict.description}" 使用`);
        return;
      }
      const result = addBinding(action, recordedKey);
      if (!result.success) {
        alert(`保存失败: ${result.error}`);
        return;
      }
      onClose();
    }, [recordedKey, conflict, addBinding, action, onClose]);

    const handleReset = useCallback(() => {
      removeBinding(action);
      onClose();
    }, [removeBinding, action, onClose]);

    const effectiveKey = recordedKey ?? currentKey;
    const isCustom = effectiveKey !== defaultKey;

    return (
      <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className={styles.modal} role="dialog" aria-modal="true" aria-label={`编辑快捷键: ${description}`}>
          <div className={styles.header}>
            <h3 className={styles.title}>编辑快捷键</h3>
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="关闭">✕</button>
          </div>

          <div className={styles.body}>
            <p className={styles.actionLabel}>{description}</p>

            <div className={styles.keyDisplay}>
              {isListening ? (
                <span className={styles.listening}>按下任意快捷键...</span>
              ) : recordedKey ? (
                <span className={conflict ? styles.keyConflict : styles.keyRecorded}>
                  {formatDisplayKey(recordedKey)}
                </span>
              ) : (
                <span className={styles.keyDefault}>{formatDisplayKey(currentKey)}</span>
              )}
            </div>

            {conflict && (
              <p className={styles.conflictWarning} role="alert">
                ⚠️ 快捷键冲突: 已绑定到 "{conflict.description}"
              </p>
            )}

            {isCustom && !conflict && (
              <p className={styles.customNote}>
                ✏️ 自定义快捷键 (默认: {formatDisplayKey(defaultKey)})
              </p>
            )}
          </div>

          <div className={styles.footer}>
            <input
              ref={inputRef}
              type="text"
              className={styles.hiddenInput}
              onKeyDown={handleKeyDown}
              aria-label="按下快捷键"
              autoFocus
            />
            <button type="button" className={styles.clearBtn} onClick={handleClear}>
              重新录制
            </button>
            <button type="button" className={styles.resetBtn} onClick={handleReset}>
              恢复默认
            </button>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={!recordedKey || !!conflict}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    );
  }
);

ShortcutEditor.displayName = 'ShortcutEditor';
