/**
 * Category Navigation
 * 
 * 分类导航组件
 */
// @ts-nocheck


import React from 'react';
import styles from './CategoryNav.module.css';

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface CategoryNavProps {
  /** 分类列表 */
  categories: Category[];
  /** 当前选中分类 */
  selected: string;
  /** 选择回调 */
  onSelect: (categoryId: string) => void;
  /** 自定义类名 */
  className?: string;
}

export function CategoryNav({
  categories,
  selected,
  onSelect,
  className = '',
}: CategoryNavProps) {
  return (
    <div className={`${styles.nav} ${className}`}>
      <div className={styles.scrollContainer}>
        {categories.map(category => (
          <button
            key={category.id}
            className={`${styles.item} ${selected === category.id ? styles.active : ''}`}
            onClick={() => onSelect(category.id)}
          >
            <span className={styles.icon}>{category.icon}</span>
            <span className={styles.name}>{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default CategoryNav;