/**
 * AnalyticsDashboard.tsx — S95-E1: Canvas Analytics Dashboard
 *
 * Renders canvas analytics as a settings tab content.
 * No separate panel — rendered directly as a settings tab.
 */

'use client';

import React, { useEffect } from 'react';
import { useAnalyticsStore, type AnalyticsRange } from '@/stores/analyticsStore';
import type { CanvasAnalytics } from '@/lib/api/analytics';
import styles from './AnalyticsDashboard.module.css';

const RANGES: AnalyticsRange[] = ['7d', '30d', '90d'];

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

interface TrendChartProps {
  dailyTrend: CanvasAnalytics['dailyTrend'];
  maxViews: number;
}

function TrendChart({ dailyTrend, maxViews }: TrendChartProps) {
  if (!dailyTrend.length) return null;

  const width = 400;
  const height = 100;
  const padLeft = 8;
  const padRight = 8;
  const padTop = 8;
  const padBottom = 20;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const xStep = chartW / Math.max(dailyTrend.length - 1, 1);

  const viewsPath = dailyTrend
    .map((d, i) => {
      const x = padLeft + i * xStep;
      const y = padTop + chartH - (d.views / maxViews) * chartH;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const editsPath = dailyTrend
    .map((d, i) => {
      const x = padLeft + i * xStep;
      const y = padTop + chartH - (d.edits / Math.max(maxViews, 1)) * chartH;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const labelStep = Math.ceil(dailyTrend.length / 5);

  return (
    <svg
      className={styles.chartSvg}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-label="Analytics trend chart"
    >
      {/* Horizontal grid line */}
      <line
        x1={padLeft}
        y1={padTop + chartH}
        x2={padLeft + chartW}
        y2={padTop + chartH}
        className={styles.chartAxis}
      />
      {/* Views line */}
      <path d={viewsPath} className={styles.chartLine} />
      {/* Edits line */}
      <path d={editsPath} className={styles.chartEditsLine} />
      {/* X-axis labels */}
      {dailyTrend.map((d, i) => {
        if (i % labelStep !== 0 && i !== dailyTrend.length - 1) return null;
        const x = padLeft + i * xStep;
        const label = d.date.slice(5); // MM-DD
        return (
          <text key={d.date} x={x} y={height - 2} className={styles.chartLabel} textAnchor="middle">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

interface AnalyticsDashboardProps {
  canvasId: string;
}

export function AnalyticsDashboard({ canvasId }: AnalyticsDashboardProps) {
  const { analytics, isLoading, error, range, fetchAnalytics, setRange, exportCSV } =
    useAnalyticsStore();

  useEffect(() => {
    if (canvasId) {
      fetchAnalytics(canvasId, range);
    }
  }, [canvasId, range, fetchAnalytics]);

  const maxViews = analytics
    ? Math.max(
        ...analytics.dailyTrend.map((d) => Math.max(d.views, d.edits)),
        1
      )
    : 1;

  return (
    <div className={styles.container}>
      {/* Header with range selector */}
      <div className={styles.header}>
        <span className={styles.title}>Analytics</span>
        <div className={styles.rangeSelector} role="tablist" aria-label="Time range">
          {RANGES.map((r) => (
            <button
              key={r}
              className={`${styles.rangeBtn} ${range === r ? styles.active : ''}`}
              onClick={() => setRange(r)}
              role="tab"
              aria-selected={range === r}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className={styles.loading}>Loading analytics…</div>
      )}

      {error && !isLoading && (
        <div className={styles.error}>{error}</div>
      )}

      {!isLoading && !error && analytics && (
        <>
          {/* View stats — 3 columns */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Views Today</span>
              <span className={styles.statValue}>{formatNumber(analytics.views.today)}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Views This Week</span>
              <span className={styles.statValue}>{formatNumber(analytics.views.week)}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Views This Month</span>
              <span className={styles.statValue}>{formatNumber(analytics.views.month)}</span>
            </div>
          </div>

          {/* Wide stats — 4 columns */}
          <div className={styles.wideStats}>
            <div className={styles.wideCard}>
              <span className={styles.statLabel}>Edits</span>
              <span className={styles.statValue}>{formatNumber(analytics.editCount)}</span>
            </div>
            <div className={styles.wideCard}>
              <span className={styles.statLabel}>Unique Users</span>
              <span className={styles.statValue}>{formatNumber(analytics.uniqueUsers)}</span>
            </div>
            <div className={styles.wideCard}>
              <span className={styles.statLabel}>Shares</span>
              <span className={styles.statValue}>{formatNumber(analytics.shareCount)}</span>
            </div>
            <div className={styles.wideCard}>
              <span className={styles.statLabel}>Exports</span>
              <span className={styles.statValue}>{formatNumber(analytics.exportCount)}</span>
            </div>
          </div>

          {/* Trend chart */}
          <div className={styles.chartSection}>
            <div className={styles.chartTitle}>Views &amp; Edits Trend</div>
            <div className={styles.chartContainer}>
              <TrendChart dailyTrend={analytics.dailyTrend} maxViews={maxViews} />
            </div>
            <div className={styles.legend}>
              <div className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.views}`} />
                <span>Views</span>
              </div>
              <div className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.edits}`} />
                <span>Edits</span>
              </div>
            </div>
          </div>

          {/* Footer with export */}
          <div className={styles.footer}>
            <button
              className={styles.exportBtn}
              onClick={() => exportCSV(canvasId)}
              disabled={!analytics}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </button>
          </div>
        </>
      )}

      {!isLoading && !error && !analytics && (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📊</span>
          <span>No analytics data available yet.</span>
        </div>
      )}
    </div>
  );
}
