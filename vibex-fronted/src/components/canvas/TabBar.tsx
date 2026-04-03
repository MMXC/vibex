/**
 * TabBar — 三树 Tab 切换器
 * 
 * S1.1: 新增 Tab 切换栏（context / flow / component 三个 Tab）
 * S1.2: Tab 切换时三树数据全部保留（不卸载 — 面板始终渲染）
 * 
 * Epic: canvas-three-tree-unification
 */

import React from 'react';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import type { TreeType } from '@/lib/canvas/types';
import styles from './TabBar.module.css';

const TABS: { id: TreeType; label: string; emoji: string }[] = [
  { id: 'context', label: '上下文', emoji: '🔵' },
  { id: 'flow', label: '流程', emoji: '🔀' },
  { id: 'component', label: '组件', emoji: '🧩' },
];

interface TabBarProps {
  /** Callback when tab changes */
  onTabChange?: (tab: TreeType) => void;
}

export function TabBar({ onTabChange }: TabBarProps) {
  const activeTree = useContextStore((s) => s.activeTree);
  const contextNodes = useContextStore((s) => s.contextNodes);
  const flowNodes = useFlowStore((s) => s.flowNodes);
  const componentNodes = useComponentStore((s) => s.componentNodes);
  const setActiveTree = useContextStore((s) => s.setActiveTree);

  const counts = {
    context: contextNodes.length,
    flow: flowNodes.length,
    component: componentNodes.length,
  };

  const handleTabClick = (tabId: TreeType) => {
    setActiveTree(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className={styles.tabBar} role="tablist" aria-label="三树切换">
      {TABS.map((tab) => {
        const isActive = activeTree === tab.id || (activeTree === null && tab.id === 'context');
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            onClick={() => handleTabClick(tab.id)}
            title={`切换到 ${tab.label} 树`}
          >
            <span className={styles.tabEmoji}>{tab.emoji}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
            {counts[tab.id] > 0 && (
              <span className={styles.tabCount}>{counts[tab.id]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
