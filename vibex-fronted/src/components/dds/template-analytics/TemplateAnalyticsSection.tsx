'use client';

import React, { useCallback, useEffect, useState } from 'react';
import styles from './TemplateAnalyticsSection.module.css';

interface TemplateAnalytics {
  templateId: string;
  title: string;
  views: number;
  uses: number;
  rating: number;
}

type TimeRange = '7d' | '30d' | '90d';

interface TemplateAnalyticsSectionProps {
  currentUserId: string;
}

/**
 * S91-E4: Template Analytics Dashboard
 *
 * Shows per-template analytics for the current author:
 * - Template list with views, uses, rating columns
 * - Time range tabs: 7d | 30d | 90d
 * - CSV export button
 */
export function TemplateAnalyticsSection({ currentUserId }: TemplateAnalyticsSectionProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('7d');
  const [analytics, setAnalytics] = useState<TemplateAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (range: TimeRange) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/templates/analytics?range=${range}`);
      const data = await res.json();
      if (data.ok) {
        setAnalytics(data.analytics ?? []);
      } else {
        setError(data.error ?? 'Failed to load analytics');
      }
    } catch {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(selectedRange);
  }, [selectedRange, fetchAnalytics]);

  const handleExport = useCallback(async () => {
    try {
      const res = await fetch(`/api/templates/analytics/export?range=${selectedRange}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisp = res.headers.get('Content-Disposition') ?? '';
      const match = contentDisp.match(/filename=(.+)/);
      a.download = match ? match[1] : `template-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Export failed silently
    }
  }, [selectedRange]);

  const totalViews = analytics.reduce((sum, t) => sum + t.views, 0);
  const totalUses = analytics.reduce((sum, t) => sum + t.uses, 0);
  const avgRating = analytics.length > 0
    ? Math.round((analytics.reduce((sum, t) => sum + t.rating, 0) / analytics.length) * 10) / 10
    : 0;

  const rangeLabels: Record<TimeRange, string> = {
    '7d': '7 天',
    '30d': '30 天',
    '90d': '90 天',
  };

  return (
    <section className={styles.section} data-testid="template-analytics-section">
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>模板数据分析</h2>
        <div className={styles.rangeTabs} role="tablist" data-testid="range-tabs">
          {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
            <button
              key={range}
              role="tab"
              aria-selected={selectedRange === range}
              className={`${styles.rangeTab} ${selectedRange === range ? styles.rangeTabActive : ''}`}
              onClick={() => setSelectedRange(range)}
              data-testid={`range-tab-${range}`}
            >
              {rangeLabels[range]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className={styles.statsGrid} data-testid="analytics-summary">
        <div className={styles.statCard}>
          <div className={styles.statValue} data-testid="stat-templates">{analytics.length}</div>
          <div className={styles.statLabel}>模板数</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} data-testid="stat-views">{totalViews}</div>
          <div className={styles.statLabel}>总浏览</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} data-testid="stat-uses">{totalUses}</div>
          <div className={styles.statLabel}>总使用</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} data-testid="stat-avg-rating">{avgRating}</div>
          <div className={styles.statLabel}>平均评分</div>
        </div>
      </div>

      {/* Export button */}
      <div className={styles.exportRow}>
        <button
          className={styles.exportButton}
          onClick={handleExport}
          data-testid="export-button"
          disabled={loading}
        >
          导出数据
        </button>
      </div>

      {/* Table */}
      {loading && (
        <p className={styles.loadingState} data-testid="loading-state">加载中...</p>
      )}
      {error && (
        <p className={styles.errorState} data-testid="error-state">{error}</p>
      )}
      {!loading && !error && (
        <div className={styles.tableContainer} data-testid="analytics-table">
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>模板名称</th>
                <th className={styles.th}>浏览</th>
                <th className={styles.th}>使用</th>
                <th className={styles.th}>评分</th>
              </tr>
            </thead>
            <tbody>
              {analytics.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyTd} data-testid="empty-analytics">
                    暂无数据
                  </td>
                </tr>
              ) : (
                analytics.map((item) => (
                  <tr key={item.templateId} className={styles.tr} data-testid={`row-${item.templateId}`}>
                    <td className={styles.td} title={item.title}>{item.title}</td>
                    <td className={styles.td}>{item.views.toLocaleString()}</td>
                    <td className={styles.td}>{item.uses.toLocaleString()}</td>
                    <td className={styles.td}>
                      {item.rating > 0 ? (
                        <span className={styles.ratingBadge} data-testid={`rating-${item.templateId}`}>
                          {item.rating.toFixed(1)} ★
                        </span>
                      ) : (
                        <span className={styles.noRating}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
