'use client';

import React from 'react';
import styles from './Loading.module.css';

interface LoadingProps {
  /** 加载文案 */
  text?: string;
  /** 加载变体: spinner-旋转图标, dots-三点动画, pulse-脉冲 */
  variant?: 'spinner' | 'dots' | 'pulse';
  /** 尺寸: small, medium, large */
  size?: 'small' | 'medium' | 'large';
  /** 是否全屏显示 */
  fullScreen?: boolean;
  /** 叠加层背景透明度 */
  overlay?: boolean;
  /** 自定义类名 */
  className?: string;
}

export function Loading({
  text,
  variant = 'spinner',
  size = 'medium',
  fullScreen = false,
  overlay = false,
  className = '',
}: LoadingProps) {
  const content = (
    <div className={`${styles.container} ${styles[size]} ${className}`}>
      <div className={styles[variant]}>
        {variant === 'spinner' && <div className={styles.spinnerRing} />}
        {variant === 'dots' && (
          <>
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </>
        )}
        {variant === 'pulse' && (
          <>
            <span className={styles.pulseRing} />
            <span className={styles.pulseCore} />
          </>
        )}
      </div>
      {text && <span className={styles.text}>{text}</span>}
    </div>
  );

  if (fullScreen) {
    return <div className={styles.fullScreen}>{content}</div>;
  }

  if (overlay) {
    return <div className={styles.overlay}>{content}</div>;
  }

  return content;
}

// 带骨架屏的加载组件
export function LoadingSkeleton({ 
  loading, 
  children, 
  fallback 
}: { 
  loading: boolean; 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  if (loading) {
    return fallback || <Loading text="加载中..." />;
  }
  return <>{children}</>;
}

// 进度条加载组件
interface ProgressLoadingProps {
  /** 当前进度 (0-100) */
  progress?: number;
  /** 是否不确定 (无具体进度) */
  indeterminate?: boolean;
  /** 进度文案 */
  text?: string;
}

export function ProgressLoading({ 
  progress, 
  indeterminate = false,
  text,
}: ProgressLoadingProps) {
  const percentage = Math.min(100, Math.max(0, progress || 0));
  
  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill}
          style={{ 
            width: indeterminate ? '100%' : `${percentage}%`,
            animation: indeterminate ? 'progress-indeterminate 1.5s ease-in-out infinite' : undefined
          }}
        />
      </div>
      {(text || indeterminate) && (
        <span className={styles.progressText}>
          {text || (indeterminate ? '处理中...' : `${percentage}%`)}
        </span>
      )}
    </div>
  );
}
