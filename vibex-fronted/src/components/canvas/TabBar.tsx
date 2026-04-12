/**
 * TabBar — 三树 Tab 切换器（含 prototype tab）
 *
 * Epic: canvas-three-tree-unification
 * E1 S1.1: 新增 prototype tab
 * E1 S1.2: Tab 切换时三树数据全部保留（不卸载）
 */

import React from 'react';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import { useSessionStore } from '@/lib/canvas/stores/sessionStore';
import type { TreeType, Phase, PrototypePage } from '@/lib/canvas/types';
import styles from './TabBar.module.css';

const TABS: { id: TreeType | 'prototype'; label: string; emoji: string }[] = [
  { id: 'context', label: '上下文', emoji: '🔵' },
  { id: 'flow', label: '流程', emoji: '🔀' },
  { id: 'component', label: '组件', emoji: '🧩' },
  { id: 'prototype', label: '原型', emoji: '🚀' },
];

interface TabBarProps {
  /** Callback when tab changes */
  onTabChange?: (tab: TreeType) => void;
}

export function TabBar({ onTabChange }: TabBarProps) {
  const activeTree = useContextStore((s) => s.activeTree);
  const phase = useContextStore((s) => s.phase);
  const setPhase = useContextStore((s) => s.setPhase);
  const contextNodes = useContextStore((s) => s.contextNodes);
  const flowNodes = useFlowStore((s) => s.flowNodes);
  const componentNodes = useComponentStore((s) => s.componentNodes);
  const setActiveTree = useContextStore((s) => s.setActiveTree);
  const prototypeCount = useSessionStore((s) => s.prototypeQueue.length);

  const PHASE_ORDER: Phase[] = ['input', 'context', 'flow', 'component', 'prototype'];
  const phaseIdx = PHASE_ORDER.indexOf(phase);

  const counts = {
    context: contextNodes.length,
    flow: flowNodes.length,
    component: componentNodes.length,
  };

  const handleTabClick = (tabId: TreeType | 'prototype') => {
    if (tabId === 'prototype') {
      setPhase('prototype');
      setActiveTree(null);
      return;
    }
    // Guard: only allow selecting 'flow' tab when phase >= 'flow'
    const tabIdx = PHASE_ORDER.indexOf(tabId as Phase);
    if (tabIdx > phaseIdx) {
      // Tab not yet unlocked by phase — do nothing
      return;
    }
    setActiveTree(tabId as TreeType);
    onTabChange?.(tabId as TreeType);
  };

  return (
    <div className={styles.tabBar} role="tablist" aria-label="三树切换">
      {TABS.map((tab) => {
        const tabIdx = PHASE_ORDER.indexOf(tab.id as Phase);
        const isLocked = tab.id !== 'prototype' && tabIdx > phaseIdx;
        const isActive =
          tab.id === 'prototype'
            ? phase === 'prototype'
            : activeTree === tab.id || (activeTree === null && tab.id === 'context');

        let badge: React.ReactNode = null;
        if (tab.id !== 'prototype' && counts[tab.id as TreeType] > 0) {
          badge = <span className={styles.tabCount}>{counts[tab.id as TreeType]}</span>;
        }
        if (tab.id === 'prototype' && prototypeCount > 0) {
          badge = <span className={styles.tabCount}>{prototypeCount}</span>;
        }

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-disabled={isLocked}
            disabled={isLocked}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''} ${isLocked ? styles.tabLocked : ''}`}
            onClick={() => handleTabClick(tab.id)}
            title={isLocked ? `需先完成上一阶段` : `切换到 ${tab.label} 树`}
          >
            <span className={styles.tabEmoji}>{tab.emoji}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
            {badge}
          </button>
        );
      })}
    </div>
  );
}
