'use client';

/**
 * AnalyticsTrendChart — S72-E4: Analytics 趋势可视化
 *
 * CSS bar chart showing canvas edit history over 7d or 30d.
 * Reads from useCanvasAnalyticsStore.getHistory().
 * No external chart library dependency.
 */

import React, { useState, useMemo } from 'react';
import { useCanvasAnalyticsStore } from '@/stores/dds/canvasAnalyticsStore';
import styles from './AnalyticsTrendChart.module.css';

export type TrendRange = '7d' | '30d';

interface AnalyticsTrendChartProps {
  /** Target canvas ID */
  canvasId: string;
  /** Called when user generates a share link */
  onShare?: (shareId: string) => void;
}

export function AnalyticsTrendChart({ canvasId, onShare }: AnalyticsTrendChartProps) {
  const [range, setRange] = useState<TrendRange>('7d');

  const history = useCanvasAnalyticsStore((s) => s.getHistory(range));
  const shareAnalytics = useCanvasAnalyticsStore((s) => s.shareAnalytics);

  // Build a date-indexed map for display
  const { dates, maxEdits } = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - (range === '7d' ? 7 : 30));

    // Initialize all dates in range with 0
    const map: Record<string, number> = {};
    for (let d = new Date(cutoff); d <= now; d.setDate(d.getDate() + 1)) {
      map[d.toISOString().slice(0, 10)] = 0;
    }

    let max = 0;
    for (const entry of history) {
      if (entry.canvasId === canvasId) {
        map[entry.date] = entry.totalEdits;
        max = Math.max(max, entry.totalEdits);
      }
    }

    return { dates: Object.keys(map).sort(), maxEdits: max };
  }, [history, canvasId, range]);

  const handleShare = () => {
    const shareId = shareAnalytics(canvasId);
    onShare?.(shareId);
  };

  if (dates.length === 0) {
    return (
      <div className={styles.container} data-testid="analytics-trend-chart">
        <div className={styles.empty}>暂无数据</div>
      </div>
    );
  }

  return (
    <div className={styles.container} data-testid="analytics-trend-chart">
      <div className={styles.header}>
        <span className={styles.title}>
          趋势图 {range === '7d' ? '近7天' : '近30天'}
        </span>
        <div className={styles.controls}>
          <button
            className={`${styles.rangeBtn} ${range === '7d' ? styles.active : ''}`}
            onClick={() => setRange('7d')}
            data-testid="range-7d"
          >
            7天
          </button>
          <button
            className={`${styles.rangeBtn} ${range === '30d' ? styles.active : ''}`}
            onClick={() => setRange('30d')}
            data-testid="range-30d"
          >
            30天
          </button>
          <button
            className={styles.shareBtn}
            onClick={handleShare}
            data-testid="share-btn"
          >
            分享
          </button>
        </div>
      </div>

      <div className={styles.chart} data-testid="trend-chart-bars">
        {dates.map((date) => {
          const heightPct = maxEdits > 0 ? (history.find((e) => e.date === date && e.canvasId === canvasId)?.totalEdits ?? 0) / maxEdits * 100 : 0;
          const barValue = history.find((e) => e.date === date && e.canvasId === canvasId)?.totalEdits ?? 0;
          const shortDate = date.slice(5); // MM-DD
          return (
            <div key={date} className={styles.barColumn} title={`${date}: ${barValue} edits`}>
              <div className={styles.barWrapper}>
                <div
                  className={styles.bar}
                  style={{ height: `${heightPct}%` }}
                  data-testid={`bar-${date}`}
                  aria-label={`${date}: ${barValue} edits`}
                />
              </div>
              {range === '7d' && (
                <span className={styles.dateLabel}>{shortDate}</span>
              )}
            </div>
          );
        })}
      </div>

      {maxEdits === 0 && (
        <div className={styles.noData}>暂无编辑记录</div>
      )}
    </div>
  );
}
