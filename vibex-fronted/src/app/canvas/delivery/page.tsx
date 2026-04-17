/**
 * Delivery Center Page - 统一交付中心
 * 路由: /canvas/delivery
 */

'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useDeliveryStore } from '@/stores/deliveryStore';
import {
  DeliveryNav,
  DeliveryTabs,
  CanvasBreadcrumb,
  ContextTab,
  FlowTab,
  ComponentTab,
  PRDTab,
} from '@/components/delivery';
import { ArrowLeft, Search, History, Trash2 } from 'lucide-react';
import styles from './delivery.module.css';

export default function DeliveryCenterPage() {
  const {
    activeTab,
    searchQuery,
    setSearchQuery,
    loadMockData,
    exportHistory,
    clearHistory,
  } = useDeliveryStore();

  useEffect(() => {
    loadMockData();
  }, [loadMockData]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatType = (type: string) => {
    const map: Record<string, string> = {
      context: '上下文',
      flow: '流程',
      component: '组件',
      prd: 'PRD',
    };
    return map[type] || type;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'contexts':
        return <ContextTab />;
      case 'flows':
        return <FlowTab />;
      case 'components':
        return <ComponentTab />;
      case 'prd':
        return <PRDTab />;
      default:
        return <ContextTab />;
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/canvas" className={styles.backBtn}>
            <ArrowLeft size={20} />
            返回 Canvas
          </Link>
        </div>
        <h1 className={styles.title}>交付中心</h1>
        <div className={styles.headerRight}>
          <span className={styles.projectInfo}>
            电商系统 v1.0 · 最后更新: 2小时前
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Search Bar */}
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <CanvasBreadcrumb
          items={[
            { label: "Canvas", href: "/canvas" },
            { label: "交付中心" },
          ]}
        />
        <DeliveryNav />
        <DeliveryTabs />

        {/* Tab Content */}
        {renderTabContent()}

        {/* Export History */}
        {exportHistory.length > 0 && (
          <div className={styles.history}>
            <div className={styles.historyHeader}>
              <h3 className={styles.historyTitle}>
                <History size={18} />
                导出历史
              </h3>
              <button
                className={styles.clearHistoryBtn}
                onClick={clearHistory}
              >
                <Trash2 size={14} />
                清空
              </button>
            </div>
            <div className={styles.historyList}>
              {exportHistory.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className={`${styles.historyItem} ${
                    item.status === 'success'
                      ? styles.historyItemSuccess
                      : styles.historyItemError
                  }`}
                >
                  <span className={styles.historyItemName}>
                    {item.name}
                    <span className={styles.historyItemFormat}>
                      .{item.format}
                    </span>
                  </span>
                  <div className={styles.historyItemMeta}>
                    <span>{formatType(item.type)}</span>
                    <span>{formatTime(item.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
