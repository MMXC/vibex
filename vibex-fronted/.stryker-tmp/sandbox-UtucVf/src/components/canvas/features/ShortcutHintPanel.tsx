/**
 * ShortcutHintPanel — 快捷键提示面板
 *
 * Epic1 F1.6 实现: 按 ? 键显示快捷键提示面板
 *
 * 遵守约束:
 * - 无 any 类型
 * - 无 console.log
 */
// @ts-nocheck

'use client';

import React from 'react';
import { Keyboard } from 'lucide-react';
import styles from '../canvas.module.css';

interface ShortcutItem {
  /** 显示的快捷键（如 Ctrl+Z） */
  keys: string[];
  /** 描述（如 "撤销"） */
  description: string;
}

const SHORTCUTS: ShortcutItem[] = [
  { keys: ['Ctrl', 'Z'], description: '撤销' },
  { keys: ['Ctrl', 'Shift', 'Z'], description: '重做' },
  { keys: ['Ctrl', 'Y'], description: '重做（Windows）' },
  { keys: ['Ctrl', 'K'], description: '搜索节点' },
  { keys: ['/'], description: '搜索节点（备选）' },
  { keys: ['Ctrl', 'Shift', 'C'], description: '确认选中节点' },
  { keys: ['Ctrl', 'Shift', 'G'], description: '生成上下文' },
  { keys: ['N'], description: '新建节点（当前树）' },
  { keys: ['+'], description: '放大画布' },
  { keys: ['-'], description: '缩小画布' },
  { keys: ['0'], description: '重置缩放' },
  { keys: ['Del'], description: '删除选中节点' },
  { keys: ['Backspace'], description: '删除选中节点' },
  { keys: ['Ctrl', 'A'], description: '全选节点' },
  { keys: ['Esc'], description: '取消选择/关闭对话框/退出最大化' },
  { keys: ['F11'], description: '最大化画布/退出最大化' },
  { keys: ['?'], description: '显示/隐藏本面板' },
];

interface ShortcutHintPanelProps {
  /** 是否显示面板 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
}

export function ShortcutHintPanel({ open, onClose }: ShortcutHintPanelProps) {
  if (!open) return null;

  return (
    <div
      className={styles.shortcutHintOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="快捷键提示"
      onClick={(e) => {
        // Close when clicking the overlay
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.shortcutHintPanel}>
        <div className={styles.shortcutHintHeader}>
          <div className={styles.shortcutHintTitle}>
            <Keyboard size={18} aria-hidden="true" />
            <span>快捷键</span>
          </div>
          <button
            type="button"
            className={styles.shortcutHintClose}
            onClick={onClose}
            aria-label="关闭快捷键提示"
          >
            ✕
          </button>
        </div>

        <div className={styles.shortcutHintList} role="list">
          {SHORTCUTS.map((shortcut, idx) => (
            <div key={idx} className={styles.shortcutHintItem} role="listitem">
              <div className={styles.shortcutKeys} aria-label={shortcut.keys.join('+')}>
                {shortcut.keys.map((key, i) => (
                  <React.Fragment key={i}>
                    <kbd className={styles.shortcutKbd}>{key}</kbd>
                    {i < shortcut.keys.length - 1 && (
                      <span className={styles.shortcutPlus}>+</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <span className={styles.shortcutDesc}>{shortcut.description}</span>
            </div>
          ))}
        </div>

        <div className={styles.shortcutHintFooter}>
          <span>在文本输入框中，快捷键不会触发</span>
        </div>
      </div>
    </div>
  );
}
