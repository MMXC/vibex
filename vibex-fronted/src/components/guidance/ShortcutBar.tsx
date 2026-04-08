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
import { SHORTCUTS } from '@/components/canvas/features/ShortcutPanel';

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
      data-testid="shortcut-bar-item"
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

// Compact shortcuts shown when collapsed (subset of SHORTCUTS)
const COLLAPSED_SHORTCUT_IDS = ['question', 'esc', 'ctrl-k', 'ctrl-z', 'space'];

// Full shortcuts shown when expanded (subset of SHORTCUTS)
const EXPANDED_SHORTCUT_IDS = [
  ...COLLAPSED_SHORTCUT_IDS,
  'ctrl-shift-z', 'n', 'plus', 'minus', 'zero', 'del', 'ctrl-a', 'f11', 'ctrl-g'
];

// Compact shortcuts shown when collapsed
const COLLAPSED_SHORTCUTS = SHORTCUTS.filter(s => COLLAPSED_SHORTCUT_IDS.includes(s.id));

// Full shortcuts shown when expanded
const EXPANDED_SHORTCUTS = SHORTCUTS.filter(s => EXPANDED_SHORTCUT_IDS.includes(s.id));

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
      data-testid="shortcut-bar"
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
