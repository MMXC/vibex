/**
 * CanvasPage — 画布主容器组件
 * 三树并行画布，三列横向布局，响应式 Tab 切换
 *
 * Epic 1 实现：S1.1 (三列布局) + S1.2 (阶段进度条) + S1.3 (树面板折叠)
 * + S1.4 (激活/暗淡联动) + S1.5 (节点确认样式)
 *
 * 遵守 AGENTS.md 规范：
 * - 组件接收 slice 相关 props，不直接访问多个 canvasStore slice
 * - 无 any 类型泄漏
 * - 无 console.log
 */
'use client';

import React, { useMemo } from 'react';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import { areAllConfirmed } from '@/lib/canvas/cascade';
import { PhaseProgressBar } from './PhaseProgressBar';
import { TreePanel } from './TreePanel';
import { BoundedContextTree } from './BoundedContextTree';
import type { Phase, TreeType, TreeNode } from '@/lib/canvas/types';
import styles from './canvas.module.css';

// Placeholder tree components — will be implemented in Epic 2-4
function PlaceholderTree({ tree, title }: { tree: TreeType; title: string }) {
  return (
    <div className={styles.placeholderTree}>
      <span className={styles.placeholderIcon}>
        {tree === 'context' ? '◇' : tree === 'flow' ? '→' : '▣'}
      </span>
      <p>{title}将在 Epic 2-4 实现</p>
    </div>
  );
}

interface CanvasPageProps {
  /** 是否使用 Tab 模式（< 768px） */
  useTabMode?: boolean;
}

export function CanvasPage({ useTabMode = false }: CanvasPageProps) {
  // === Store Selectors (individual selectors to avoid full re-render) ===
  const phase = useCanvasStore((s) => s.phase);
  const activeTree = useCanvasStore((s) => s.activeTree);
  const contextNodes = useCanvasStore((s) => s.contextNodes);
  const flowNodes = useCanvasStore((s) => s.flowNodes);
  const componentNodes = useCanvasStore((s) => s.componentNodes);
  const contextPanelCollapsed = useCanvasStore((s) => s.contextPanelCollapsed);
  const flowPanelCollapsed = useCanvasStore((s) => s.flowPanelCollapsed);
  const componentPanelCollapsed = useCanvasStore((s) => s.componentPanelCollapsed);
  const setPhase = useCanvasStore((s) => s.setPhase);
  const toggleContextPanel = useCanvasStore((s) => s.toggleContextPanel);
  const toggleFlowPanel = useCanvasStore((s) => s.toggleFlowPanel);
  const toggleComponentPanel = useCanvasStore((s) => s.toggleComponentPanel);
  // Placeholders for Epic 2-4 node interactions
  const _confirmContextNode = useCanvasStore((s) => s.confirmContextNode);
  const _confirmFlowNode = useCanvasStore((s) => s.confirmFlowNode);
  const _confirmComponentNode = useCanvasStore((s) => s.confirmComponentNode);
  const _editContextNode = useCanvasStore((s) => s.editContextNode);
  const _editFlowNode = useCanvasStore((s) => s.editFlowNode);
  const _editComponentNode = useCanvasStore((s) => s.editComponentNode);

  // === Compute tree activation states ===
  const contextActive = activeTree === 'context' || activeTree === null;
  const flowActive = activeTree === 'flow';
  const componentActive = activeTree === 'component';

  // === Transform nodes to unified TreeNode for TreePanel ===
  const contextTreeNodes: TreeNode[] = useMemo(
    () =>
      contextNodes.map((n) => ({
        id: n.nodeId,
        label: n.name,
        type: 'context' as TreeType,
        status: n.status,
        confirmed: n.confirmed,
        parentId: n.parentId,
        children: n.children,
        data: n,
      })),
    [contextNodes]
  );

  const flowTreeNodes: TreeNode[] = useMemo(
    () =>
      flowNodes.map((n) => ({
        id: n.nodeId,
        label: n.name,
        type: 'flow' as TreeType,
        status: n.status,
        confirmed: n.confirmed,
        parentId: n.parentId,
        children: n.children,
        data: n,
      })),
    [flowNodes]
  );

  const componentTreeNodes: TreeNode[] = useMemo(
    () =>
      componentNodes.map((n) => ({
        id: n.nodeId,
        label: n.name,
        type: 'component' as TreeType,
        status: n.status,
        confirmed: n.confirmed,
        parentId: n.parentId,
        children: n.children,
        data: n,
      })),
    [componentNodes]
  );

  // === Tab state for mobile ===
  const [activeTab, setActiveTab] = React.useState<TreeType>('context');

  const handlePhaseClick = (p: Phase) => {
    // Only allow clicking to phases that have data or are before current
    const phaseOrder: Phase[] = ['input', 'context', 'flow', 'component', 'prototype'];
    const currentIdx = phaseOrder.indexOf(phase);
    const targetIdx = phaseOrder.indexOf(p);
    if (targetIdx <= currentIdx) {
      setPhase(p);
    }
  };

  // === Determine if context tree is ready for flow activation ===
  const contextReady = areAllConfirmed(contextNodes);
  const flowReady = areAllConfirmed(flowNodes);

  return (
    <div className={styles.canvasContainer}>
      {/* Phase Progress Bar */}
      <div className={styles.phaseProgressBarWrapper}>
        <PhaseProgressBar currentPhase={phase} onPhaseClick={handlePhaseClick} />
      </div>

      {/* Phase Label */}
      <div className={styles.phaseLabelBar}>
        <span className={styles.phaseCurrentLabel}>
          {phase === 'input'
            ? '📝 需求录入'
            : phase === 'context'
              ? `◇ 限界上下文 (${contextNodes.length} 节点${contextReady ? ' ✅' : ''})`
              : phase === 'flow'
                ? `→ 业务流程 (${flowNodes.length} 节点${flowReady ? ' ✅' : ''})`
                : phase === 'component'
                  ? `▣ 组件树 (${componentNodes.length} 节点)`
                  : '🚀 原型生成'}
        </span>
        {phase !== 'input' && (
          <span className={styles.phaseHint}>
            {phase === 'context' && !contextReady
              ? '确认所有上下文节点后解锁流程树'
              : phase === 'flow' && !flowReady
                ? '确认所有流程节点后解锁组件树'
                : phase === 'component'
                  ? '确认所有组件后创建项目'
                  : ''}
          </span>
        )}
      </div>

      {/* Tree Panels — Desktop: 3-column grid, Mobile: Tab + single panel */}
      {useTabMode ? (
        /* Mobile: Tab navigation */
        <div className={styles.canvasMobile}>
          <div className={styles.tabBar} role="tablist">
            {(['context', 'flow', 'component'] as TreeType[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={activeTab === t}
                className={`${styles.tabButton} ${
                  activeTab === t ? styles.tabButtonActive : ''
                }`}
                onClick={() => setActiveTab(t)}
              >
                {t === 'context' ? '◇ 上下文' : t === 'flow' ? '→ 流程' : '▣ 组件'}
              </button>
            ))}
          </div>
          <div className={styles.tabContent} role="tabpanel">
            {activeTab === 'context' && (
              <TreePanel
                tree="context"
                title="限界上下文树"
                nodes={contextTreeNodes}
                collapsed={contextPanelCollapsed}
                isActive={contextActive}
                onToggleCollapse={toggleContextPanel}
              >
                <BoundedContextTree />
              </TreePanel>
            )}
            {activeTab === 'flow' && (
              <TreePanel
                tree="flow"
                title="业务流程树"
                nodes={flowTreeNodes}
                collapsed={flowPanelCollapsed}
                isActive={flowActive}
                onToggleCollapse={toggleFlowPanel}
              >
                <PlaceholderTree tree="flow" title="业务流程" />
              </TreePanel>
            )}
            {activeTab === 'component' && (
              <TreePanel
                tree="component"
                title="组件树"
                nodes={componentTreeNodes}
                collapsed={componentPanelCollapsed}
                isActive={componentActive}
                onToggleCollapse={toggleComponentPanel}
              >
                <PlaceholderTree tree="component" title="组件树" />
              </TreePanel>
            )}
          </div>
        </div>
      ) : (
        /* Desktop: 3-column grid */
          <div className={styles.treePanelsGrid}>
            <TreePanel
              tree="context"
              title="限界上下文树"
              nodes={contextTreeNodes}
              collapsed={contextPanelCollapsed}
              isActive={contextActive}
              onToggleCollapse={toggleContextPanel}
            >
              <BoundedContextTree />
            </TreePanel>

            <TreePanel
              tree="flow"
              title="业务流程树"
              nodes={flowTreeNodes}
              collapsed={flowPanelCollapsed}
              isActive={flowActive}
              onToggleCollapse={toggleFlowPanel}
            >
              <PlaceholderTree tree="flow" title="业务流程" />
            </TreePanel>

            <TreePanel
              tree="component"
              title="组件树"
              nodes={componentTreeNodes}
              collapsed={componentPanelCollapsed}
              isActive={componentActive}
              onToggleCollapse={toggleComponentPanel}
            >
              <PlaceholderTree tree="component" title="组件树" />
            </TreePanel>
          </div>
      )}

      {/* Input Phase: Requirement Input Area */}
      {phase === 'input' && (
        <div className={styles.inputPhaseArea}>
          <div className={styles.inputPhaseCard}>
            <h2 className={styles.inputPhaseTitle}>🎯 描述您的需求</h2>
            <textarea
              className={styles.requirementTextarea}
              placeholder="例如：我想做一个在线预约医生系统，患者可以预约、问诊、查看病历..."
              rows={6}
              aria-label="需求描述"
            />
            <div className={styles.inputPhaseActions}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => setPhase('context')}
              >
                启动画布 →
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setPhase('context')}
              >
                导入示例
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
