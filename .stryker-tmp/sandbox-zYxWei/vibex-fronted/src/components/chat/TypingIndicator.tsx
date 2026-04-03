// @ts-nocheck
'use client';

import React from 'react';
import styles from './TypingIndicator.module.css';

interface TypingIndicatorProps {
  /** 自定义类名 */
  className?: string;
  /** 显示文案 */
  text?: string;
  /** 尺寸: small, medium, large */
  size?: 'small' | 'medium' | 'large';
}

/**
 * 打字指示器组件 - 显示 AI 正在输入的动画效果
 */
export function TypingIndicator({
  className = '',
  text = '正在输入',
  size = 'medium',
}: TypingIndicatorProps) {
  return (
    <div className={`${styles.container} ${styles[size]} ${className}`}>
      <div className={styles.dots}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
      {text && <span className={styles.text}>{text}</span>}
    </div>
  );
}

export default TypingIndicator;
