/**
 * BatchExportCard — UI for batch component export to ZIP
 * E5: 多文件组件导出
 */

'use client';

import React, { useCallback, useState } from 'react';
import styles from './BatchExportCard.module.css';

interface ComponentInfo {
  id: string;
  name: string;
  selected: boolean;
}

interface BatchExportCardProps {
  projectId: string;
  components: ComponentInfo[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

type State = 'idle' | 'exporting' | 'success' | 'error';

export function BatchExportCard({ projectId, components, onSelectionChange }: BatchExportCardProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      onSelectionChange?.(Array.from(next));
      return next;
    });
  }, [onSelectionChange]);

  const handleSelectAll = useCallback(() => {
    const allIds = components.map((c) => c.id);
    setSelectedIds(new Set(allIds));
    onSelectionChange?.(allIds);
  }, [components, onSelectionChange]);

  const handleSelectNone = useCallback(() => {
    setSelectedIds(new Set());
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  const handleExport = useCallback(async () => {
    if (selectedIds.size === 0) {
      setError('Please select at least one component');
      return;
    }

    if (selectedIds.size > 100) {
      setError('Maximum 100 components per export');
      return;
    }

    setState('exporting');
    setError(null);
    setSuccessMsg(null);

    try {
      // Get auth token
      const { getAuthToken } = await import('@/lib/auth-token');
      const token = getAuthToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.vibex.top';

      const res = await fetch(`${apiBase}/v1/projects/batch-export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId,
          componentIds: Array.from(selectedIds),
          format: 'json',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const result = await res.json();

      if (result.success) {
        // In MVP, download base64 ZIP. Production would use signed URL.
        if (result.zipData) {
          // Convert base64 to blob and download
          const zipBuffer = Uint8Array.from(atob(result.zipData), (c) => c.charCodeAt(0));
          const blob = new Blob([zipBuffer], { type: 'application/zip' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `batch-export-${projectId}.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          setState('success');
          setSuccessMsg(
            `Exported ${result.componentCount} components (${(result.sizeBytes / 1024).toFixed(1)}KB) as ZIP`
          );
        } else if (result.downloadUrl) {
          // Production: use signed URL
          window.open(result.downloadUrl, '_blank');
          setState('success');
          setSuccessMsg(`Exported ${result.componentCount} components — link expires in 5 min`);
        }
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  }, [projectId, selectedIds]);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Batch Export</h3>
        <div className={styles.headerActions}>
          <button className={styles.smallBtn} onClick={handleSelectAll} type="button">
            Select All
          </button>
          <button className={styles.smallBtn} onClick={handleSelectNone} type="button">
            Select None
          </button>
        </div>
      </div>

      {/* Component list */}
      <div className={styles.componentList} role="list">
        {components.length === 0 ? (
          <div className={styles.emptyState}>No components available</div>
        ) : (
          components.map((c) => (
            <label key={c.id} className={styles.componentItem} role="listitem">
              <input
                type="checkbox"
                checked={selectedIds.has(c.id)}
                onChange={() => handleToggle(c.id)}
                className={styles.checkbox}
                aria-label={`Select ${c.name}`}
              />
              <span className={styles.componentName}>{c.name}</span>
            </label>
          ))
        )}
      </div>

      {/* Selection info */}
      <div className={styles.selectionInfo}>
        {selectedIds.size} of {components.length} selected
        {selectedIds.size > 100 && (
          <span className={styles.limitWarning}> (max 100)</span>
        )}
      </div>

      {/* Export button */}
      <button
        className={styles.exportBtn}
        onClick={handleExport}
        disabled={state === 'exporting' || selectedIds.size === 0 || selectedIds.size > 100}
        aria-label="Export selected components as ZIP"
      >
        {state === 'exporting' ? 'Exporting...' : `Export ${selectedIds.size} as ZIP`}
      </button>

      {/* Messages */}
      {error && (
        <div className={styles.errorMsg} role="alert">
          ❌ {error}
        </div>
      )}
      {successMsg && (
        <div className={styles.successMsg} role="status">
          ✅ {successMsg}
        </div>
      )}
    </div>
  );
}