/**
 * DDSPanel — Individual Chapter Panel
 * Epic 2: F11
 */

'use client';

import React, { memo, type ReactNode } from 'react';
import type { ChapterType } from '@/types/dds';
import styles from './DDSPanel.module.css';

export interface DDSPanelProps {
  /** Chapter type identifier */
  chapterType: ChapterType;
  /** Chapter display label */
  label: string;
  /** Whether this panel is currently expanded */
  isExpanded: boolean;
  /** Panel content */
  children?: ReactNode;
  /** Callback ref for scroll-into-view */
  panelRef?: React.RefCallback<HTMLDivElement>;
}

const CHAPTER_LABELS: Record<ChapterType, string> = {
  requirement: '需求',
  context: '上下文',
  flow: '流程',
  api: 'API',
};

export const DDSPanel = memo(function DDSPanel({
  chapterType,
  label,
  isExpanded,
  children,
  panelRef,
}: DDSPanelProps) {
  const displayLabel = label || CHAPTER_LABELS[chapterType];

  return (
    <div
      ref={panelRef as unknown as React.RefObject<HTMLDivElement | null>}
      className={`${styles.panel} ${isExpanded ? styles.panelExpanded : styles.panelCollapsed}`}
      role="region"
      aria-label={displayLabel}
      data-chapter={chapterType}
      data-expanded={isExpanded}
    >
      {/* Header */}
      <div
        className={`${styles.header} ${!isExpanded ? styles.headerCollapsed : ''}`}
        aria-hidden={!isExpanded}
      >
        <span className={`${styles.headerTitle} ${!isExpanded ? styles.headerTitleCollapsed : ''}`}>
          {displayLabel}
        </span>
      </div>

      {/* Content */}
      {children}
    </div>
  );
});

export default DDSPanel;
