'use client';

import React, { useMemo } from 'react';
import { useCanvasListStore } from '@/stores/canvasListStore';
import { useCanvasAccessHistoryStore } from '@/stores/dds/canvasAccessHistoryStore';
import styles from './analytics.module.css';

/**
 * S89-E1: Settings Usage Analytics Section
 * 
 * Shows per-canvas and aggregate usage statistics:
 * - Total canvas count / created this month / active this month
 * - Canvas type distribution (template/prototype/blank)
 * - Recent access history per canvas
 */

interface CanvasStatsData {
  total: number;
  createdThisMonth: number;
  activeThisMonth: number;
  typeDistribution: Record<string, number>;
}

/** Infer canvas type from name/tags since CanvasMeta has no explicit type field */
function inferCanvasType(canvas: { name?: string; description?: string; tags?: string[] }): string {
  const name = (canvas.name ?? '').toLowerCase();
  const desc = (canvas.description ?? '').toLowerCase();
  const tags = (canvas.tags ?? []).map((t) => t.toLowerCase());
  if (tags.includes('template') || name.includes('template') || desc.includes('template')) {
    return 'template';
  }
  if (tags.includes('prototype') || name.includes('prototype') || desc.includes('prototype')) {
    return 'prototype';
  }
  return 'blank';
}

function calcCanvasStats(canvases: ReturnType<typeof useCanvasListStore.getState>['canvases']): CanvasStatsData {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const typeDist: Record<string, number> = {};
  let createdThisMonth = 0;
  let activeThisMonth = 0;

  for (const c of canvases) {
    const type = inferCanvasType(c);
    typeDist[type] = (typeDist[type] ?? 0) + 1;
    if (c.createdAt >= monthStart) createdThisMonth++;
    if (c.updatedAt >= weekAgo) activeThisMonth++;
  }

  return {
    total: canvases.length,
    createdThisMonth,
    activeThisMonth,
    typeDistribution: typeDist,
  };
}

function formatRelative(isoString: string): string {
  if (!isoString) return '—';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  const months = Math.floor(days / 30);
  return `${months}个月前`;
}

export function UsageAnalyticsSection() {
  const canvases = useCanvasListStore((s) => s.canvases);
  const getRecentAccessors = useCanvasAccessHistoryStore((s) => s.getRecentAccessors);

  const stats = useMemo(() => calcCanvasStats(canvases), [canvases]);

  // Build pie chart segments for type distribution
  const pieSegments = useMemo(() => {
    const total = stats.total;
    if (total === 0) return [];
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#22c55e'];
    const labels = Object.keys(stats.typeDistribution);
    let cumulative = 0;
    return labels.map((label, i) => {
      const count = stats.typeDistribution[label];
      const pct = count / total;
      const segment = {
        label,
        count,
        pct,
        color: colors[i % colors.length],
        startPct: cumulative,
        endPct: cumulative + pct,
      };
      cumulative += pct;
      return segment;
    });
  }, [stats]);

  const recentCanvases = useMemo(
    () => [...canvases].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 10),
    [canvases]
  );

  return (
    <section className={styles.section} data-testid="usage-analytics-section">
      <h2 className={styles.sectionTitle}>使用分析</h2>

      {/* Aggregate stats */}
      <div className={styles.statsGrid} data-testid="analytics-stats-grid">
        <div className={styles.statCard}>
          <div className={styles.statValue} data-testid="stat-total">{stats.total}</div>
          <div className={styles.statLabel}>总画布数</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} data-testid="stat-created-month">{stats.createdThisMonth}</div>
          <div className={styles.statLabel}>本月新建</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} data-testid="stat-active-month">{stats.activeThisMonth}</div>
          <div className={styles.statLabel}>本周活跃</div>
        </div>
      </div>

      {/* Type distribution */}
      {pieSegments.length > 0 && (
        <div className={styles.distributionBlock} data-testid="type-distribution">
          <h3 className={styles.subTitle}>画布类型分布</h3>
          <div className={styles.pieContainer}>
            {/* CSS-only pie chart using conic-gradient */}
            <div
              className={styles.pieChart}
              style={{
                background: `conic-gradient(${pieSegments
                  .map((s, i) => `${s.color} ${s.startPct * 100}% ${s.endPct * 100}%`)
                  .join(', ')})`,
              }}
              data-testid="type-pie-chart"
            />
            <div className={styles.pieLegend}>
              {pieSegments.map((s) => (
                <div key={s.label} className={styles.legendRow}>
                  <span className={styles.legendDot} style={{ background: s.color }} />
                  <span className={styles.legendLabel}>{s.label}</span>
                  <span className={styles.legendCount}>({s.count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent access history */}
      <div className={styles.accessHistoryBlock}>
        <h3 className={styles.subTitle}>最近访问记录</h3>
        <div className={styles.canvasList}>
          {recentCanvases.map((canvas) => {
            const accessors = getRecentAccessors(canvas.id);
            return (
              <div key={canvas.id} className={styles.canvasRow} data-testid={`canvas-row-${canvas.id}`}>
                <span className={styles.canvasName} title={canvas.name}>{canvas.name}</span>
                <span className={styles.canvasMeta}>
                  {formatRelative(canvas.updatedAt)}
                </span>
                <span className={styles.accessorAvatars} data-testid={`accessors-${canvas.id}`}>
                  {accessors.slice(0, 5).map((r) => (
                    <span key={r.userId} className={styles.avatar} title={r.userName}>
                      {r.avatarUrl ? (
                        <img src={r.avatarUrl} alt={r.userName} className={styles.avatarImg} />
                      ) : (
                        r.userName.slice(0, 1).toUpperCase()
                      )}
                    </span>
                  ))}
                  {accessors.length === 0 && (
                    <span className={styles.noAccessors}>—</span>
                  )}
                </span>
              </div>
            );
          })}
          {recentCanvases.length === 0 && (
            <p className={styles.emptyState} data-testid="no-canvases-message">
              暂无画布数据
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
