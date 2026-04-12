/**
 * PhaseIndicator — Canvas Phase Status Indicator
 * E3 S3.1: 在 CanvasPage 左上角显示当前 Phase（Context / Flow / Component）
 * 悬浮在 canvas 区域上方，始终可见，点击可切换 Phase
 *
 * 遵守 AGENTS.md 规范：
 * - 组件接收 slice 相关 props，不直接访问多个 canvasStore slice
 * - 无 any 类型泄漏
 * - 无 canvasLogger.default.debug
 */
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Phase } from '@/lib/canvas/types';
import styles from './PhaseIndicator.module.css';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

interface PhaseIndicatorProps {
  /** 当前阶段（从 contextStore 传入） */
  phase: Phase;
  /** 切换阶段回调 */
  onPhaseChange: (phase: Phase) => void;
  /** 当前阶段节点数量（可选，用于显示计数） */
  nodeCount?: number;
}

/** 可切换的阶段列表 */
const SWITCHABLE_PHASES: Array<{ key: Phase; label: string; icon: string; colorVar: string }> = [
  { key: 'context', label: '◇ 上下文', icon: '◇', colorVar: 'var(--tree-context-color)' },
  { key: 'flow', label: '→ 流程', icon: '→', colorVar: 'var(--tree-flow-color)' },
  { key: 'component', label: '▣ 组件', icon: '▣', colorVar: 'var(--tree-component-color)' },
  { key: 'prototype', label: '🚀 原型队列', icon: '🚀', colorVar: 'var(--tree-prototype-color)' },
];

function getCurrentPhaseMeta(phase: Phase) {
  return (
    SWITCHABLE_PHASES.find((p) => p.key === phase) ?? {
      key: 'prototype' as Phase,
      label: '🚀 原型队列',
      icon: '🚀',
      colorVar: 'var(--tree-prototype-color)',
    }
  );
}

export function PhaseIndicator({ phase, onPhaseChange, nodeCount }: PhaseIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const meta = getCurrentPhaseMeta(phase);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as HTMLElement)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleSelect = useCallback(
    (p: Phase) => {
      onPhaseChange(p);
      setIsOpen(false);
    },
    [onPhaseChange]
  );

  // Don't show for input phase (handled by PhaseProgressBar)
  if (phase === 'input') {
    return null;
  }
  // PhaseIndicator 在 prototype phase 可见，显示 "🚀 原型队列"

  return (
    <div className={styles.wrapper} ref={dropdownRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`当前阶段: ${meta.label}${nodeCount !== undefined ? `, ${nodeCount} 节点` : ''}`}
        style={{ '--phase-color': meta.colorVar } as React.CSSProperties}
      >
        <span className={styles.triggerIcon} aria-hidden="true">{meta.icon}</span>
        <span className={styles.triggerLabel}>{meta.label}</span>
        {nodeCount !== undefined && (
          <span className={styles.nodeCount}>{nodeCount}</span>
        )}
        <span className={styles.chevron} aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <ul
          className={styles.dropdown}
          role="listbox"
          aria-label="切换阶段"
        >
          {SWITCHABLE_PHASES.map((p) => (
            <li
              key={p.key}
              role="option"
              aria-selected={p.key === phase}
              className={`${styles.dropdownItem} ${p.key === phase ? styles.dropdownItemActive : ''}`}
              style={{ '--phase-color': p.colorVar } as React.CSSProperties}
            >
              <button
                type="button"
                className={styles.dropdownButton}
                onClick={() => handleSelect(p.key)}
              >
                <span className={styles.dropdownIcon} aria-hidden="true">{p.icon}</span>
                <span className={styles.dropdownLabel}>{p.label}</span>
                {p.key === phase && (
                  <span className={styles.activeCheck} aria-hidden="true">✓</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
