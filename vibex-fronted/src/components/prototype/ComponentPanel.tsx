/**
 * ComponentPanel — Left Panel with Draggable Component Cards
 *
 * Displays 10 default components from DEFAULT_COMPONENTS.
 * Each card is draggable (HTML5 drag-and-drop), passing component
 * data via dataTransfer as JSON.
 *
 * Epic1: E1-U1
 */

'use client';

import React, { memo, useCallback } from 'react';
import { DEFAULT_COMPONENTS } from '@/lib/prototypes/ui-schema';
import type { UIComponent } from '@/lib/prototypes/ui-schema';
// No external ID library needed — using crypto.randomUUID()
import styles from './ComponentPanel.module.css';

// ==================== Icon Sprites ====================

const ICONS: Record<string, React.ReactNode> = {
  Button: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="8" width="18" height="8" rx="3" />
    </svg>
  ),
  Input: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <line x1="6" y1="12" x2="18" y2="12" />
    </svg>
  ),
  Card: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  Container: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="2" strokeDasharray="4 2" />
    </svg>
  ),
  Header: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="5" rx="1" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  ),
  Navigation: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="12" x2="8" y2="12" />
      <line x1="10" y1="12" x2="15" y2="12" />
      <line x1="17" y1="12" x2="21" y2="12" />
    </svg>
  ),
  Modal: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <line x1="3" y1="11" x2="21" y2="11" />
    </svg>
  ),
  Table: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  ),
  Form: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="7" y1="8" x2="17" y2="8" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="7" y1="16" x2="13" y2="16" />
    </svg>
  ),
  Image: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21,15 16,10 5,21" />
    </svg>
  ),
};

// ==================== Category Labels ====================

const CATEGORY_LABELS: Record<string, string> = {
  basic: '基础',
  form: '表单',
  display: '展示',
  layout: '布局',
  navigation: '导航',
  feedback: '反馈',
  data: '数据',
  media: '媒体',
};

// ==================== Props ====================

export interface ComponentPanelProps {
  className?: string;
}

// ==================== Component ====================

export const ComponentPanel = memo(function ComponentPanel({
  className = '',
}: ComponentPanelProps) {
  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, def: (typeof DEFAULT_COMPONENTS)[number]) => {
      // Build a UIComponent snapshot from the definition
      const component: UIComponent = {
        id: `comp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        type: def.name.toLowerCase() as UIComponent['type'],
        name: def.name,
        props: {},
      };

      // Set defaults from prop schemas
      for (const prop of def.props ?? []) {
        if (prop.default !== undefined) {
          component.props = component.props ?? {};
          component.props[prop.name] = prop.default;
        }
      }

      e.dataTransfer.setData('application/json', JSON.stringify(component));
      e.dataTransfer.effectAllowed = 'copy';
    },
    []
  );

  return (
    <aside className={`${styles.panel} ${className}`} aria-label="组件面板">
      <div className={styles.header}>
        <h2 className={styles.title}>组件</h2>
        <span className={styles.badge}>{DEFAULT_COMPONENTS.length}</span>
      </div>

      <div className={styles.grid} role="list">
        {DEFAULT_COMPONENTS.map((def) => {
          const icon = ICONS[def.name];
          return (
            <div
              key={def.name}
              className={styles.card}
              draggable
              onDragStart={(e) => handleDragStart(e, def)}
              role="listitem"
              aria-label={`拖拽 ${def.name} 组件`}
              title={def.description}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  // Fallback: just set the component in a temp store or show hint
                }
              }}
            >
              <div className={styles.icon} aria-hidden="true">
                {icon ?? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                  </svg>
                )}
              </div>
              <span className={styles.label}>{def.name}</span>
              <span className={styles.category}>
                {CATEGORY_LABELS[def.category] ?? def.category}
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
});
