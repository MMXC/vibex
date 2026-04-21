/**
 * ProjectBar — 画布顶部项目信息栏
 *
 * Epic 5 实现: S5.4 (创建项目按钮)
 *
 * 遵守 AGENTS.md 规范:
 * - 组件接收 slice 相关 props，不直接 dispatch 多个 slice
 * - 无 any 类型泄漏
 */
'use client';
import { canvasLogger } from '@/lib/canvas/canvasLogger';

import React, { useState, useCallback } from 'react';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import { useUIStore } from '@/lib/canvas/stores/uiStore';
import { useSessionStore } from '@/lib/canvas/stores/sessionStore';
import { canvasApi } from '@/lib/canvas/api/canvasApi';
import { hasNodes } from '@/lib/canvas/cascade';
import type { CreateProjectInput, PrototypePage, BoundedContextNode, BusinessFlowNode, ComponentNode } from '@/lib/canvas/types';
import { getHistoryStore } from '@/lib/canvas/historySlice';

// ── Epic 1 F1.2: Message Drawer Toggle ────────────────────────────────────
function LeftDrawerToggle() {
  const isOpen = useUIStore((s) => s.leftDrawerOpen);
  const toggleLeftDrawer = useUIStore((s) => s.toggleLeftDrawer);

  return (
    <button
      type="button"
      className={styles.searchButton}
      onClick={toggleLeftDrawer}
      aria-label={isOpen ? '关闭需求输入抽屉' : '打开需求输入抽屉'}
      aria-pressed={isOpen}
      title={isOpen ? '关闭需求输入' : '需求输入'}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <span>需求</span>
    </button>
  );
}

function MessageDrawerToggle() {
  // S3.1: Use UI store for drawer state
  const isOpen = useUIStore((s) => s.rightDrawerOpen);
  const toggleRightDrawer = useUIStore((s) => s.toggleRightDrawer);

  return (
    <button
      type="button"
      className={styles.searchButton}
      onClick={toggleRightDrawer}
      aria-label={isOpen ? '关闭消息抽屉' : '打开消息抽屉'}
      aria-pressed={isOpen}
      title={isOpen ? '关闭消息抽屉' : '打开消息抽屉'}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <span>消息</span>
    </button>
  );
}

import { UndoRedoButtons, ZoomControls } from './CanvasToolbar';
import { ExportMenu } from './features/ExportMenu';
import styles from './canvas.module.css';

interface ProjectBarProps {
  /** 项目名称 */
  projectName?: string;
  /** 项目名称变更回调 */
  onProjectNameChange?: (name: string) => void;
  /** 打开搜索回调 */
  onOpenSearch?: () => void;
  /** E2-F14: 当前缩放级别 */
  zoomLevel?: number;
  /** E2-F14: 放大回调 */
  onZoomIn?: () => void;
  /** E2-F14: 缩小回调 */
  onZoomOut?: () => void;
  /** E2-F14: 重置缩放回调 */
  onZoomReset?: () => void;
  /** E4-F11: 打开版本历史回调 */
  onOpenHistory?: () => void;
  /** P1-F6: 打开快捷键帮助面板回调 */
  onOpenShortcuts?: () => void;
  /** E3-U3: 打开导入面板回调 */
  onImportClick?: () => void;
}

export function ProjectBar({
  projectName = '未命名项目',
  onProjectNameChange,
  onOpenSearch,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onOpenHistory,
  onOpenShortcuts,
  onImportClick,
}: ProjectBarProps) {
  const contextNodes = useContextStore((s) => s.contextNodes);
  const flowNodes = useFlowStore((s) => s.flowNodes);
  const componentNodes = useComponentStore((s) => s.componentNodes);
  const projectId = useSessionStore((s) => s.projectId);
  const setProjectId = useSessionStore((s) => s.setProjectId);
  const addToQueue = useSessionStore((s) => s.addToQueue);
  const setPhase = useContextStore((s) => s.setPhase);
  const prototypeQueue = useSessionStore((s) => s.prototypeQueue);

  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // === Undo/Redo handlers (Epic1 F1.3) ===
  const handleUndo = useCallback(() => {
    const historyStore = getHistoryStore();

    // Priority: context > flow > component
    if (historyStore.canUndo('context')) {
      const prev = historyStore.undo('context');
      if (prev) useContextStore.getState().setContextNodes(prev as BoundedContextNode[]);
      return;
    }
    if (historyStore.canUndo('flow')) {
      const prev = historyStore.undo('flow');
      if (prev) useFlowStore.getState().setFlowNodes(prev as BusinessFlowNode[]);
      return;
    }
    if (historyStore.canUndo('component')) {
      const prev = historyStore.undo('component');
      if (prev) useComponentStore.getState().setComponentNodes(prev as ComponentNode[]);
    }
  }, []);

  const handleRedo = useCallback(() => {
    const historyStore = getHistoryStore();

    // Priority: context > flow > component
    if (historyStore.canRedo('context')) {
      const next = historyStore.redo('context');
      if (next) useContextStore.getState().setContextNodes(next as BoundedContextNode[]);
      return;
    }
    if (historyStore.canRedo('flow')) {
      const next = historyStore.redo('flow');
      if (next) useFlowStore.getState().setFlowNodes(next as BusinessFlowNode[]);
      return;
    }
    if (historyStore.canRedo('component')) {
      const next = historyStore.redo('component');
      if (next) useComponentStore.getState().setComponentNodes(next as ComponentNode[]);
    }
  }, []);

  // E3-F3.1: hasAllNodes 要求所有节点 isActive !== false
  // E3-F3.2: tooltip 与 hasAllNodes 失败原因一致
  // Bug (F3.2): 原先 tooltip 统一显示"请先确认所有三树节点"，不区分具体哪棵树失败
  const contextInactive = contextNodes.length > 0 && contextNodes.some((n) => n.isActive === false);
  const flowInactive = flowNodes.length > 0 && flowNodes.some((n) => n.isActive === false);
  const componentInactive = componentNodes.length > 0 && componentNodes.some((n) => n.isActive === false);
  const hasAllNodes = hasNodes(contextNodes) && hasNodes(flowNodes) && hasNodes(componentNodes)
    && contextNodes.every((n) => n.isActive !== false)
    && flowNodes.every((n) => n.isActive !== false)
    && componentNodes.every((n) => n.isActive !== false);

  // === Handlers ===

  const handleCreateProject = async () => {
    if (!hasAllNodes || isCreating) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      // Step 1: Create project
      const input: CreateProjectInput = {
        requirementText: projectName,
        contexts: contextNodes,
        flows: flowNodes,
        components: componentNodes,
      };

      const result = await canvasApi.createProject(input);
      setProjectId(result.projectId);

      // Step 2: Generate prototypes from component nodes
      const componentIds = componentNodes.map((c) => c.nodeId);
      const generateResult = await canvasApi.generate({
        projectId: result.projectId,
        pageIds: componentIds,
        mode: 'parallel',
      });

      // Step 3: Add pages to queue
      const pages: PrototypePage[] = generateResult.pages.map((p) => ({
        pageId: p.pageId,
        componentId: componentIds[generateResult.pages.indexOf(p)],
        name: componentNodes.find((c) => c.nodeId === componentIds[generateResult.pages.indexOf(p)])?.name ?? p.pageId,
        status: 'queued',
        progress: 0,
        retryCount: 0,
      }));

      addToQueue(pages);

      // Step 4: Advance to prototype phase
      setPhase('prototype');
    } catch (err) {
      canvasLogger.ProjectBar.error(' create project error:', err);
      setCreateError(String(err));
    } finally {
      setIsCreating(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onProjectNameChange?.(e.target.value);
  };

  const hasProject = !!projectId;
  const doneCount = prototypeQueue.filter((p) => p.status === 'done').length;
  const totalCount = prototypeQueue.length;

  return (
    <div className={styles.projectBar}>
      {/* Project name input */}
      <input
        type="text"
        className={styles.projectNameInput}
        value={projectName}
        onChange={handleNameChange}
        placeholder="项目名称"
        aria-label="项目名称"
        disabled={hasProject}
      />

      {/* Project ID badge */}
      {hasProject && (
        <span className={styles.projectIdBadge} title="项目 ID">
          ID: {projectId?.slice(0, 16)}...
        </span>
      )}

      {/* Queue summary */}
      {hasProject && totalCount > 0 && (
        <span className={styles.queueSummaryBadge}>
          🚀 {doneCount}/{totalCount} 原型完成
        </span>
      )}

      {/* Epic1 F1.3: Undo/Redo buttons */}
      <UndoRedoButtons onUndo={handleUndo} onRedo={handleRedo} />

      {/* E2-F5: Search button */}
      {onOpenSearch && (
        <button
          type="button"
          className={styles.searchButton}
          onClick={onOpenSearch}
          aria-label="搜索节点"
          title="搜索节点（按 / 键）"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>搜索</span>
        </button>
      )}

      {/* P1-F6: Shortcut help button */}
      {onOpenShortcuts && (
        <button
          type="button"
          className={styles.searchButton}
          onClick={onOpenShortcuts}
          aria-label="快捷键帮助"
          title="快捷键帮助（按 ? 键）"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8" />
          </svg>
          <span>?</span>
        </button>
      )}

      {/* E2-F14: Zoom controls */}
      {zoomLevel !== undefined && onZoomIn && onZoomOut && onZoomReset && (
        <ZoomControls
          zoomLevel={zoomLevel}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onZoomReset={onZoomReset}
        />
      )}

      {/* E4-F9: Export Menu (PNG/SVG/JSON/Markdown) */}
      <ExportMenu label="导出" onImportClick={onImportClick} />

      {/* Epic 2 S2.5: Left Drawer toggle button */}
      <LeftDrawerToggle />

      {/* Epic 1 F1.2: Message Drawer toggle button */}
      <MessageDrawerToggle />

      {/* E4-F11: Version History button */}
      {onOpenHistory && (
        <button
          type="button"
          className={styles.searchButton}
          onClick={onOpenHistory}
          aria-label="版本历史"
          title="版本历史（保存快照/恢复）"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>历史</span>
        </button>
      )}

      {/* Create Project button */}
      <button
        type="button"
        className={styles.createProjectBtn}
        onClick={handleCreateProject}
        disabled={!hasAllNodes || isCreating}
        aria-label="创建项目并开始生成原型"
        data-testid="create-project-btn"
        title={
          isCreating
            ? '创建中...'
            : !hasAllNodes
              ? componentNodes.length === 0
                ? '请先生成组件树'
                : contextInactive
                  ? '请先确认所有上下文节点'
                  : flowInactive
                    ? '请先确认所有流程节点'
                    : componentInactive
                      ? '请先确认所有组件节点'
                      : '请先确认所有三树节点'
              : '创建项目并开始生成原型'
        }
      >
        {isCreating ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            创建中...
          </>
        ) : (
          <>🚀 创建项目</>
        )}
      </button>

      {/* Error display */}
      {createError && (
        <span className={styles.createProjectError} role="alert">
          ❌ {createError}
        </span>
      )}
    </div>
  );
}
