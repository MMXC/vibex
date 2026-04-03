/**
 * Template Search
 * 
 * 模板搜索组件
 */
// @ts-nocheck


import React from 'react';
import styles from './TemplateSearch.module.css';

export interface TemplateSearchProps {
  /** 搜索值 */
  value: string;
  /** 值变化回调 */
  onChange: (value: string) => void;
  /** 占位符 */
  placeholder?: string;
  /** 自定义类名 */
  className?: string;
}

export function TemplateSearch({
  value,
  onChange,
  placeholder = '搜索模板...',
  className = '',
}: TemplateSearchProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={`${styles.search} ${className}`}>
      <span className={styles.icon}>🔍</span>
      <input
        type="text"
        className={styles.input}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
      />
      {value && (
        <button className={styles.clear} onClick={handleClear}>
          ✕
        </button>
      )}
    </div>
  );
}

export default TemplateSearch;