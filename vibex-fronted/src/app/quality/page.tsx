/**
 * Quality Dashboard — CI 质量仪表盘
 * E5 S5.2: CI 质量仪表盘
 *
 * 显示:
 * - E2E 测试通过率折线图
 * - CI 构建状态
 * - TypeScript 错误数
 * - 质量趋势
 */
'use client';

import { useQualityData } from '@/hooks/useQualityData';
import styles from './quality.module.css';

function buildStatusLabel(status: string): string {
  switch (status) {
    case 'success': return '通过';
    case 'failed': return '失败';
    case 'running': return '运行中';
    case 'pending': return '排队中';
    default: return status;
  }
}

function buildStatusColor(status: string): string {
  switch (status) {
    case 'success': return styles.statusSuccess;
    case 'failed': return styles.statusFailed;
    case 'running': return styles.statusRunning;
    case 'pending': return styles.statusPending;
    default: return '';
  }
}

function MiniChart({
  data,
  color,
  unit = '%',
  threshold,
}: {
  data: Array<{ date: string; rate?: number; count?: number }>;
  color: string;
  unit?: string;
  threshold?: number;
}) {
  const values = data.map((d) => d.rate ?? (d.count ?? 0));
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;

  return (
    <div className={styles.miniChart}>
      {values.map((v, i) => {
        const heightPct = 20 + ((v - min) / range) * 60;
        const isAlert = threshold !== undefined && v < threshold;
        return (
          <div key={i} className={styles.barWrapper}>
            <div
              className={`${styles.bar} ${isAlert ? styles.barAlert : ''}`}
              style={{ height: `${heightPct}%`, background: color }}
              title={`${v}${unit}`}
            />
            <span className={styles.barLabel}>{data[i]!.date.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function QualityPage() {
  const { data, loading, error, isAlarming } = useQualityData();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>CI 质量仪表盘</h1>
        {isAlarming && (
          <span className={styles.alarmBadge}>⚠️ 存在质量异常</span>
        )}
      </header>

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>加载质量数据中...</span>
        </div>
      )}

      {error && (
        <div className={styles.errorBox}>
          <p>⚠️ 无法加载质量数据: {String(error)}</p>
        </div>
      )}

      {data && !loading && !error && (
        <>
          {/* 概览卡片 */}
          <div className={styles.overviewGrid}>
            {/* E2E 通过率 */}
            <div className={`${styles.card} ${data.e2ePassRate < 90 ? styles.cardAlert : ''}`}>
              <h2 className={styles.cardLabel}>E2E 通过率</h2>
              <div className={styles.bigNumber}>
                <span className={data.e2ePassRate < 90 ? styles.numberAlert : ''}>
                  {data.e2ePassRate}
                </span>
                <span className={styles.unit}>%</span>
              </div>
              <p className={styles.target}>目标 ≥90%</p>
              <MiniChart
                data={data.e2ePassRateHistory}
                color="#3b82f6"
                unit="%"
                threshold={90}
              />
            </div>

            {/* CI 构建状态 */}
            <div className={`${styles.card} ${data.ciBuildStatus === 'failed' ? styles.cardAlert : ''}`}>
              <h2 className={styles.cardLabel}>CI 构建状态</h2>
              <div className={`${styles.buildStatus} ${buildStatusColor(data.ciBuildStatus)}`}>
                <span className={styles.statusDot} />
                <span className={styles.statusText}>
                  {buildStatusLabel(data.ciBuildStatus)}
                </span>
              </div>
              <p className={styles.buildDuration}>
                {data.buildDuration}s
              </p>
              {/* 构建历史 */}
              <div className={styles.buildHistory}>
                {data.buildStatusHistory.map((h, i) => (
                  <span
                    key={i}
                    className={`${styles.buildDot} ${buildStatusColor(h.status)}`}
                    title={`${h.date}: ${h.status}`}
                  />
                ))}
              </div>
            </div>

            {/* TS 错误数 */}
            <div className={`${styles.card} ${data.tsErrorCount > 0 ? styles.cardAlert : ''}`}>
              <h2 className={styles.cardLabel}>TS 错误数</h2>
              <div className={styles.bigNumber}>
                <span className={data.tsErrorCount > 0 ? styles.numberAlert : ''}>
                  {data.tsErrorCount}
                </span>
                <span className={styles.unit}>个</span>
              </div>
              <p className={styles.target}>目标 0</p>
              <MiniChart
                data={data.tsErrorHistory}
                color="#ef4444"
                unit="个"
                threshold={1}
              />
            </div>
          </div>

          {/* 更新时间 */}
          <p className={styles.updatedAt}>
            最后更新: {new Date(data.updatedAt).toLocaleString('zh-CN', {
              timeZone: 'Asia/Shanghai',
            })}
          </p>
        </>
      )}
    </div>
  );
}
