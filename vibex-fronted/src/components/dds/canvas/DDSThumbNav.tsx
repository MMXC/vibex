/**
 * DDSThumbNav — Thumbnail Navigation
 * Epic 2: F12
 *
 * Vertical navigation buttons for quickly jumping between panels.
 * Visible inside each collapsed panel as a sidebar nav.
 */

'use client';

import React, { memo, type ReactNode } from 'react';
import styles from './DDSThumbNav.module.css';

export interface DDSThumbNavProps {
  /** Navigation items */
  children?: ReactNode;
  /** Additional class */
  className?: string;
  /** Whether the nav is in collapsed (vertical) mode */
  isCollapsed?: boolean;
}

export const DDSThumbNav = memo(function DDSThumbNav({
  children,
  className = '',
  isCollapsed = false,
}: DDSThumbNavProps) {
  return (
    <nav
      className={`${styles.thumbNav} ${isCollapsed ? styles.thumbNavCollapsed : ''} ${className}`}
      aria-label="章节导航"
    >
      {children}
    </nav>
  );
});

export interface ThumbButtonProps {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  /** Short label shown when panel is collapsed */
  shortLabel?: string;
}

export const DDSThumbButton = memo(function DDSThumbButton({
  label,
  isActive = false,
  onClick,
  shortLabel,
}: ThumbButtonProps) {
  const displayLabel = shortLabel ?? label;

  return (
    <button
      type="button"
      className={`${styles.thumbButton} ${isActive ? styles.thumbButtonActive : ''}`}
      onClick={onClick}
      aria-pressed={isActive}
      aria-label={label}
    >
      {displayLabel}
    </button>
  );
});

export default DDSThumbNav;
