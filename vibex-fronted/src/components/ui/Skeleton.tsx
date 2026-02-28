import React, { useEffect, useState } from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  /** 自定义类名 */
  className?: string;
  /** 骨架屏变体: circle-圆形, rect-矩形, text-文本行 */
  variant?: 'circle' | 'rect' | 'text';
  /** 自定义宽度 */
  width?: string | number;
  /** 自定义高度 */
  height?: string | number;
  /** 是否显示动画 */
  animate?: boolean;
  /** 子元素数量 (仅 text 类型有效) */
  lines?: number;
}

export function Skeleton({
  className = '',
  variant = 'rect',
  width,
  height,
  animate = true,
  lines = 1,
}: SkeletonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (variant === 'text') {
    return (
      <div className={`${styles.textContainer} ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${styles.skeleton} ${styles.text} ${animate ? styles.animate : ''}`}
            style={{
              ...style,
              width: i === lines - 1 && lines > 1 ? '70%' : style.width,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      data-testid="skeleton"
      className={`${styles.skeleton} ${styles[variant]} ${animate ? styles.animate : ''} ${className}`}
      style={style}
    />
  );
}

// 预定义的骨架屏组合
export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <Skeleton variant="rect" height={160} />
      <div className={styles.cardContent}>
        <Skeleton variant="text" lines={2} />
        <Skeleton variant="text" width={80} height={16} />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.listItem}>
          <Skeleton variant="circle" width={40} height={40} />
          <div className={styles.listItemContent}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}
