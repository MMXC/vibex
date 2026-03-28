/**
 * CanvasPage — 画布主容器组件
 * 三树并行画布，三列横向布局，响应式 Tab 切换
 *
 * Epic 1 实现: S1.1 (三列布局) + S1.2 (阶段进度条) + S1.3 (树面板折叠)
 * Epic 5 实现: S5.4 (创建项目按钮) + S5.5 (原型队列)
 *
 * 遵守 AGENTS.md 规范：
 * - 组件接收 slice 相关 props，不直接访问多个 canvasStore slice
 * - 无 any 类型泄漏
 * - 无 console.log
 */
'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import { areAllConfirmed } from '@/lib/canvas/cascade';
import { PhaseProgressBar } from './PhaseProgressBar';
import { TreeStatus } from './TreeStatus';
import { TreePanel } from './TreePanel';
import { BoundedContextTree } from './BoundedContextTree';
import { ComponentTree } from './ComponentTree';
import { BusinessFlowTree } from './BusinessFlowTree';
import { ProjectBar } from './ProjectBar';
import { PrototypeQueuePanel } from './PrototypeQueuePanel';
import { HoverHotzone } from './HoverHotzone';
import type { Phase, TreeType, TreeNode } from '@/lib/canvas/types';
import styles from './canvas.module.css';

interface CanvasPageProps {
  /** 是否使用 Tab 模式（< 768px） */
  useTabMode?: boolean;
}

export function CanvasPage({ useTabMode = false }: CanvasPageProps) {
  // === Store Selectors ===
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
  const loadExampleData = useCanvasStore((s) => s.loadExampleData);
  const autoGenerateFlows = useCanvasStore((s) => s.autoGenerateFlows);
  const flowGenerating = useCanvasStore((s) => s.flowGenerating);
  const flowGeneratingMessage = useCanvasStore((s) => s.flowGeneratingMessage);

  // === Expand State Selectors (E2) ===
  const gridRef = useRef<HTMLDivElement>(null);
  const _getGridTemplate = useCanvasStore((s) => s.getGridTemplate);
  const leftExpand = useCanvasStore((s) => s.leftExpand);
  const centerExpand = useCanvasStore((s) => s.centerExpand);
  const rightExpand = useCanvasStore((s) => s.rightExpand);

  // === Sync expand state to CSS variables ===
  useEffect(() => {
    if (!gridRef.current) return;
    const grid = gridRef.current;
    grid.style.setProperty('--grid-left', leftExpand === 'expand-right' ? '1.5fr' : leftExpand === 'expand-left' ? '0fr' : '1fr');
    grid.style.setProperty('--grid-center', centerExpand === 'expand-left' ? '1.5fr' : centerExpand === 'expand-right' ? '0fr' : '1fr');
    grid.style.setProperty('--grid-right', rightExpand === 'expand-left' ? '1.5fr' : rightExpand === 'expand-right' ? '0fr' : '1fr');
  }, [leftExpand, centerExpand, rightExpand]);

  // === UI State ===
  const [activeTab, setActiveTab] = useState<TreeType>('context');
  const [projectName, setProjectName] = useState('我的项目');
  const [queuePanelExpanded, setQueuePanelExpanded] = useState(true);
  const [requirementInput, setRequirementInput] = useState('');

  // === AI Thinking State (Epic 1) ===
  const aiThinking = useCanvasStore((s) => s.aiThinking);
  const aiThinkingMessage = useCanvasStore((s) => s.aiThinkingMessage);
  const generateContexts = useCanvasStore((s) => s.generateContextsFromRequirement);
  const setRequirementText = useCanvasStore((s) => s.setRequirementText);
  const requirementText = useCanvasStore((s) => s.requirementText);

  // === Compute confirmation states ===
  const contextReady = areAllConfirmed(contextNodes);
  const flowReady = areAllConfirmed(flowNodes);
  const componentReady = areAllConfirmed(componentNodes);
  const allTreesConfirmed = contextReady && flowReady && componentReady
    && contextNodes.length > 0 && flowNodes.length > 0 && componentNodes.length > 0;

  // === Transform nodes to unified TreeNode ===
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

  // === Phase click handler ===
  const handlePhaseClick = (p: Phase) => {
    const phaseOrder: Phase[] = ['input', 'context', 'flow', 'component', 'prototype'];
    const currentIdx = phaseOrder.indexOf(phase);
    const targetIdx = phaseOrder.indexOf(p);
    if (targetIdx <= currentIdx) {
      setPhase(p);
    }
  };

  // === Phase label ===
  const phaseLabel =
    phase === 'input'
      ? '📝 需求录入'
      : phase === 'context'
        ? `◇ 限界上下文 (${contextNodes.length} 节点${contextReady ? ' ✅' : ''})`
        : phase === 'flow'
          ? `→ 业务流程 (${flowNodes.length} 节点${flowReady ? ' ✅' : ''})`
          : phase === 'component'
            ? `▣ 组件树 (${componentNodes.length} 节点${componentReady ? ' ✅' : ''})`
            : '🚀 原型生成';

  const phaseHint =
    phase === 'context' && !contextReady
      ? '确认所有上下文节点后解锁流程树'
      : phase === 'flow' && !flowReady
        ? '确认所有流程节点后解锁组件树'
        : phase === 'component'
          ? allTreesConfirmed
            ? '✅ 所有树已确认！可以创建项目'
            : '确认所有组件后创建项目'
          : '';

  // === Tab content for mobile ===
  const renderTabContent = (tab: TreeType, _treeNodes: TreeNode[], _isActive: boolean) => {
    switch (tab) {
      case 'context':
        return (
          <TreePanel
            tree="context"
            title="限界上下文树"
            nodes={contextTreeNodes}
            collapsed={contextPanelCollapsed}
            isActive={contextActive}
            onToggleCollapse={toggleContextPanel}
            actions={
              contextNodes.length > 0 ? (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => autoGenerateFlows(contextNodes)}
                    disabled={flowGenerating}
                    aria-label="生成流程树"
                    title="基于已确认的限界上下文生成业务流程树"
                  >
                    {flowGenerating
                      ? `◌ ${flowGeneratingMessage ?? '生成中...'}`
                      : '→ 继续 → 流程树'}
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => generateContexts(requirementText)}
                    disabled={aiThinking || !requirementText.trim()}
                    aria-label="重新生成限界上下文"
                    title="使用当前需求文本重新生成上下文"
                  >
                    {aiThinking ? '◌ 重新生成中...' : '🔄 重新生成'}
                  </button>
                </div>
              ) : undefined
            }
          >
            <BoundedContextTree />
          </TreePanel>
        );
      case 'flow':
        return (
          <TreePanel
            tree="flow"
            title="业务流程树"
            nodes={flowTreeNodes}
            collapsed={flowPanelCollapsed}
            isActive={flowActive}
            onToggleCollapse={toggleFlowPanel}
          >
            <BusinessFlowTree isActive={flowActive || activeTree === null} />
          </TreePanel>
        );
      case 'component':
        return (
          <TreePanel
            tree="component"
            title="组件树"
            nodes={componentTreeNodes}
            collapsed={componentPanelCollapsed}
            isActive={componentActive}
            onToggleCollapse={toggleComponentPanel}
          >
            <ComponentTree />
          </TreePanel>
        );
    }
  };

  const contextActive = activeTree === 'context' || activeTree === null;
  const flowActive = activeTree === 'flow';
  const componentActive = activeTree === 'component';

  // === Render ===
  return (
    <div className={styles.canvasContainer}>
      {/* Phase Progress Bar */}
      <div className={styles.phaseProgressBarWrapper}>
        <PhaseProgressBar currentPhase={phase} onPhaseClick={handlePhaseClick} />
        {phase !== 'input' && <TreeStatus />}
      </div>

      {/* Project Bar — Epic 5: Create Project button */}
      {phase !== 'input' && (
        <div className={styles.projectBarWrapper}>
          <ProjectBar
            projectName={projectName}
            onProjectNameChange={setProjectName}
          />
        </div>
      )}

      {/* Phase Label */}
      <div className={styles.phaseLabelBar}>
        <span className={styles.phaseCurrentLabel}>{phaseLabel}</span>
        {phase !== 'input' && phaseHint && (
          <span className={styles.phaseHint}>{phaseHint}</span>
        )}
      </div>

      {/* === PROTOTYPE PHASE: Queue Panel === */}
      {phase === 'prototype' ? (
        <div className={styles.prototypePhase}>
          <PrototypeQueuePanel
            expanded={queuePanelExpanded}
            onToggleExpand={() => setQueuePanelExpanded((v) => !v)}
          />
        </div>
      ) : (
        /* === TREE PHASES === */
        <>
          {useTabMode ? (
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
                {renderTabContent(
                  activeTab,
                  activeTab === 'context' ? contextTreeNodes : activeTab === 'flow' ? flowTreeNodes : componentTreeNodes,
                  activeTab === 'context' ? contextActive : activeTab === 'flow' ? flowActive : componentActive
                )}
              </div>
            </div>
          ) : (
            <div ref={gridRef} className={styles.treePanelsGrid}>
              <TreePanel
                tree="context"
                title="限界上下文树"
                nodes={contextTreeNodes}
                collapsed={contextPanelCollapsed}
                isActive={contextActive}
                onToggleCollapse={toggleContextPanel}
                actions={
                  contextNodes.length > 0 ? (
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => generateContexts(requirementText)}
                      disabled={aiThinking || !requirementText.trim()}
                      aria-label="重新生成限界上下文"
                      title="使用当前需求文本重新生成上下文"
                    >
                      {aiThinking ? '◌ 重新生成中...' : '🔄 重新生成'}
                    </button>
                  ) : undefined
                }
              >
                <HoverHotzone position="left-edge" panel="left" />
                <BoundedContextTree />
                <HoverHotzone position="right-edge" panel="left" />
              </TreePanel>

              <TreePanel
                tree="flow"
                title="业务流程树"
                nodes={flowTreeNodes}
                collapsed={flowPanelCollapsed}
                isActive={flowActive}
                onToggleCollapse={toggleFlowPanel}
              >
                <HoverHotzone position="left-edge" panel="center" centerExpandDirection="left" />
                <BusinessFlowTree isActive={flowActive || activeTree === null} />
                <HoverHotzone position="right-edge" panel="center" centerExpandDirection="right" />
              </TreePanel>

              <TreePanel
                tree="component"
                title="组件树"
                nodes={componentTreeNodes}
                collapsed={componentPanelCollapsed}
                isActive={componentActive}
                onToggleCollapse={toggleComponentPanel}
              >
                <HoverHotzone position="left-edge" panel="right" />
                <ComponentTree />
                <HoverHotzone position="right-edge" panel="right" />
              </TreePanel>
            </div>
          )}
        </>
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
              value={requirementInput}
              onChange={(e) => setRequirementInput(e.target.value)}
              disabled={aiThinking}
            />
            <div className={styles.inputPhaseActions}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => {
                  if (requirementInput.trim()) {
                    setRequirementText(requirementInput);
                    generateContexts(requirementInput);
                  }
                }}
                disabled={!requirementInput.trim() || aiThinking}
              >
                {aiThinking ? '分析中...' : '启动画布 →'}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={loadExampleData}
                aria-label="导入示例数据"
                data-testid="import-example-btn"
                title="加载示例画布数据到三树"
              >
                导入示例
              </button>
            </div>

            {/* AI Thinking Hint (Epic 1) */}
            {aiThinking && (
              <div className={styles.aiThinkingHint} role="status" aria-live="polite">
                <span className={styles.aiSpinner} aria-hidden="true" />
                <span className={styles.aiThinkingMessage}>
                  {aiThinkingMessage ?? '正在分析需求...'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
