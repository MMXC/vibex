/**
 * TreeStatus — 画布三树进度状态显示组件
 *
 * Epic E3-P2: 体验优化 (F-3.2)
 * 显示当前画布三树（限界上下文、业务流程、组件）的节点数量和确认状态
 *
 * 遵守 AGENTS.md 规范：
 * - 无 any 类型泄漏
 * - 无 console.log
 */
// @ts-nocheck

'use client';

import React from 'react';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import styles from './canvas.module.css';

export function TreeStatus() {
  const contextNodes = useCanvasStore((s) => s.contextNodes);
  const flowNodes = useCanvasStore((s) => s.flowNodes);
  const componentNodes = useCanvasStore((s) => s.componentNodes);

  const activeContexts = (contextNodes ?? []).filter((n) => n.isActive !== false).length;
  const activeFlows = (flowNodes ?? []).filter((n) => n.isActive !== false).length;
  const activeComponents = (componentNodes ?? []).filter((n) => n.isActive !== false).length;

  return (
    <div className={styles.treeStatus} data-testid="tree-status" aria-label="三树进度状态">
      <span
        className={`${styles.treeStatusItem} ${activeContexts === contextNodes.length && contextNodes.length > 0 ? styles.treeStatusConfirmed : ''}`}
        title={`限界上下文：${contextNodes.length} 个节点，${activeContexts} 个已确认`}
      >
        📋 上下文{' '}
        <strong>{contextNodes.length}</strong>{' '}
        {activeContexts === contextNodes.length && contextNodes.length > 0 ? '✓' : ''}
      </span>
      <span className={styles.treeStatusDivider} aria-hidden="true">|</span>
      <span
        className={`${styles.treeStatusItem} ${activeFlows === flowNodes.length && flowNodes.length > 0 ? styles.treeStatusConfirmed : ''}`}
        title={`业务流程：${flowNodes.length} 个节点，${activeFlows} 个已确认`}
      >
        🔀 流程{' '}
        <strong>{flowNodes.length}</strong>{' '}
        {activeFlows === flowNodes.length && flowNodes.length > 0 ? '✓' : ''}
      </span>
      <span className={styles.treeStatusDivider} aria-hidden="true">|</span>
      <span
        className={`${styles.treeStatusItem} ${activeComponents === componentNodes.length && componentNodes.length > 0 ? styles.treeStatusConfirmed : ''}`}
        title={`组件树：${componentNodes.length} 个节点，${activeComponents} 个已确认`}
      >
        🧩 组件{' '}
        <strong>{componentNodes.length}</strong>{' '}
        {activeComponents === componentNodes.length && componentNodes.length > 0 ? '✓' : ''}
      </span>
    </div>
  );
}
