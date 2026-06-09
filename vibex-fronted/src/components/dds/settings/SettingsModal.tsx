/**
 * SettingsModal.tsx — E4 (Sprint80): 画布设置中心
 *
 * 统一设置入口模态框，4个Tab：
 * - 快捷键：ShortcutSettingsPanel
 * - 画布：CanvasSettingsPanel
 * - 通知：NotificationPreferencesPanel
 * - 性能：PerformanceSettings
 *
 * 关闭时自动保存 lastOpenedTab 到 settingsStore
 */
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useSettingsStore } from '@/stores/dds/settingsStore';
import { ShortcutSettingsPanel } from '@/components/dds/shortcuts/ShortcutSettingsPanel';
import { CanvasSettingsPanel } from '@/components/dds/settings/CanvasSettingsPanel';
import { NotificationPreferencesPanel } from '@/components/dds/notifications/NotificationPreferencesPanel';
import { PerformanceSettings } from '@/components/dds/settings/PerformanceSettings';
import styles from './SettingsModal.module.css';

type TabId = 'shortcuts' | 'canvas' | 'notifications' | 'performance';

const TABS: { id: TabId; label: string }[] = [
  { id: 'shortcuts', label: '快捷键' },
  { id: 'canvas', label: '画布' },
  { id: 'notifications', label: '通知' },
  { id: 'performance', label: '性能' },
];

export interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const lastOpenedTab = useSettingsStore((s) => s.lastOpenedTab);
  const setLastOpenedTab = useSettingsStore((s) => s.setLastOpenedTab);

  // E4: Restore last opened tab; default to shortcuts
  const [activeTab, setActiveTab] = useState<TabId>(
    (lastOpenedTab as TabId) ?? 'shortcuts'
  );

  // Sync from store when modal opens
  useEffect(() => {
    if (open && lastOpenedTab) {
      setActiveTab(lastOpenedTab as TabId);
    }
  }, [open, lastOpenedTab]);

  const handleTabChange = useCallback(
    (tabId: TabId) => {
      setActiveTab(tabId);
      setLastOpenedTab(tabId);
    },
    [setLastOpenedTab]
  );

  const handleClose = useCallback(() => {
    setLastOpenedTab(activeTab);
    onClose();
  }, [activeTab, setLastOpenedTab, onClose]);

  // Keyboard close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="设置中心"
      data-testid="settings-modal"
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>设置中心</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="关闭"
            data-testid="settings-modal-close"
          >
            <svg
              width="20"
              height="20"
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

        {/* Tab bar */}
        <div className={styles.tabBar} role="tablist" aria-label="设置分类">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`settings-tab-${tab.id}`}
              id={`settings-tab-btn-${tab.id}`}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => handleTabChange(tab.id)}
              data-testid={`settings-tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className={styles.content}>
          {/* Tab 1: Shortcuts */}
          <div
            role="tabpanel"
            id={`settings-tab-shortcuts`}
            aria-labelledby={`settings-tab-btn-shortcuts`}
            hidden={activeTab !== 'shortcuts'}
            className={styles.tabPanel}
            data-testid="settings-tabpanel-shortcuts"
          >
            <ShortcutSettingsPanel onClose={handleClose} />
          </div>

          {/* Tab 2: Canvas */}
          <div
            role="tabpanel"
            id={`settings-tab-canvas`}
            aria-labelledby={`settings-tab-btn-canvas`}
            hidden={activeTab !== 'canvas'}
            className={styles.tabPanel}
            data-testid="settings-tabpanel-canvas"
          >
            <CanvasSettingsPanel isOpen={activeTab === 'canvas'} onClose={handleClose} />
          </div>

          {/* Tab 3: Notifications */}
          <div
            role="tabpanel"
            id={`settings-tab-notifications`}
            aria-labelledby={`settings-tab-btn-notifications`}
            hidden={activeTab !== 'notifications'}
            className={styles.tabPanel}
            data-testid="settings-tabpanel-notifications"
          >
            <NotificationPreferencesPanel
              isOpen={activeTab === 'notifications'}
              onClose={handleClose}
            />
          </div>

          {/* Tab 4: Performance */}
          <div
            role="tabpanel"
            id={`settings-tab-performance`}
            aria-labelledby={`settings-tab-btn-performance`}
            hidden={activeTab !== 'performance'}
            className={styles.tabPanel}
            data-testid="settings-tabpanel-performance"
          >
            <PerformanceSettings />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
