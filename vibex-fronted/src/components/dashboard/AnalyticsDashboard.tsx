'use client';

import React, { useState } from 'react';
import { FunnelWidget } from './FunnelWidget';
import { TrendChart } from '@/components/analytics/TrendChart';
import { useFunnelQuery, type FunnelStep } from '@/hooks/queries/useFunnelQuery';
import { useTrendData } from '@/hooks/queries/useTrendData';
import styles from './AnalyticsDashboard.module.css';

// E06 S4: UTF-8 BOM for Excel compatibility
const BOM = '\ufeff';

function exportFunnelCSV(steps: FunnelStep[], trendData?: Array<{ date: string; conversionRate: number }>): void {
  // E06 S4: CSV 增加趋势数据列（date + conversionRate + trend）
  const header = trendData
    ? '日期,转化率,趋势\n'
    : '阶段,数量,转化率\n';
  if (trendData) {
    const rows = trendData.map((t) => `${t.date},${(t.conversionRate * 100).toFixed(1)}%,${t.conversionRate > 0 ? '+' : ''}`).join('\n');
    const blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trend-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  } else {
    const rows = steps.map((s) => `${s.name},${s.count},${(s.rate * 100).toFixed(1)}%`).join('\n');
    const blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'funnel-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}

export function AnalyticsDashboard() {
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const [trendRange, setTrendRange] = useState<'7d' | '30d' | '90d'>('30d');
  const { data, isPending: isLoading } = useFunnelQuery(range);
  const { data: trendData } = useTrendData(trendRange);

  const steps = data?.data?.steps ?? [];
  const trendPoints = trendData?.data ?? [];

  return (
    <div className={styles.container} data-testid="analytics-dashboard">
      <div className={styles.header}>
        <h2 className={styles.title}>转化漏斗</h2>
        <div className={styles.controls}>
          <div className={styles.rangeButtons}>
            <button
              type="button"
              className={`${styles.rangeBtn} ${range === '7d' ? styles.rangeBtnActive : ''}`}
              onClick={() => setRange('7d')}
              data-testid="analytics-range-btn-7d"
            >
              7天
            </button>
            <button
              type="button"
              className={`${styles.rangeBtn} ${range === '30d' ? styles.rangeBtnActive : ''}`}
              onClick={() => setRange('30d')}
              data-testid="analytics-range-btn-30d"
            >
              30天
            </button>
          </div>
          {steps.length > 0 && (
            <button
              type="button"
              className={styles.exportBtn}
              onClick={() => exportFunnelCSV(steps, trendPoints)}
              data-testid="analytics-export-btn"
            >
              导出 CSV
            </button>
          )}
        </div>
      </div>
      <FunnelWidget steps={steps} isLoading={isLoading} />

      {/* E06 S3: TrendChart 集成（漏斗图下方） */}
      {trendPoints.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <TrendChart
            data={trendPoints}
            range={trendRange}
            onRangeChange={setTrendRange}
            title="转化率趋势"
          />
        </div>
      )}
    </div>
  );
}
