/**
 * CanvasPreviewModal — Full-screen preview modal for Canvas components
 * 
 * E3: Preview-Edit Sync
 * - Shows active node selection in header
 * - Sync toggle to enable/disable edit↔preview sync
 * - Syncs selection to componentStore when clicking nodes
 */
'use client';

import React from 'react';
import { JsonRenderPreview } from '@/components/canvas/json-render/JsonRenderPreview';
import { JsonRenderErrorBoundary } from '@/components/canvas/json-render/JsonRenderErrorBoundary';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import { useCanvasPreviewStore } from '@/lib/canvas/stores/canvasPreviewStore';
import styles from './CanvasPreviewModal.module.css';

export function CanvasPreviewModal() {
  const [isOpen, setIsOpen] = React.useState(false);
  const componentNodes = useComponentStore((s) => s.componentNodes);
  
  // E3: Preview state
  const { 
    activeNodeId, 
    syncEnabled, 
    setActiveNode, 
    toggleSync,
    clearActiveNode 
  } = useCanvasPreviewStore();

  // Find active node name
  const activeNode = componentNodes.find(n => n.nodeId === activeNodeId);
  const activeNodeName = activeNode?.name ?? null;

  const handleNodeClick = (nodeId: string, _type: string) => {
    setActiveNode(nodeId);
  };

  const handleClose = () => {
    clearActiveNode();
    setIsOpen(false);
  };

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
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>组件预览</h2>
          <div className={styles.modalActions}>
            {/* E3: Active node indicator */}
            {activeNodeName && (
              <span className={styles.activeNode} data-testid="active-node">
                <span className={styles.activeNodeDot} />
                {activeNodeName}
              </span>
            )}
            
            {/* E3: Sync toggle */}
            <button 
              className={`${styles.syncToggle} ${syncEnabled ? styles.syncEnabled : styles.syncDisabled}`}
              onClick={toggleSync}
              title={syncEnabled ? '同步已开启 - 点击关闭' : '同步已关闭 - 点击开启'}
              data-testid="sync-toggle"
            >
              <span className={styles.syncIcon}>
                {syncEnabled ? (
                  // Linked/chain icon
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                ) : (
                  // Unlink icon
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18.84 12.25l1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M5.16 11.75l-1.72 1.71a5 5 0 0 0 7.07 7.07l1.72-1.71"/>
                    <line x1="2" y1="2" x2="22" y2="22"/>
                  </svg>
                )}
              </span>
              <span className={styles.syncLabel}>
                {syncEnabled ? '同步' : '已断开'}
              </span>
            </button>
            
            <span className={styles.nodeCount}>{componentNodes.length} 个组件</span>
            <button className={styles.closeButton} onClick={handleClose}>
              ✕
            </button>
          </div>
        </div>
        <div className={styles.modalBody}>
          <JsonRenderErrorBoundary>
            <JsonRenderPreview
              nodes={componentNodes}
              onNodeClick={handleNodeClick}
              interactive={true}
            />
          </JsonRenderErrorBoundary>
        </div>
      </div>
    </div>
  );
}
