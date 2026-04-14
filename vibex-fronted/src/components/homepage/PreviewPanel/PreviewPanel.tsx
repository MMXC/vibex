/**
 * PreviewPanel - 中间预览区组件 (PRD v2)
 *
 * 60% 宽度，渲染当前步骤的 Mermaid 图表
 * 支持 4 种图表：上下文图、模型图、流程图、UI 节点图
 *
 * PRD: FR-2 三栏布局 / FR-4 实时预览
 */
'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import styles from './PreviewPanel.module.css';
import { MermaidSkeleton } from '@/components/mermaid/MermaidSkeleton';

// Dynamic import for MermaidRenderer (SSR: false to avoid window access on server)
// E2.1: mermaid ~350KB loaded only when needed
const MermaidRenderer = dynamic(
  () => import('@/components/mermaid/MermaidRenderer'),
  {
    ssr: false,
    loading: () => <MermaidSkeleton />,
  }
);

export interface MermaidCodes {
  context: string;
  model: string;
  flow: string;
  ui: string;
}

export interface PreviewPanelProps {
  currentStep: number;
  mermaidCodes: MermaidCodes;
  isLoading?: boolean;
  error?: string;
}

/** 根据步骤 ID 获取图表类型标签 */
const STEP_LABELS: Record<number, string> = {
  1: '需求预览',
  2: '限界上下文',
  3: '领域模型',
  4: '业务流程',
  5: 'UI 设计',
};

/** 根据步骤 ID 获取对应的 Mermaid 代码 key */
const STEP_CODE_KEYS: Record<number, keyof MermaidCodes> = {
  1: 'context',
  2: 'context',
  3: 'model',
  4: 'flow',
  5: 'ui',
};

export function PreviewPanel({
  currentStep,
  mermaidCodes,
  isLoading = false,
  error,
}: PreviewPanelProps) {
  const codeKey = STEP_CODE_KEYS[currentStep] ?? 'context';
  const mermaidCode = mermaidCodes[codeKey] || '';
  const stepLabel = STEP_LABELS[currentStep] || '预览';

  const hasCode = !!mermaidCode.trim();

  return (
    <div className={styles.panel} data-testid="preview-panel">
      {/* 预览头部 */}
      <div className={styles.header}>
        <h3 className={styles.title}>{stepLabel}</h3>
        {isLoading && (
          <div className={styles.loadingBadge}>
            <span className={styles.spinner} />
            生成中...
          </div>
        )}
      </div>

      {/* 预览内容 */}
      <div className={styles.content} data-testid="preview-content">
        {error ? (
          <div className={styles.errorState}>
            <span className={styles.errorIcon}>⚠️</span>
            <p className={styles.errorText}>{error}</p>
          </div>
        ) : isLoading ? (
          <div className={styles.loadingState} data-testid="preview-skeleton">
            <div className={styles.skeleton} />
            <div className={styles.skeletonText}>正在生成预览...</div>
          </div>
        ) : hasCode ? (
          <div className={styles.mermaidContainer} data-testid="mermaid-svg">
            <MermaidRenderer
              chart={mermaidCode}
              title={getChartType(codeKey)}
            />
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🔍</span>
            <p className={styles.emptyTitle}>暂无预览</p>
            <p className={styles.emptyText}>
              输入需求后，系统将自动生成 {stepLabel}图表
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** 根据代码类型推断 Mermaid 图表类型 (用于 title) */
function getChartType(codeKey: keyof MermaidCodes): string {
  switch (codeKey) {
    case 'context':
      return '限界上下文图';
    case 'model':
      return '领域模型图';
    case 'flow':
      return '业务流程图';
    case 'ui':
      return 'UI 节点图';
    default:
      return '流程图';
  }
}

export default PreviewPanel;
