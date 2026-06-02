/**
 * BackgroundSettingsPanel
 * 画布背景设置面板 — 5种预设 + 自定义颜色
 * S55-E4
 */

'use client';

import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useBackgroundSettingsStore, type BackgroundPreset } from '@/stores/backgroundSettingsStore';
import styles from './BackgroundSettingsPanel.module.css';

interface BackgroundSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS: { id: BackgroundPreset; label: string; description: string }[] = [
  { id: 'dots', label: 'Dots', description: '点状网格' },
  { id: 'lines', label: 'Lines', description: '线条网格' },
  { id: 'cross', label: 'Cross', description: '十字网格' },
  { id: 'solid', label: 'Solid', description: '纯色背景' },
  { id: 'custom', label: 'Custom', description: '自定义颜色' },
];

export function BackgroundSettingsPanel({ isOpen, onClose }: BackgroundSettingsPanelProps) {
  const { preset, customColor, setPreset, setCustomColor, resetToDefaults } =
    useBackgroundSettingsStore();
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!isOpen) return null;

  const handlePresetClick = (p: BackgroundPreset) => {
    setPreset(p);
    if (p === 'custom') {
      setShowColorPicker(true);
    } else {
      setShowColorPicker(false);
    }
  };

  const handleColorChange = (color: string) => {
    setCustomColor(color);
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="背景设置">
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Background Settings</h3>
          <button className={styles.closeButton} onClick={onClose} aria-label="关闭">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>预设</p>
          <div className={styles.presetGrid}>
            {PRESETS.map((p) => (
              <button
                key={p.id}
                className={`${styles.presetButton} ${preset === p.id ? styles.presetButtonActive : ''}`}
                onClick={() => handlePresetClick(p.id)}
                aria-pressed={preset === p.id}
                data-testid={`preset-${p.id}`}
              >
                <span className={styles.presetName}>{p.label}</span>
                <span className={styles.presetDesc}>{p.description}</span>
              </button>
            ))}
          </div>
        </div>

        {preset === 'custom' && (
          <div className={styles.section}>
            <p className={styles.sectionLabel}>自定义颜色</p>
            <div className={styles.colorPickerWrapper}>
              <HexColorPicker
                color={customColor}
                onChange={handleColorChange}
                className={styles.colorPicker}
                aria-label="选择背景颜色"
              />
              <div className={styles.colorValue}>
                <span
                  className={styles.colorSwatch}
                  style={{ backgroundColor: customColor }}
                  aria-hidden="true"
                />
                <input
                  type="text"
                  className={styles.colorInput}
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  aria-label="颜色值"
                  maxLength={9}
                />
              </div>
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <button
            className={styles.resetButton}
            onClick={resetToDefaults}
            data-testid="reset-background"
          >
            重置默认
          </button>
        </div>
      </div>
    </div>
  );
}
