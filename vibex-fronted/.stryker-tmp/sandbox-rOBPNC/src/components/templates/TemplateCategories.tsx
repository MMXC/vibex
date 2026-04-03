/**
 * TemplateCategories - 分类筛选标签组件
 * 
 * 显示分类标签列表，支持单选筛选
 */
// @ts-nocheck


import { TemplateCategoriesProps } from '@/data/templates';
import styles from './TemplateSelector.module.css';

export function TemplateCategories({ 
  categories, 
  selected, 
  onSelect 
}: TemplateCategoriesProps) {
  return (
    <div className={styles.categories}>
      {categories.map(cat => (
        <button
          key={cat.value}
          className={`${styles.categoryBtn} ${selected === cat.value ? styles.categoryActive : ''}`}
          onClick={() => onSelect(cat.value)}
        >
          {cat.label}
          <span className={styles.categoryCount}>{cat.count}</span>
        </button>
      ))}
    </div>
  );
}

export default TemplateCategories;
