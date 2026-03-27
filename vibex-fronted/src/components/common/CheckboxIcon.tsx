/**
 * CheckboxIcon — CSS 样式的复选框图标
 * Epic 1: Checkbox图标CSS替换
 *
 * 实现要点：
 * - 纯 CSS box-style: ☐ / ☑
 * - 支持深色模式
 * - 正确的 aria 属性
 */
'use client';

import React from 'react';
import styles from './CheckboxIcon.module.css';

interface CheckboxIconProps {
  /** 是否选中 */
  checked: boolean;
  /** 尺寸: sm/md/lg */
  size?: 'sm' | 'md' | 'lg';
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** aria-label 标签 */
  'aria-label'?: string;
}

export function CheckboxIcon({
  checked,
  size = 'md',
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
}: CheckboxIconProps) {
  return (
    <span
      className={`${styles.checkbox} ${styles[size]} ${checked ? styles.checked : styles.unchecked} ${disabled ? styles.disabled : ''} ${className}`}
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled}
      aria-label={ariaLabel}
      data-testid="checkbox-icon"
    >
      {checked && (
        <svg
          className={styles.checkmark}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M3 8.5L6.5 12L13 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}
