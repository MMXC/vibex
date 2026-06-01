/**
 * CategoryFilter.tsx — Template Category Filter Buttons
 * Sprint49 E2: 画布模板管理完善
 *
 * Displays category buttons: blank/flowchart/mindmap/swot + all
 * Maps IMP categories to actual TemplateCategory types in the store.
 */
'use client';

import React, { useCallback } from 'react';
import { useTemplateStore } from '@/stores/templateStore';
import { TemplateCategory } from '@/data/templates';
import styles from './CategoryFilter.module.css';

// IMP categories: blank/flowchart/mindmap/swot
// Map to actual TemplateCategory values
const IMP_CATEGORIES: { key: TemplateCategory | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: '全部', icon: '📋' },
  { key: 'custom', label: '空白', icon: '📄' },
  { key: 'saas', label: 'SaaS', icon: '☁️' },
  { key: 'ecommerce', label: '电商', icon: '🛒' },
  { key: 'fintech', label: '金融', icon: '💰' },
  { key: 'enterprise', label: '企业', icon: '🏢' },
  { key: 'content', label: '内容', icon: '📝' },
  { key: 'education', label: '教育', icon: '📚' },
];

export function CategoryFilter() {
  const { selectedCategory, setCategory } = useTemplateStore();

  const handleSelect = useCallback((key: TemplateCategory | 'all') => {
    setCategory(key);
  }, [setCategory]);

  return (
    <div className={styles.filterRow} role="group" aria-label="模板分类筛选">
      {IMP_CATEGORIES.map(({ key, label, icon }) => (
        <button
          key={key}
          type="button"
          className={`${styles.filterBtn} ${selectedCategory === key ? styles.active : ''}`}
          onClick={() => handleSelect(key)}
          aria-pressed={selectedCategory === key}
        >
          <span aria-hidden="true">{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
