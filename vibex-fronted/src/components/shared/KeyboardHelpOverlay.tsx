/**
 * KeyboardHelpOverlay — Shows all keyboard shortcuts in a modal overlay
 * E003: Ctrl+G generate + ? help overlay
 */

'use client';

import React, { memo } from 'react';
import styles from './KeyboardHelpOverlay.module.css';

export interface KeyboardHelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutEntry {
  keys: string;
  description: string;
}

const SHORTCUTS: ShortcutEntry[] = [
  { keys: 'Ctrl+G', description: '快速生成 (Quick Generate)' },
  { keys: 'Ctrl+Z', description: '撤销 (Undo)' },
  { keys: 'Ctrl+Shift+Z', description: '重做 (Redo)' },
  { keys: 'Ctrl+K', description: '打开搜索 (Open Search)' },
  { keys: '/', description: '打开搜索 (alternative)' },
  { keys: '+', description: '放大画布 (Zoom In)' },
  { keys: '-', description: '缩小画布 (Zoom Out)' },
  { keys: '0', description: '重置缩放 (Reset Zoom)' },
  { keys: 'N', description: '新建节点 (New Node)' },
  { keys: 'Ctrl+N', description: '新建节点 (Ctrl+New)' },
  { keys: 'Del / Backspace', description: '删除选中节点 (Delete Selected)' },
  { keys: 'Tab', description: '下一个 Tab (Next Tab)' },
  { keys: 'Shift+Tab', description: '上一个 Tab (Previous Tab)' },
  { keys: 'Alt+1', description: '切换到 Context (Context Tab)' },
  { keys: 'Alt+2', description: '切换到 Flow (Flow Tab)' },
  { keys: 'Alt+3', description: '切换到 Component (Component Tab)' },
  { keys: 'Ctrl+Shift+G', description: '从选中生成 Context (Generate Context)' },
  { keys: 'Ctrl+Shift+C', description: '确认选中节点 (Confirm Selected)' },
  { keys: 'Ctrl+Shift+R', description: '设计评审 (Design Review)' },
  { keys: 'Escape', description: '取消选择 / 关闭弹窗 (Cancel / Close)' },
];

export const KeyboardHelpOverlay = memo(function KeyboardHelpOverlay({
  isOpen,
  onClose,
}: KeyboardHelpOverlayProps) {
  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
      data-testid="keyboard-help-overlay"
    >
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>⌨️ 键盘快捷键</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className={styles.list}>
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className={styles.row}>
              <kbd className={styles.key}>{s.keys}</kbd>
              <span className={styles.desc}>{s.description}</span>
            </div>
          ))}
        </div>
        <div className={styles.footer}>按 ? 或 Escape 关闭</div>
      </div>
    </div>
  );
});
