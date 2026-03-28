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

import React, { useState, useCallback } from 'react';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import { canvasApi } from '@/lib/canvas/api/canvasApi';
import { areAllConfirmed } from '@/lib/canvas/cascade';
import type { CreateProjectInput, PrototypePage } from '@/lib/canvas/types';
import { getHistoryStore } from '@/lib/canvas/historySlice';
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
}: ProjectBarProps) {
  const contextNodes = useCanvasStore((s) => s.contextNodes);
  const flowNodes = useCanvasStore((s) => s.flowNodes);
  const componentNodes = useCanvasStore((s) => s.componentNodes);
  const projectId = useCanvasStore((s) => s.projectId);
  const setProjectId = useCanvasStore((s) => s.setProjectId);
  const addToQueue = useCanvasStore((s) => s.addToQueue);
  const setPhase = useCanvasStore((s) => s.setPhase);
  const prototypeQueue = useCanvasStore((s) => s.prototypeQueue);

  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // === Undo/Redo handlers (Epic1 F1.3) ===
  const handleUndo = useCallback(() => {
    const historyStore = getHistoryStore();
    const canvasStore = useCanvasStore.getState();

    // Priority: context > flow > component
    if (historyStore.canUndo('context')) {
      const prev = historyStore.undo('context');
      if (prev) canvasStore.setContextNodes(prev as typeof canvasStore.contextNodes);
      return;
    }
    if (historyStore.canUndo('flow')) {
      const prev = historyStore.undo('flow');
      if (prev) canvasStore.setFlowNodes(prev as typeof canvasStore.flowNodes);
      return;
    }
    if (historyStore.canUndo('component')) {
      const prev = historyStore.undo('component');
      if (prev) canvasStore.setComponentNodes(prev as typeof canvasStore.componentNodes);
    }
  }, []);

  const handleRedo = useCallback(() => {
    const historyStore = getHistoryStore();
    const canvasStore = useCanvasStore.getState();

    // Priority: context > flow > component
    if (historyStore.canRedo('context')) {
      const next = historyStore.redo('context');
      if (next) canvasStore.setContextNodes(next as typeof canvasStore.contextNodes);
      return;
    }
    if (historyStore.canRedo('flow')) {
      const next = historyStore.redo('flow');
      if (next) canvasStore.setFlowNodes(next as typeof canvasStore.flowNodes);
      return;
    }
    if (historyStore.canRedo('component')) {
      const next = historyStore.redo('component');
      if (next) canvasStore.setComponentNodes(next as typeof canvasStore.componentNodes);
    }
  }, []);

  const allConfirmed = areAllConfirmed(contextNodes) && areAllConfirmed(flowNodes) && areAllConfirmed(componentNodes)
    && contextNodes.length > 0 && flowNodes.length > 0 && componentNodes.length > 0;

  // === Handlers ===

  const handleCreateProject = async () => {
    if (!allConfirmed || isCreating) return;

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
      console.error('[ProjectBar] create project error:', err);
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
      <ExportMenu label="导出" />

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
        disabled={!allConfirmed || isCreating}
        aria-label="创建项目并开始生成原型"
        data-testid="create-project-btn"
        title={
          !allConfirmed
            ? '请先确认所有三树节点'
            : isCreating
              ? '创建中...'
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
