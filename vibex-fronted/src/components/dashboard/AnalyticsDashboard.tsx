'use client';

import React, { useState } from 'react';
import { FunnelWidget } from './FunnelWidget';
import { useFunnelQuery, type FunnelStep } from '@/hooks/queries/useFunnelQuery';
import styles from './AnalyticsDashboard.module.css';

function exportFunnelCSV(steps: FunnelStep[]): void {
  const header = '阶段,数量,转化率\n';
  const rows = steps.map((s) => `${s.name},${s.count},${(s.rate * 100).toFixed(1)}%`).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'funnel-report.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function AnalyticsDashboard() {
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const { data, isPending: isLoading } = useFunnelQuery(range);

  const steps = data?.data?.steps ?? [];

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
              onClick={() => exportFunnelCSV(steps)}
              data-testid="analytics-export-btn"
            >
              导出 CSV
            </button>
          )}
        </div>
      </div>
      <FunnelWidget steps={steps} isLoading={isLoading} />
    </div>
  );
}
