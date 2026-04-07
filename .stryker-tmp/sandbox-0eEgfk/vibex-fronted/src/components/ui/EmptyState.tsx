// @ts-nocheck
import React from 'react';
import type { LucideIcon } from 'lucide-react';
import styles from './EmptyState.module.css';

export type EmptyStateVariant = 'default' | 'search' | 'error' | 'projects';

export interface EmptyStateProps {
  /** Lucide icon component to display */
  icon?: LucideIcon;
  /** Primary title */
  title: string;
  /** Optional description text */
  description?: string;
  /** Optional call-to-action button */
  action?: React.ReactNode;
  /** Visual variant */
  variant?: EmptyStateVariant;
  /** Additional CSS class */
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'default',
  className = '',
}: EmptyStateProps) {
  const classNames = [
    styles.emptyState,
    styles[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} role="status" aria-live="polite">
      {Icon && (
        <div className={styles.iconWrapper}>
          <Icon className={styles.icon} aria-hidden="true" />
        </div>
      )}
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        {description && (
          <p className={styles.description}>{description}</p>
        )}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

export default EmptyState;
