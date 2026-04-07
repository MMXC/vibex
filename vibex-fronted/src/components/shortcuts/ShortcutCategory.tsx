/**
 * ShortcutCategory - 快捷键分类组件
 */

'use client';

import React from 'react';
import { useShortcutStore, type ShortcutCategory as CategoryType } from '@/stores/shortcutStore';
import { ShortcutRow } from './ShortcutRow';
import styles from './shortcuts.module.css';

interface ShortcutCategoryProps {
  id: CategoryType;
  title: string;
}

const CATEGORY_ICONS: Record<CategoryType, string> = {
  navigation: '🧭',
  edit: '✏️',
  view: '👁️',
  phase: '📑',
};

export function ShortcutCategory({ id, title }: ShortcutCategoryProps) {
  const { shortcuts } = useShortcutStore();
  
  const categoryShortcuts = shortcuts.filter((s) => s.category === id);

  if (categoryShortcuts.length === 0) {
    return null;
  }

  return (
    <div className={styles.category}>
      <h3 className={styles.categoryTitle}>
        <span className={styles.categoryIcon}>{CATEGORY_ICONS[id]}</span>
        {title}
      </h3>
      <div className={styles.categoryList}>
        {categoryShortcuts.map((shortcut) => (
          <ShortcutRow
            key={shortcut.action}
            action={shortcut.action}
            description={shortcut.description}
            currentKey={shortcut.currentKey}
            category={shortcut.category}
          />
        ))}
      </div>
    </div>
  );
}
