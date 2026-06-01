/**
 * SnapshotDiff — Dual-column diff comparison between current canvas and a snapshot
 *
 * S49-E4: 画布版本历史可视化
 *
 * Features:
 * - Left: selected snapshot (read-only)
 * - Right: current canvas state
 * - Color coding: green = added, red = removed, yellow = modified
 * - Shows node count summary at top
 */

'use client';

import React, { memo } from 'react';
import type { SnapshotCanvasState } from '@/stores/dds/snapshotHistoryStore';
import type { DDSCard, DDSEdge } from '@/types/dds';
import styles from './SnapshotDiff.module.css';

export interface SnapshotDiffProps {
  snapshot: SnapshotCanvasState;
  current: SnapshotCanvasState;
  snapshotLabel?: string;
}

interface DiffEntry {
  type: 'added' | 'removed' | 'unchanged';
  id: string;
  label: string;
  category?: string;
}

function diffNodes(
  snapshotNodes: DDSCard[],
  currentNodes: DDSCard[]
): { snapshotList: DiffEntry[]; currentList: DiffEntry[] } {
  const snapshotMap = new Map(snapshotNodes.map((n) => [n.id, n]));
  const currentMap = new Map(currentNodes.map((n) => [n.id, n]));

  const snapshotList: DiffEntry[] = snapshotNodes.map((n) => {
    if (!currentMap.has(n.id)) {
      return { type: 'removed', id: n.id, label: n.title ?? n.id, category: n.type };
    }
    return { type: 'unchanged', id: n.id, label: n.title ?? n.id, category: n.type };
  });

  const currentList: DiffEntry[] = currentNodes.map((n) => {
    if (!snapshotMap.has(n.id)) {
      return { type: 'added', id: n.id, label: n.title ?? n.id, category: n.type };
    }
    return { type: 'unchanged', id: n.id, label: n.title ?? n.id, category: n.type };
  });

  return { snapshotList, currentList };
}

function diffEdges(
  snapshotEdges: DDSEdge[],
  currentEdges: DDSEdge[]
): { snapshotList: DiffEntry[]; currentList: DiffEntry[] } {
  const snapshotMap = new Map(snapshotEdges.map((e) => [e.id, e]));
  const currentMap = new Map(currentEdges.map((e) => [e.id, e]));

  const snapshotList: DiffEntry[] = snapshotEdges.map((e) => {
    if (!currentMap.has(e.id)) {
      return { type: 'removed', id: e.id, label: e.label ?? e.id };
    }
    return { type: 'unchanged', id: e.id, label: e.label ?? e.id };
  });

  const currentList: DiffEntry[] = currentEdges.map((e) => {
    if (!snapshotMap.has(e.id)) {
      return { type: 'added', id: e.id, label: e.label ?? e.id };
    }
    return { type: 'unchanged', id: e.id, label: e.label ?? e.id };
  });

  return { snapshotList, currentList };
}

function SummaryRow({
  label,
  snapshotCount,
  currentCount,
}: {
  label: string;
  snapshotCount: number;
  currentCount: number;
}) {
  const diff = currentCount - snapshotCount;
  const diffLabel =
    diff === 0 ? '' : diff > 0 ? `+${diff}` : `${diff}`;
  const diffClass =
    diff === 0 ? styles.diffNeutral : diff > 0 ? styles.diffAdded : styles.diffRemoved;

  return (
    <div className={styles.summaryRow}>
      <span className={styles.summaryLabel}>{label}</span>
      <span className={styles.summaryCount}>
        <span>{snapshotCount}</span>
        <span className={styles.arrow}>→</span>
        <span>{currentCount}</span>
        {diffLabel && <span className={`${styles.summaryDiff} ${diffClass}`}>{diffLabel}</span>}
      </span>
    </div>
  );
}

function DiffList({ entries }: { entries: DiffEntry[] }) {
  if (entries.length === 0) {
    return <div className={styles.emptyCol}>— 无 —</div>;
  }
  return (
    <ul className={styles.diffList}>
      {entries.map((entry) => (
        <li
          key={entry.id}
          className={`${styles.diffItem} ${
            entry.type === 'added'
              ? styles.diffItemAdded
              : entry.type === 'removed'
                ? styles.diffItemRemoved
                : styles.diffItemUnchanged
          }`}
          title={entry.id}
        >
          <span className={styles.diffDot} />
          <span className={styles.diffLabel}>{entry.label}</span>
          {entry.category && (
            <span className={styles.diffCategory}>{entry.category}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export const SnapshotDiff = memo(function SnapshotDiff({
  snapshot,
  current,
  snapshotLabel,
}: SnapshotDiffProps) {
  const nodeDiff = diffNodes(snapshot.nodes, current.nodes);
  const edgeDiff = diffEdges(snapshot.edges, current.edges);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <SummaryRow
          label="节点"
          snapshotCount={snapshot.nodes.length}
          currentCount={current.nodes.length}
        />
        <SummaryRow
          label="边"
          snapshotCount={snapshot.edges.length}
          currentCount={current.edges.length}
        />
      </div>

      <div className={styles.columns}>
        <div className={styles.column}>
          <div className={styles.colHeader}>
            <span className={styles.colTitle}>{snapshotLabel ?? '快照版本'}</span>
            <span className={styles.colMeta}>{snapshot.nodes.length} 节点 · {snapshot.edges.length} 边</span>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionLabel}>节点变化</div>
            <DiffList entries={nodeDiff.snapshotList} />
          </div>

          <div className={styles.section}>
            <div className={styles.sectionLabel}>边变化</div>
            <DiffList entries={edgeDiff.snapshotList} />
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.column}>
          <div className={styles.colHeader}>
            <span className={styles.colTitle}>当前版本</span>
            <span className={styles.colMeta}>{current.nodes.length} 节点 · {current.edges.length} 边</span>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionLabel}>节点变化</div>
            <DiffList entries={nodeDiff.currentList} />
          </div>

          <div className={styles.section}>
            <div className={styles.sectionLabel}>边变化</div>
            <DiffList entries={edgeDiff.currentList} />
          </div>
        </div>
      </div>
    </div>
  );
});

export default SnapshotDiff;
