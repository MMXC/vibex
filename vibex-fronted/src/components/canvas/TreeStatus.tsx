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
'use client';

import React from 'react';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import styles from './canvas.module.css';

export function TreeStatus() {
  const contextNodes = useCanvasStore((s) => s.contextNodes);
  const flowNodes = useCanvasStore((s) => s.flowNodes);
  const componentNodes = useCanvasStore((s) => s.componentNodes);

  const confirmedContexts = contextNodes.filter((n) => n.confirmed).length;
  const confirmedFlows = flowNodes.filter((n) => n.confirmed).length;
  const confirmedComponents = componentNodes.filter((n) => n.confirmed).length;

  return (
    <div className={styles.treeStatus} data-testid="tree-status" aria-label="三树进度状态">
      <span
        className={`${styles.treeStatusItem} ${confirmedContexts === contextNodes.length && contextNodes.length > 0 ? styles.treeStatusConfirmed : ''}`}
        title={`限界上下文：${contextNodes.length} 个节点，${confirmedContexts} 个已确认`}
      >
        📋 上下文{' '}
        <strong>{contextNodes.length}</strong>{' '}
        {confirmedContexts === contextNodes.length && contextNodes.length > 0 ? '✓' : ''}
      </span>
      <span className={styles.treeStatusDivider} aria-hidden="true">|</span>
      <span
        className={`${styles.treeStatusItem} ${confirmedFlows === flowNodes.length && flowNodes.length > 0 ? styles.treeStatusConfirmed : ''}`}
        title={`业务流程：${flowNodes.length} 个节点，${confirmedFlows} 个已确认`}
      >
        🔀 流程{' '}
        <strong>{flowNodes.length}</strong>{' '}
        {confirmedFlows === flowNodes.length && flowNodes.length > 0 ? '✓' : ''}
      </span>
      <span className={styles.treeStatusDivider} aria-hidden="true">|</span>
      <span
        className={`${styles.treeStatusItem} ${confirmedComponents === componentNodes.length && componentNodes.length > 0 ? styles.treeStatusConfirmed : ''}`}
        title={`组件树：${componentNodes.length} 个节点，${confirmedComponents} 个已确认`}
      >
        🧩 组件{' '}
        <strong>{componentNodes.length}</strong>{' '}
        {confirmedComponents === componentNodes.length && componentNodes.length > 0 ? '✓' : ''}
      </span>
    </div>
  );
}
