/**
 * TemplateSearch - 模板搜索组件
 * 
 * 搜索输入框，支持实时过滤
 */

import { TemplateSearchProps } from '@/data/templates';
import styles from './TemplateSelector.module.css';

export function TemplateSearch({ 
  value, 
  onChange, 
  placeholder = '搜索模板...'
}: TemplateSearchProps) {
  return (
    <div className={styles.searchWrapper}>
      <span className={styles.searchIcon}>🔍</span>
      <input
        type="text"
        className={styles.searchInput}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {value && (
        <button 
          className={styles.clearBtn}
          onClick={() => onChange('')}
          aria-label="清除搜索"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default TemplateSearch;
