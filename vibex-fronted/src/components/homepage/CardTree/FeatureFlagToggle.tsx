/**
 * FeatureFlagToggle — Debug toggle for CardTree Feature Flag
 *
 * Allows runtime switching between CardTree and GridLayout without
 * changing environment variables. Only available in development mode.
 */

'use client';

import React, { useState, useCallback } from 'react';
import styles from './FeatureFlagToggle.module.css';

interface FeatureFlagToggleProps {
  /** Current flag state (read from IS_CARD_TREE_ENABLED) */
  isEnabled: boolean;
  /** Callback when user toggles the flag */
  onToggle: (enabled: boolean) => void;
  /** Custom class name */
  className?: string;
}

/**
 * FeatureFlagToggle — Debug panel for switching Feature Flag at runtime
 *
 * Only renders in non-production environments.
 * Shows a floating pill in the bottom-right corner.
 */
export function FeatureFlagToggle({ isEnabled, onToggle, className }: FeatureFlagToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = useCallback(() => {
    onToggle(!isEnabled);
  }, [isEnabled, onToggle]);

  const handleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Main pill click: toggle the feature flag AND open panel
  const handlePillClick = useCallback(() => {
    onToggle(!isEnabled);
    setIsOpen((prev) => !prev);
  }, [isEnabled, onToggle]);

  // Don't render in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className={`${styles.container} ${className || ''}`} data-testid="feature-flag-toggle">
      {/* Toggle pill */}
      <button
        type="button"
        onClick={handlePillClick}
        className={`${styles.pill} ${isEnabled ? styles.pillActive : styles.pillInactive}`}
        aria-label="Feature Flag Toggle"
        title="切换 CardTree 布局"
        data-testid="toggle-pill"
      >
        <span className={styles.pillIcon}>{isEnabled ? '🌲' : '📋'}</span>
        <span className={styles.pillLabel}>CardTree</span>
        <span className={styles.pillBadge}>{isEnabled ? 'ON' : 'OFF'}</span>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className={styles.panel} data-testid="toggle-panel">
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>布局切换</span>
          </div>

          <div className={styles.option}>
            <label className={styles.optionLabel}>
              <input
                type="radio"
                name="layout"
                checked={isEnabled}
                onChange={() => onToggle(true)}
                className={styles.radio}
              />
              <span>🌲 CardTree 树形布局</span>
            </label>
          </div>

          <div className={styles.option}>
            <label className={styles.optionLabel}>
              <input
                type="radio"
                name="layout"
                checked={!isEnabled}
                onChange={() => onToggle(false)}
                className={styles.radio}
              />
              <span>📋 GridLayout 网格布局</span>
            </label>
          </div>

          <div className={styles.divider} />
          <p className={styles.hint}>切换将实时生效，无需刷新页面</p>
        </div>
      )}
    </div>
  );
}
