/**
 * TabBar — 三树 Tab 切换器
 * 
 * S1.1: 新增 Tab 切换栏（context / flow / component 三个 Tab）
 * S1.2: Tab 切换时三树数据全部保留（不卸载 — 面板始终渲染）
 * 
 * Epic: canvas-three-tree-unification
 */
// @ts-nocheck


import React from 'react';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
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
  const activeTree = useCanvasStore((s) => s.activeTree);
  const contextNodes = useCanvasStore((s) => s.contextNodes);
  const flowNodes = useCanvasStore((s) => s.flowNodes);
  const componentNodes = useCanvasStore((s) => s.componentNodes);
  const setActiveTree = useCanvasStore((s) => s.setActiveTree);

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
