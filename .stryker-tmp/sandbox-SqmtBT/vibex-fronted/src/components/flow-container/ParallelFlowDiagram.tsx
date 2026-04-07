/**
 * Parallel Flow Diagram Component
 * Renders a Mermaid-style parallel execution flow for the 5-step process
 */
// @ts-nocheck


'use client';

import React, { useState } from 'react';
import styles from './ParallelFlowDiagram.module.css';

export interface ParallelStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  subSteps?: ParallelStep[];
  data?: Record<string, unknown>;
}

interface ParallelFlowDiagramProps {
  steps: ParallelStep[];
  currentStepId?: string;
  onStepClick?: (stepId: string) => void;
}

const STEP_ICONS: Record<string, string> = {
  requirements: '📝',
  context: '🎯',
  businessFlow: '🔄',
  components: '🧩',
  project: '🚀',
};

const STEP_LABELS: Record<string, string> = {
  requirements: '需求定义',
  context: '限界上下文',
  businessFlow: '业务流程',
  components: 'UI组件',
  project: '项目创建',
};

function StepNode({ step, depth = 0 }: { step: ParallelStep; depth?: number }) {
  const statusColors: Record<string, string> = {
    pending: styles.statusPending,
    active: styles.statusActive,
    completed: styles.statusCompleted,
    error: styles.statusError,
  };

  return (
    <div className={`${styles.stepNode} ${statusColors[step.status] || ''}`} style={{ marginLeft: depth * 24 }}>
      <span className={styles.stepIcon}>{STEP_ICONS[step.id] || '📋'}</span>
      <span className={styles.stepLabel}>{step.label}</span>
      {step.status === 'active' && <span className={styles.pulse} />}
      {step.subSteps?.map((sub) => (
        <StepNode key={sub.id} step={sub} depth={depth + 1} />
      ))}
    </div>
  );
}

export function ParallelFlowDiagram({
  steps,
  currentStepId,
  onStepClick,
}: ParallelFlowDiagramProps) {
  const mappedSteps: ParallelStep[] = steps.map((step) => ({
    ...step,
    label: STEP_LABELS[step.id] || step.label,
    status: currentStepId
      ? step.id === currentStepId
        ? 'active'
        : steps.findIndex((s) => s.id === step.id) < steps.findIndex((s) => s.id === currentStepId)
          ? 'completed'
          : 'pending'
      : step.status,
  }));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>并行流程图</h3>
        <div className={styles.legend}>
          <span className={`${styles.legendItem} ${styles.statusPending}`}>待处理</span>
          <span className={`${styles.legendItem} ${styles.statusActive}`}>进行中</span>
          <span className={`${styles.legendItem} ${styles.statusCompleted}`}>已完成</span>
          <span className={`${styles.legendItem} ${styles.statusError}`}>错误</span>
        </div>
      </div>

      <div className={styles.flow}>
        {mappedSteps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div
              className={`${styles.stepWrapper} ${step.status === 'active' ? styles.wrapperActive : ''}`}
              onClick={() => onStepClick?.(step.id)}
            >
              <StepNode step={step} />
            </div>
            {index < mappedSteps.length - 1 && (
              <div className={styles.connector}>
                <div className={styles.line} />
                <span className={styles.arrow}>→</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// Default 5-step flow
export const DEFAULT_FLOW_STEPS: ParallelStep[] = [
  { id: 'requirements', label: '需求定义', status: 'pending' },
  { id: 'context', label: '限界上下文', status: 'pending' },
  { id: 'businessFlow', label: '业务流程', status: 'pending' },
  { id: 'components', label: 'UI组件', status: 'pending' },
  { id: 'project', label: '项目创建', status: 'pending' },
];

export default ParallelFlowDiagram;
