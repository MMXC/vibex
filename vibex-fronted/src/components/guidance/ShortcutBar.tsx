/**
 * ShortcutBar — Collapsible keyboard shortcut bar at the bottom of the canvas
 *
 * E4-T2: Shows key shortcuts in a compact bar, collapsible via Zustand state.
 *
 * 遵守规范:
 * - React.memo for performance
 * - 无 any 类型，无 canvasLogger.default.debug
 */
'use client';

import React, { memo, useCallback } from 'react';
import { useGuidanceStore } from '@/stores/guidanceStore';
import { ChevronUp, ChevronDown, Keyboard } from 'lucide-react';
import styles from './ShortcutBar.module.css';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

interface ShortcutItemProps {
  keys: string[];
  description: string;
  onClick?: () => void;
}

const ShortcutItem = memo<ShortcutItemProps>(function ShortcutItem({ keys, description, onClick }) {
  return (
    <button
      type="button"
      className={styles.shortcutItem}
      onClick={onClick}
      title={description}
      aria-label={description}
    >
      <div className={styles.shortcutKeys} aria-hidden="true">
        {keys.map((key, i) => (
          <React.Fragment key={i}>
            <kbd className={styles.kbd}>{key}</kbd>
            {i < keys.length - 1 && <span className={styles.plus}>+</span>}
          </React.Fragment>
        ))}
      </div>
      <span className={styles.shortcutDesc}>{description}</span>
    </button>
  );
});

// Compact shortcuts shown when collapsed
const COLLAPSED_SHORTCUTS = [
  { keys: ['?'], description: '快捷键' },
  { keys: ['Esc'], description: '关闭/退出' },
  { keys: ['Ctrl', 'K'], description: '搜索' },
  { keys: ['Ctrl', 'Z'], description: '撤销' },
  { keys: ['Space'], description: '平移' },
];

// Full shortcuts shown when expanded
const EXPANDED_SHORTCUTS = [
  ...COLLAPSED_SHORTCUTS,
  { keys: ['Ctrl', 'Shift', 'Z'], description: '重做' },
  { keys: ['N'], description: '新建节点' },
  { keys: ['+'], description: '放大' },
  { keys: ['-'], description: '缩小' },
  { keys: ['0'], description: '重置缩放' },
  { keys: ['Del'], description: '删除选中' },
  { keys: ['Ctrl', 'A'], description: '全选' },
  { keys: ['F11'], description: '最大化' },
];

interface ShortcutBarProps {
  /** Callback when ? key is pressed (opens full shortcut panel) */
  onOpenShortcutPanel?: () => void;
}

export const ShortcutBar = memo<ShortcutBarProps>(function ShortcutBar({ onOpenShortcutPanel }) {
  const collapsed = useGuidanceStore((s) => s.shortcutBarCollapsed);
  const visible = useGuidanceStore((s) => s.shortcutBarVisible);
  const collapseShortcutBar = useGuidanceStore((s) => s.collapseShortcutBar);
  const expandShortcutBar = useGuidanceStore((s) => s.expandShortcutBar);

  const handleToggle = useCallback(() => {
    if (collapsed) {
      expandShortcutBar();
    } else {
      collapseShortcutBar();
    }
  }, [collapsed, collapseShortcutBar, expandShortcutBar]);

  const shortcuts = collapsed ? COLLAPSED_SHORTCUTS : EXPANDED_SHORTCUTS;

  if (!visible) return null;

  return (
    <div
      className={`${styles.shortcutBar} ${collapsed ? styles.collapsed : styles.expanded}`}
      role="toolbar"
      aria-label="快捷键栏"
    >
      <div className={styles.inner}>
        <div className={styles.shortcutList} aria-label="快捷键列表">
          {shortcuts.map((shortcut, idx) => (
            <ShortcutItem
              key={idx}
              keys={shortcut.keys}
              description={shortcut.description}
              onClick={
                shortcut.description === '快捷键'
                  ? onOpenShortcutPanel
                  : undefined
              }
            />
          ))}
        </div>

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.moreButton}
            onClick={onOpenShortcutPanel}
            title="查看全部快捷键"
            aria-label="查看全部快捷键"
          >
            <Keyboard size={14} aria-hidden="true" />
            <span>更多</span>
          </button>

          <button
            type="button"
            className={styles.collapseButton}
            onClick={handleToggle}
            aria-label={collapsed ? '展开快捷键栏' : '收起快捷键栏'}
            title={collapsed ? '展开快捷键栏' : '收起快捷键栏'}
          >
            {collapsed ? (
              <ChevronUp size={14} aria-hidden="true" />
            ) : (
              <ChevronDown size={14} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ShortcutBar;
