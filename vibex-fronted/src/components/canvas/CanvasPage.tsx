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
 * - 无 console.log
 */
'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import type {
  BoundedContextNode,
  BusinessFlowNode,
  ComponentNode,
  BoundedContextDraft,
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
import { loadExampleData } from '@/lib/canvas/loadExampleData';
import { hasNodes } from '@/lib/canvas/cascade';
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

import { PhaseProgressBar } from './PhaseProgressBar';
import { TabBar } from './TabBar';
import { TreePanel } from './TreePanel';
import { TreeToolbar } from './TreeToolbar';
import { BoundedContextTree } from './BoundedContextTree';
import { ComponentTree } from './ComponentTree';
import { BusinessFlowTree } from './BusinessFlowTree';
import { ProjectBar } from './ProjectBar';
import { PrototypeQueuePanel } from './PrototypeQueuePanel';
import { HoverHotzone } from './HoverHotzone';
import { ShortcutHintPanel } from './features/ShortcutHintPanel';
import { ShortcutHelpPanel } from './ShortcutHelpPanel';
import { TreeStatus } from './TreeStatus';
import { TemplateSelector } from './features/TemplateSelector';
import { VersionHistoryPanel } from './features/VersionHistoryPanel';
import { SaveIndicator } from './features/SaveIndicator';
import { useVersionHistory } from '@/hooks/canvas/useVersionHistory';
import { useAutoSave } from '@/hooks/canvas/useAutoSave';
import { useHasProject } from '@/hooks/useHasProject';
import { MessageDrawer } from './messageDrawer/MessageDrawer';
import { LeftDrawer } from './leftDrawer/LeftDrawer';
import { ShortcutBar } from '@/components/guidance/ShortcutBar';
import { useToast } from '@/components/ui/Toast';
import { UndoBar } from '@/components/undo-bar/UndoBar';
import { NodeTooltip } from '@/components/guidance/NodeTooltip';
import { NewUserGuide } from '@/components/guide';
import { ConflictDialog as ConflictDialogComponent } from '@/components/ConflictDialog';
import { FeedbackFAB } from '@/components/FeedbackFAB';
import { BoundedEdgeLayer } from './edges/BoundedEdgeLayer';
import { FlowEdgeLayer } from './edges/FlowEdgeLayer';
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
  const renderer = useCanvasRenderer({ contextNodes, flowNodes, componentNodes });
  const {
    contextNodeRects,
    flowNodeRects,
    componentNodeRects,
    boundedEdges,
    flowEdges,
    contextTreeNodes,
    flowTreeNodes,
    componentTreeNodes,
  } = renderer;

  // === E4: useAIController — requirement input + quick generate ===
  const ai = useAIController();
  const { requirementInput, setRequirementInput, isQuickGenerating, aiThinking, aiThinkingMessage, requirementText, setRequirementText, quickGenerate } = ai;

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

  // REMOVED: zoomLevel state, isSpacePressed state, isPanning state, panOffset state
  // REMOVED: gridRef (now from useCanvasState)
  // REMOVED: isSearchOpen state (now from useCanvasEvents)
  // REMOVED: zoomStep/MIN/MAX constants (now in useCanvasState)

  // === UI State (kept, not in hooks) ===
  const [activeTab, setActiveTab] = useState<TreeType>('context');
  const [projectName, setProjectName] = useState('我的项目');
  const [queuePanelExpanded, setQueuePanelExpanded] = useState(true);
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);

  // === Component Generation State (Bug4b) ===
  const [componentGenerating, setComponentGenerating] = useState(false);
  const projectId = useSessionStore((s) => s.projectId);

  // === E3: Auto-Save Hook ===
  const { saveStatus, lastSavedAt, saveNow, conflictData, clearConflict } = useAutoSave({
    projectId,
    debounceMs: 2000,
  });

  // E3 S3.4: 检测是否有已加载的项目
  const hasProject = useHasProject();

  // === E4: Version History ===
  const versionHistory = useVersionHistory();

  // === Toast (needed for conflict handlers) ===
  const toast = useToast();

  // =============================================================================
  // E6 Phase 1: Remove duplicated effects now in hooks
  // =============================================================================

  // REMOVED: Space key listener (now in useCanvasState)
  // REMOVED: Pan CSS variable effect (now in useCanvasState)
  // REMOVED: Zoom CSS variable effect (now in useCanvasState)
  // REMOVED: Expand mode grid CSS effect (now in useCanvasState)
  // REMOVED: Scroll reset on mount (F1.1) — removed per refactor decision
  // REMOVED: F11 keyboard shortcut (now in useCanvasEvents)
  // REMOVED: ? key shortcut panel (now in useCanvasEvents)

  // === E1-F2: Legacy expand handlers (keep for backward compat with toggle buttons) ===
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

  // === E4: Conflict Resolution Handlers ===
  const handleConflictKeepLocal = useCallback(() => {
    if (!conflictData) return;
    clearConflict();
    toast.showToast('已保留本地数据，请继续编辑后自动保存', 'info');
  }, [conflictData, clearConflict, toast]);

  const handleConflictUseServer = useCallback(() => {
    if (!conflictData) return;
    const serverData = conflictData.serverSnapshot.data;
    if (serverData.contexts) {
      useContextStore.getState().setContextNodes(isValidContextNodes(serverData.contexts) ? serverData.contexts : []);
    }
    if (serverData.flows) {
      useFlowStore.getState().setFlowNodes(isValidFlowNodes(serverData.flows) ? serverData.flows : []);
    }
    if (serverData.components) {
      setComponentNodes(isValidComponentNodes(serverData.components) ? serverData.components : []);
    }
    clearConflict();
    toast.showToast('已使用服务端数据，当前画布已更新', 'success');
  }, [conflictData, clearConflict, toast]);

  const handleConflictMerge = useCallback(() => {
    if (!conflictData) return;
    const serverData = conflictData.serverSnapshot.data;
    const localContexts = useContextStore.getState().contextNodes;
    const localFlows = useFlowStore.getState().flowNodes;
    const localComponents = useComponentStore.getState().componentNodes;

    const serverContexts = (serverData.contexts ?? []) as typeof localContexts;
    const serverFlows = (serverData.flows ?? []) as typeof localFlows;
    const serverComponents = (serverData.components ?? []) as typeof localComponents;

    const localCtxIds = new Set(localContexts.map((n) => n.nodeId));
    const localFlowIds = new Set(localFlows.map((n) => n.nodeId));
    const localCompIds = new Set(localComponents.map((n) => n.nodeId));

    const mergedContexts = [...localContexts, ...serverContexts.filter((n) => !localCtxIds.has(n.nodeId))];
    const mergedFlows = [...localFlows, ...serverFlows.filter((n) => !localFlowIds.has(n.nodeId))];
    const mergedComponents = [...localComponents, ...serverComponents.filter((n) => !localCompIds.has(n.nodeId))];

    useContextStore.getState().setContextNodes(mergedContexts);
    useFlowStore.getState().setFlowNodes(mergedFlows);
    setComponentNodes(mergedComponents);
    clearConflict();
    toast.showToast(
      `已合并：+${serverContexts.length - localContexts.length} 上下文、+${serverFlows.length - localFlows.length} 流程、+${serverComponents.length - localComponents.length} 组件`,
      'success'
    );
  }, [conflictData, clearConflict, toast]);

  // E3-F2: Delete selected node(s) based on active tree
  const handleDeleteSelected = useCallback(() => {
    const tree: 'context' | 'flow' = (activeTree ?? 'context') as 'context' | 'flow';
    deleteSelectedNodes(tree);
  }, [activeTree, deleteSelectedNodes]);

  // === Epic1 F1.2: Keyboard shortcuts for Undo/Redo ===
  const handleKeyboardUndo = useCallback((): boolean => {
    const historyStore = getHistoryStore();
    if (historyStore.canUndo('context')) {
      const prev = historyStore.undo('context');
      if (prev) { useContextStore.getState().setContextNodes(isValidContextNodes(prev) ? prev : []); return true; }
    }
    if (historyStore.canUndo('flow')) {
      const prev = historyStore.undo('flow');
      if (prev) { useFlowStore.getState().setFlowNodes(isValidFlowNodes(prev) ? prev : []); return true; }
    }
    if (historyStore.canUndo('component')) {
      const prev = historyStore.undo('component');
      if (prev) { setComponentNodes(isValidComponentNodes(prev) ? prev : []); return true; }
    }
    return false;
  }, []);

  const handleKeyboardRedo = useCallback((): boolean => {
    const historyStore = getHistoryStore();
    if (historyStore.canRedo('context')) {
      const next = historyStore.redo('context');
      if (next) { useContextStore.getState().setContextNodes(isValidContextNodes(next) ? next : []); return true; }
    }
    if (historyStore.canRedo('flow')) {
      const next = historyStore.redo('flow');
      if (next) { useFlowStore.getState().setFlowNodes(isValidFlowNodes(next) ? next : []); return true; }
    }
    if (historyStore.canRedo('component')) {
      const next = historyStore.redo('component');
      if (next) { setComponentNodes(isValidComponentNodes(next) ? next : []); return true; }
    }
    return false;
  }, []);

  // === E4: Minimap node click — scroll to and highlight node ===
  const handleMinimapNodeClick = useCallback(
    (nodeId: string) => {
      const ctxNode = contextNodes.find((n) => n.nodeId === nodeId);
      if (ctxNode) {
        searchEvents.onSearchSelect({ id: nodeId, treeType: 'context' });
        return;
      }
      const flowNode = flowNodes.find((n) => n.nodeId === nodeId);
      if (flowNode) {
        searchEvents.onSearchSelect({ id: nodeId, treeType: 'flow' });
        return;
      }
      const compNode = componentNodes.find((n) => n.nodeId === nodeId);
      if (compNode) {
        searchEvents.onSearchSelect({ id: nodeId, treeType: 'component' });
        return;
      }
    },
    [contextNodes, flowNodes, componentNodes, searchEvents]
  );

  // === Bug4b: 继续 → 组件树 handler ===
  const handleContinueToComponents = useCallback(async () => {
    if (componentGenerating || flowNodes.length === 0) return;
    setComponentGenerating(true);

    try {
      const sessionId = projectId ?? `session-${Date.now()}`;

      const activeContexts = contextNodes.filter((ctx) => ctx.isActive !== false);
      const selectedContextSet = new Set(selectedNodeIds.context);
      const contextsToSend = selectedContextSet.size > 0
        ? activeContexts.filter((ctx) => selectedContextSet.has(ctx.nodeId))
        : activeContexts;
      const mappedContexts = contextsToSend.map((ctx) => ({
        id: ctx.nodeId,
        name: ctx.name,
        description: ctx.description ?? '',
        type: ctx.type,
      }));

      const activeFlows = flowNodes.filter((f) => f.isActive !== false);
      const selectedFlowSet = new Set(selectedNodeIds.flow);
      const flowsToSend = selectedFlowSet.size > 0
        ? activeFlows.filter((f) => selectedFlowSet.has(f.nodeId))
        : activeFlows;
      const mappedFlows = flowsToSend.map((f) => ({
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
  }, [componentGenerating, flowNodes, contextNodes, selectedNodeIds, projectId, setComponentNodes, setPhase]);

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
      if (isQuickGenerating || aiThinking || flowGenerating || componentGenerating) return;
      const drafts: BoundedContextDraft[] = [
        { name: '需求管理', description: '处理需求录入', type: 'core' },
        { name: '业务流程', description: '核心业务处理', type: 'core' },
      ];
      const newCtxs: BoundedContextNode[] = drafts.map((d, i) => ({
        nodeId: `ctx-gen-${Date.now()}-${i}`,
        name: d.name,
        description: d.description,
        type: d.type,
        status: 'pending' as const,
        children: [],
      }));
      useContextStore.getState().setContextNodes(newCtxs);
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
  const renderTabContent = (tab: TreeType, _treeNodes: TreeNode[], _isActive: boolean) => {
    switch (tab) {
      case 'context':
        return (
          <TreePanel
            tree="context"
            title="限界上下文树"
            nodes={contextTreeNodes}
            collapsed={false}
            isActive={contextActive}
            onToggleCollapse={toggleContextPanel}
            onNodeClick={handleMinimapNodeClick}
            actions={
              <TreeToolbar
                treeType="context"
                nodeCount={contextNodes.length}
                onSelectAll={() => useContextStore.getState().selectAllNodes?.('context')}
                onDeselectAll={() => useContextStore.getState().selectAllNodes?.('context')}
                onClear={() => useContextStore.getState().setContextNodes([])}
                onContinue={() => autoGenerateFlows(contextNodes.filter((c) => c.isActive !== false))}
                continueLabel={contextNodes.length === 0 ? '→ 选择上下文' : flowGenerating ? `◌ ${flowGeneratingMessage ?? '生成中...'}` : '→ 继续 → 流程树'}
                continueDisabled={flowGenerating || contextNodes.length === 0}
                extraButtons={
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => {
                      const drafts: BoundedContextDraft[] = [
                        { name: '需求管理', description: '处理需求录入', type: 'core' },
                        { name: '业务流程', description: '核心业务处理', type: 'core' },
                      ];
                      const newCtxs: BoundedContextNode[] = drafts.map((d, i) => ({
                        nodeId: `ctx-gen-${Date.now()}-${i}`,
                        name: d.name,
                        description: d.description,
                        type: d.type,
                        status: 'pending' as const,
                        children: [],
                      }));
                      useContextStore.getState().setContextNodes(newCtxs);
                    }}
                    disabled={aiThinking || !requirementText.trim()}
                    aria-label="重新生成限界上下文"
                  >
                    {aiThinking ? '◌ 重新生成中...' : '🔄 重新生成'}
                  </button>
                }
              />
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
            collapsed={false}
            isActive={flowActive}
            onToggleCollapse={toggleFlowPanel}
            onNodeClick={handleMinimapNodeClick}
            actions={
              <TreeToolbar
                treeType="flow"
                nodeCount={flowNodes.length}
                onSelectAll={() => {}}
                onDeselectAll={() => {}}
                onClear={() => useFlowStore.getState().setFlowNodes([])}
                onContinue={handleContinueToComponents}
                continueLabel={flowNodes.length === 0 ? '→ 选择流程' : componentGenerating ? '◌ 生成中...' : '继续 → 组件树'}
                continueDisabled={componentGenerating || flowNodes.length === 0}
              />
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
            collapsed={false}
            isActive={componentActive}
            onToggleCollapse={toggleComponentPanel}
            onNodeClick={handleMinimapNodeClick}
            actions={
              <TreeToolbar
                treeType="component"
                nodeCount={componentNodes.length}
                onSelectAll={() => useComponentStore.getState().selectAllNodes?.()}
                onDeselectAll={() => useComponentStore.getState().clearNodeSelection?.()}
                onClear={() => useComponentStore.getState().setComponentNodes([])}
              />
            }
          >
            <ComponentTree />
          </TreePanel>
        );
    }
  };

  const contextActive = activeTree === 'context' || activeTree === null;
  const flowActive = activeTree === 'flow';
  const componentActive = activeTree === 'component';

  // === Epic 5: Drawer state for layout ===
  const leftDrawerOpen = useUIStore((s) => s.leftDrawerOpen);
  const rightDrawerOpen = useUIStore((s) => s.rightDrawerOpen);

  // Compute container class based on drawer state
  const containerClasses = [
    styles.canvasContainer,
    expandMode === 'maximize' && styles.maximizeMode,
    expandMode === 'expand-both' && styles.expandBothMode,
  ].filter(Boolean).join(' ');

  // Compute row wrapper class for tree + drawers
  const rowWrapperClasses = [
    styles.canvasRowWrapper,
    leftDrawerOpen && styles.canvasRowWithLeftDrawer,
    rightDrawerOpen && styles.canvasRowWithRightDrawer,
    leftDrawerOpen && rightDrawerOpen && styles.canvasRowWithBothDrawers,
  ].filter(Boolean).join(' ');

  // Compute grid class based on drawer state
  const gridClasses = [
    styles.treePanelsGrid,
    leftDrawerOpen && styles.treePanelsGridWithLeftDrawer,
    rightDrawerOpen && styles.treePanelsGridWithRightDrawer,
    leftDrawerOpen && rightDrawerOpen && styles.treePanelsGridWithBothDrawers,
  ].filter(Boolean).join(' ');

  // === Render ===
  return (
    <div className={containerClasses}>
      {/* Phase Progress Bar */}
      <div className={styles.phaseProgressBarWrapper}>
        <PhaseProgressBar currentPhase={phase} onPhaseClick={handlePhaseClick} />
        {phase !== 'input' && <TreeStatus />}
      </div>

      {/* Tab Bar — Epic 1: Three-tree tab switcher */}
      {phase !== 'input' && (
        <div className={styles.tabBarWrapper}>
          <TabBar />
        </div>
      )}

      {/* Project Bar — Epic 5: Create Project button */}
      {phase !== 'input' && (
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
          />
          {/* E3-S2: Save Indicator — shows auto-save status */}
          <SaveIndicator
            status={saveStatus}
            lastSavedAt={lastSavedAt}
            onSaveNow={saveNow}
          />
        </div>
      )}

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
                    className={`${styles.tabButton} ${activeTab === t ? styles.tabButtonActive : ''}`}
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
              {/* F3: Edge layer overlays */}
              {boundedEdges.length > 0 && (
                <BoundedEdgeLayer
                  edges={boundedEdges}
                  nodeRects={contextNodeRects}
                  zoom={zoomLevel}
                  pan={panOffset}
                />
              )}
              {flowEdges.length > 0 && (
                <FlowEdgeLayer
                  edges={flowEdges}
                  nodeRects={flowNodeRects}
                  zoom={zoomLevel}
                  pan={panOffset}
                />
              )}

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
                  <TreeToolbar
                    treeType="context"
                    nodeCount={contextNodes.length}
                    onSelectAll={() => useContextStore.getState().selectAllNodes?.('context')}
                    onDeselectAll={() => useContextStore.getState().selectAllNodes?.('context')}
                    onClear={() => useContextStore.getState().setContextNodes([])}
                    onContinue={() => autoGenerateFlows(contextNodes.filter((c) => c.isActive !== false))}
                    continueLabel={contextNodes.length === 0 ? '→ 选择上下文' : flowGenerating ? `◌ ${flowGeneratingMessage ?? '生成中...'}` : '→ 继续 → 流程树'}
                    continueDisabled={flowGenerating || contextNodes.length === 0}
                    extraButtons={
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => {
                          const drafts: BoundedContextDraft[] = [
                            { name: '需求管理', description: '处理需求录入', type: 'core' },
                            { name: '业务流程', description: '核心业务处理', type: 'core' },
                          ];
                          const newCtxs: BoundedContextNode[] = drafts.map((d, i) => ({
                            nodeId: `ctx-gen-${Date.now()}-${i}`,
                            name: d.name,
                            description: d.description,
                            type: d.type,
                            status: 'pending' as const,
                            children: [],
                          }));
                          useContextStore.getState().setContextNodes(newCtxs);
                        }}
                        disabled={aiThinking || !requirementText.trim()}
                        aria-label="重新生成限界上下文"
                      >
                        {aiThinking ? '◌ 重新生成中...' : '🔄 重新生成'}
                      </button>
                    }
                  />
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
                  <TreeToolbar
                    treeType="flow"
                    nodeCount={flowNodes.length}
                    onSelectAll={() => {}}
                    onDeselectAll={() => {}}
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
                actions={
                  <TreeToolbar
                    treeType="component"
                    nodeCount={componentNodes.length}
                    onSelectAll={() => useComponentStore.getState().selectAllNodes?.()}
                    onDeselectAll={() => useComponentStore.getState().clearNodeSelection?.()}
                    onClear={() => useComponentStore.getState().setComponentNodes([])}
                  />
                }
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

              {/* F2: BoundedEdgeLayer */}
              <BoundedEdgeLayer
                edges={boundedEdges}
                nodeRects={contextNodeRects}
                zoom={zoomLevel}
                pan={{ x: 0, y: 0 }}
              />

              {/* F2: FlowEdgeLayer */}
              <FlowEdgeLayer
                edges={flowEdges}
                nodeRects={flowNodeRects}
                zoom={zoomLevel}
                pan={{ x: 0, y: 0 }}
              />
            </div>

            {/* Right Drawer */}
            <MessageDrawer />
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
                    const drafts: BoundedContextDraft[] = [
                      { name: '需求管理', description: '处理需求录入', type: 'core' },
                      { name: '业务流程', description: '核心业务处理', type: 'core' },
                    ];
                    const newCtxs: BoundedContextNode[] = drafts.map((d, i) => ({
                      nodeId: `ctx-gen-${Date.now()}-${i}`,
                      name: d.name,
                      description: d.description,
                      type: d.type,
                      status: 'pending' as const,
                      children: [],
                    }));
                    useContextStore.getState().setContextNodes(newCtxs);
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

            {/* E4-F10: Template Selector */}
            <div className={styles.templateActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setIsTemplateSelectorOpen(true)}
                aria-label="使用模板"
                data-testid="open-template-selector-btn"
                title="从模板库选择作为起点"
              >
                📋 使用模板
              </button>
            </div>
            <TemplateSelector
              open={isTemplateSelectorOpen}
              onClose={() => setIsTemplateSelectorOpen(false)}
            />

            {/* E3 S3.4: 示例项目快速入口 */}
            {!hasProject && (
              <div className={styles.exampleQuickEntry}>
                <div className={styles.exampleDivider}>
                  <span>或</span>
                </div>
                <button
                  type="button"
                  className={styles.exampleQuickButton}
                  onClick={() => {
                    loadExampleData();
                    setPhase('context');
                    setActiveTree('context');
                  }}
                  aria-label="从示例开始"
                  data-testid="start-from-example-btn"
                  title="加载示例项目，快速了解 VibeX 的功能"
                >
                  🚀 从示例开始
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Epic1 F1.6: ShortcutHintPanel */}
      <ShortcutHintPanel
        open={isShortcutPanelOpen}
        onClose={eventHandlers.toggleShortcutPanel}
      />

      {/* E2: ShortcutHelpPanel — Ctrl+G, Alt+1/2/3, F11, ? */}
      <ShortcutHelpPanel
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

      {/* E4: Canvas Guidance System — removed 2026-04-01 */}
      <UndoBar />
      <ShortcutBar onOpenShortcutPanel={eventHandlers.toggleShortcutPanel} />
      <NodeTooltip />

      {/* E1: New User Guide */}
      <NewUserGuide />

      {/* E3 S3.3: Feedback FAB */}
      <FeedbackFAB />

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
    </div>
  );
}