/**
 * CanvasTabBar — Sprint90 E1: Multi-Canvas Tabs
 *
 * Horizontal tab bar rendered at the top of DDSCanvasPage.
 * Each tab shows canvas name + close button.
 * Dirty (unsaved) tabs are marked with a "·" indicator.
 * Dormant tabs are dimmed.
 *
 * Limits:
 * - Up to 8 active tabs; earliest is marked dormant when exceeded
 * - Tabs are sorted by creation time (earliest first)
 */

'use client';

import React, { memo, useCallback, useEffect, useRef } from 'react';
import { useCanvasTabStore } from '@/stores/dds/canvasTabStore';
import type { CanvasTab } from '@/stores/dds/canvasTabStore';
import styles from './CanvasTabBar.module.css';

interface CanvasTabBarProps {
  /** Called when user clicks "+" to open a new canvas tab */
  onNewTab?: () => void;
}

export const CanvasTabBar = memo(function CanvasTabBar({ onNewTab }: CanvasTabBarProps) {
  const tabs = useCanvasTabStore((s) => s.tabs);
  const activeTabId = useCanvasTabStore((s) => s.activeTabId);
  const switchTab = useCanvasTabStore((s) => s.switchTab);
  const closeTab = useCanvasTabStore((s) => s.closeTab);
  const hasDirtyTabs = useCanvasTabStore((s) => s.hasDirtyTabs);

  const barRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Scroll active tab into view
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, [activeTabId]);

  // Register beforeunload handler when there are dirty tabs
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasDirtyTabs()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasDirtyTabs]);

  const handleCloseTab = useCallback((e: React.MouseEvent, tab: CanvasTab) => {
    e.stopPropagation();
    if (tab.isDirty) {
      const confirmed = window.confirm(
        `Tab "${tab.name}" has unsaved changes. Close anyway?`
      );
      if (!confirmed) return;
    }
    closeTab(tab.id);
  }, [closeTab]);

  const handleAddTab = useCallback(() => {
    onNewTab?.();
  }, [onNewTab]);

  // Only show active (non-dormant) tabs in the bar
  const visibleTabs = tabs.filter((t) => !t.dormant);

  if (visibleTabs.length === 0) {
    return null;
  }

  return (
    <div
      ref={barRef}
      className={styles.tabBar}
      role="tablist"
      aria-label="Canvas tabs"
      data-testid="canvas-tab-bar"
    >
      {visibleTabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            ref={isActive ? activeTabRef : undefined}
            role="tab"
            aria-selected={isActive}
            aria-label={`${tab.name}${tab.isDirty ? ' (unsaved)' : ''}`}
            className={`${styles.tab}${isActive ? ` ${styles.tabActive}` : ''}`}
            onClick={() => switchTab(tab.id)}
            title={tab.name}
            data-testid={`canvas-tab-${tab.id}`}
            data-tab-active={isActive}
            data-tab-dirty={tab.isDirty}
          >
            <span className={styles.tabName}>{tab.name}</span>
            {tab.isDirty && (
              <span
                className={styles.dirtyMarker}
                aria-label="Unsaved changes"
                data-testid="dirty-marker"
              >
                ·
              </span>
            )}
            <button
              className={styles.closeBtn}
              onClick={(e) => handleCloseTab(e, tab)}
              aria-label={`Close tab: ${tab.name}`}
              data-testid={`close-tab-${tab.id}`}
              tabIndex={-1}
            >
              ×
            </button>
          </button>
        );
      })}

      {onNewTab && (
        <button
          className={styles.addTabBtn}
          onClick={handleAddTab}
          aria-label="Open new canvas tab"
          data-testid="add-canvas-tab"
          title="Open new canvas tab"
        >
          +
        </button>
      )}

      <div className={styles.tabSpacer} />
    </div>
  );
});
