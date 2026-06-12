'use client';

import React, { useMemo } from 'react';
import styles from './RatingDistributionChart.module.css';

interface RatingDistributionChartProps {
  distribution: Record<number, number>;
}

/**
 * S91-E4: Rating Distribution Donut Chart
 *
 * Simple CSS-only donut chart showing 1-5 star distribution.
 */
export function RatingDistributionChart({ distribution }: RatingDistributionChartProps) {
  const { segments, total } = useMemo(() => {
    const totalCount = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    const colors: Record<number, string> = {
      1: '#ef4444', // red
      2: '#f97316', // orange
      3: '#eab308', // yellow
      4: '#22c55e', // green
      5: '#6366f1', // indigo
    };
    const labels: Record<number, string> = {
      1: '1星',
      2: '2星',
      3: '3星',
      4: '4星',
      5: '5星',
    };
    let cumulative = 0;
    const segs = ([1, 2, 3, 4, 5] as const).map((star) => {
      const count = distribution[star] ?? 0;
      const pct = totalCount > 0 ? count / totalCount : 0;
      const startPct = cumulative;
      const endPct = cumulative + pct;
      cumulative += pct;
      return {
        star,
        count,
        pct,
        startPct,
        endPct,
        color: colors[star],
        label: labels[star],
      };
    });
    return { segments: segs, total: totalCount };
  }, [distribution]);

  const gradientStops = useMemo(() => {
    return segments
      .filter((s) => s.pct > 0)
      .map((s) => `${s.color} ${s.startPct * 100}% ${s.endPct * 100}%`)
      .join(', ');
  }, [segments]);

  if (total === 0) {
    return (
      <div className={styles.container} data-testid="rating-distribution-chart">
        <div className={styles.emptyState} data-testid="no-ratings">暂无评分数据</div>
      </div>
    );
  }

  return (
    <div className={styles.container} data-testid="rating-distribution-chart">
      {/* Donut chart using conic-gradient */}
      <div
        className={styles.donut}
        style={{
          background: gradientStops ? `conic-gradient(${gradientStops})` : '#e5e7eb',
        }}
        data-testid="donut-chart"
        role="img"
        aria-label="Rating distribution chart"
      />
      <div className={styles.legend} data-testid="chart-legend">
        {segments.map((s) => (
          <div key={s.star} className={styles.legendRow} data-testid={`legend-star-${s.star}`}>
            <span
              className={styles.legendDot}
              style={{ background: s.color }}
            />
            <span className={styles.legendLabel}>{s.label}</span>
            <span className={styles.legendPct} data-testid={`pct-star-${s.star}`}>
              {total > 0 ? `${Math.round((s.pct) * 100)}%` : '0%'}
            </span>
            <span className={styles.legendCount}>({s.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
