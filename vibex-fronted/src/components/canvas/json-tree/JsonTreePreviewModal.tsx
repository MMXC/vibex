'use client';

import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { JsonRenderPreview } from '@/components/canvas/json-render/JsonRenderPreview';
import type { ComponentNode } from '@/lib/canvas/types';
import styles from './JsonTreePreviewModal.module.css';

interface JsonTreePreviewModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Component nodes to display */
  nodes: ComponentNode[];
}

/**
 * JsonTreePreviewModal — E1-F3: JSON tree preview modal
 * Displays component nodes using JsonRenderPreview in a modal overlay.
 */
export function JsonTreePreviewModal({
  isOpen,
  onClose,
  nodes,
}: JsonTreePreviewModalProps) {
  // Build compact JSON summary for title
  const summary = useMemo(() => {
    const total = nodes.length;
    const byType: Record<string, number> = {};
    for (const node of nodes) {
      byType[node.type] = (byType[node.type] ?? 0) + 1;
    }
    return `${total} 个组件 (${Object.entries(byType).map(([k, v]) => `${v} ${k}`).join(', ')})`;
  }, [nodes]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="JSON 树视图预览"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="json-tree-preview-modal"
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 className={styles.title}>📋 JSON 树视图</h2>
            <p className={styles.subtitle}>{summary}</p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="关闭"
            data-testid="json-tree-modal-close"
          >
            <X size={18} />
          </button>
        </div>
        <div className={styles.body}>
          <JsonRenderPreview nodes={nodes} />
        </div>
      </div>
    </div>
  );
}
