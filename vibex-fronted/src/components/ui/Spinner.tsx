import React from 'react';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  /** Spinner 尺寸: small, medium, large */
  size?: 'small' | 'medium' | 'large';
  /** 自定义类名 */
  className?: string;
  /** 自定义颜色 */
  color?: string;
  /** 是否有文字说明 */
  text?: string;
  /** 文字位置: left, right, bottom */
  textPosition?: 'left' | 'right' | 'bottom';
}

/**
 * Spinner 旋转加载指示器组件
 * 用于表示异步操作进行中
 */
export function Spinner({
  size = 'medium',
  className = '',
  color,
  text,
  textPosition = 'right',
}: SpinnerProps) {
  const spinnerElement = (
    <span 
      className={`${styles.spinner} ${styles[size]} ${className}`}
      style={color ? { color } : undefined}
    >
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeDasharray="31.4 31.4" 
        />
      </svg>
    </span>
  );

  // 没有文字时直接返回 spinner
  if (!text) {
    return spinnerElement;
  }

  // 有文字时的布局
  const textElement = <span className={styles.text}>{text}</span>;

  return (
    <span className={`${styles.container} ${styles[`text-${textPosition}`]}`}>
      {textPosition === 'left' && textElement}
      {spinnerElement}
      {textPosition === 'right' && textElement}
      {textPosition === 'bottom' && (
        <>
          {spinnerElement}
          {textElement}
        </>
      )}
    </span>
  );
}

export default Spinner;
