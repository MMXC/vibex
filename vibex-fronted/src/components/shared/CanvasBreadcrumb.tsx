/**
 * CanvasBreadcrumb — Sprint5 T5
 * Breadcrumb navigation for cross-canvas navigation context.
 *
 * Shows: 交付中心 > 原型画布 > [pageTitle]
 */

'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import styles from './CanvasBreadcrumb.module.css';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface CanvasBreadcrumbProps {
  /** Breadcrumb trail items */
  items: BreadcrumbItem[];
  /** Additional CSS class */
  className?: string;
}

export const CanvasBreadcrumb = memo(function CanvasBreadcrumb({
  items,
  className = '',
}: CanvasBreadcrumbProps) {
  return (
    <nav
      className={`${styles.breadcrumb} ${className}`}
      aria-label="面包屑导航"
    >
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className={styles.item}>
              {item.href && !isLast ? (
                <Link href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? styles.current : styles.link}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span className={styles.separator} aria-hidden="true">
                  &gt;
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
});

export default CanvasBreadcrumb;
