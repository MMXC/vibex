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

import React, { useState } from 'react';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import { canvasApi } from '@/lib/canvas/api/canvasApi';
import { areAllConfirmed } from '@/lib/canvas/cascade';
import type { CreateProjectInput, PrototypePage } from '@/lib/canvas/types';
import styles from './canvas.module.css';

interface ProjectBarProps {
  /** 项目名称 */
  projectName?: string;
  /** 项目名称变更回调 */
  onProjectNameChange?: (name: string) => void;
}

export function ProjectBar({ projectName = '未命名项目', onProjectNameChange }: ProjectBarProps) {
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
