import React from 'react';
import styles from './Badge.module.css';

export interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  glow?: boolean;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Badge({
  variant = 'default',
  size = 'md',
  glow = false,
  dot = false,
  className = '',
  children,
}: BadgeProps) {
  const classNames = [
    styles.badge,
    styles[variant],
    styles[size],
    glow && styles.glow,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classNames}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  );
}

export default Badge;
