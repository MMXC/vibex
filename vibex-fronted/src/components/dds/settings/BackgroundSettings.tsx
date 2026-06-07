/**
 * BackgroundSettings.tsx — Background & Grid Style Settings Tab
 * S65-E3: Canvas View Personalization Settings Panel
 * S76-E1: 画布背景设置集成 — add variant + 5-style switcher using canvasBackground
 */
'use client';

import React, { useCallback } from 'react';
import { useSettingsStore, type GridVariant } from '@/stores/dds/settingsStore';
import styles from './BackgroundSettings.module.css';

const PRESET_COLORS = [
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0',
  '#f0fdf4', '#eff6ff', '#fefce8', '#fff7ed',
  '#fdf4ff', '#fff1f2', '#18181b', '#0f172a',
  '#052e16', '#172554', '#1c1917',
];

export type BackgroundStyle = 'dots' | 'lines' | 'cross' | 'none';

const STYLE_OPTIONS: { value: BackgroundStyle; label: string; icon: string }[] = [
  { value: 'dots', label: '点状网格', icon: '⠿' },
  { value: 'lines', label: '线条网格', icon: '┋' },
  { value: 'cross', label: '十字网格', icon: '╋' },
  { value: 'none', label: '无网格', icon: '∅' },
];

/** Map BackgroundStyle to GridVariant (none maps to 'dots' as fallback) */
function styleToVariant(style: BackgroundStyle): GridVariant {
  if (style === 'none') return 'dots';
  return style;
}

export function BackgroundSettings() {
  const backgroundColor = useSettingsStore((s) => s.backgroundColor);
  const setBackgroundColor = useSettingsStore((s) => s.setBackgroundColor);
  const canvasBackground = useSettingsStore((s) => s.canvasBackground);
  const setCanvasBackground = useSettingsStore((s) => s.setCanvasBackground);

  /** Derive current style from canvasBackground.variant */
  const currentStyle: BackgroundStyle =
    canvasBackground.variant === 'dots' && canvasBackground.gap === 0 ? 'none' : canvasBackground.variant;

  const handleStyleChange = useCallback(
    (style: BackgroundStyle) => {
      if (style === 'none') {
        // none: show no grid — set variant to dots but gap to 0
        setCanvasBackground({ variant: 'dots', gap: 0 });
      } else {
        setCanvasBackground({ variant: style, gap: canvasBackground.gap || 16 });
      }
    },
    [setCanvasBackground, canvasBackground.gap]
  );

  const handleGapChange = useCallback(
    (gap: number) => {
      setCanvasBackground({ gap });
    },
    [setCanvasBackground]
  );

  const handleCustomColor = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setBackgroundColor(e.target.value);
    },
    [setBackgroundColor]
  );

  return (
    <div className={styles.container}>
      {/* S76-E1: 5-style switcher */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>网格样式</label>
        <div className={styles.styleOptions}>
          {STYLE_OPTIONS.map(({ value, label, icon }) => (
            <button
              key={value}
              type="button"
              className={`${styles.styleButton} ${currentStyle === value ? styles.active : ''}`}
              onClick={() => handleStyleChange(value)}
              aria-pressed={currentStyle === value}
              aria-label={label}
            >
              <span className={styles.styleIcon} aria-hidden="true">{icon}</span>
              <span className={styles.styleLabel}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid gap control — hidden when "none" selected */}
      {currentStyle !== 'none' && (
        <div className={styles.section}>
          <label className={styles.sectionLabel}>网格间距</label>
          <div className={styles.gapOptions}>
            {[12, 16, 24, 32].map((gap) => (
              <button
                key={gap}
                type="button"
                className={`${styles.gapButton} ${canvasBackground.gap === gap ? styles.active : ''}`}
                onClick={() => handleGapChange(gap)}
                aria-pressed={canvasBackground.gap === gap}
              >
                {gap}px
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Canvas fill color */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>画布颜色</label>
        <div className={styles.presetGrid}>
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`${styles.presetSwatch} ${backgroundColor === color ? styles.active : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setBackgroundColor(color)}
              aria-label={`画布颜色 ${color}`}
              aria-pressed={backgroundColor === color}
            />
          ))}
        </div>
        <div className={styles.customRow}>
          <label htmlFor="custom-bg-color" className={styles.customLabel}>自定义</label>
          <input
            id="custom-bg-color"
            type="color"
            value={backgroundColor}
            onChange={handleCustomColor}
            className={styles.colorInput}
          />
          <span className={styles.colorValue}>{backgroundColor}</span>
        </div>
      </div>
    </div>
  );
}
