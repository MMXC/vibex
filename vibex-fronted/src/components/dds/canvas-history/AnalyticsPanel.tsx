/**
 * AnalyticsPanel.tsx — S71-E4: 画布使用统计分析
 *
 * Analytics tab (Tab5) in HistoryPanel.
 * Shows top-edited nodes, total edit count, per-node breakdown.
 */
'use client';
import React, { useState } from 'react';
import { useCanvasAnalyticsStore } from '@/stores/dds/canvasAnalyticsStore';
import styles from './AnalyticsPanel.module.css';

interface AnalyticsPanelProps {
  /** Canvas ID to show analytics for */
  canvasId: string;
}

export default function AnalyticsPanel({ canvasId }: AnalyticsPanelProps) {
  const getStats = useCanvasAnalyticsStore((s) => s.getStats);
  const getTopNodes = useCanvasAnalyticsStore((s) => s.getTopNodes);
  const exportAnalytics = useCanvasAnalyticsStore((s) => s.exportAnalytics);
  const clearStats = useCanvasAnalyticsStore((s) => s.clearStats);

  const [showAll, setShowAll] = useState(false);

  const stats = getStats(canvasId);
  const topNodes = getTopNodes(canvasId, showAll ? 100 : 10);

  const handleExport = () => {
    const csv = exportAnalytics(canvasId);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${canvasId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.panel} role="tabpanel" aria-label="画布统计分析">
      <div className={styles.header}>
        <h3 className={styles.title}>画布使用统计</h3>
        <div className={styles.actions}>
          <button className={styles.exportBtn} onClick={handleExport}>
            导出 CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className={styles.summary}>
        <div className={styles.card}>
          <span className={styles.cardValue}>{stats.totalEdits}</span>
          <span className={styles.cardLabel}>总编辑次数</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardValue}>{Object.keys(stats.nodeEdits ?? {}).length}</span>
          <span className={styles.cardLabel}>编辑节点数</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardValue}>
            {stats.lastEdit ? new Date(stats.lastEdit).toLocaleDateString('zh-CN') : '—'}
          </span>
          <span className={styles.cardLabel}>最近编辑</span>
        </div>
      </div>

      {/* Top nodes */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>编辑最多的节点</h4>
        {topNodes.length === 0 ? (
          <p className={styles.empty}>暂无编辑数据</p>
        ) : (
          <ol className={styles.nodeList}>
            {topNodes.map((node, i) => (
              <li key={node.nodeId} className={styles.nodeItem}>
                <span className={styles.rank}>#{i + 1}</span>
                <span className={styles.nodeId}>{node.nodeId}</span>
                <span className={styles.editCount}>{node.editCount} 次</span>
                <div
                  className={styles.bar}
                  style={{
                    width: `${(node.editCount / topNodes[0].editCount) * 100}%`,
                  }}
                />
              </li>
            ))}
          </ol>
        )}
      </div>

      {Object.keys(stats.nodeEdits ?? {}).length > 10 && !showAll && (
        <button className={styles.loadMore} onClick={() => setShowAll(true)}>
          显示全部 ({Object.keys(stats.nodeEdits ?? {}).length} 节点)
        </button>
      )}
    </div>
  );
}
