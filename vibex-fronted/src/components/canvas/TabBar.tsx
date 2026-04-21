/**
 * TabBar — 三树 Tab 切换器（含 prototype tab）
 *
 * Epic: canvas-three-tree-unification
 * E1 S1.1: 新增 prototype tab
 * E1 S1.2: Tab 切换时三树数据全部保留（不卸载）
 * E4: Phase 对齐 — Phase1 仅显示"输入/澄清"相关 tabs
 */

import React from 'react';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import { useSessionStore } from '@/lib/canvas/stores/sessionStore';
import type { TreeType, Phase, PrototypePage } from '@/lib/canvas/types';
import styles from './TabBar.module.css';

/** 全部 tab 定义 */
const TABS: { id: TreeType | 'prototype'; label: string; emoji: string }[] = [
  { id: 'context', label: '上下文', emoji: '🔵' },
  { id: 'flow', label: '流程', emoji: '🔀' },
  { id: 'component', label: '组件', emoji: '🧩' },
  { id: 'prototype', label: '原型', emoji: '🚀' },
];

/** Phase → 可见 tabs 映射（E4: TabBar Phase 对齐） */
const PHASE_TABS: Record<Phase, Array<TreeType | 'prototype'>> = {
  input: ['context'],
  context: ['context', 'flow'],
  flow: ['context', 'flow'],
  component: ['context', 'flow', 'component'],
  prototype: ['context', 'flow', 'component', 'prototype'],
};

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

  const visibleTabs = PHASE_TABS[phase] ?? PHASE_TABS['context'];

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
    // E4: 点击 tab → 同步 phase（PhaseNavigator 对称）
    const phaseMap: Record<TreeType, Phase> = {
      context: 'context',
      flow: 'flow',
      component: 'component',
    };
    const newPhase = phaseMap[tabId as TreeType];
    if (newPhase && newPhase !== phase) {
      setPhase(newPhase);
    }
    setActiveTree(tabId as TreeType);
    onTabChange?.(tabId as TreeType);
  };

  return (
    <div className={styles.tabBar} role="tablist" aria-label="三树切换">
      {visibleTabs.map((tabId) => {
        const tabMeta = TABS.find((t) => t.id === tabId)!;
        const isActive =
          tabId === 'prototype'
            ? phase === 'prototype'
            : activeTree === tabId || (activeTree === null && tabId === 'context');

        let badge: React.ReactNode = null;
        if (tabId !== 'prototype' && counts[tabId as TreeType] > 0) {
          badge = <span className={styles.tabCount}>{counts[tabId as TreeType]}</span>;
        }
        if (tabId === 'prototype' && prototypeCount > 0) {
          badge = <span className={styles.tabCount}>{prototypeCount}</span>;
        }

        return (
          <button
            key={tabId}
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            onClick={() => handleTabClick(tabId)}
            title={`切换到 ${tabMeta.label} 树`}
          >
            <span className={styles.tabEmoji}>{tabMeta.emoji}</span>
            <span className={styles.tabLabel}>{tabMeta.label}</span>
            {badge}
          </button>
        );
      })}
    </div>
  );
}