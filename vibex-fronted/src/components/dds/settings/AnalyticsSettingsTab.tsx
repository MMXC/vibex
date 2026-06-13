/**
 * AnalyticsSettingsTab.tsx — S95-E1: Canvas Analytics Dashboard
 *
 * Settings tab wrapper for the AnalyticsDashboard component.
 * Reads canvasId from DDSCanvasStore and renders AnalyticsDashboard inside the settings drawer.
 */
'use client';

import React, { useEffect } from 'react';
import { AnalyticsDashboard } from '@/components/dds/AnalyticsDashboard';
import { useDDSCanvasStore } from '@/stores/dds/DDSCanvasStore';
import styles from './AuditLogSettingsTab.module.css';

export function AnalyticsSettingsTab() {
  const canvasId = useDDSCanvasStore ? useDDSCanvasStore.getState().projectId : '';

  useEffect(() => {
    // Ensure the settings drawer knows analytics is a valid tab
  }, []);

  if (!canvasId) {
    return (
      <div className={styles.emptyState}>
        <p style={{ color: '#64748b', fontSize: 13 }}>加载中...</p>
      </div>
    );
  }

  return <AnalyticsDashboard canvasId={canvasId} />;
}
