/**
 * CanvasPreviewModal — Full-screen preview modal for Canvas components
 */
'use client';

import React, { useState } from 'react';
import { JsonRenderPreview } from '@/components/canvas/json-render/JsonRenderPreview';
import { JsonRenderErrorBoundary } from '@/components/canvas/json-render/JsonRenderErrorBoundary';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import styles from './CanvasPreviewModal.module.css';

export function CanvasPreviewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const componentNodes = useComponentStore((s) => s.componentNodes);

  if (!isOpen) {
    return (
      <button
        className={styles.previewButton}
        onClick={() => setIsOpen(true)}
        disabled={componentNodes.length === 0}
        title={componentNodes.length === 0 ? '先生成组件树' : '预览组件'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        预览
        {componentNodes.length > 0 && (
          <span className={styles.badge}>{componentNodes.length}</span>
        )}
      </button>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={() => setIsOpen(false)}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>组件预览</h2>
          <div className={styles.modalActions}>
            <span className={styles.nodeCount}>{componentNodes.length} 个组件</span>
            <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>
        </div>
        <div className={styles.modalBody}>
          <JsonRenderErrorBoundary>
            <JsonRenderPreview
              nodes={componentNodes}
              interactive={true}
            />
          </JsonRenderErrorBoundary>
        </div>
      </div>
    </div>
  );
}
