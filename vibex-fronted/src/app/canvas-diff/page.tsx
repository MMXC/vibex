/**
 * P005 Canvas 对比页面
 * 路由: /canvas-diff
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CanvasDiffSelector, CanvasDiffView, ProjectOption } from '@/components/canvas-diff';
import { compareCanvasProjects, exportDiffReport, type CanvasDiff, type CanvasProject } from '@/lib/canvasDiff';
import { projectApi } from '@/services/api/modules/project';
import { getUserId } from '@/lib/auth-token';
import type { Project } from '@/services/api/types/project';
import styles from './canvas-diff.module.css';

const s = styles as Record<string, string>;

// 模拟 Canvas 项目数据加载
// 实际项目中会从 API 或 Canvas Store 加载完整三树数据
async function loadCanvasProject(projectId: string): Promise<CanvasProject> {
  // 这里需要调用实际的 Canvas API 获取项目完整数据
  // 当前使用示例数据作为占位
  return {
    id: projectId,
    name: projectId,
    contextNodes: [],
    flowNodes: [],
    componentNodes: [],
  };
}

export default function CanvasDiffPage() {
  const [options, setOptions] = useState<ProjectOption[]>([]);
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');
  const [projectAName, setProjectAName] = useState('');
  const [projectBName, setProjectBName] = useState('');
  const [diff, setDiff] = useState<CanvasDiff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载项目列表
  useEffect(() => {
    async function fetchProjects() {
      try {
        const userId = getUserId() || '';
        const projects = await projectApi.getProjects(userId);
        setOptions(
          projects.map((p: Project) => ({
            id: p.id,
            name: p.name || `项目 ${p.id.slice(0, 8)}`,
          }))
        );
      } catch (err) {
        // 项目列表加载失败，使用空列表，页面仍可展示空状态
        console.warn('Failed to load projects:', err);
      }
    }
    fetchProjects();
  }, []);

  // 执行对比
  const runCompare = useCallback(async () => {
    if (!selectedA || !selectedB) return;

    setLoading(true);
    setError(null);
    setDiff(null);

    try {
      const [projA, projB] = await Promise.all([
        loadCanvasProject(selectedA),
        loadCanvasProject(selectedB),
      ]);

      // 从 options 获取项目名称
      const optA = options.find((o) => o.id === selectedA);
      const optB = options.find((o) => o.id === selectedB);
      setProjectAName(optA?.name || selectedA);
      setProjectBName(optB?.name || selectedB);

      // 注意：当前 loadCanvasProject 使用占位数据
      // 实际需要后端提供 /projects/:id/canvas 接口返回完整三树数据
      // 这里先用空的 CanvasProject 对比，结果会是 added=0 removed=0
      const result = compareCanvasProjects(projA, projB);
      setDiff(result);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [selectedA, selectedB, options]);

  // 选择变化时自动对比
  useEffect(() => {
    if (selectedA && selectedB) {
      runCompare();
    } else {
      setDiff(null);
    }
  }, [selectedA, selectedB, runCompare]);

  // 导出报告
  const handleExport = useCallback(() => {
    if (!diff) return;
    const report = exportDiffReport(diff, projectAName, projectBName);
    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canvas-diff-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [diff, projectAName, projectBName]);

  return (
    <div className={`${s.page ?? ''}`}>
      <div className={`${s.pageHeader ?? ''}`}>
        <h1 className={`${s.pageTitle ?? ''}`}>Canvas 对比</h1>
        <p className={`${s.pageDesc ?? ''}`}>比较两个 Canvas 项目的三树节点差异</p>
      </div>

      <CanvasDiffSelector
        options={options}
        valueA={selectedA}
        valueB={selectedB}
        onChangeA={setSelectedA}
        onChangeB={setSelectedB}
      />

      {(loading) && (
        <div className={`${s.loadingState ?? ''}`}>
          <div className={`${s.skeleton ?? ''}`} style={{ width: 200, height: 20 }} />
          <span>正在加载项目数据...</span>
        </div>
      )}

      {error && (
        <div className={`${s.errorState ?? ''}`} role="alert">
          ❌ {error}
        </div>
      )}

      <CanvasDiffView
        diff={diff}
        projectAName={projectAName}
        projectBName={projectBName}
        onExport={handleExport}
      />
    </div>
  );
}