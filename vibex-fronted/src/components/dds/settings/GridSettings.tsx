/**
 * GridSettings.tsx — Grid Spacing Settings Tab
 * S65-E3: Canvas View Personalization Settings Panel
 */
'use client';

import React, { useCallback } from 'react';
import { useSettingsStore, type GridVariant } from '@/stores/dds/settingsStore';
import styles from './GridSettings.module.css';

const GRID_SIZE_OPTIONS = [12, 16, 24, 32];

const GRID_VARIANT_OPTIONS: { value: GridVariant; label: string; icon: string }[] = [
  { value: 'dots', label: '点状网格', icon: '⠿' },
  { value: 'lines', label: '线条网格', icon: '┋' },
  { value: 'cross', label: '十字网格', icon: '╋' },
];

export function GridSettings() {
  const gridSize = useSettingsStore((s) => s.gridSize);
  const gridVariant = useSettingsStore((s) => s.gridVariant);
  const setGridSize = useSettingsStore((s) => s.setGridSize);
  const setGridVariant = useSettingsStore((s) => s.setGridVariant);
  const snapToGrid = useSettingsStore((s) => s.snapToGrid);
  const setSnapToGrid = useSettingsStore((s) => s.setSnapToGrid);

  const handleSizeChange = useCallback(
    (size: number) => {
      setGridSize(size);
    },
    [setGridSize]
  );

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <label className={styles.sectionLabel}>网格间距</label>
        <div className={styles.sizeOptions}>
          {GRID_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              type="button"
              className={`${styles.sizeButton} ${gridSize === size ? styles.active : ''}`}
              onClick={() => handleSizeChange(size)}
              aria-pressed={gridSize === size}
            >
              {size}px
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.sectionLabel}>网格样式</label>
        <div className={styles.variantOptions}>
          {GRID_VARIANT_OPTIONS.map(({ value, label, icon }) => (
            <button
              key={value}
              type="button"
              className={`${styles.variantButton} ${gridVariant === value ? styles.active : ''}`}
              onClick={() => setGridVariant(value)}
              aria-pressed={gridVariant === value}
            >
              <span className={styles.variantIcon} aria-hidden="true">{icon}</span>
              <span className={styles.variantLabel}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={snapToGrid}
            onChange={(e) => setSnapToGrid(e.target.checked)}
            className={styles.checkbox}
          />
          <span>对齐到网格</span>
          <span className={styles.toggleHint}>拖拽节点时自动对齐到网格</span>
        </label>
      </div>
    </div>
  );
}
