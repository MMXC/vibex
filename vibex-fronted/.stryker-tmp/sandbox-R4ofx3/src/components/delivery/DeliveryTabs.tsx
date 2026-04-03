/**
 * DeliveryTabs - 交付中心标签页切换组件
 */
// @ts-nocheck


'use client';

import React from 'react';
import { useDeliveryStore, type DeliveryTab } from '@/stores/deliveryStore';
import styles from './delivery.module.css';

const TABS: { id: DeliveryTab; label: string; icon: string }[] = [
  { id: 'contexts', label: '限界上下文', icon: '🏛️' },
  { id: 'flows', label: '流程文档', icon: '📋' },
  { id: 'components', label: '组件清单', icon: '🧩' },
  { id: 'prd', label: 'PRD', icon: '📄' },
];

export function DeliveryTabs() {
  const { activeTab, setActiveTab } = useDeliveryStore();

  return (
    <div className={styles.tabs}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className={styles.tabIcon}>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
