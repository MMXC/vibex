/**
 * CanvasPage — 画布主容器组件
 * 三树并行画布，三列横向布局，响应式 Tab 切换
 *
 * Epic 1 实现: S1.1 (三列布局) + S1.2 (阶段进度条) + S1.3 (树面板折叠)
 * Epic 5 实现: S5.4 (创建项目按钮) + S5.5 (原型队列)
 *
 * E6 Integration (canvas-split-hooks):
 * - useCanvasState (E1): pan/zoom/expand state + handlers
 * - useCanvasStore (E2): unified store selectors
 * - useCanvasRenderer (E3): memoized rects/edges/treeNodes
 * - useAIController (E4): requirement input + quick generate
 * - useCanvasSearch (E4): fuzzy search across three trees
 * - useCanvasEvents (E5): search dialog state + F11/? keyboard shortcuts
 *
 * 遵守 AGENTS.md 规范：
 * - 组件接收 slice 相关 props，不直接访问多个 canvasStore slice
 * - 无 any 类型泄漏
 * - 无 canvasLogger.default.debug
 */
'use client';
import { canvasLogger } from '@/lib/canvas/canvasLogger';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { CanvasStoreInitializer } from './CanvasStoreInitializer';
import type {
  BoundedContextNode,
  BusinessFlowNode,
  ComponentNode,
FlowStep,
  Phase,
  TreeType,
  TreeNode,
  NodeRect,
} from '@/lib/canvas/types';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import { useUIStore } from '@/lib/canvas/stores/uiStore';
import { useSessionStore } from '@/lib/canvas/stores/sessionStore';
import { useAuthStore } from '@/stores/authStore';
import { usePrototypeStore } from '@/stores/prototypeStore';
import { EdgeCreationModal } from '@/components/prototype/EdgeCreationModal';
import { usePresence } from '@/lib/firebase/presence';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import PresenceLayer from './PresenceLayer';

import { hasNodes } from '@/lib/canvas/cascade';
import { cx } from '@/lib/canvas/utils/class';
import { canvasApi } from '@/lib/canvas/api/canvasApi';
import { getHistoryStore } from '@/lib/canvas/historySlice';
import { isValidContextNodes, isValidFlowNodes, isValidComponentNodes } from '@/lib/canvas/type-guards';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { SearchDialog } from './features/SearchDialog';

// E6 Hooks (canvas-split-hooks)
import { useCanvasState } from '@/hooks/canvas/useCanvasState';
import { useCanvasStore } from '@/hooks/canvas/useCanvasStore';
import { useCanvasRenderer } from '@/hooks/canvas/useCanvasRenderer';
import { useAIController } from '@/hooks/canvas/useAIController';
import { useCanvasSearch } from '@/hooks/canvas/useCanvasSearch';
import { useCanvasEvents } from '@/hooks/canvas/useCanvasEvents';
import { useCanvasToolbar } from '@/hooks/canvas/useCanvasToolbar';
import { useCanvasPanels } from '@/hooks/canvas/useCanvasPanels';
import { useMediaQuery } from '@/hooks/useMediaQuery';

import { TabBar } from './TabBar';
import { TreeToolbar } from './TreeToolbar';
import { ProjectBar } from './ProjectBar';
import { PrototypeQueuePanel } from './PrototypeQueuePanel';
import { ContextTreePanel } from './panels/ContextTreePanel';
import { FlowTreePanel } from './panels/FlowTreePanel';
import { ComponentTreePanel } from './panels/ComponentTreePanel';
import { ShortcutPanel } from './features/ShortcutPanel';
import { VersionHistoryPanel } from './features/VersionHistoryPanel';
import { ImportPanel } from './features/ImportPanel';
import { SaveIndicator } from './features/SaveIndicator';
import { CanvasPageSkeleton } from './CanvasPageSkeleton';
import { PhaseIndicator } from './features/PhaseIndicator';
import { TemplateSelector } from './features/TemplateSelector';
import { useVersionHistory } from '@/hooks/canvas/useVersionHistory';
import { useAutoSave } from '@/hooks/canvas/useAutoSave';
import { useProjectLoader } from '@/hooks/canvas/useProjectLoader';
import { useHasProject } from '@/hooks/useHasProject';
import { MessageDrawer } from './messageDrawer/MessageDrawer';
import { LeftDrawer } from './leftDrawer/LeftDrawer';
import { ShortcutBar } from '@/components/guidance/ShortcutBar';
import { useToast } from '@/components/ui/Toast';
import { UndoBar } from '@/components/undo-bar/UndoBar';
import { NodeTooltip } from '@/components/guidance/NodeTooltip';
import { CanvasOnboardingOverlay } from '@/components/guidance';
import { CanvasFirstHint } from '@/components/guidance';
import { ConflictDialog as ConflictDialogComponent } from '@/components/ConflictDialog';
import ConflictBubble from './ConflictBubble';
import { ConfirmDialog } from './features/ConfirmDialog';
import { FeedbackFAB } from '@/components/FeedbackFAB';
import { CanvasPreviewModal } from './json-render/CanvasPreviewModal';
import { OfflineBanner } from './OfflineBanner';
// F2.5 decision: FlowEdgeLayer remains in BusinessFlowTree (flow panel uses it); CanvasPage itself does not render edge layers
import styles from './canvas.module.css';

// =============================================================================
// E6: Hook Integration — Phase 1: Import and call all hooks
// =============================================================================

interface CanvasPageProps {
  /** 是否使用 Tab 模式（< 768px） */
  useTabMode?: boolean;
}

export function CanvasPage({ useTabMode = false }: CanvasPageProps) {
  // === E1: useCanvasState — pan, zoom, expand state ===
  const canvasState = useCanvasState();
  const { zoomLevel, isSpacePressed, isPanning, panOffset, gridRef, expandMode, setExpandMode, handlers: stateHandlers } = canvasState;

  // === E2: useCanvasStore — unified store selectors ===
  const canvasStore = useCanvasStore();
  const {
    phase,
    activeTree,
    contextNodes,
    flowNodes,
    componentNodes,
    selectedNodeIds,
    setPhase,
    setActiveTree,
    deleteSelectedNodes,
    autoGenerateFlows,
    setComponentNodes,
    contextPanelCollapsed,
    flowPanelCollapsed,
    componentPanelCollapsed,
    leftExpand,
    centerExpand,
    rightExpand,
    toggleContextPanel,
    toggleFlowPanel,
    toggleComponentPanel,
    setLeftExpand,
    setCenterExpand,
    setRightExpand,
    flowGenerating,
    flowGeneratingMessage,
  } = canvasStore;

  // === E3: useCanvasRenderer — memoized rects/edges/treeNodes ===
  // === E1.6: Manual rehydration — stores have skipHydration:true, rehydrate client-side ===
  // === Toast (needed for toast notifications in useEffects) ===
  const toast = useToast();

  useEffect(() => {
    // Rehydrate all stores that have skipHydration:true to restore persisted state
    useContextStore.persist?.rehydrate?.();
    useFlowStore.persist?.rehydrate?.();
    useComponentStore.persist?.rehydrate?.();
    useUIStore.persist?.rehydrate?.();
    useSessionStore.persist?.rehydrate?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // === Phase 2: 从 URL 注入 projectId 并校验合法性 ===
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlProjectId = params.get('projectId');
    if (!urlProjectId) return;

    const currentProjectId = useSessionStore.getState().projectId;
    if (urlProjectId === currentProjectId) return;

    // 设置到 sessionStore（早于 useVersionHistory 挂载生效）
    useSessionStore.getState().setProjectId(urlProjectId);

    // 校验 projectId 合法性
    fetch(`/api/projects/${encodeURIComponent(urlProjectId)}`)
      .then((res) => {
        if (!res.ok) {
          useSessionStore.getState().setProjectId(null);
          toast.showToast('项目不存在或无权限访问', 'error');
        }
      })
      .catch(() => {
        useSessionStore.getState().setProjectId(null);
        toast.showToast('项目验证失败，请稍后重试', 'error');
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const renderer = useCanvasRenderer({ contextNodes, flowNodes, componentNodes });
  const {
    contextNodeRects,
    flowNodeRects,
    componentNodeRects,
    contextTreeNodes,
    flowTreeNodes,
    componentTreeNodes,
  } = renderer;

  // === E4: useAIController — requirement input + quick generate ===
  const ai = useAIController();
  const { requirementInput, setRequirementInput, isQuickGenerating, generatingState, aiThinking, aiThinkingMessage, requirementText, setRequirementText, quickGenerate } = ai;

  // === E4: useCanvasSearch — fuzzy search across three trees ===
  const { query: searchQuery, setQuery: setSearchQuery, results: searchResults, searchTimeMs } = useCanvasSearch(
    contextNodes,
    flowNodes,
    componentNodes
  );

  // === E5: useCanvasEvents — search dialog state + global keyboard shortcuts ===
  const events = useCanvasEvents(contextNodes, flowNodes, componentNodes);
  const { isSearchOpen, search: searchEvents, isShortcutPanelOpen, handlers: eventHandlers } = events;

  // =============================================================================
  // E6 Phase 1: Remove duplicated inline state now provided by hooks
  // =============================================================================

  // === E6: useCanvasPanels — UI state ===
  const panels = useCanvasPanels();
  const {
    activeTab, setActiveTab,
    projectName, setProjectName,
    queuePanelExpanded, setQueuePanelExpanded,
    componentGenerating, setComponentGenerating,
    resetPanelState,
  } = panels;
  // Root Cause #2: Tab 切换时 queuePanelExpanded 未重置，导致旧面板状态残留
  // Fix: activeTree 变化时重置面板状态 + 重置 phase
  // 注意: activeTab 来自 useCanvasPanels（本地 state，初始化后不更新），
  //       实际 tab 切换由 contextStore.activeTree 驱动
  useEffect(() => {
    resetPanelState();
    setPhase('input');
  }, [activeTree, resetPanelState, setPhase]);

  const projectId = useSessionStore((s) => s.projectId);
  const user = useAuthStore((s) => s.user);
  const userId = user?.id || 'anonymous';
  const userName = user?.name || 'Anonymous';

  // E4: Mobile read-only mode (non-admin on mobile = read-only)
  const isMobileDevice = useMediaQuery('(max-width: 768px)');
  const role = user?.role || 'viewer';
  const isReadOnlyMode = isMobileDevice && role !== 'admin';
  const effectiveRole = isReadOnlyMode ? 'viewer' : role;

  const [mobileWriteAttempt, setMobileWriteAttempt] = useState(false);

  // E1-S1: 实时协作感知 — Presence
  const { others: presenceOthers } = usePresence(projectId || null, userId, userName);

  // P001-S1.3: 实时节点同步 — Firebase RTDB (S-P1.3)
  // 沙箱模式（Firebase 未配置时）自动降级，不阻断 Onboarding
  useRealtimeSync({ projectId, userId });

  // === E3: Auto-Save Hook ===
  const { saveStatus, lastSavedAt, saveNow, conflictData, clearConflict } = useAutoSave({
    projectId,
    debounceMs: 2000,
  });

  // E3 S3.4: 检测是否有已加载的项目
  const hasProject = useHasProject();

  // === E4: Version History ===
  const versionHistory = useVersionHistory();

  // E4-U3: Auto-load project snapshot on mount
  const projectLoader = useProjectLoader({ projectId });
  const { loading } = projectLoader;

  // =============================================================================
  // E6 Phase 1: Remove duplicated effects now in hooks
  // =============================================================================

  // === E6: useCanvasToolbar — all toolbar/action handlers ===
  const toolbar = useCanvasToolbar({
    leftExpand, centerExpand, rightExpand,
    setLeftExpand, setCenterExpand, setRightExpand,
    contextNodes, flowNodes, componentNodes,
    activeTree, selectedNodeIds,
    setComponentNodes, setPhase, deleteSelectedNodes, autoGenerateFlows,
    conflictData, clearConflict, toast,
    projectId, quickGenerate,
    searchEvents,
  });
  const {
    toggleLeft, toggleCenter, toggleRight,
    handleConflictKeepLocal, handleConflictUseServer, handleConflictMerge,
    handleDeleteSelected,
    handleKeyboardUndo, handleKeyboardRedo,
    handleMinimapNodeClick,
    handleContinueToComponents,
  } = toolbar;

  // === F1.3: handleRegenerateContexts — shared handler for context regeneration ===
  const handleRegenerateContexts = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      if (aiThinking || isQuickGenerating || generatingState !== 'idle') return;
      try {
        const result = await canvasApi.generateContexts({ requirementText: text });
        const ctxs: BoundedContextNode[] = result.contexts.map((c) => ({
          nodeId: c.id,
          name: c.name,
          description: c.description,
          type: c.type,
          status: 'pending' as const,
          isActive: false,
          children: [],
        }));
        getHistoryStore().recordSnapshot('context', ctxs);
        useContextStore.getState().setContextNodes(ctxs);
      } catch (err) {
        canvasLogger.CanvasPage.error('handleRegenerateContexts failed:', err);
        toast.showToast('重新生成失败，请重试', 'error');
      }
    },
    [aiThinking, isQuickGenerating, generatingState, toast],
  );

  // === Keyboard shortcuts (uses hook handlers) ===
  useKeyboardShortcuts({
    undo: handleKeyboardUndo,
    redo: handleKeyboardRedo,
    onOpenSearch: searchEvents.openSearch,
    onZoomIn: stateHandlers.handleZoomIn,
    onZoomOut: stateHandlers.handleZoomOut,
    onZoomReset: stateHandlers.handleZoomReset,
    onDelete: handleDeleteSelected,
    onSelectAll: () => {
      const tree: TreeType = activeTree ?? 'context';
      useContextStore.getState().selectAllNodes(tree);
    },
    onClearSelection: () => {
      const tree: TreeType = activeTree ?? 'context';
      useContextStore.getState().clearNodeSelection(tree);
    },
    onNewNode: () => {
      const tree: TreeType = activeTree ?? 'context';
      if (tree === 'context') {
        useContextStore.getState().addContextNode({ name: '新上下文', description: '', type: 'core' });
      } else if (tree === 'flow') {
        useFlowStore.getState().addFlowNode({ contextId: '', name: '新流程', steps: [] });
      } else {
        useComponentStore.getState().addComponentNode({ name: '新组件', flowId: '', type: 'page', props: {}, api: { method: 'GET', path: '/', params: [] } });
      }
    },
    onQuickGenerate: quickGenerate,
    onConfirmSelected: () => {
      const store = useContextStore.getState();
      const { context: ctxIds, flow: flowIds } = store.selectedNodeIds;
      ctxIds.forEach((id) => store.confirmContextNode(id));
      flowIds.forEach((id) => useFlowStore.getState().confirmFlowNode(id));
    },
    onGenerateContext: async () => {
      if (!requirementInput.trim()) {
        toast.showToast('请先输入需求', 'warning');
        return;
      }
      if (generatingState !== 'idle' || aiThinking || flowGenerating || componentGenerating) return;
      try {
        const result = await canvasApi.generateContexts({ requirementText });
        const ctxs: BoundedContextNode[] = result.contexts.map((c) => ({
          nodeId: c.id,
          name: c.name,
          description: c.description,
          type: c.type,
          status: 'pending' as const,
          isActive: false,
          children: [],
        }));
        getHistoryStore().recordSnapshot('context', ctxs);
        useContextStore.getState().setContextNodes(ctxs);
      } catch (err) {
        canvasLogger.CanvasPage.error('onGenerateContext failed:', err);
        toast.showToast('重新生成失败，请重试', 'error');
      }
    },
    onSwitchToContext: () => setActiveTree('context'),
    onSwitchToFlow: () => setActiveTree('flow'),
    onSwitchToComponent: () => setActiveTree('component'),
    enabled: phase !== 'input',
  });

  // === Compute confirmation states ===
  const contextReady = hasNodes(contextNodes);
  const flowReady = hasNodes(flowNodes);
  const componentReady = hasNodes(componentNodes);
  const allTreesConfirmed = contextReady && flowReady && componentReady
    && contextNodes.length > 0 && flowNodes.length > 0 && componentNodes.length > 0;

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

  // === F1.2: renderContextTreeToolbar — shared helper for context TreeToolbar ===
  const renderContextTreeToolbar = useCallback(
    (
      treeType: 'context' | 'flow' | 'component',
      nodeCount: number,
      continueDisabled: boolean,
      continueLabel: string,
      onContinue: () => void,
      extraButtons?: React.ReactNode,
    ) => {
      return (
        <TreeToolbar
          treeType={treeType}
          nodeCount={nodeCount}
          onSelectAll={() => useContextStore.getState().selectAllNodes?.('context')}
          onDeselectAll={() => useContextStore.getState().clearNodeSelection?.('context')}
          onClear={() => useContextStore.getState().setContextNodes([])}
          onContinue={onContinue}
          continueLabel={continueLabel}
          continueDisabled={continueDisabled}
          extraButtons={extraButtons}
        />
      );
    },
    [],
  );

  // === Tab content for mobile (E2-2: auto-expand active tab panel) ===
  const renderTabContent = (tab: TreeType, _treeNodes: TreeNode[], _isActive: boolean) => {
    switch (tab) {
      case 'context':
        return (
          <ContextTreePanel
            nodes={contextTreeNodes}
            collapsed={false}
            isActive={contextActive}
            onToggleCollapse={toggleContextPanel}
            onNodeClick={handleMinimapNodeClick}
            headerActions={renderContextTreeToolbar(
              'context',
              contextNodes.length,
              flowGenerating || contextNodes.length === 0,
              contextNodes.length === 0 ? '→ 选择上下文' : flowGenerating ? `◌ ${flowGeneratingMessage ?? '生成中...'}` : '→ 继续 → 流程树',
              () => autoGenerateFlows(contextNodes.filter((c) => c.isActive !== false)),
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => handleRegenerateContexts(requirementText)}
                disabled={aiThinking || generatingState !== 'idle' || !requirementText.trim()}
                aria-label="重新生成限界上下文"
              >
                {aiThinking ? '◌ 重新生成中...' : '🔄 重新生成'}
              </button>,
            )}
          />
        );
      case 'flow':
        return (
          <FlowTreePanel
            nodes={flowTreeNodes}
            collapsed={false}
            isActive={flowActive}
            onToggleCollapse={toggleFlowPanel}
            onNodeClick={handleMinimapNodeClick}
            headerActions={
              <TreeToolbar
                treeType="flow"
                nodeCount={flowNodes.length}
                onSelectAll={() => useFlowStore.getState().selectAllNodes()}
                onDeselectAll={() => useFlowStore.getState().clearNodeSelection()}
                onDelete={() => useFlowStore.getState().deleteSelectedNodes()}
                deleteDisabled={selectedNodeIds.flow.length === 0}
                onReset={() => {
                  useFlowStore.getState().clearFlowCanvas()
                }}
                onClear={() => useFlowStore.getState().setFlowNodes([])}
                onContinue={handleContinueToComponents}
                continueLabel={flowNodes.length === 0 ? '→ 选择流程' : componentGenerating ? '◌ 生成中...' : '继续 → 组件树'}
                continueDisabled={componentGenerating || flowNodes.length === 0}
                extraButtons={
                  <button
                    type="button"
                    className={styles.addEdgeBtn}
                    onClick={() => setIsEdgeModalOpen(true)}
                    disabled={pages.length < 2}
                    aria-label="添加连线"
                    title="添加页面连线"
                  >
                    +连线
                  </button>
                }
              />
            }
          />
        );
      case 'component':
        return (
          <ComponentTreePanel
            nodes={componentTreeNodes}
            collapsed={false}
            isActive={componentActive}
            onToggleCollapse={toggleComponentPanel}
            onNodeClick={handleMinimapNodeClick}
            headerActions={
              <TreeToolbar
                treeType="component"
                nodeCount={componentNodes.length}
                onSelectAll={() => useComponentStore.getState().selectAllNodes?.()}
                onDeselectAll={() => useComponentStore.getState().clearNodeSelection?.()}
                onClear={() => useComponentStore.getState().clearComponentCanvas()}
              />
            }
          />
        );
    }
  };

  const contextActive = activeTree === 'context' || activeTree === null;
  const flowActive = activeTree === 'flow';
  const componentActive = activeTree === 'component';

  // === Epic 5: Drawer state for layout ===
  const leftDrawerOpen = useUIStore((s) => s.leftDrawerOpen);
  const rightDrawerOpen = useUIStore((s) => s.rightDrawerOpen);

  // === E2.1: TemplateSelector state ===
  const [templateOpen, setTemplateOpen] = useState(false);
  // E1-QA: EdgeCreationModal state
  const [isEdgeModalOpen, setIsEdgeModalOpen] = useState(false);
  const pages = usePrototypeStore((s) => s.pages);
  const addEdge = usePrototypeStore((s) => s.addEdge);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // === E2.2: PhaseIndicator is read-only (PhaseIndicator.tsx manages its own open/close) ===

  // Compute container class based on drawer state
  const containerClasses = cx(
    styles.canvasContainer,
    expandMode === 'maximize' && styles.maximizeMode,
    expandMode === 'expand-both' && styles.expandBothMode
  );

  // Compute row wrapper class for tree + drawers
  const rowWrapperClasses = cx(
    styles.canvasRowWrapper,
    leftDrawerOpen && styles.canvasRowWithLeftDrawer,
    rightDrawerOpen && styles.canvasRowWithRightDrawer,
    leftDrawerOpen && rightDrawerOpen && styles.canvasRowWithBothDrawers
  );

  // Compute grid class based on drawer state
  const gridClasses = cx(
    styles.treePanelsGrid,
    leftDrawerOpen && styles.treePanelsGridWithLeftDrawer,
    rightDrawerOpen && styles.treePanelsGridWithRightDrawer,
    leftDrawerOpen && rightDrawerOpen && styles.treePanelsGridWithBothDrawers
  );

  // E1-QA: EdgeCreationModal confirm handler
  const handleEdgeConfirm = useCallback(
    (sourceId: string, targetId: string) => {
      addEdge(sourceId, targetId);
      setIsEdgeModalOpen(false);
    },
    [addEdge]
  );

  // === Render ===
  if (loading) {
    return <CanvasPageSkeleton />;
  }

  return (
    <div className={containerClasses}>
      {/* E2: Initialize cross-store subscriptions */}
      <CanvasStoreInitializer />
      {/* Tab Bar — Epic 1: Three-tree tab switcher */}
      <div className={styles.tabBarWrapper}>
        <TabBar />
        {/* E2.2: PhaseIndicator — shows current phase, allows switching */}
        <PhaseIndicator phase={phase} onPhaseChange={setPhase} />
      </div>

      {/* Project Bar — Epic 5: Create Project button */}
      <div className={styles.projectBarWrapper}>
        <ProjectBar
            projectName={projectName}
            onProjectNameChange={setProjectName}
            onOpenSearch={searchEvents.openSearch}
            zoomLevel={zoomLevel}
            onZoomIn={stateHandlers.handleZoomIn}
            onZoomOut={stateHandlers.handleZoomOut}
            onZoomReset={stateHandlers.handleZoomReset}
            onOpenHistory={versionHistory.open}
            onOpenShortcuts={eventHandlers.toggleShortcutPanel}
            onImportClick={() => setIsImportOpen(true)}
          />
          {/* E3-S2: Save Indicator — shows auto-save status */}
          <SaveIndicator
            status={saveStatus}
            lastSavedAt={lastSavedAt}
            onSaveNow={saveNow}
          />
        </div>

      {/* E4: Mobile read-only banners */}
      {isReadOnlyMode && (
        <div className={styles.mobileReadOnlyBanner} data-testid="mobile-read-only-banner">
          📱 移动端仅查看模式（管理员可编辑）
        </div>
      )}
      {mobileWriteAttempt && (
        <div className={styles.mobileWriteAttemptBanner} data-testid="mobile-write-blocked">
          ⚠️ 移动端不支持编辑，请切换到桌面端
        </div>
      )}

      {/* E4-SSE: AI status bar — shows generatingState to the user */}
      {(generatingState === 'generating' || generatingState === 'fallback' || generatingState === 'error') && (
        <div
          className={styles.aiThinkingHint}
          role="status"
          aria-live="polite"
          data-testid="ai-thinking"
        >
          {generatingState === 'generating' && (
            <>
              <span className={styles.aiSpinner} aria-hidden="true" />
              <span>{aiThinkingMessage ?? 'AI 分析中...'}</span>
            </>
          )}
          {generatingState === 'fallback' && (
            <span>🔄 同步模式生成中...</span>
          )}
          {generatingState === 'error' && (
            <span>⚠️ SSE 连接失败，已切换同步模式</span>
          )}
        </div>
      )}

      {/* E2.1: Template Selector trigger button */}
      <button
        type="button"
        className={styles.secondaryButton}
        style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
        onClick={() => setTemplateOpen(true)}
        title="选择需求模板"
      >
        📋 模板
      </button>

      {/* E2.1: TemplateSelector modal dialog */}
      <TemplateSelector open={templateOpen} onClose={() => setTemplateOpen(false)} />

      {/* F1: Expand controls — shown when not in input phase */}
      {phase !== 'input' && (
        <div className={styles.expandControls}>
          {/* F1.1: expand-both toggle */}
          {expandMode !== 'maximize' && (
            <button
              type="button"
              className={`${styles.expandAllButton} ${expandMode === 'expand-both' ? styles.expandAllButtonActive : ''}`}
              onClick={() => setExpandMode(expandMode === 'normal' ? 'expand-both' : 'normal')}
              aria-label={expandMode === 'normal' ? '均分视口' : '退出均分'}
              title={expandMode === 'normal' ? '三栏均分视口' : '恢复正常布局'}
            >
              {expandMode === 'normal' ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                  均分视口
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <polyline points="4 14 10 14 10 20" />
                    <polyline points="20 10 14 10 14 4" />
                    <line x1="10" y1="14" x2="3" y2="21" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                  </svg>
                  退出均分
                </>
              )}
            </button>
          )}
          {/* F1.2: maximize toggle */}
          <button
            type="button"
            className={`${styles.maximizeButton} ${expandMode === 'maximize' ? styles.maximizeButtonActive : ''}`}
            onClick={stateHandlers.toggleMaximize}
            aria-label={expandMode === 'maximize' ? '退出最大化' : '最大化'}
            title={expandMode === 'maximize' ? '退出最大化（F11）' : '最大化模式（F11）'}
          >
            {expandMode === 'maximize' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* === PROTOTYPE PHASE: Queue Panel === */}
      {phase === 'prototype' ? (
        <div className={styles.prototypePhase}>
          <PrototypeQueuePanel
            expanded={queuePanelExpanded}
            onToggleExpand={() => setQueuePanelExpanded(!queuePanelExpanded)}
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
                    // @ts-ignore — comparing Phase and TreeType unions (both include context/flow/component)
                    aria-selected={phase === t}
                    className={`${styles.tabButton} ${phase === t ? styles.tabButtonActive : ''}`}
                    onClick={() => {
                      if (t === 'context') { setPhase('context'); setActiveTree('context'); }
                      else if (t === 'flow') { setPhase('flow'); setActiveTree('flow'); }
                      else { setPhase('component'); setActiveTree('component'); }
                    }}
                  >
                    {t === 'context' ? '◇ 上下文' : t === 'flow' ? '→ 流程' : '▣ 组件'}
                  </button>
                ))}
                <button
                  key="prototype"
                  role="tab"
                  // @ts-ignore - prototype is valid Phase but useCanvasStore type literal missing it
                  aria-selected={phase === 'prototype'}
                  // @ts-ignore
                  className={`${styles.tabButton} ${phase === 'prototype' ? styles.tabButtonActive : ''}`}
                  onClick={() => { setPhase('prototype'); setActiveTree('component'); }}
                >
                  ⚡ 原型
                </button>
              </div>
              <div className={styles.tabContent} role="tabpanel">
                {/* @ts-ignore */}
                {phase === 'prototype' ? (
                  <div className={styles.prototypePhase}>
                    <PrototypeQueuePanel
                      expanded={queuePanelExpanded}
                      onToggleExpand={() => setQueuePanelExpanded(!queuePanelExpanded)}
                    />
                  </div>
                ) : renderTabContent(
                  activeTab,
                  activeTab === 'context' ? contextTreeNodes : activeTab === 'flow' ? flowTreeNodes : componentTreeNodes,
                  activeTab === 'context' ? contextActive : activeTab === 'flow' ? flowActive : componentActive
                )}
              </div>
            </div>
          ) : (
            <div className={rowWrapperClasses}>
              {/* Left Drawer */}
              <LeftDrawer />

              <div
                ref={gridRef}
                className={gridClasses}
                onMouseDown={stateHandlers.handleMouseDown}
                onMouseMove={stateHandlers.handleMouseMove}
                onMouseUp={stateHandlers.handleMouseUp}
                onMouseLeave={stateHandlers.handleMouseUp}
              >
              {/* SVG edge layers removed — BusinessFlowTree handles its own FlowEdgeLayer */}

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

              <ContextTreePanel
                nodes={contextTreeNodes}
                collapsed={contextPanelCollapsed}
                isActive={contextActive}
                onToggleCollapse={toggleContextPanel}
                onNodeClick={handleMinimapNodeClick}
                headerActions={renderContextTreeToolbar(
                  'context',
                  contextNodes.length,
                  flowGenerating || contextNodes.length === 0,
                  contextNodes.length === 0 ? '→ 选择上下文' : flowGenerating ? `◌ ${flowGeneratingMessage ?? '生成中...'}` : '→ 继续 → 流程树',
                  () => autoGenerateFlows(contextNodes.filter((c) => c.isActive !== false)),
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => handleRegenerateContexts(requirementText)}
                    disabled={aiThinking || generatingState !== 'idle' || !requirementText.trim()}
                    aria-label="重新生成限界上下文"
                  >
                    {aiThinking ? '◌ 重新生成中...' : '🔄 重新生成'}
                  </button>,
                )}
              />

              <FlowTreePanel
                nodes={flowTreeNodes}
                collapsed={flowPanelCollapsed}
                isActive={flowActive}
                onToggleCollapse={toggleFlowPanel}
                onNodeClick={handleMinimapNodeClick}
                headerActions={
                  <TreeToolbar
                    treeType="flow"
                    nodeCount={flowNodes.length}
                    onSelectAll={() => useFlowStore.getState().selectAllNodes()}
                    onDeselectAll={() => useFlowStore.getState().clearNodeSelection()}
                    onDelete={() => useFlowStore.getState().deleteSelectedNodes()}
                    deleteDisabled={selectedNodeIds.flow.length === 0}
                    onReset={() => useFlowStore.getState().clearFlowCanvas()}
                    onClear={() => useFlowStore.getState().setFlowNodes([])}
                    onContinue={handleContinueToComponents}
                    continueLabel={flowNodes.length === 0 ? '→ 选择流程' : componentGenerating ? '◌ 生成中...' : '继续 → 组件树'}
                    continueDisabled={componentGenerating || flowNodes.length === 0}
                    extraButtons={
                      <button
                        type="button"
                        className={styles.expandButton}
                        onClick={toggleCenter}
                        aria-label={centerExpand === 'default' ? '展开中间面板' : '收起中间面板'}
                        title={centerExpand === 'default' ? '展开中间面板' : '收起中间面板'}
                      >
                        {centerExpand === 'default' ? '⤵ 展开' : '⤴ 收起'}
                      </button>
                    }
                  />
                }
              />

              <ComponentTreePanel
                nodes={componentTreeNodes}
                collapsed={componentPanelCollapsed}
                isActive={componentActive}
                onToggleCollapse={toggleComponentPanel}
                onNodeClick={handleMinimapNodeClick}
                headerActions={
                  <TreeToolbar
                    treeType="component"
                    nodeCount={componentNodes.length}
                    onSelectAll={() => useComponentStore.getState().selectAllNodes?.()}
                    onDeselectAll={() => useComponentStore.getState().clearNodeSelection?.()}
                    onClear={() => useComponentStore.getState().clearComponentCanvas()}
                  />
                }
              />

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

            {/* Right Drawer */}
            <MessageDrawer />
            </div>
          )}
        </>
      )}

      {/* ShortcutPanel — unified panel for all canvas shortcuts */}
      <ShortcutPanel
        open={isShortcutPanelOpen}
        onClose={eventHandlers.toggleShortcutPanel}
      />

      {/* Epic2 F2-F5: Search Dialog */}
      <SearchDialog
        open={isSearchOpen}
        onClose={searchEvents.closeSearch}
        results={searchResults}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        searchTimeMs={searchTimeMs}
        onSelect={searchEvents.onSearchSelect}
      />

      {/* E4-F11: Version History Panel */}
      <VersionHistoryPanel
        open={versionHistory.isOpen}
        onClose={versionHistory.close}
      />

      {/* E3-U3: Import Panel */}
      <ImportPanel
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />

      {/* E4: Canvas Guidance System — removed 2026-04-01 */}
      <UndoBar />
      <ShortcutBar onOpenShortcutPanel={eventHandlers.toggleShortcutPanel} />
      <NodeTooltip />

      {/* E2: Canvas Preview Modal */}
      <CanvasPreviewModal />

      {/* E3: CanvasOnboardingOverlay — first-time canvas user guidance */}
      <CanvasOnboardingOverlay />

      {/* E1-S1.2: First-time canvas hint bubble */}
      <CanvasFirstHint />

      {/* E3 S3.3: Feedback FAB */}
      <FeedbackFAB />

      <ConfirmDialog />

      {/* E4-SyncProtocol: Conflict Dialog */}
      {saveStatus === 'conflict' && conflictData && (
        <ConflictDialogComponent
          serverSnapshot={conflictData.serverSnapshot}
          localData={{
            contextNodes: contextNodes,
            flowNodes: flowNodes,
            componentNodes: componentNodes,
          }}
          onKeepLocal={handleConflictKeepLocal}
          onUseServer={handleConflictUseServer}
          onMerge={handleConflictMerge}
        />
      )}

      {/* E1-S1: 协作者在线头像层 */}
      <PresenceLayer
        canvasId={projectId || null}
        userId={userId}
        userName={userName}
      />

      {/* E1-QA: EdgeCreationModal for adding page-to-page flow edges */}
      <EdgeCreationModal
        open={isEdgeModalOpen}
        pages={pages}
        onConfirm={handleEdgeConfirm}
        onCancel={() => setIsEdgeModalOpen(false)}
      />
    </div>
  );
}