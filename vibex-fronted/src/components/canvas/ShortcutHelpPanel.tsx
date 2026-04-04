/**
 * ShortcutHelpPanel — 快捷键帮助面板
 *
 * E2 实现: 按 ? 键显示快捷键帮助面板
 * 包含核心快捷键: Ctrl+G, Alt+1/2/3, F11, ?
 *
 * 遵守约束:
 * - 无 any 类型
 * - 无 console.log
 */
'use client';

import React from 'react';
import { Keyboard } from 'lucide-react';
import styles from './canvas.module.css';

interface ShortcutItem {
  /** 显示的快捷键（如 Ctrl+G） */
  keys: string[];
  /** 描述（如 "生成图谱"） */
  description: string;
}

const SHORTCUTS: ShortcutItem[] = [
  { keys: ['Ctrl', 'G'], description: '生成图谱' },
  { keys: ['Alt', '1'], description: '切换到上下文树' },
  { keys: ['Alt', '2'], description: '切换到流程树' },
  { keys: ['Alt', '3'], description: '切换到组件树' },
  { keys: ['F11'], description: '最大化画布' },
  { keys: ['?'], description: '显示/隐藏本面板' },
];

interface ShortcutHelpPanelProps {
  /** 是否显示面板 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
}

export function ShortcutHelpPanel({ open, onClose }: ShortcutHelpPanelProps) {
  if (!open) return null;

  return (
    <div
      className={styles.shortcutHelpOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="快捷键帮助"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.shortcutHelpPanel}>
        <div className={styles.shortcutHelpHeader}>
          <div className={styles.shortcutHelpTitle}>
            <Keyboard size={18} aria-hidden="true" />
            <span>快捷键</span>
          </div>
          <button
            type="button"
            className={styles.shortcutHelpClose}
            onClick={onClose}
            aria-label="关闭快捷键帮助"
          >
            ✕
          </button>
        </div>

        <div className={styles.shortcutHelpList} role="list">
          {SHORTCUTS.map((shortcut, idx) => (
            <div key={idx} className={styles.shortcutHelpItem} role="listitem">
              <div className={styles.shortcutHelpKeys} aria-label={shortcut.keys.join('+')}>
                {shortcut.keys.map((key, i) => (
                  <React.Fragment key={i}>
                    <kbd className={styles.shortcutHelpKbd}>{key}</kbd>
                    {i < shortcut.keys.length - 1 && (
                      <span className={styles.shortcutHelpPlus}>+</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <span className={styles.shortcutHelpDesc}>{shortcut.description}</span>
            </div>
          ))}
        </div>

        <div className={styles.shortcutHelpFooter}>
          <span>按 Esc 或点击遮罩关闭</span>
        </div>
      </div>
    </div>
  );
}
