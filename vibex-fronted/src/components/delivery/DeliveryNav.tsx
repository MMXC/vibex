/**
 * DeliveryNav — Cross-Canvas Navigation
 * Sprint5 T4: Three-canvas navigation tabs
 *
 * Provides links to prototype, DDS, and delivery canvases.
 * Used at the top of DeliveryCenter and optionally in other canvases.
 */

'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './DeliveryNav.module.css';

const CANVAS_LINKS = [
  { href: '/prototype/editor', label: '原型画布', key: 'prototype' },
  { href: '/dds/canvas', label: '详设画布', key: 'dds' },
  { href: '/canvas/delivery', label: '交付中心', key: 'delivery' },
] as const;

export interface DeliveryNavProps {
  /** Additional CSS class */
  className?: string;
}

export const DeliveryNav = memo(function DeliveryNav({ className = '' }: DeliveryNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={`${styles.nav} ${className}`}
      aria-label="画布导航"
    >
      {CANVAS_LINKS.map(({ href, label }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
});

export default DeliveryNav;
