/**
 * BackgroundSettings.tsx — Background Color Settings Tab
 * S65-E3: Canvas View Personalization Settings Panel
 */
'use client';

import React, { useCallback } from 'react';
import { useSettingsStore } from '@/stores/dds/settingsStore';
import styles from './BackgroundSettings.module.css';

const PRESET_COLORS = [
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0',
  '#f0fdf4', '#eff6ff', '#fefce8', '#fff7ed',
  '#fdf4ff', '#fff1f2', '#18181b', '#0f172a',
  '#052e16', '#172554', '#1c1917',
];

export function BackgroundSettings() {
  const backgroundColor = useSettingsStore((s) => s.backgroundColor);
  const setBackgroundColor = useSettingsStore((s) => s.setBackgroundColor);

  const handleCustomColor = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setBackgroundColor(e.target.value);
    },
    [setBackgroundColor]
  );

  return (
    <div className={styles.container}>
      <p className={styles.hint}>选择预设颜色或使用自定义颜色：</p>
      <div className={styles.presetGrid}>
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`${styles.presetSwatch} ${backgroundColor === color ? styles.active : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => setBackgroundColor(color)}
            aria-label={`背景颜色 ${color}`}
            aria-pressed={backgroundColor === color}
          />
        ))}
      </div>
      <div className={styles.customRow}>
        <label htmlFor="custom-bg-color" className={styles.customLabel}>自定义颜色</label>
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
  );
}
