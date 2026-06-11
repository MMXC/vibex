/**
 * CommandCategorySidebar.tsx — S88-E5: 命令面板增强
 *
 * Left sidebar with category tabs: 全部 / 画布 / 模板 / 协作 / 视图 / 设置
 *
 * Usage:
 *   <CommandCategorySidebar
 *     activeCategory={activeCategory}
 *     onSelect={(cat) => store.setFilterCategory(cat)}
 *   />
 */
'use client';

import React from 'react';
import { type CommandCategory } from '@/stores/commandPaletteStore';
import styles from './CommandCategorySidebar.module.css';

export interface CommandCategorySidebarProps {
  /** Currently active category */
  activeCategory: CommandCategory;
  /** Called when user selects a category */
  onSelect: (category: CommandCategory) => void;
}

const CATEGORIES: Array<{ id: CommandCategory; label: string; icon: string }> = [
  { id: 'all', label: '全部', icon: '📂' },
  { id: 'canvas', label: '画布', icon: '🎨' },
  { id: 'template', label: '模板', icon: '📋' },
  { id: 'collaboration', label: '协作', icon: '👥' },
  { id: 'view', label: '视图', icon: '👁️' },
  { id: 'settings', label: '设置', icon: '⚙️' },
];

export function CommandCategorySidebar({ activeCategory, onSelect }: CommandCategorySidebarProps) {
  return (
    <nav className={styles.sidebar} role="navigation" aria-label="命令分类">
      <div className={styles.categoryList}>
        {CATEGORIES.map(({ id, label, icon }) => (
          <button
            key={id}
            className={`${styles.categoryButton} ${activeCategory === id ? styles.active : ''}`}
            onClick={() => onSelect(id)}
            aria-pressed={activeCategory === id}
            aria-label={label}
            data-testid={`category-btn-${id}`}
            title={label}
          >
            <span className={styles.categoryIcon} aria-hidden="true">
              {icon}
            </span>
            <span className={styles.categoryLabel}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
