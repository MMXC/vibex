/**
 * ViewSwitcher — UI component for switching between visualization modes
 *
 * Provides three toggle buttons: Flow | Mermaid | JSON Tree
 * with animated transitions and active state indication.
 */
// @ts-nocheck


'use client';

import React, { useCallback } from 'react';
import type { VisualizationType } from '@/types/visualization';
import styles from './ViewSwitcher.module.css';

// ==================== Config ====================

const VIEW_CONFIG: Record<
  VisualizationType,
  { label: string; icon: string; description: string }
> = {
  flow: {
    label: 'Flow',
    icon: '🔗',
    description: '流程图视图',
  },
  mermaid: {
    label: 'Mermaid',
    icon: '📊',
    description: 'Mermaid 图表',
  },
  json: {
    label: 'JSON',
    icon: '🌳',
    description: 'JSON 树视图',
  },
  cardtree: {
    label: 'Card',
    icon: '📋',
    description: '卡片树视图',
  },
};

const VIEW_ORDER: VisualizationType[] = ['cardtree', 'flow', 'mermaid', 'json'];

// ==================== Props ====================

export interface ViewSwitcherProps {
  /** Current active view type */
  value: VisualizationType;
  /** Callback when view changes */
  onChange: (type: VisualizationType) => void;
  /** Disable switching */
  disabled?: boolean;
  /** Show labels */
  showLabels?: boolean;
  /** Show descriptions on hover */
  showDescriptions?: boolean;
  /** Custom class name */
  className?: string;
}

// ==================== Component ====================

export function ViewSwitcher({
  value,
  onChange,
  disabled = false,
  showLabels = true,
  showDescriptions = true,
  className = '',
}: ViewSwitcherProps) {
  const handleChange = useCallback(
    (type: VisualizationType) => {
      if (!disabled && type !== value) {
        onChange(type);
      }
    },
    [disabled, value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, type: VisualizationType) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleChange(type);
      }
      // Arrow key navigation
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const currentIdx = VIEW_ORDER.indexOf(value);
        const direction = e.key === 'ArrowRight' ? 1 : -1;
        const nextIdx =
          (currentIdx + direction + VIEW_ORDER.length) % VIEW_ORDER.length;
        handleChange(VIEW_ORDER[nextIdx]);
      }
    },
    [handleChange, value]
  );

  return (
    <div
      className={`${styles.switcher} ${className}`}
      role="tablist"
      aria-label="Visualization view"
      data-testid="view-switcher"
    >
      {VIEW_ORDER.map((type) => {
        const config = VIEW_CONFIG[type];
        const isActive = value === type;

        return (
          <button
            key={type}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${type}`}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''} ${disabled ? styles.tabDisabled : ''}`}
            onClick={() => handleChange(type)}
            onKeyDown={(e) => handleKeyDown(e, type)}
            disabled={disabled}
            title={showDescriptions ? config.description : undefined}
            data-type={type}
          >
            <span className={styles.icon}>{config.icon}</span>
            {showLabels && (
              <span className={styles.label}>{config.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default ViewSwitcher;
