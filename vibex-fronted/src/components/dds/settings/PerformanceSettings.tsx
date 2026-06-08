/**
 * PerformanceSettings.tsx — DPR Performance Settings Tab
 * E5 (Sprint77): DPR 性能模式设置
 */
'use client';

import React from 'react';
import { useSettingsStore } from '@/stores/dds/settingsStore';
import type { DprMode } from '@/stores/dds/settingsStore';
import styles from './PerformanceSettings.module.css';

const DPR_OPTIONS: { value: DprMode; label: string; description: string }[] = [
  { value: 'auto', label: '自动', description: '跟随设备 DPR (最高 2x)' },
  { value: '1x', label: '1x', description: '固定 1 倍分辨率，降低显存占用' },
  { value: '2x', label: '2x', description: '固定 2 倍分辨率，精细显示' },
];

/**
 * Calculate effective DPR from mode and real devicePixelRatio.
 * E5 acceptance: calculateEffectiveDPR(1.5)→1.5, calculateEffectiveDPR(3)→2, calculateEffectiveDPR(1)→1
 */
export function calculateEffectiveDPR(realDpr: number, mode: DprMode): number {
  if (mode === 'auto') return Math.min(realDpr, 2);
  if (mode === '2x') return 2;
  return 1;
}

export function PerformanceSettings() {
  const dprMode = useSettingsStore((s) => s.dprMode);
  const setDprMode = useSettingsStore((s) => s.setDprMode);

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>渲染分辨率</h3>
        <p className={styles.description}>
          控制画布渲染的设备像素比（DPR）。低分辨率可提升大型画布的流畅度。
        </p>
        <div className={styles.options} role="radiogroup" aria-label="渲染分辨率">
          {DPR_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`${styles.option} ${dprMode === opt.value ? styles.optionActive : ''}`}
              htmlFor={`dpr-mode-${opt.value}`}
            >
              <input
                type="radio"
                id={`dpr-mode-${opt.value}`}
                name="dpr-mode"
                value={opt.value}
                checked={dprMode === opt.value}
                onChange={() => setDprMode(opt.value)}
                className={styles.radio}
              />
              <div className={styles.optionContent}>
                <span className={styles.optionLabel}>{opt.label}</span>
                <span className={styles.optionDesc}>{opt.description}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.info}>
        <p>
          当前设备 DPR: <strong>{typeof window !== 'undefined' ? window.devicePixelRatio.toFixed(2) : 'N/A'}</strong>
          {' → '}
          实际渲染:{' '}
          <strong>
            {typeof window !== 'undefined'
              ? calculateEffectiveDPR(window.devicePixelRatio, dprMode).toFixed(2)
              : 'N/A'}
          </strong>
        </p>
      </div>
    </div>
  );
}
