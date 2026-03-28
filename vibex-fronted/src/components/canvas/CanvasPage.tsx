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

import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import { areAllConfirmed } from '@/lib/canvas/cascade';
import { canvasApi } from '@/lib/canvas/api/canvasApi';
import { getHistoryStore } from '@/lib/canvas/historySlice';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { SearchDialog } from './features/SearchDialog';
import { useCanvasSearch } from '@/hooks/canvas/useCanvasSearch';
import { PhaseProgressBar } from './PhaseProgressBar';
import { TreePanel } from './TreePanel';
import { BoundedContextTree } from './BoundedContextTree';
import { ComponentTree } from './ComponentTree';
import { BusinessFlowTree } from './BusinessFlowTree';
import { ProjectBar } from './ProjectBar';
import { PrototypeQueuePanel } from './PrototypeQueuePanel';
import { HoverHotzone } from './HoverHotzone';
import { ShortcutHintPanel } from './features/ShortcutHintPanel';
import { TreeStatus } from './TreeStatus';
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
  const deleteContextNode = useCanvasStore((s) => s.deleteContextNode);
  const autoGenerateFlows = useCanvasStore((s) => s.autoGenerateFlows);
  const flowGenerating = useCanvasStore((s) => s.flowGenerating);
  const flowGeneratingMessage = useCanvasStore((s) => s.flowGeneratingMessage);

  // === Expand State Selectors (E2) ===
  const gridRef = useRef<HTMLDivElement>(null);
  const _getGridTemplate = useCanvasStore((s) => s.getGridTemplate);
  const leftExpand = useCanvasStore((s) => s.leftExpand);
  const centerExpand = useCanvasStore((s) => s.centerExpand);
  const rightExpand = useCanvasStore((s) => s.rightExpand);
  const setLeftExpand = useCanvasStore((s) => s.setLeftExpand);
  const setCenterExpand = useCanvasStore((s) => s.setCenterExpand);
  const setRightExpand = useCanvasStore((s) => s.setRightExpand);

  // Bug5: Toggle handlers for expand buttons
  const toggleLeft = useCallback(() => {
    const next = leftExpand === 'default' ? 'expand-right' : 'default';
    setLeftExpand(next as 'default' | 'expand-right');
  }, [leftExpand, setLeftExpand]);

  const toggleCenter = useCallback(() => {
    const next = centerExpand === 'default' ? 'expand-left' : 'default';
    setCenterExpand(next as 'default' | 'expand-left');
  }, [centerExpand, setCenterExpand]);

  const toggleRight = useCallback(() => {
    const next = rightExpand === 'default' ? 'expand-left' : 'default';
    setRightExpand(next as 'default' | 'expand-left');
  }, [rightExpand, setRightExpand]);

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
  const [isShortcutPanelOpen, setIsShortcutPanelOpen] = useState(false);

  // === E2-F10: Space+drag canvas panning ===
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);

  // Track Space key for panning mode
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === ' ' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const target = e.target as HTMLElement;
        const tagName = target.tagName;
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') return;
        if (target.getAttribute('contenteditable') === 'true') return;
        const role = target.getAttribute('role');
        if (role === 'textbox' || role === 'searchbox' || role === 'combobox') return;
        if (target.id === 'canvas-search-input') return;
        e.preventDefault();
        setIsSpacePressed(true);
      }
    }
    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === ' ') {
        e.preventDefault();
        setIsSpacePressed(false);
        setIsPanning(false);
        lastMousePosRef.current = null;
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Apply pan offset to the grid
  useEffect(() => {
    if (!gridRef.current) return;
    gridRef.current.style.setProperty('--canvas-pan-x', `${panOffset.x}px`);
    gridRef.current.style.setProperty('--canvas-pan-y', `${panOffset.y}px`);
  }, [panOffset]);

  // Mouse drag for panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isSpacePressed) return;
      // Only pan when space is held and clicking on the canvas (not on buttons/inputs)
      const target = e.target as HTMLElement;
      const tagName = target.tagName;
      if (tagName === 'BUTTON' || tagName === 'INPUT' || tagName === 'TEXTAREA') return;
      e.preventDefault();
      setIsPanning(true);
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    },
    [isSpacePressed]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning || !lastMousePosRef.current) return;
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      lastMousePosRef.current = null;
    }
  }, [isPanning]);

  // Reset pan on zoom reset
  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // === E2-F5: Search State ===
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  // E2-F5: Search hook — merges all three trees
  const { query, setQuery, results, searchTimeMs } = useCanvasSearch(
    contextNodes,
    flowNodes,
    componentNodes
  );

  // E2-F5: Handle search result selection — scroll to node and highlight
  const handleSearchSelect = useCallback(
    (result: { id: string; treeType: TreeType }) => {
      // Set active tree to the result's tree
      useCanvasStore.getState().setActiveTree(result.treeType);
      // Scroll node into view via minimap (handled by TreePanel's onNodeClick)
      const nodeEl = document.querySelector<HTMLElement>(`[data-node-id="${result.id}"]`);
      nodeEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add pulse highlight class
      nodeEl?.classList.add(styles.searchHighlightNode);
      setTimeout(() => nodeEl?.classList.remove(styles.searchHighlightNode), 2000);
    },
    []
  );

  // E2-F12: Handle minimap node click — scroll to and highlight node
  const handleMinimapNodeClick = useCallback(
    (nodeId: string) => {
      // Find which tree contains this node
      const ctxNode = contextNodes.find((n) => n.nodeId === nodeId);
      if (ctxNode) {
        handleSearchSelect({ id: nodeId, treeType: 'context' });
        return;
      }
      const flowNode = flowNodes.find((n) => n.nodeId === nodeId);
      if (flowNode) {
        handleSearchSelect({ id: nodeId, treeType: 'flow' });
        return;
      }
      const compNode = componentNodes.find((n) => n.nodeId === nodeId);
      if (compNode) {
        handleSearchSelect({ id: nodeId, treeType: 'component' });
        return;
      }
    },
    [contextNodes, flowNodes, componentNodes, handleSearchSelect]
  );

  // === AI Thinking State (Epic 1) ===
  const aiThinking = useCanvasStore((s) => s.aiThinking);
  const aiThinkingMessage = useCanvasStore((s) => s.aiThinkingMessage);
  const generateContexts = useCanvasStore((s) => s.generateContextsFromRequirement);
  const setRequirementText = useCanvasStore((s) => s.setRequirementText);
  const requirementText = useCanvasStore((s) => s.requirementText);

  // === Component Generation State (Bug4b) ===
  const [componentGenerating, setComponentGenerating] = useState(false);
  const projectId = useCanvasStore((s) => s.projectId);
  const setComponentNodes = useCanvasStore((s) => s.setComponentNodes);

  // === E2-F14: Zoom State ===
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%
  const ZOOM_STEP = 0.1;
  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 2.0;

  const handleZoomIn = useCallback(() => {
    setZoomLevel((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  }, []);

  // E2-F14: Apply zoom to canvas container via CSS variable
  useEffect(() => {
    if (!gridRef.current) return;
    gridRef.current.style.setProperty('--canvas-zoom', String(zoomLevel));
  }, [zoomLevel]);

  // E2-F10: Delete selected node (context tree primary)
  const handleDeleteSelected = useCallback(() => {
    // Find the first active context node that could be "selected" (e.g., first unconfirmed)
    // For now, delete the first unconfirmed context node if any
    const unconfirmed = contextNodes.filter((n) => !n.confirmed);
    if (unconfirmed.length > 0) {
      deleteContextNode(unconfirmed[0].nodeId);
    }
  }, [contextNodes, deleteContextNode]);

  // === Epic1 F1.2: Keyboard shortcuts for Undo/Redo ===
  const handleKeyboardUndo = useCallback((): boolean => {
    const historyStore = getHistoryStore();
    const canvasStore = useCanvasStore.getState();
    if (historyStore.canUndo('context')) {
      const prev = historyStore.undo('context');
      if (prev) { canvasStore.setContextNodes(prev as typeof canvasStore.contextNodes); return true; }
    }
    if (historyStore.canUndo('flow')) {
      const prev = historyStore.undo('flow');
      if (prev) { canvasStore.setFlowNodes(prev as typeof canvasStore.flowNodes); return true; }
    }
    if (historyStore.canUndo('component')) {
      const prev = historyStore.undo('component');
      if (prev) { canvasStore.setComponentNodes(prev as typeof canvasStore.componentNodes); return true; }
    }
    return false;
  }, []);

  const handleKeyboardRedo = useCallback((): boolean => {
    const historyStore = getHistoryStore();
    const canvasStore = useCanvasStore.getState();
    if (historyStore.canRedo('context')) {
      const next = historyStore.redo('context');
      if (next) { canvasStore.setContextNodes(next as typeof canvasStore.contextNodes); return true; }
    }
    if (historyStore.canRedo('flow')) {
      const next = historyStore.redo('flow');
      if (next) { canvasStore.setFlowNodes(next as typeof canvasStore.flowNodes); return true; }
    }
    if (historyStore.canRedo('component')) {
      const next = historyStore.redo('component');
      if (next) { canvasStore.setComponentNodes(next as typeof canvasStore.componentNodes); return true; }
    }
    return false;
  }, []);

  useKeyboardShortcuts({
    undo: handleKeyboardUndo,
    redo: handleKeyboardRedo,
    onOpenSearch: openSearch,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onZoomReset: handleZoomReset,
    onDelete: handleDeleteSelected,
    enabled: phase !== 'input',
  });

  // === Epic1 F1.6: ? key toggles ShortcutHintPanel ===
  const toggleShortcutPanel = useCallback(() => {
    setIsShortcutPanelOpen((v) => !v);
  }, []);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Only trigger ? key when not in an input field
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const target = e.target as HTMLElement;
        const tagName = target.tagName;
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') return;
        if (target.getAttribute('contenteditable') === 'true') return;
        const role = target.getAttribute('role');
        if (role === 'textbox' || role === 'searchbox' || role === 'combobox') return;
        e.preventDefault();
        toggleShortcutPanel();
      }
      // Esc closes the shortcut panel
      if (e.key === 'Escape' && isShortcutPanelOpen) {
        setIsShortcutPanelOpen(false);
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [toggleShortcutPanel, isShortcutPanelOpen]);

  // Bug4b: 继续 → 组件树 handler
  const handleContinueToComponents = useCallback(async () => {
    if (componentGenerating || flowNodes.length === 0) return;
    setComponentGenerating(true);

    try {
      const sessionId = projectId ?? `session-${Date.now()}`;

      // Map contexts to API format
      const mappedContexts = contextNodes.map((ctx) => ({
        id: ctx.nodeId,
        name: ctx.name,
        description: ctx.description ?? '',
        type: ctx.type,
      }));

      // Map flows to API format
      const mappedFlows = flowNodes.map((f) => ({
        name: f.name,
        contextId: f.contextId,
        steps: f.steps.map((step) => ({
          name: step.name,
          actor: step.actor,
        })),
      }));

      const result = await canvasApi.generateComponents({
        contexts: mappedContexts,
        flows: mappedFlows,
        sessionId,
      });

      if (result.success && result.components && result.components.length > 0) {
        // Convert API response to ComponentNode format
        const newNodes = result.components.map((comp) => ({
          flowId: comp.flowId ?? 'mock',
          name: comp.name,
          type: comp.type as 'page' | 'list' | 'form' | 'detail' | 'modal',
          props: {},
          api: comp.api ?? { method: 'GET' as const, path: '/api/' + comp.name.toLowerCase().replace(/\s+/g, '-'), params: [] },
          previewUrl: undefined,
          nodeId: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          confirmed: false,
          status: 'pending' as const,
          children: [],
        }));

        setComponentNodes(newNodes);
        setPhase('component');
      }
    } catch (err) {
      console.error('[CanvasPage] handleContinueToComponents error:', err);
    } finally {
      setComponentGenerating(false);
    }
  }, [componentGenerating, flowNodes, contextNodes, projectId, setComponentNodes, setPhase]);

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

  // === Tab content for mobile (E2-2: auto-expand active tab panel) ===
  // In tab mode, the active tab's panel always expands to fill the screen.
  // collapsed={false} overrides the shared desktop collapsed state, ensuring
  // the selected tab is always fully visible in mobile layout.
  const renderTabContent = (tab: TreeType, _treeNodes: TreeNode[], _isActive: boolean) => {
    switch (tab) {
      case 'context':
        return (
          <TreePanel
            tree="context"
            title="限界上下文树"
            nodes={contextTreeNodes}
            collapsed={false} // E2-2: always expanded in tab mode
            isActive={contextActive}
            onToggleCollapse={toggleContextPanel}
            onNodeClick={handleMinimapNodeClick}
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
            collapsed={false} // E2-2: always expanded in tab mode
            isActive={flowActive}
            onToggleCollapse={toggleFlowPanel}
            onNodeClick={handleMinimapNodeClick}
            actions={
              flowNodes.length > 0 ? (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={handleContinueToComponents}
                    disabled={componentGenerating}
                    aria-label="继续到组件树"
                    title="基于已确认的流程树生成组件树"
                  >
                    {componentGenerating ? '◌ 生成中...' : '继续 → 组件树'}
                  </button>
                </div>
              ) : undefined
            }
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
            collapsed={false} // E2-2: always expanded in tab mode
            isActive={componentActive}
            onToggleCollapse={toggleComponentPanel}
            onNodeClick={handleMinimapNodeClick}
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
            onOpenSearch={openSearch}
            zoomLevel={zoomLevel}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomReset={handleZoomReset}
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
            <div
              ref={gridRef}
              className={styles.treePanelsGrid}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Bug5: Left expand toggle button */}
              <div className={styles.expandCol}>
                <button
                  type="button"
                  className={styles.expandToggleBtn}
                  onClick={toggleLeft}
                  aria-label={leftExpand === 'default' ? '展开左侧面板' : '收起左侧面板'}
                  title={leftExpand === 'default' ? '展开左侧面板' : '收起左侧面板'}
                >
                  {leftExpand === 'default' ? '◀' : '▶'}
                </button>
              </div>

              <TreePanel
                tree="context"
                title="限界上下文树"
                nodes={contextTreeNodes}
                collapsed={contextPanelCollapsed}
                isActive={contextActive}
                onToggleCollapse={toggleContextPanel}
                onNodeClick={handleMinimapNodeClick}
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
                onNodeClick={handleMinimapNodeClick}
                actions={
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {flowNodes.length > 0 && (
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={handleContinueToComponents}
                        disabled={componentGenerating}
                        aria-label="继续到组件树"
                        title="基于已确认的流程树生成组件树"
                      >
                        {componentGenerating ? '◌ 生成中...' : '继续 → 组件树'}
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.expandButton}
                      onClick={toggleCenter}
                      aria-label={centerExpand === 'default' ? '展开中间面板' : '收起中间面板'}
                      title={centerExpand === 'default' ? '展开中间面板' : '收起中间面板'}
                    >
                      {centerExpand === 'default' ? '⤵ 展开' : '⤴ 收起'}
                    </button>
                  </div>
                }
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
                onNodeClick={handleMinimapNodeClick}
              >
                <HoverHotzone position="left-edge" panel="right" />
                <ComponentTree />
                <HoverHotzone position="right-edge" panel="right" />
              </TreePanel>

              {/* Bug5: Right expand toggle button */}
              <div className={styles.expandCol}>
                <button
                  type="button"
                  className={styles.expandToggleBtn}
                  onClick={toggleRight}
                  aria-label={rightExpand === 'default' ? '展开右侧面板' : '收起右侧面板'}
                  title={rightExpand === 'default' ? '展开右侧面板' : '收起右侧面板'}
                >
                  {rightExpand === 'default' ? '▶' : '◀'}
                </button>
              </div>
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

      {/* Epic1 F1.6: ShortcutHintPanel */}
      <ShortcutHintPanel
        open={isShortcutPanelOpen}
        onClose={() => setIsShortcutPanelOpen(false)}
      />

      {/* Epic2 F2-F5: Search Dialog */}
      <SearchDialog
        open={isSearchOpen}
        onClose={closeSearch}
        results={results}
        query={query}
        onQueryChange={setQuery}
        searchTimeMs={searchTimeMs}
        onSelect={handleSearchSelect}
      />
    </div>
  );
}
