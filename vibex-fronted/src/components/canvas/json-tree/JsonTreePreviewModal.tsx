'use client';

import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import type { ComponentGroup } from '../ComponentTree';
import styles from './JsonTreePreviewModal.module.css';

/**
 * Build the pages JSON data structure from ComponentGroup[].
 * Spec: docs/vibex-proposals-20260411-page-structure/specs/03-json-preview.md §3.3
 *
 * @param groups - ComponentGroup[] from groupByFlowId()
 * @returns JSON-serializable pages data matching the spec's PageData interface
 */
export function buildPagesData(groups: ComponentGroup[]): {
  pages: Array<{
    pageId: string;
    pageName: string;
    componentCount: number;
    isCommon: boolean;
    components: Array<{
      nodeId: string;
      name: string;
      type: string;
      flowId: string;
      status: string;
      pageName?: string;
      children?: unknown[];
    }>;
  }>;
  totalComponents: number;
  generatedAt: string;
} {
  const pages = groups.map((g) => {
    // Strip emoji prefix from label to get clean pageName
    // e.g. "📄 首页" → "首页", "🔧 通用组件" → "通用组件"
    const pageName = g.label.replace(/^[\u{1F4C4}\u{2753}\u{1F527}]\s*/u, '');

    return {
      pageId: g.pageId,
      pageName,
      componentCount: g.componentCount,
      isCommon: g.isCommon ?? false,
      components: g.nodes.map((n) => ({
        nodeId: n.nodeId,
        name: n.name,
        type: n.type,
        flowId: n.flowId,
        status: n.status,
        pageName: n.pageName,
        // children are string[] (child node IDs), include as-is
        children: n.children.length > 0 ? n.children : undefined,
      })),
    };
  });

  const totalComponents = groups.reduce((sum, g) => sum + g.nodes.length, 0);

  return {
    pages,
    totalComponents,
    generatedAt: new Date().toISOString(),
  };
}

export interface JsonTreePreviewModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** ComponentGroup[] from groupByFlowId() */
  groups: ComponentGroup[];
}

/**
 * JsonTreePreviewModal — E2 JSON Preview Modal
 *
 * Displays component tree as structured JSON:
 * {
 *   pages: [{ pageId, pageName, componentCount, isCommon, components }],
 *   totalComponents,
 *   generatedAt
 * }
 *
 * Matches spec: docs/vibex-proposals-20260411-page-structure/specs/03-json-preview.md
 * Accepts AC6/AC7/AC8: pageId, pageName, componentCount visible in modal.
 */
export function JsonTreePreviewModal({
  isOpen,
  onClose,
  groups,
}: JsonTreePreviewModalProps) {
  const pagesData = useMemo(() => buildPagesData(groups), [groups]);

  // Summary: total components + breakdown by type
  const summary = useMemo(() => {
    const total = pagesData.totalComponents;
    const byType: Record<string, number> = {};
    for (const page of pagesData.pages) {
      for (const comp of page.components) {
        byType[comp.type] = (byType[comp.type] ?? 0) + 1;
      }
    }
    const breakdown = Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${v} ${k}`)
      .join(', ');
    return `${total} 个组件 · ${pagesData.pages.length} 个页面`;
  }, [pagesData]);

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
          <pre className={styles.jsonPre} data-testid="json-tree-content">
            {JSON.stringify(pagesData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
