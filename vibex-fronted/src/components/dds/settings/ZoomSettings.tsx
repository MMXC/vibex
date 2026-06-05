/**
 * ZoomSettings.tsx — Default Zoom Settings Tab
 * S65-E3: Canvas View Personalization Settings Panel
 */
'use client';

import React, { useCallback } from 'react';
import { useSettingsStore } from '@/stores/dds/settingsStore';
import styles from './ZoomSettings.module.css';

const ZOOM_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

function ZoomIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

export function ZoomSettings() {
  const defaultZoom = useSettingsStore((s) => s.defaultZoom);
  const setDefaultZoom = useSettingsStore((s) => s.setDefaultZoom);

  const handleZoomChange = useCallback(
    (zoom: number) => {
      setDefaultZoom(zoom);
    },
    [setDefaultZoom]
  );

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <label className={styles.sectionLabel}>
          <ZoomIcon />
          默认缩放比例
        </label>
        <p className={styles.hint}>新建画布时的默认缩放级别</p>
        <div className={styles.zoomOptions}>
          {ZOOM_OPTIONS.map((zoom) => (
            <button
              key={zoom}
              type="button"
              className={`${styles.zoomButton} ${defaultZoom === zoom ? styles.active : ''}`}
              onClick={() => handleZoomChange(zoom)}
              aria-pressed={defaultZoom === zoom}
            >
              {zoom === 1.0 ? '100%' : `${zoom * 100}%`}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.previewRow}>
        <span className={styles.previewLabel}>当前预览：</span>
        <div className={styles.previewBox}>
          <span className={styles.previewZoom}>{defaultZoom * 100}%</span>
        </div>
      </div>
    </div>
  );
}
