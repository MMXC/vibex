/**
 * TemplatePreviewDialog.tsx — Canvas Template Preview Dialog
 * Sprint54 E5: Template Gallery 增强
 *
 * Full-screen dialog showing a template preview using MiniCanvas.
 * Displays template metadata and a read-only canvas preview.
 */
'use client';

import React, { memo, useState } from 'react';
import { MiniCanvas } from './MiniCanvas';
import type { CanvasTemplateData } from '@/lib/canvas/templateStore';
import type { CanvasSnapshotData } from '@/lib/canvas/serialize';
import styles from './TemplatePreviewDialog.module.css';

interface TemplatePreviewDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Template to preview */
  template: CanvasTemplateData | null;
  /** Called when dialog closes */
  onClose: () => void;
  /** Called when user applies the template */
  onApply?: (templateId: string) => void;
}

export const TemplatePreviewDialog = memo<TemplatePreviewDialogProps>(
  ({ isOpen, template, onClose, onApply }) => {
    const [applying, setApplying] = useState(false);

    if (!isOpen || !template) return null;

    const handleApply = () => {
      if (!template) return;
      setApplying(true);
      try {
        onApply?.(template.id);
        onClose();
      } finally {
        setApplying(false);
      }
    };

    // Parse snapshot data for MiniCanvas
    let snapshotData = null;
    try {
      snapshotData = JSON.parse(template.snapshot);
    } catch {
      snapshotData = null;
    }

    return (
      <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="模板预览">
        <div className={styles.dialog}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <span className={styles.icon}>{template.icon}</span>
              <h3 className={styles.title}>{template.name}</h3>
            </div>
            <div className={styles.headerRight}>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="关闭"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Description */}
          <div className={styles.meta}>
            <p className={styles.description}>{template.description}</p>
            <div className={styles.tags}>
              {template.category && (
                <span className={styles.categoryBadge}>{template.category}</span>
              )}
              {template.tags.slice(0, 3).map((tag) => (
                <span key={tag} className={styles.tag}>
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Mini Canvas Preview */}
          <div className={styles.preview}>
            {snapshotData ? (
              <MiniCanvas data={snapshotData} />
            ) : (
              <div className={styles.previewPlaceholder}>
                <span>预览不可用</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="button"
              className={styles.applyBtn}
              onClick={handleApply}
              disabled={applying}
              aria-label="应用此模板"
            >
              {applying ? '应用中...' : '应用模板'}
            </button>
          </div>
        </div>
      </div>
    );
  }
);

TemplatePreviewDialog.displayName = 'TemplatePreviewDialog';
