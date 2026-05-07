/**
 * ProtoPreviewPanel — Overlay panel showing selected component preview
 * E01-U1: useShallow subscription to prototypeStore.selectedNodeId
 * E01-U4: Unselected placeholder
 * E01-U2: data-rebuild="false" for hot-update
 */
'use client';

import React, { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { usePrototypeStore } from '@/stores/prototypeStore';
import type { ProtoNode, ProtoNodeData } from '@/stores/prototypeStore';
import { ProtoPreviewContent } from './ProtoPreviewContent';
import styles from './ProtoFlowCanvas.module.css';

export function ProtoPreviewPanel() {
  const { selectedNodeId, nodes: allNodes } = usePrototypeStore(
    useShallow((s) => ({
      selectedNodeId: s.selectedNodeId,
      nodes: s.nodes,
    }))
  );

  const selectedNode = useMemo<ProtoNode | null>(() => {
    if (!selectedNodeId) return null;
    return allNodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [selectedNodeId, allNodes]);

  // E01-U4: Unselected placeholder
  if (!selectedNode) {
    return (
      <div
        className={styles.protoPreview}
        data-testid="proto-preview-placeholder"
        aria-label="未选中组件占位符"
      >
        <div className={styles.placeholderContent}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h6M9 12h6M9 15h4" />
          </svg>
          <p>选中组件以预览</p>
        </div>
      </div>
    );
  }

  const nodeData = selectedNode.data as ProtoNodeData;
  const componentLabel = (nodeData.component?.type ?? '未命名') as string;

  // E01-U2: Render with rebuild=false flag
  return (
    <div
      className={styles.protoPreview}
      data-testid="proto-preview"
      data-node-id={selectedNode.id}
      data-rebuild="false"
      aria-label={`组件预览: ${componentLabel}`}
    >
      <div className={styles.protoPreviewHeader}>
        <span className={styles.protoPreviewLabel}>{componentLabel}</span>
        <span className={styles.protoPreviewId}>{selectedNode.id}</span>
      </div>
      <div className={styles.protoPreviewBody}>
        <ProtoPreviewContent node={selectedNode} />
      </div>
    </div>
  );
}
