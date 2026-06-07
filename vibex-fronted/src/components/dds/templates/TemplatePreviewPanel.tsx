'use client';

/**
 * TemplatePreviewPanel.tsx — S74-E5: Template Preview Mode
 *
 * Drawer panel showing template node tree with node details.
 * Displays node name/type/connection relationships and supports
 * importing the template into the canvas.
 *
 * S74-E5: Adds keyboard navigation — Escape closes the panel,
 * Tab cycles through interactive elements within the panel.
 */

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useTemplateStore, TemplateNode } from '@/stores/templateStore';
import styles from './TemplatePreviewPanel.module.css';

interface TemplatePreviewPanelProps {
  /** Target template ID */
  templateId: string;
  /** Open state */
  open: boolean;
  /** Close callback */
  onClose: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  epic: '#8B5CF6',
  feature: '#3B82F6',
  story: '#10B981',
  task: '#F59E0B',
  bug: '#EF4444',
};

const PRIORITY_COLORS: Record<string, string> = {
  P0: '#EF4444',
  P1: '#F59E0B',
  P2: '#3B82F6',
  P3: '#6B7280',
};

export function TemplatePreviewPanel({ templateId, open, onClose }: TemplatePreviewPanelProps) {
  const getTemplateNodes = useTemplateStore((s) => s.getTemplateNodes);
  const templates = useTemplateStore((s) => s.templates);
  const applyTemplate = useTemplateStore((s) => s.applyTemplate);
  const selectTemplate = useTemplateStore((s) => s.selectTemplate);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape key closes the panel
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Focus the panel when it opens and manage focus trap for Tab navigation
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    // Focus the first focusable element inside the panel
    const focusableSelectors = [
      'button:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
    ].join(', ');
    const focusable = panel.querySelectorAll<HTMLElement>(focusableSelectors);
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      panel.focus();
    }

    // Focus trap: keep Tab navigation inside the panel
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(focusableSelectors)
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    panel.addEventListener('keydown', handleTabKey);
    return () => panel.removeEventListener('keydown', handleTabKey);
  }, [open]);

  const template = useMemo(
    () => templates.find((t) => t.id === templateId),
    [templates, templateId]
  );

  const nodes = useMemo(
    () => getTemplateNodes(templateId),
    [getTemplateNodes, templateId]
  );

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  const handleImport = useCallback(() => {
    if (!template || isImporting) return;
    setIsImporting(true);
    try {
      applyTemplate(template);
      onClose();
    } finally {
      setIsImporting(false);
    }
  }, [template, isImporting, applyTemplate, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div
        className={styles.panel}
        ref={panelRef}
        role="dialog"
        aria-label="模板预览"
        tabIndex={-1}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>{template?.name ?? '模板预览'}</h2>
            {template && (
              <span className={styles.badge}>{nodes.length} 个节点</span>
            )}
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Node List */}
          <div className={styles.nodeList} data-testid="node-list">
            <h3 className={styles.sectionTitle}>节点列表</h3>
            {nodes.length === 0 ? (
              <div className={styles.empty} data-testid="empty-nodes">
                暂无节点
              </div>
            ) : (
              nodes.map((node) => (
                <button
                  key={node.id}
                  className={`${styles.nodeRow} ${selectedNodeId === node.id ? styles.selected : ''}`}
                  onClick={() => setSelectedNodeId(node.id)}
                  data-testid={`node-${node.id}`}
                >
                  <span
                    className={styles.typeTag}
                    style={{ backgroundColor: TYPE_COLORS[node.type] ?? '#6B7280' }}
                  >
                    {node.type}
                  </span>
                  <span className={styles.nodeTitle}>{node.title}</span>
                  <span className={styles.edgeCounts}>
                    <span title="入边数">←{node.inboundCount}</span>
                    <span title="出边数">{node.outboundCount}→</span>
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Node Detail */}
          <div className={styles.nodeDetail}>
            <h3 className={styles.sectionTitle}>节点详情</h3>
            {selectedNode ? (
              <div className={styles.detailCard} data-testid="node-detail">
                <div className={styles.detailHeader}>
                  <span
                    className={styles.typeTag}
                    style={{ backgroundColor: TYPE_COLORS[selectedNode.type] ?? '#6B7280' }}
                  >
                    {selectedNode.type}
                  </span>
                  <span
                    className={styles.priorityTag}
                    style={{ color: PRIORITY_COLORS[selectedNode.priority] ?? '#6B7280' }}
                  >
                    {selectedNode.priority}
                  </span>
                </div>
                <h4 className={styles.detailTitle}>{selectedNode.title}</h4>
                <p className={styles.detailDesc}>{selectedNode.description}</p>
                <div className={styles.detailMeta}>
                  <span>入边: {selectedNode.inboundCount}</span>
                  <span>出边: {selectedNode.outboundCount}</span>
                </div>
              </div>
            ) : (
              <div className={styles.emptyDetail}>
                点击节点查看详情
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            className={styles.importBtn}
            onClick={handleImport}
            disabled={isImporting || !template}
            data-testid="import-btn"
          >
            {isImporting ? '导入中…' : '导入模板'}
          </button>
        </div>
      </div>
    </>
  );
}
