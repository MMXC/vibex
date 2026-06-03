/**
 * DropOverlay — Full-screen overlay shown during file drag
 * S58-E2: 桌面文件拖拽导入
 *
 * Renders a semi-transparent overlay with a drop zone indicator
 * when the user drags files over the canvas.
 *
 * @module components/dds/canvas/DropOverlay
 */

'use client';

import React from 'react';
import styles from './DropOverlay.module.css';

export interface DropOverlayProps {
  visible: boolean;
  fileCount?: number;
}

export function DropOverlay({ visible, fileCount = 0 }: DropOverlayProps) {
  if (!visible) return null;

  return (
    <div className={styles.overlay} aria-hidden="true">
      <div className={styles.content}>
        <div className={styles.icon} aria-hidden="true">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <p className={styles.title}>松开以导入文件</p>
        <p className={styles.subtitle}>
          支持 .vibex · .json · .yaml · .yml
          {fileCount > 0 && (
            <span className={styles.fileCount}>（{fileCount} 个文件）</span>
          )}
        </p>
      </div>
    </div>
  );
}
