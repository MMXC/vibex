/**
 * PhaseProgressBar — 阶段进度条组件
 * 显示 4 阶段进度：input → context → flow → component
 *
 * 遵守 AGENTS.md 规范：
 * - Props 接口有 JSDoc
 * - 无 any 类型泄漏
 * - 无 canvasLogger.default.debug
 */
import React from 'react';
import type { Phase } from '@/lib/canvas/types';
import styles from './canvas.module.css';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

interface PhaseProgressBarProps {
  /** 当前阶段 */
  currentPhase: Phase;
  /** 点击阶段切换（仅在不触发生成的范围内） */
  onPhaseClick?: (phase: Phase) => void;
}

/** 阶段定义 */
const PHASES: Array<{ key: Phase; label: string }> = [
  { key: 'input', label: '需求录入' },
  { key: 'context', label: '限界上下文' },
  { key: 'flow', label: '业务流程' },
  { key: 'component', label: '组件树' },
];

function getPhaseStatus(phase: Phase, currentPhase: Phase): 'completed' | 'active' | 'pending' {
  const phaseOrder: Phase[] = ['input', 'context', 'flow', 'component', 'prototype'];
  const currentIdx = phaseOrder.indexOf(currentPhase);
  const thisIdx = phaseOrder.indexOf(phase);

  if (thisIdx < currentIdx) return 'completed';
  if (thisIdx === currentIdx) return 'active';
  return 'pending';
}

export function PhaseProgressBar({ currentPhase, onPhaseClick }: PhaseProgressBarProps) {
  return (
    <div className={styles.phaseProgressBar} role="navigation" aria-label="画布阶段导航">
      {PHASES.map((phase, idx) => {
        const status = getPhaseStatus(phase.key, currentPhase);
        const isClickable = onPhaseClick && status !== 'pending';

        return (
          <React.Fragment key={phase.key}>
            <button
              type="button"
              className={`${styles.phaseItem} ${styles[`phase_${status}`]} ${
                isClickable ? styles.phaseClickable : ''
              }`}
              onClick={isClickable ? () => onPhaseClick?.(phase.key) : undefined}
              disabled={!isClickable}
              data-testid={`step-${phase.key}`}
              title={
                !isClickable
                  ? `${phase.label}：需先完成上一阶段`
                  : undefined
              }
              aria-current={status === 'active' ? 'step' : undefined}
              aria-label={`阶段: ${phase.label}, 状态: ${
                status === 'completed' ? '已完成' : status === 'active' ? '进行中' : '待激活'
              }`}
            >
              <span className={styles.phaseNumber} aria-hidden="true">
                {status === 'completed' ? '✓' : idx + 1}
              </span>
              <span className={styles.phaseLabel}>{phase.label}</span>
            </button>
            {idx < PHASES.length - 1 && (
              <div
                className={`${styles.phaseConnector} ${
                  status === 'completed' ? styles.connectorCompleted : ''
                }`}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
