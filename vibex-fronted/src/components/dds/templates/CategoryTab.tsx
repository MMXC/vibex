/**
 * CategoryTab.tsx — Canvas Template Category Tab Bar
 * Sprint52 E4: 模板管理增强（分类/标签/搜索）
 *
 * Horizontal scrollable tab bar for canvas layout categories.
 * Emits selected category up to parent via onSelect callback.
 */
'use client';

import React, { memo, useCallback } from 'react';
import styles from './CategoryTab.module.css';

export type CanvasCategory = 'flowchart' | 'mindmap' | 'uml' | 'other' | null;
export type CategoryTabValue = CanvasCategory | 'all' | 'favorites' | 'discover';

interface CategoryTabProps {
  /** Currently selected category */
  selected: CategoryTabValue;
  /** Callback when a category is selected */
  onSelect: (category: CategoryTabValue) => void;
}

const CATEGORIES: { key: CategoryTabValue; label: string; icon: string }[] = [
  { key: 'all', label: '全部', icon: '📋' },
  { key: 'flowchart', label: '流程图', icon: '🔀' },
  { key: 'mindmap', label: '思维导图', icon: '🧠' },
  { key: 'uml', label: 'UML', icon: '📐' },
  { key: 'other', label: '其他', icon: '📄' },
  { key: 'discover', label: '发现', icon: '🔗' },
];

const CATEGORY_COLORS: Record<string, string> = {
  flowchart: '#3b82f6',
  mindmap: '#8b5cf6',
  uml: '#f59e0b',
  other: '#6b7280',
};

export const CategoryTab = memo<CategoryTabProps>(({ selected, onSelect }) => {
  const handleSelect = useCallback(
    (key: CategoryTabValue) => {
      onSelect(key);
    },
    [onSelect]
  );

  return (
    <div className={styles.tabBar} role="tablist" aria-label="模板分类">
      {CATEGORIES.map(({ key, label, icon }) => {
        const isActive = selected === key;
        const color = key !== 'all' ? CATEGORY_COLORS[key] : undefined;
        return (
          <button
            key={String(key)}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            style={
              isActive && color
                ? { borderBottomColor: color, color }
                : undefined
            }
            onClick={() => handleSelect(key)}
          >
            <span aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
});

CategoryTab.displayName = 'CategoryTab';
