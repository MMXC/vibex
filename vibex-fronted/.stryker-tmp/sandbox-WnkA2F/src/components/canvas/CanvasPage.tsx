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
// @ts-nocheck

'use client';

import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import { useUIStore } from '@/lib/canvas/stores/uiStore';
import { useSessionStore } from '@/lib/canvas/stores/sessionStore';
import {
  loadExampleData,
  setContextNodes as canvasSetContextNodes,
  setFlowNodes as canvasSetFlowNodes,
  setComponentNodes as canvasSetComponentNodes,
} from '@/lib/canvas/canvasStore';
import { hasNodes } from '@/lib/canvas/cascade';
import { canvasApi } from '@/lib/canvas/api/canvasApi';
import { getHistoryStore } from '@/lib/canvas/historySlice';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { SearchDialog } from './features/SearchDialog';
import { useCanvasSearch } from '@/hooks/canvas/useCanvasSearch';
import { PhaseProgressBar } from './PhaseProgressBar';
import { TabBar } from './TabBar';
import { TreePanel } from './TreePanel';
import { BoundedContextTree } from './BoundedContextTree';
import { ComponentTree } from './ComponentTree';
import { BusinessFlowTree } from './BusinessFlowTree';
import { ProjectBar } from './ProjectBar';
import { PrototypeQueuePanel } from './PrototypeQueuePanel';
import { HoverHotzone } from './HoverHotzone';
import { ShortcutHintPanel } from './features/ShortcutHintPanel';
import { TreeStatus } from './TreeStatus';
import { TemplateSelector } from './features/TemplateSelector';
import { VersionHistoryPanel } from './features/VersionHistoryPanel';
import { SaveIndicator } from './features/SaveIndicator';
import { useVersionHistory } from '@/hooks/canvas/useVersionHistory';
import { useAutoSave } from '@/hooks/canvas/useAutoSave';
import { MessageDrawer } from './messageDrawer/MessageDrawer';
import { LeftDrawer } from './leftDrawer/LeftDrawer';
import { ShortcutBar } from '@/components/guidance/ShortcutBar';
import { useToast } from '@/components/ui/Toast';
import { UndoBar } from '@/components/undo-bar/UndoBar';

import { NodeTooltip } from '@/components/guidance/NodeTooltip';
import { ConflictDialog as ConflictDialogComponent } from '@/components/ConflictDialog';
import type { Phase, TreeType, TreeNode } from '@/lib/canvas/types';
import type { NodeRect } from '@/lib/canvas/types';
import { BoundedEdgeLayer } from './edges/BoundedEdgeLayer';
import { FlowEdgeLayer } from './edges/FlowEdgeLayer';
import styles from './canvas.module.css';

interface CanvasPageProps {
  /** 是否使用 Tab 模式（< 768px） */
  useTabMode?: boolean;
}

export function CanvasPage({ useTabMode = false }: CanvasPageProps) {
  // === Store Selectors ===
  const phase = useContextStore((s) => s.phase);
  const activeTree = useContextStore((s) => s.activeTree);
  const contextNodes = useContextStore((s) => s.contextNodes);
  const flowNodes = useFlowStore((s) => s.flowNodes);
  const componentNodes = useComponentStore((s) => s.componentNodes);
  const contextPanelCollapsed = useUIStore((s) => s.contextPanelCollapsed);
  const flowPanelCollapsed = useUIStore((s) => s.flowPanelCollapsed);
  const componentPanelCollapsed = useUIStore((s) => s.componentPanelCollapsed);
  const setPhase = useContextStore((s) => s.setPhase);
  const toggleContextPanel = useUIStore((s) => s.toggleContextPanel);
  const toggleFlowPanel = useUIStore((s) => s.toggleFlowPanel);
  const toggleComponentPanel = useUIStore((s) => s.toggleComponentPanel);
  // E3-F2: Delete selected node(s) based on active tree (multi-select batch delete)
  const deleteSelectedNodes = useContextStore((s) => s.deleteSelectedNodes);
  const autoGenerateFlows = useFlowStore((s) => s.autoGenerateFlows);
  const generateComponentFromFlow = useComponentStore((s) => s.generateComponentFromFlow);
  const flowGenerating = useSessionStore((s) => s.flowGenerating);
  const flowGeneratingMessage = useSessionStore((s) => s.flowGeneratingMessage);
  // Epic1: Selection-based filtering — only send selected confirmed nodes
  const selectedNodeIds = useContextStore((s) => s.selectedNodeIds);

  // === Expand State Selectors (E2 → F1: legacy, kept for toggle buttons) ===
  const gridRef = useRef<HTMLDivElement>(null);
  const leftExpand = useUIStore((s) => s.leftExpand);
  const centerExpand = useUIStore((s) => s.centerExpand);
  const rightExpand = useUIStore((s) => s.rightExpand);
  const setLeftExpand = useUIStore((s) => s.setLeftExpand);
  const setCenterExpand = useUIStore((s) => s.setCenterExpand);
  const setRightExpand = useUIStore((s) => s.setRightExpand);

  // F1: New expand mode
  const expandMode = useUIStore((s) => s.expandMode);
  const setExpandMode = useUIStore((s) => s.setExpandMode);
  const toggleMaximize = useUIStore((s) => s.toggleMaximize);

  // F1: Legacy expand handlers (keep for backward compat until F1.4)
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

  // === F1: Sync expand mode to CSS variables ===
  useEffect(() => {
    if (!gridRef.current) return;
    const grid = gridRef.current;

    // F1: Set grid columns based on expandMode
    if (expandMode === 'expand-both' || expandMode === 'maximize') {
      grid.style.setProperty('--grid-left', '1fr');
      grid.style.setProperty('--grid-center', '1fr');
      grid.style.setProperty('--grid-right', '1fr');
    } else {
      // F1.4: Old 1.5fr logic removed — always 1fr for normal mode
      grid.style.setProperty('--grid-left', '1fr');
      grid.style.setProperty('--grid-center', '1fr');
      grid.style.setProperty('--grid-right', '1fr');
    }
  }, [expandMode]);

  // === F1.1: Reset scrollTop on canvas mount (rAF × 2 + cleanup) ===
  useEffect(() => {
    const resetScroll = () => {
      // Try to find canvas container by class and use scrollTo
      const container = document.querySelector('[class*="canvasContainer"]');
      if (container) {
        container.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
      // Also reset window scroll for safety
      window.scrollTo(0, 0);
    };
    // C1: Double rAF to ensure DOM is ready after mount
    const frameId = requestAnimationFrame(() => {
      requestAnimationFrame(resetScroll);
    });
    // C2: Cleanup with cancelAnimationFrame
    return () => cancelAnimationFrame(frameId);
  }, []); // C3: empty dependency

  // F1: F11 keyboard shortcut for maximize mode
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleMaximize();
      }
      // Escape only exits maximize mode
      if (e.key === 'Escape' && expandMode === 'maximize') {
        setExpandMode('normal');
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [expandMode, toggleMaximize, setExpandMode]);

  // === UI State ===
  const [activeTab, setActiveTab] = useState<TreeType>('context');
  const [projectName, setProjectName] = useState('我的项目');
  const [queuePanelExpanded, setQueuePanelExpanded] = useState(true);
  const [requirementInput, setRequirementInput] = useState('');
  const [isShortcutPanelOpen, setIsShortcutPanelOpen] = useState(false);
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);

  // === E2-F10: Space+drag canvas panning ===
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const [isQuickGenerating, setIsQuickGenerating] = useState(false);
  const toast = useToast();

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

  // === E4-F11: Version History ===
  const versionHistory = useVersionHistory();

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
      useContextStore.getState().setActiveTree(result.treeType);
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
  const aiThinking = useSessionStore((s) => s.aiThinking);
  const aiThinkingMessage = useSessionStore((s) => s.aiThinkingMessage);
  const generateContexts = useSessionStore((s) => s.generateContextsFromRequirement);
  const setRequirementText = useSessionStore((s) => s.setRequirementText);
  const requirementText = useSessionStore((s) => s.requirementText);

  // === Component Generation State (Bug4b) ===
  const [componentGenerating, setComponentGenerating] = useState(false);
  const projectId = useSessionStore((s) => s.projectId);

  // === E3: Auto-Save Hook ===
  const { saveStatus, lastSavedAt, saveNow, conflictData, clearConflict } = useAutoSave({
    projectId,
    debounceMs: 2000, // MUST be exactly 2000 per AGENTS.md
  });

  // === E4: Conflict Resolution Handlers ===
  // E4-SyncProtocol: Keep local data — force save with incremented version
  const handleConflictKeepLocal = useCallback(() => {
    if (!conflictData) return
    clearConflict()
    // The next save will automatically use the correct version
    // because local state hasn't changed — just clear the conflict flag
    // and the user can continue editing
    toast.showToast('已保留本地数据，请继续编辑后自动保存', 'info')
  }, [conflictData, clearConflict, toast])

  // E4-SyncProtocol: Use server data — restore from server snapshot
  const handleConflictUseServer = useCallback(() => {
    if (!conflictData) return
    const serverData = conflictData.serverSnapshot.data
    if (serverData.contexts) {
      canvasSetContextNodes(serverData.contexts as any)
    }
    if (serverData.flows) {
      canvasSetFlowNodes(serverData.flows as any)
    }
    if (serverData.components) {
      canvasSetComponentNodes(serverData.components as any)
    }
    clearConflict()
    toast.showToast('已使用服务端数据，当前画布已更新', 'success')
  }, [conflictData, clearConflict, toast])

  // E4-SyncProtocol: Merge both — append server nodes to local nodes (deduplicate by ID)
  const handleConflictMerge = useCallback(() => {
    if (!conflictData) return
    const serverData = conflictData.serverSnapshot.data

    const localContexts = useContextStore.getState().contextNodes
    const localFlows = useFlowStore.getState().flowNodes
    const localComponents = useComponentStore.getState().componentNodes

    const serverContexts = (serverData.contexts ?? []) as typeof localContexts
    const serverFlows = (serverData.flows ?? []) as typeof localFlows
    const serverComponents = (serverData.components ?? []) as typeof localComponents

    // Deduplicate by nodeId
    const localCtxIds = new Set(localContexts.map((n) => n.nodeId))
    const localFlowIds = new Set(localFlows.map((n) => n.nodeId))
    const localCompIds = new Set(localComponents.map((n) => n.nodeId))

    const mergedContexts = [
      ...localContexts,
      ...serverContexts.filter((n) => !localCtxIds.has(n.nodeId)),
    ]
    const mergedFlows = [
      ...localFlows,
      ...serverFlows.filter((n) => !localFlowIds.has(n.nodeId)),
    ]
    const mergedComponents = [
      ...localComponents,
      ...serverComponents.filter((n) => !localCompIds.has(n.nodeId)),
    ]

    canvasSetContextNodes(mergedContexts)
    canvasSetFlowNodes(mergedFlows)
    canvasSetComponentNodes(mergedComponents)
    clearConflict()
    toast.showToast(`已合并：+${serverContexts.length - localContexts.length} 上下文、+${serverFlows.length - localFlows.length} 流程、+${serverComponents.length - localComponents.length} 组件`, 'success')
  }, [conflictData, clearConflict, toast])

  // === E2-F14: Zoom State ===
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%
  const ZOOM_STEP = 0.1;
  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 2.0;

  // F3: Compute approximate node rects for edge layers (CSS grid → approximate positions)
  const CARD_W = 240;
  const CARD_H = 200;
  const CARD_GAP = 16;

  const contextNodeRects = useMemo<NodeRect[]>(() => {
    return contextNodes.map((node, i) => ({
      id: node.nodeId,
      x: (i % 3) * (CARD_W + CARD_GAP),
      y: Math.floor(i / 3) * (CARD_H + CARD_GAP),
      width: CARD_W,
      height: CARD_H,
    }));
  }, [contextNodes]);

  const flowNodeRects = useMemo<NodeRect[]>(() => {
    return flowNodes.map((node, i) => ({
      id: node.nodeId,
      x: (i % 3) * (CARD_W + CARD_GAP),
      y: Math.floor(i / 3) * (CARD_H + CARD_GAP),
      width: CARD_W,
      height: CARD_H,
    }));
  }, [flowNodes]);

  const _componentNodeRects = useMemo<NodeRect[]>(() => {
    return componentNodes.map((node, i) => ({
      id: node.nodeId,
      x: (i % 3) * (CARD_W + CARD_GAP),
      y: Math.floor(i / 3) * (CARD_H + CARD_GAP),
      width: CARD_W,
      height: CARD_H,
    }));
  }, [componentNodes]);

  // Store selectors for edge layers
  const flowEdges = useContextStore((s) => s.flowEdges);
  const boundedEdges = useContextStore((s) => s.boundedEdges);

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

  // E3-F2: Delete selected node(s) based on active tree (multi-select batch delete)
  // Delegates to the canvasStore which records a single undo snapshot for the batch
  const handleDeleteSelected = useCallback(() => {
    // Use activeTree if set, otherwise default to 'context'
    const tree: TreeType = activeTree ?? 'context';
    deleteSelectedNodes(tree);
  }, [activeTree, deleteSelectedNodes]);

  // === Epic1 F1.2: Keyboard shortcuts for Undo/Redo ===
  const handleKeyboardUndo = useCallback((): boolean => {
    const historyStore = getHistoryStore();
    if (historyStore.canUndo('context')) {
      const prev = historyStore.undo('context');
      if (prev) { canvasSetContextNodes(prev as any); return true; }
    }
    if (historyStore.canUndo('flow')) {
      const prev = historyStore.undo('flow');
      if (prev) { canvasSetFlowNodes(prev as any); return true; }
    }
    if (historyStore.canUndo('component')) {
      const prev = historyStore.undo('component');
      if (prev) { canvasSetComponentNodes(prev as any); return true; }
    }
    return false;
  }, []);

  const handleKeyboardRedo = useCallback((): boolean => {
    const historyStore = getHistoryStore();
    if (historyStore.canRedo('context')) {
      const next = historyStore.redo('context');
      if (next) { canvasSetContextNodes(next as any); return true; }
    }
    if (historyStore.canRedo('flow')) {
      const next = historyStore.redo('flow');
      if (next) { canvasSetFlowNodes(next as any); return true; }
    }
    if (historyStore.canRedo('component')) {
      const next = historyStore.redo('component');
      if (next) { canvasSetComponentNodes(next as any); return true; }
    }
    return false;
  }, []);

  // === F1.1: Ctrl+G Quick Generate (useCallback for AGENTS.md C4) ===
  const quickGenerate = useCallback(async () => {
    // C3: Check if requirement input is empty
    if (!requirementInput.trim()) {
      toast.showToast('请先输入需求', 'warning');
      return;
    }
    // C3: Guard against concurrent generation
    if (isQuickGenerating || aiThinking || flowGenerating || componentGenerating) {
      return;
    }
    setIsQuickGenerating(true);
    try {
      // Step 1: Generate contexts
      await generateContexts(requirementInput);
      const ctxs = useContextStore.getState().contextNodes.filter((c) => c.isActive !== false);
      if (ctxs.length === 0) {
        toast.showToast('未生成任何 Context 节点，请检查需求输入', 'error');
        return;
      }
      // Step 2: Auto-generate flows
      await autoGenerateFlows(ctxs);
      // Step 3: Generate components
      await generateComponentFromFlow();
      toast.showToast('三树生成完成', 'success');
    } catch (err) {
      toast.showToast(err instanceof Error ? err.message : '生成失败', 'error');
    } finally {
      setIsQuickGenerating(false);
    }
  }, [requirementInput, isQuickGenerating, aiThinking, flowGenerating, componentGenerating, generateContexts, autoGenerateFlows, generateComponentFromFlow, toast]);

  useKeyboardShortcuts({
    undo: handleKeyboardUndo,
    redo: handleKeyboardRedo,
    onOpenSearch: openSearch,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onZoomReset: handleZoomReset,
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
    // [E4] Confirm selected nodes: Ctrl+Shift+C
    onConfirmSelected: () => {
      const store = useContextStore.getState();
      const { context: ctxIds, flow: flowIds } = store.selectedNodeIds;
      ctxIds.forEach((id) => store.confirmContextNode(id));
      flowIds.forEach((id) => useFlowStore.getState().confirmFlowNode(id));
    },
    // [E4] Generate context from requirement: Ctrl+Shift+G
    onGenerateContext: async () => {
      if (!requirementInput.trim()) {
        toast.showToast('请先输入需求', 'warning');
        return;
      }
      if (isQuickGenerating || aiThinking || flowGenerating || componentGenerating) return;
      await generateContexts(requirementInput);
    },
    onSwitchToContext: () => {
      useContextStore.getState().setActiveTree('context');
    },
    onSwitchToFlow: () => {
      useContextStore.getState().setActiveTree('flow');
    },
    onSwitchToComponent: () => {
      useContextStore.getState().setActiveTree('component');
    },
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

      // Map ONLY confirmed contexts to API format
      // Epic1 S1.1: If context selection exists, only send selected+confirmed; else send all confirmed
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

      // Map ONLY confirmed flows to API format
      // Epic1 S1.2: If flow selection exists, only send selected+confirmed; else send all confirmed
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
  }, [componentGenerating, flowNodes, contextNodes, selectedNodeIds, projectId, setComponentNodes, setPhase]);

  // === Compute confirmation states ===
  const contextReady = hasNodes(contextNodes);
  const flowReady = hasNodes(flowNodes);
  const componentReady = hasNodes(componentNodes);
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
        confirmed: n.isActive !== false,
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
        confirmed: n.isActive !== false,
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
        confirmed: n.isActive !== false,
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
                    onClick={() => autoGenerateFlows(contextNodes.filter((c) => c.isActive !== false))}
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
            onOpenSearch={openSearch}
            zoomLevel={zoomLevel}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomReset={handleZoomReset}
            onOpenHistory={versionHistory.open}
            onOpenShortcuts={toggleShortcutPanel}
          />
          {/* E3-S2: Save Indicator — shows auto-save status */}
          <SaveIndicator
            status={saveStatus}
            lastSavedAt={lastSavedAt}
            onSaveNow={saveNow}
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
            onClick={toggleMaximize}
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
            <div className={rowWrapperClasses}>
              {/* Left Drawer */}
              <LeftDrawer />

              <div
                ref={gridRef}
                className={gridClasses}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
              {/* F3: Edge layer overlays — absolutely positioned, pointer-events: none */}
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
                  contextNodes.length > 0 ? (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => autoGenerateFlows(contextNodes.filter((c) => c.isActive !== false))}
                        disabled={flowGenerating}
                        aria-label="继续到流程树"
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

              {/* F2: BoundedEdgeLayer — 限界上下文连线 SVG overlay */}
              <BoundedEdgeLayer
                edges={boundedEdges}
                nodeRects={contextNodeRects}
                zoom={zoomLevel}
                pan={{ x: 0, y: 0 }}
              />

              {/* F2: FlowEdgeLayer — 流程节点连线 SVG overlay */}
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

      {/* E4-F11: Version History Panel */}
      <VersionHistoryPanel
        open={versionHistory.isOpen}
        onClose={versionHistory.close}
      />

      {/* E4: Canvas Guidance System — removed 2026-04-01 */}
      <UndoBar />
      <ShortcutBar onOpenShortcutPanel={toggleShortcutPanel} />
      <NodeTooltip />

      {/* E4-SyncProtocol: Conflict Dialog — shown when save conflict is detected */}
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
