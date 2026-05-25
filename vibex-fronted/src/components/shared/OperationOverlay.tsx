/**
 * OperationOverlay — Sprint38 P002-E3: Ctrl+H operation overlay
 *
 * Full-screen overlay displaying the operation log (oplog) from oplogStore.
 * Each entry shows: userId badge / action / nodeId / timestamp.
 * Supports filtering by nodeId via a built-in search input.
 * Triggered by Ctrl+H global keyboard shortcut.
 */

'use client';

import React, { memo, useState, useMemo } from 'react';
import styles from './OperationOverlay.module.css';
import { useOplogStore, type OperationEntry } from '@/stores/oplogStore';

export interface OperationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function TypeBadge({ type }: { type: OperationEntry['type'] }) {
  const label =
    type === 'ai' ? '🤖 AI' : type === 'user' ? '👤 User' : '⚙️ System';
  const cls =
    type === 'ai'
      ? styles.badgeAi
      : type === 'user'
      ? styles.badgeUser
      : styles.badgeSystem;
  return <span className={`${styles.badge} ${cls}`}>{label}</span>;
}

export const OperationOverlay = memo(function OperationOverlay({
  isOpen,
  onClose,
}: OperationOverlayProps) {
  const oplog = useOplogStore((s) => s.oplog);
  const [search, setSearch] = useState('');

  const filtered = useMemo<OperationEntry[]>(() => {
    if (!search.trim()) return oplog;
    const q = search.trim().toLowerCase();
    return oplog.filter((e) => e.nodeId.toLowerCase().includes(q));
  }, [oplog, search]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Operation Log"
      data-testid="operation-overlay"
    >
      <div
        className={styles.panel}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.title}>📋 Operation Log</span>
          <div className={styles.headerMeta}>
            <kbd className={styles.kbd}>Ctrl+H</kbd>
            <span className={styles.hint}>to toggle</span>
          </div>
        </div>

        {/* Search */}
        <div className={styles.searchRow}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Filter by nodeId…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            aria-label="Filter operation log by nodeId"
          />
          {search && (
            <span className={styles.searchCount}>
              {filtered.length} / {oplog.length}
            </span>
          )}
        </div>

        {/* List */}
        <div className={styles.list} role="list">
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              {oplog.length === 0
                ? 'No operations recorded yet.'
                : 'No entries match your filter.'}
            </div>
          ) : (
            filtered.map((entry) => (
              <div key={entry.id} className={styles.row} role="listitem">
                <span className={styles.ts}>{formatTimestamp(entry.timestamp)}</span>
                <TypeBadge type={entry.type} />
                <span className={styles.nodeId} title={entry.nodeId}>
                  {entry.nodeId.length > 16
                    ? entry.nodeId.slice(0, 16) + '…'
                    : entry.nodeId}
                </span>
                <span className={styles.action}>{entry.action}</span>
                {entry.diff && (
                  <span className={styles.diffTag} title={entry.diff}>
                    diff
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span>{oplog.length} total entries · newest first</span>
          <span>Press <kbd className={styles.kbdSmall}>Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
});
