/**
 * CanvasSettingsPanel.tsx — Canvas Settings Tab Panel
 * S65-E3: Canvas View Personalization Settings Panel
 *
 * Tab 1 — 背景：BackgroundSettings
 * Tab 2 — 网格：GridSettings
 * Tab 3 — 缩放：ZoomSettings
 * Tab 4 — 快捷键：ShortcutSettingsPanel (existing, S52-E5)
 */
'use client';

import React, { useState, useCallback } from 'react';
import { useSettingsStore } from '@/stores/dds/settingsStore';
import { BackgroundSettings } from './BackgroundSettings';
import { GridSettings } from './GridSettings';
import { ZoomSettings } from './ZoomSettings';
import { ShortcutSettingsPanel } from '@/components/dds/shortcuts/ShortcutSettingsPanel';
import { ViewPresetsTab } from './ViewPresetsTab';
import styles from './CanvasSettingsPanel.module.css';

type TabId = 'background' | 'grid' | 'zoom' | 'shortcuts' | 'presets';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'background', label: '背景' },
  { id: 'grid', label: '网格' },
  { id: 'zoom', label: '缩放' },
  { id: 'shortcuts', label: '快捷键' },
  { id: 'presets', label: '预设' },
];

interface CanvasSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CanvasSettingsPanel({ isOpen, onClose }: CanvasSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('background');
  const reset = useSettingsStore((s) => s.reset);

  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
  }, []);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="画布设置">
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>画布设置</h2>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.resetButton}
              onClick={handleReset}
              aria-label="恢复默认设置"
            >
              恢复默认
            </button>
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="关闭设置面板"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
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

        {/* Tab Content */}
        <div className={styles.content} role="tabpanel">
          {activeTab === 'background' && <BackgroundSettings />}
          {activeTab === 'grid' && <GridSettings />}
          {activeTab === 'zoom' && <ZoomSettings />}
          {activeTab === 'shortcuts' && (
            <ShortcutSettingsPanel onClose={() => setActiveTab('background')} />
          )}
          {activeTab === 'presets' && <ViewPresetsTab />}
        </div>
      </div>
    </div>
  );
}
