// @ts-nocheck
import React from 'react';
import styles from './Alert.module.css';

export type AlertVariant = 'success' | 'warning' | 'error' | 'info';
export type AlertSize = 'sm' | 'md' | 'lg';

export interface AlertProps {
  variant?: AlertVariant;
  size?: AlertSize;
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  closable?: boolean;
  onClose?: () => void;
  className?: string;
}

const defaultIcons: Record<AlertVariant, string> = {
  success: '✓',
  warning: '⚠',
  error: '✕',
  info: 'ℹ',
};

export function Alert({
  variant = 'info',
  size = 'md',
  title,
  children,
  icon,
  closable = false,
  onClose,
  className = '',
}: AlertProps) {
  const classNames = [styles.alert, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} role="alert">
      <span className={styles.icon}>{icon || defaultIcons[variant]}</span>
      <div className={styles.content}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.message}>{children}</div>
      </div>
      {closable && (
        <button className={styles.close} onClick={onClose} aria-label="关闭">
          ×
        </button>
      )}
    </div>
  );
}

export default Alert;
