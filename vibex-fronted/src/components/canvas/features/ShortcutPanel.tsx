/**
 * ShortcutPanel — 统一快捷键面板
 *
 * 合并 ShortcutHintPanel 和 ShortcutHelpPanel，统一管理所有快捷键。
 *
 * 快捷键列表:
 * - HintPanel 快捷键: Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y, Ctrl+K, /, Ctrl+Shift+C, Ctrl+Shift+G, N, +, -, 0, Del, Backspace, Ctrl+A, Esc, F11, ?
 * - HelpPanel 快捷键: Ctrl+G, Alt+1, Alt+2, Alt+3, F11, ?
 * - 补充: Space
 *
 * 遵守约束:
 * - 无 any 类型
 * - 无 canvasLogger.default.debug
 */
'use client';

import React from 'react';
import { Keyboard } from 'lucide-react';
import styles from '../canvas.module.css';

export interface ShortcutItem {
  /** 唯一标识符 */
  id: string;
  /** 显示的快捷键（如 Ctrl+Z） */
  keys: string[];
  /** 描述（如 "撤销"） */
  description: string;
}

export const SHORTCUTS: ShortcutItem[] = [
  // Undo/Redo
  { id: 'ctrl-z', keys: ['Ctrl', 'Z'], description: '撤销' },
  { id: 'ctrl-shift-z', keys: ['Ctrl', 'Shift', 'Z'], description: '重做' },
  { id: 'ctrl-y', keys: ['Ctrl', 'Y'], description: '重做（Windows）' },
  // Search
  { id: 'ctrl-k', keys: ['Ctrl', 'K'], description: '搜索节点' },
  { id: 'slash', keys: ['/'], description: '搜索节点（备选）' },
  // Canvas actions
  { id: 'ctrl-shift-c', keys: ['Ctrl', 'Shift', 'C'], description: '确认选中节点' },
  { id: 'ctrl-g', keys: ['Ctrl', 'G'], description: '生成图谱' },
  { id: 'ctrl-shift-g', keys: ['Ctrl', 'Shift', 'G'], description: '生成上下文' },
  // Node operations
  { id: 'n', keys: ['N'], description: '新建节点（当前树）' },
  // Zoom
  { id: 'plus', keys: ['+'], description: '放大画布' },
  { id: 'minus', keys: ['-'], description: '缩小画布' },
  { id: 'zero', keys: ['0'], description: '重置缩放' },
  // Delete
  { id: 'del', keys: ['Del'], description: '删除选中节点' },
  { id: 'backspace', keys: ['Backspace'], description: '删除选中节点' },
  // Selection
  { id: 'ctrl-a', keys: ['Ctrl', 'A'], description: '全选节点' },
  // Navigation / Panel
  { id: 'alt-1', keys: ['Alt', '1'], description: '切换到上下文树' },
  { id: 'alt-2', keys: ['Alt', '2'], description: '切换到流程树' },
  { id: 'alt-3', keys: ['Alt', '3'], description: '切换到组件树' },
  // Utility
  { id: 'esc', keys: ['Esc'], description: '取消选择/关闭对话框/退出最大化' },
  { id: 'f11', keys: ['F11'], description: '最大化画布/退出最大化' },
  { id: 'question', keys: ['?'], description: '显示/隐藏本面板' },
  { id: 'space', keys: ['Space'], description: '空格键' },
];

export interface ShortcutPanelProps {
  /** 是否显示面板 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
}

export function ShortcutPanel({ open, onClose }: ShortcutPanelProps) {
  if (!open) return null;

  return (
    <div
      className={styles.shortcutHintOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="快捷键提示"
      data-testid="shortcut-panel"
      onClick={(e) => {
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
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.id} className={styles.shortcutHintItem} role="listitem">
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
