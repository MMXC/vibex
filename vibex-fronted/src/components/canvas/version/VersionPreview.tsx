/**
 * VersionPreview.tsx — Sprint93 E1: Canvas Version History
 *
 * Modal dialog showing a read-only preview of a canvas version snapshot.
 * Displays version metadata and the serialized canvas state as a simple read-only view.
 */
'use client';

import React from 'react';
import { useVersionStore } from '@/stores/versionStore';
import type { CanvasVersion } from '@/stores/versionStore';
import styles from './VersionPreview.module.css';

interface VersionPreviewProps {
  canvasId: string;
  onRestore?: (version: CanvasVersion) => void;
}

function formatDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SnapshotPreview({ snapshotData }: { snapshotData: string }) {
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(snapshotData);
  } catch {
    parsed = null;
  }

  if (!parsed) {
    return (
      <div className={styles.canvasPlaceholder}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>无法解析快照数据</span>
      </div>
    );
  }

  const nodes = (parsed.nodes as unknown[] | undefined) ?? [];
  const edges = (parsed.edges as unknown[] | undefined) ?? [];

  return (
    <div className={styles.canvasPlaceholder}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary, #00ffff)' }}>
            {nodes.length}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted, #9a9a9a)' }}>节点</div>
        </div>
        <div style={{ width: '1px', height: '2rem', background: 'var(--color-border, rgba(255,255,255,0.1))' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-accent, #8b5cf6)' }}>
            {edges.length}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted, #9a9a9a)' }}>连线</div>
        </div>
      </div>
      <span style={{ color: 'var(--color-text-muted, #9a9a9a)', fontSize: '0.8125rem' }}>
        只读预览模式 — 点击「恢复」切换到该版本
      </span>
    </div>
  );
}

export function VersionPreview({ canvasId, onRestore }: VersionPreviewProps) {
  const { previewVersionId, versionsByCanvas, isLoading, restoreVersion, setPreviewVersion } = useVersionStore();
  const [isRestoring, setIsRestoring] = React.useState(false);

  const versions = versionsByCanvas[canvasId] ?? [];
  const selectedVersion = versions.find((v) => v.id === previewVersionId) ?? null;

  const handleClose = React.useCallback(() => {
    setPreviewVersion(null);
  }, [setPreviewVersion]);

  const handleOverlayClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) handleClose();
    },
    [handleClose]
  );

  const handleRestore = React.useCallback(async () => {
    if (!selectedVersion) return;
    setIsRestoring(true);
    onRestore?.(selectedVersion);
    await restoreVersion(selectedVersion.id);
    setIsRestoring(false);
    setPreviewVersion(null);
  }, [selectedVersion, restoreVersion, onRestore, setPreviewVersion]);

  // Close on Escape key
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleClose]);

  if (!selectedVersion) return null;

  const isLatest = versions.length > 0 && selectedVersion.versionNumber === versions[0]!.versionNumber;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`版本 v${selectedVersion.versionNumber} 预览`}
      onClick={handleOverlayClick}
    >
      <div className={styles.dialog}>
        <div className={styles.header}>
          <div className={styles.title}>
            <h2 className={styles.titleText}>
              版本 v{selectedVersion.versionNumber}
              {isLatest && (
                <span style={{ marginLeft: '0.5rem', fontSize: '0.6875rem', color: 'var(--color-green, #00ff88)', fontWeight: 400 }}>
                  当前版本
                </span>
              )}
            </h2>
            <span className={styles.subtitle}>
              {selectedVersion.description ?? '无描述'}
            </span>
          </div>
          <div className={styles.headerActions}>
            {!isLatest && (
              <button
                className={styles.restoreConfirmBtn}
                onClick={handleRestore}
                disabled={isRestoring || isLoading}
              >
                {isRestoring ? '恢复中…' : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <polyline points="1,4 1,10 7,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3.51 15a9 9 0 1 0 .49-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    恢复此版本
                  </>
                )}
              </button>
            )}
            <button className={styles.closeBtn} onClick={handleClose} aria-label="关闭预览">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className={styles.canvasContainer}>
          <div className={styles.previewBadge}>只读预览</div>
          <SnapshotPreview snapshotData={selectedVersion.snapshotData} />
        </div>

        <div className={styles.footer}>
          <div className={styles.versionInfo}>
            <span>创建于</span>
            <strong>{formatDate(selectedVersion.createdAt)}</strong>
            {selectedVersion.createdBy && (
              <>
                <span>·</span>
                <span>by {selectedVersion.createdBy}</span>
              </>
            )}
          </div>
          {!isLatest && (
            <span className={styles.restoreHint}>
              点击「恢复此版本」切换画布到该版本
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
