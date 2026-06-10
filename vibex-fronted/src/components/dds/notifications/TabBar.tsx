'use client';

/**
 * TabBar — S75-E2: notification通知专用Tab
 *
 * 可复用的 TabBar 组件，支持：
 * - 固定 Tab 列表 + 可选 badge 计数
 * - aria-selected 高亮
 * - 点击切换
 */
import React, { memo } from 'react';
import styles from './TabBar.module.css';

export interface TabItem {
  key: string;
  label: string;
  badge?: number;
}

export interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

const TabBar = memo(function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <div className={styles.tabBar} role="tablist" aria-label="筛选标签">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={styles.badge} aria-label={`${tab.badge} 条`}>
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});

export default TabBar;
