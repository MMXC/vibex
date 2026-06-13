/**
 * ExportProfilesSettingsTab.tsx — S95-E4: Export Profile Templates
 *
 * Settings tab wrapper for the ExportProfilePanel component.
 * Reads canvasId from DDSCanvasStore and renders ExportProfilePanel inside the settings drawer.
 */
'use client';

import React from 'react';
import { ExportProfilePanel } from '@/components/dds/export/ExportProfilePanel';
import { useDDSCanvasStore } from '@/stores/dds/DDSCanvasStore';
import { useExportProfileStore } from '@/stores/exportProfileStore';
import styles from './AuditLogSettingsTab.module.css';

export function ExportProfilesSettingsTab() {
  const canvasId = useDDSCanvasStore ? useDDSCanvasStore.getState().projectId : '';
  const isPanelOpen = useExportProfileStore((s) => s.isPanelOpen);

  if (!canvasId) {
    return (
      <div className={styles.emptyState}>
        <p style={{ color: '#64748b', fontSize: 13 }}>加载中...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <ExportProfilePanel canvasId={canvasId} />
    </div>
  );
}
