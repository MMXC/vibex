/**
 * ZoomControls — Toolbar Zoom & Grid Controls
 * S88-E1: Canvas Zoom & Navigation Enhancement
 *
 * Features:
 * - E1-F1: Zoom control buttons [−] [+] [⊡] [100%] + zoom % display
 * - E1-F2: Grid spacing switch button
 *
 * Dependencies:
 * - canvasViewportStore (S86-E2): zoomTo, resetViewport, viewport.zoom
 * - gridSettingsStore (S88-E1): gridSize, cycleGridSize
 */
'use client';

import React, { memo, useCallback } from 'react';
import { useCanvasViewportStore } from '@/lib/canvas/stores/canvasViewportStore';
import { useGridSettingsStore, type GridSize } from '@/stores/dds/gridSettingsStore';
import styles from './ZoomControls.module.css';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4.0;
const ZOOM_STEP = 0.25;

const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0];

interface ZoomControlsProps {
  className?: string;
}

function ZoomControlsComponent({ className }: ZoomControlsProps) {
  const viewport = useCanvasViewportStore((s) => s.viewport);
  const zoomTo = useCanvasViewportStore((s) => s.zoomTo);
  const resetViewport = useCanvasViewportStore((s) => s.resetViewport);
  const gridSize = useGridSettingsStore((s) => s.gridSize);
  const cycleGridSize = useGridSettingsStore((s) => s.cycleGridSize);

  const zoomPercent = Math.round(viewport.zoom * 100);

  const handleZoomIn = useCallback(() => {
    const next = Math.min(viewport.zoom + ZOOM_STEP, MAX_ZOOM);
    zoomTo(next);
  }, [viewport.zoom, zoomTo]);

  const handleZoomOut = useCallback(() => {
    const next = Math.max(viewport.zoom - ZOOM_STEP, MIN_ZOOM);
    zoomTo(next);
  }, [viewport.zoom, zoomTo]);

  const handleFitView = useCallback(() => {
    // Fit to screen = zoom to 1 and reset pan
    zoomTo(1.0);
  }, [zoomTo]);

  const handleReset = useCallback(() => {
    resetViewport();
  }, [resetViewport]);

  const handlePresetClick = useCallback((preset: number) => {
    zoomTo(preset);
  }, [zoomTo]);

  const handleGridCycle = useCallback(() => {
    cycleGridSize();
  }, [cycleGridSize]);

  const gridSizeLabel: Record<GridSize, string> = {
    small: '10px',
    medium: '20px',
    large: '40px',
    none: '无',
  };

  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      {/* E1-F1: Zoom buttons */}
      <button
        type="button"
        className={styles.zoomBtn}
        onClick={handleZoomOut}
        aria-label="缩小 25%"
        title="缩小 25%"
      >
        −
      </button>

      <span className={styles.zoomPercent} title="点击切换缩放预设">
        {zoomPercent}%
      </span>

      <button
        type="button"
        className={styles.zoomBtn}
        onClick={handleZoomIn}
        aria-label="放大 25%"
        title="放大 25%"
      >
        +
      </button>

      <button
        type="button"
        className={styles.zoomBtn}
        onClick={handleFitView}
        aria-label="适应屏幕"
        title="适应屏幕"
      >
        ⊡
      </button>

      <button
        type="button"
        className={`${styles.zoomBtn} ${viewport.zoom === 1 && viewport.x === 0 && viewport.y === 0 ? styles.active : ''}`}
        onClick={handleReset}
        aria-label="重置到 100%"
        title="重置到 100%"
      >
        100%
      </button>

      {/* E1-F2: Grid spacing button */}
      <button
        type="button"
        className={`${styles.zoomBtn} ${styles.gridBtn}`}
        onClick={handleGridCycle}
        aria-label={`网格间距: ${gridSizeLabel[gridSize]}`}
        title={`网格间距: ${gridSizeLabel[gridSize]} (点击切换)`}
      >
        {gridSize === 'none' ? '⊠' : '▦'}
      </button>

      {/* Zoom presets dropdown (shown on zoom% click) */}
      <div className={styles.presetsDropdown} role="listbox" aria-label="缩放预设">
        {ZOOM_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className={`${styles.presetItem} ${Math.abs(viewport.zoom - preset) < 0.01 ? styles.presetActive : ''}`}
            role="option"
            aria-selected={Math.abs(viewport.zoom - preset) < 0.01}
            onClick={() => handlePresetClick(preset)}
          >
            {Math.round(preset * 100)}%
          </button>
        ))}
      </div>
    </div>
  );
}

export const ZoomControls = memo(ZoomControlsComponent);
