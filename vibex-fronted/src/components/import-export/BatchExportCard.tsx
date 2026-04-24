/**
 * BatchExportCard — UI for batch component export to ZIP
 * EpicE5-U6: 四态覆盖（理想/空/加载/错误）+ Toast + 5min 倒计时
 */

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
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

function CountdownTimer({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const [remaining, setRemaining] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const target = new Date(expiresAt).getTime();
    const tick = () => {
      const left = Math.max(0, Math.floor((target - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
        onExpire();
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [expiresAt, onExpire]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return (
    <span className={styles.countdown} role="timer" aria-live="polite">
      {mins > 0 ? `${mins}m ` : ''}{secs}s
    </span>
  );
}

export function BatchExportCard({ projectId, components, onSelectionChange }: BatchExportCardProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [state, setState] = useState<State>('idle');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
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
      showToast('请至少选择一个组件', 'error');
      return;
    }
    if (selectedIds.size > 100) {
      showToast('单次最多导出 100 个组件', 'error');
      return;
    }

    setState('exporting');
    setExpiresAt(null);

    try {
      const { getAuthToken } = await import('@/lib/auth-token');
      const token = getAuthToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.vibex.top';

      const res = await fetch(`${apiBase}/v1/projects/batch-export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ projectId, componentIds: Array.from(selectedIds), format: 'json' }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const result = await res.json();

      if (result.success) {
        if (result.zipData) {
          // Dev fallback: embedded base64 ZIP
          const zipBuffer = Uint8Array.from(atob(result.zipData), (c) => c.charCodeAt(0));
          const blob = new Blob([zipBuffer], { type: 'application/zip' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = `batch-export-${projectId}.zip`;
          document.body.appendChild(a); a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setState('success');
          showToast(`已导出 ${result.componentCount} 个组件（${(result.sizeBytes / 1024).toFixed(1)}KB）`, 'success');
        } else if (result.downloadUrl) {
          window.open(result.downloadUrl, '_blank');
          setState('success');
          setExpiresAt(result.expiresAt);
          showToast(`已导出 ${result.componentCount} 个组件`, 'success');
        }
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (err) {
      setState('error');
      showToast(err instanceof Error ? err.message : '导出失败，请重试', 'error');
    }
  }, [projectId, selectedIds, showToast]);

  const handleExpire = useCallback(() => {
    setExpiresAt(null);
    showToast('下载链接已过期，请重新导出', 'warning');
  }, [showToast]);

  const isEmpty = components.length === 0;
  const isExporting = state === 'exporting';

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>批量导出</h3>
        {!isEmpty && (
          <div className={styles.headerActions}>
            <button className={styles.smallBtn} onClick={handleSelectAll} type="button">全选</button>
            <button className={styles.smallBtn} onClick={handleSelectNone} type="button">清空</button>
          </div>
        )}
      </div>

      {isEmpty ? (
        <div className={styles.emptyState} role="status">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>选择组件后导出</span>
        </div>
      ) : (
        <>
          <div className={styles.componentList} role="list">
            {components.map((c) => (
              <label key={c.id} className={styles.componentItem} role="listitem">
                <input
                  type="checkbox"
                  checked={selectedIds.has(c.id)}
                  onChange={() => handleToggle(c.id)}
                  className={styles.checkbox}
                  aria-label={`选择 ${c.name}`}
                />
                <span className={styles.componentName}>{c.name}</span>
              </label>
            ))}
          </div>
          <div className={styles.selectionInfo}>
            已选 {selectedIds.size} / {components.length}
            {selectedIds.size > 100 && <span className={styles.limitWarning}>（最多 100 个）</span>}
          </div>
        </>
      )}

      <button
        className={styles.exportBtn}
        onClick={handleExport}
        disabled={isExporting || isEmpty || selectedIds.size === 0 || selectedIds.size > 100}
        aria-label="导出选中的组件为 ZIP"
      >
        {isExporting ? (
          <><span className={styles.spinner} aria-hidden="true" />导出中...</>
        ) : isEmpty ? (
          '无可导出组件'
        ) : selectedIds.size === 0 ? (
          '请选择组件'
        ) : (
          `导出 ${selectedIds.size} 个组件`
        )}
      </button>

      {state === 'success' && expiresAt && (
        <div className={styles.successMsg} role="status">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>下载链接有效期还剩 <CountdownTimer expiresAt={expiresAt} onExpire={handleExpire} /></span>
        </div>
      )}

      {state === 'error' && (
        <button className={styles.retryBtn} onClick={() => setState('idle')} type="button">
          重试导出
        </button>
      )}
    </div>
  );
}
