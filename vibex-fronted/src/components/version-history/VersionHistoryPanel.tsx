'use client';

/**
 * VersionHistoryPanel — S16-P2-1 Canvas Version History
 *
 * Features:
 * - Lists auto-save vs manual-save snapshots
 * - Auto-save: subtle/grey style
 * - Manual: highlighted with accent
 * - Restore with confirmation
 * - projectId=null guide UI with CTA
 */

import React, { useCallback, useState } from 'react';
import type { Snapshot } from '@/hooks/useVersionHistory';
import styles from './VersionHistoryPanel.module.css';

// ============================================================================
// Types
// ============================================================================

interface VersionHistoryPanelProps {
  /** All snapshots */
  snapshots: Snapshot[];
  /** Current project ID */
  projectId: string | null;
  /** Whether restore is in progress */
  isRestoring: boolean;
  /** Restore handler */
  onRestore: (id: string) => void;
  /** Delete handler */
  onDelete: (id: string) => void;
  /** Create manual snapshot */
  onCreateManual: () => void;
  /** Close panel */
  onClose: () => void;
}

// ============================================================================
// Sub-components
// ============================================================================

function SnapshotItem({
  snapshot,
  isRestoring,
  onRestore,
  onDelete,
}: {
  snapshot: Snapshot;
  isRestoring: boolean;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isManual = snapshot.type === 'manual';
  const timeAgo = formatTimeAgo(snapshot.timestamp);

  return (
    <div
      className={`${styles.snapshotItem} ${isManual ? styles['snapshotItem--manual'] : styles['snapshotItem--auto']}`}
      data-testid={`snapshot-${snapshot.id}`}
      data-type={snapshot.type}
    >
      <div className={styles.snapshotIcon} aria-hidden="true">
        {isManual ? '📌' : '⏱️'}
      </div>
      <div className={styles.snapshotInfo}>
        <span className={styles.snapshotLabel}>
          {snapshot.label ?? (isManual ? 'Manual snapshot' : `Auto-saved ${timeAgo}`)}
        </span>
        <span className={styles.snapshotTime} data-testid={`snapshot-time-${snapshot.id}`}>
          {timeAgo}
        </span>
      </div>
      <div className={styles.snapshotActions}>
        <button
          type="button"
          className={styles.restoreBtn}
          onClick={() => onRestore(snapshot.id)}
          disabled={isRestoring}
          data-testid={`restore-btn-${snapshot.id}`}
          aria-label={`Restore snapshot from ${timeAgo}`}
        >
          {isRestoring ? '...' : 'Restore'}
        </button>
        <button
          type="button"
          className={styles.deleteBtn}
          onClick={() => onDelete(snapshot.id)}
          data-testid={`delete-btn-${snapshot.id}`}
          aria-label={`Delete snapshot from ${timeAgo}`}
        >
          🗑
        </button>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ============================================================================
// Component
// ============================================================================

export function VersionHistoryPanel({
  snapshots,
  projectId,
  isRestoring,
  onRestore,
  onDelete,
  onCreateManual,
  onClose,
}: VersionHistoryPanelProps) {
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);

  const handleRestoreClick = useCallback((id: string) => {
    setConfirmRestoreId(id);
  }, []);

  const handleConfirmRestore = useCallback(() => {
    if (confirmRestoreId) {
      onRestore(confirmRestoreId);
      setConfirmRestoreId(null);
    }
  }, [confirmRestoreId, onRestore]);

  const handleCancelRestore = useCallback(() => {
    setConfirmRestoreId(null);
  }, []);

  // projectId=null guide UI
  if (projectId === null) {
    return (
      <div className={styles.panel} data-testid="version-history-panel">
        <div className={styles.header}>
          <h2 className={styles.title} data-testid="panel-title">Version History</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            data-testid="panel-close"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className={styles.noProjectGuide} data-testid="no-project-guide">
          <div className={styles.guideIcon}>ℹ️</div>
          <h3 className={styles.guideTitle}>Version history requires a project</h3>
          <p className={styles.guideText}>
            Create or open a project to enable automatic snapshots and manual saves.
          </p>
          <button
            type="button"
            className={styles.ctaBtn}
            data-testid="create-project-cta"
          >
            Create Project
          </button>
        </div>
      </div>
    );
  }

  const autoSnapshots = snapshots.filter((s) => s.type === 'auto');
  const manualSnapshots = snapshots.filter((s) => s.type === 'manual');

  return (
    <div className={styles.panel} data-testid="version-history-panel">
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title} data-testid="panel-title">Version History</h2>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.snapshotBtn}
            onClick={onCreateManual}
            data-testid="create-manual-snapshot"
          >
            + Save
          </button>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            data-testid="panel-close"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Snapshot list */}
      <div className={styles.list} data-testid="snapshot-list">
        {/* Manual snapshots section */}
        {manualSnapshots.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle} data-testid="manual-section">
              Manual Snapshots
            </h3>
            {manualSnapshots.map((s) => (
              <SnapshotItem
                key={s.id}
                snapshot={s}
                isRestoring={isRestoring}
                onRestore={handleRestoreClick}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}

        {/* Auto-save snapshots section */}
        {autoSnapshots.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle} data-testid="auto-section">
              Auto-saved
            </h3>
            {autoSnapshots.map((s) => (
              <SnapshotItem
                key={s.id}
                snapshot={s}
                isRestoring={isRestoring}
                onRestore={handleRestoreClick}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {snapshots.length === 0 && (
          <div className={styles.emptyState} data-testid="empty-state">
            <p>No snapshots yet.</p>
            <p className={styles.emptyHint}>
              Changes are auto-saved every 30s. Click "Save" to create a manual snapshot.
            </p>
          </div>
        )}
      </div>

      {/* Restore confirmation dialog */}
      {confirmRestoreId && (
        <div className={styles.confirmOverlay} data-testid="confirm-overlay">
          <div className={styles.confirmDialog} data-testid="confirm-dialog">
            <h3 className={styles.confirmTitle}>Restore Snapshot?</h3>
            <p className={styles.confirmText}>
              Your current canvas state will be backed up before restoring.
              This cannot be undone.
            </p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={handleCancelRestore}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmBtn}
                onClick={handleConfirmRestore}
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
