/**
 * CanvasSettingsDrawer.tsx — Canvas Settings Drawer
 * S70-E5: 画布设置面板完善
 * S75-E5: 新增「快照管理」Tab
 *
 * 侧边抽屉，5 tabs: 预设 / 画布 / 节点 / 快照管理 / 协作
 */
'use client';

import React, { useState, useEffect } from 'react';
import { ViewPresetsTab } from './ViewPresetsTab';
import { BackgroundSettings } from './BackgroundSettings';
import { GridSettings } from './GridSettings';
import { ZoomSettings } from './ZoomSettings';
import { SnapshotManagerPanel } from '@/components/dds/history/SnapshotManagerPanel';
import styles from './CanvasSettingsDrawer.module.css';

type TabId = 'presets' | 'canvas' | 'nodes' | 'snapshots' | 'collaboration';

const TABS: { id: TabId; label: string }[] = [
  { id: 'presets', label: '预设' },
  { id: 'canvas', label: '画布' },
  { id: 'nodes', label: '节点' },
  { id: 'snapshots', label: '快照管理' },
  { id: 'collaboration', label: '协作' },
];

/** Placeholder for node-specific settings (future extension) */
function NodeSettingsPlaceholder() {
  return (
    <div className={styles.placeholder}>
      <p style={{ color: '#64748b', fontSize: 13 }}>节点设置待实现</p>
    </div>
  );
}

interface CanvasSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CanvasSettingsDrawer({ isOpen, onClose }: CanvasSettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabId>('presets');

  // E5.4: ESC 键盘关闭抽屉
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="画布设置"
    >
      <div
        className={styles.drawer}
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>画布设置</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="关闭"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab list */}
        <div className={styles.tabs} role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className={styles.content} role="tabpanel">
          {activeTab === 'presets' && <ViewPresetsTab />}
          {activeTab === 'canvas' && (
            <>
              <BackgroundSettings />
              <GridSettings />
              <ZoomSettings />
            </>
          )}
          {activeTab === 'nodes' && <NodeSettingsPlaceholder />}
          {activeTab === 'snapshots' && <SnapshotManagerPanel />}
          {activeTab === 'collaboration' && (
            <div style={{ padding: 16 }}>
              <p style={{ color: '#64748b', fontSize: 13 }}>协作设置待实现</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
