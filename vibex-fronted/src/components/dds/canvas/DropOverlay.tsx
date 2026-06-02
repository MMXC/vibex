/**
 * DropOverlay — Visual overlay shown during file drag over canvas
 * S54-E2: Canvas File Import Enhancement
 *
 * Renders as a full-canvas overlay with dashed border when dragging files.
 */

'use client';

import React from 'react';
import styles from './DropOverlay.module.css';

interface DropOverlayProps {
  visible: boolean;
}

export function DropOverlay({ visible }: DropOverlayProps) {
  if (!visible) return null;

  return (
    <div className={styles.overlay} aria-hidden="true">
      <div className={styles.content}>
        <span className={styles.icon}>📥</span>
        <span className={styles.label}>松开导入文件</span>
        <span className={styles.hint}>支持 .vibex / .json / .yaml</span>
      </div>
    </div>
  );
}
