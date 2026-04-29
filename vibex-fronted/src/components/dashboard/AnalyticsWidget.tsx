'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './AnalyticsWidget.module.css';

// ============================================================
// Types — aligned with PRD contract
// PRD: { success, data: { page_view/canvas_open/component_create/delivery_export }, meta }
// ============================================================

type WidgetState = 'idle' | 'loading' | 'success' | 'error' | 'empty';

// PRD metric point shape
interface MetricPoint {
  date: string;
  count: number;
}

interface MetricData {
  page_view: MetricPoint[];
  canvas_open: MetricPoint[];
  component_create: MetricPoint[];
  delivery_export: MetricPoint[];
}

// PRD contract — top-level response
interface AnalyticsData {
  success: boolean;
  data: MetricData;
  meta: { start_date: string; end_date: string; total_days: number };
}

const METRIC_CONFIG = {
  page_view: {
    label: '页面浏览',
    color: '#00d9ff',
    colorVar: '--color-cyan',
  },
  canvas_open: {
    label: '画布打开',
    color: '#00ff88',
    colorVar: '--color-green',
  },
  component_create: {
    label: '组件创建',
    color: '#bf5af2',
    colorVar: '--color-purple',
  },
  delivery_export: {
    label: '交付导出',
    color: '#ff6b9d',
    colorVar: '--color-pink',
  },
} as const;

const CHART_HEIGHT = 200;
const CHART_PADDING = { top: 16, right: 16, bottom: 24, left: 48 };
const GRID_COLOR = '#333';

// ============================================================
// Pure SVG Line Chart
// ============================================================

interface LineChartProps {
  data: MetricData;
}

function LineChart({ data }: LineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0]!.contentRect.width || 600);
    });
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width || 600);
    return () => ro.disconnect();
  }, []);

  const chartWidth = width;
  const chartHeight = CHART_HEIGHT;
  const innerWidth = chartWidth - CHART_PADDING.left - CHART_PADDING.right;
  const innerHeight = chartHeight - CHART_PADDING.top - CHART_PADDING.bottom;

  // Collect all values across all metrics for Y scale
  const allValues: number[] = [];
  (Object.keys(METRIC_CONFIG) as Array<keyof MetricData>).forEach((key) => {
    data[key]?.forEach((p) => allValues.push(p.count));
  });

  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 1;
  const minVal = 0;
  const range = maxVal - minVal || 1;

  // X scale: evenly spaced points
  const numPoints = allValues.length > 0
    ? Math.max(
        ...(Object.keys(METRIC_CONFIG) as Array<keyof MetricData>).map(
          (k) => data[k]?.length ?? 0
        ),
        1
      )
    : 1;

  const xScale = (i: number) =>
    CHART_PADDING.left + (i / Math.max(numPoints - 1, 1)) * innerWidth;

  const yScale = (v: number) =>
    CHART_PADDING.top +
    innerHeight -
    ((v - minVal) / range) * innerHeight;

  // Grid lines
  const gridLines = [];
  const numGridLines = 4;
  for (let i = 0; i <= numGridLines; i++) {
    const y = CHART_PADDING.top + (i / numGridLines) * innerHeight;
    gridLines.push(
      <line
        key={`grid-${i}`}
        x1={CHART_PADDING.left}
        y1={y}
        x2={chartWidth - CHART_PADDING.right}
        y2={y}
        stroke={GRID_COLOR}
        strokeWidth="1"
        strokeDasharray="3,3"
      />
    );
    // Y axis labels
    const val = Math.round(maxVal - (i / numGridLines) * range);
    gridLines.push(
      <text
        key={`label-${i}`}
        x={CHART_PADDING.left - 8}
        y={y + 4}
        textAnchor="end"
        fill="#888"
        fontSize="11"
      >
        {val}
      </text>
    );
  }

  // X axis labels (date strings from PRD contract)
  const xLabels = [];
  if (numPoints > 0) {
    const sampleKey = (Object.keys(METRIC_CONFIG) as Array<keyof MetricData>)[0];
    const points = data[sampleKey!] ?? [];
    const labelStep = Math.max(1, Math.floor(numPoints / 5));
    for (let i = 0; i < numPoints; i += labelStep) {
      const p = points[i];
      if (p) {
        // p.date format: "2026-04-19"
        const label = p.date.slice(5); // "04-19"
        xLabels.push(
          <text
            key={`x-${i}`}
            x={xScale(i)}
            y={chartHeight - 4}
            textAnchor="middle"
            fill="#888"
            fontSize="11"
          >
            {label}
          </text>
        );
      }
    }
  }

  // Polylines for each metric
  const lines = (Object.entries(METRIC_CONFIG) as [keyof MetricData, typeof METRIC_CONFIG[keyof typeof METRIC_CONFIG]][]).map(
    ([key, config]) => {
      const points = data[key] ?? [];
      if (points.length === 0) return null;
      const polylinePoints = points
        .map((p, i) => `${xScale(i)},${yScale(p.count)}`)
        .join(' ');
      return (
        <polyline
          key={key}
          points={polylinePoints}
          fill="none"
          stroke={config.color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      );
    }
  );

  return (
    <div ref={containerRef} className={styles.chartContainer}>
      <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        {gridLines}
        {lines}
        {xLabels}
      </svg>
    </div>
  );
}

// ============================================================
// Metric Cards
// ============================================================

interface MetricCardsProps {
  data: MetricData;
}

function MetricCards({ data }: MetricCardsProps) {
  return (
    <div className={styles.metricCards}>
      {(Object.entries(METRIC_CONFIG) as [keyof MetricData, typeof METRIC_CONFIG[keyof typeof METRIC_CONFIG]][]).map(
        ([key, config]) => {
          const points = data[key] ?? [];
          const latest = points.length > 0 ? points[points.length - 1]!.count : 0;
          // Calculate trend: compare last 2 points
          let trend: 'up' | 'down' | 'flat' = 'flat';
          if (points.length >= 2) {
            const last = points[points.length - 1]!.count;
            const prev = points[points.length - 2]!.count;
            if (last > prev) trend = 'up';
            else if (last < prev) trend = 'down';
          }
          return (
            <div key={key} className={styles.metricCard}>
              <div
                className={styles.metricIndicator}
                style={{ background: config.color }}
              />
              <div className={styles.metricInfo}>
                <span className={styles.metricLabel}>{config.label}</span>
                <span className={styles.metricValue}>{latest.toLocaleString()}</span>
              </div>
              <span
                className={`${styles.metricTrend} ${styles[`trend${trend}`]}`}
                title={`趋势: ${trend === 'up' ? '上升' : trend === 'down' ? '下降' : '持平'}`}
              >
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'}
              </span>
            </div>
          );
        }
      )}
    </div>
  );
}

// ============================================================
// Skeleton (Loading)
// ============================================================

function Skeleton() {
  return (
    <div className={styles.skeleton} data-testid="analytics-skeleton">
      <div className={styles.skeletonChart} />
      <div className={styles.skeletonCards}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={styles.skeletonCard} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Error State
// ============================================================

interface ErrorStateProps {
  errorMsg?: string;
  onRetry: () => void;
}

function ErrorState({ errorMsg, onRetry }: ErrorStateProps) {
  return (
    <div className={styles.errorState} data-testid="analytics-error">
      <span className={styles.errorIcon}>⚠️</span>
      <p className={styles.errorText}>
        {errorMsg ? `加载失败: ${errorMsg}` : '加载失败'}
      </p>
      <button className={styles.retryButton} onClick={onRetry}>
        重试
      </button>
    </div>
  );
}

// ============================================================
// Empty State
// ============================================================

function EmptyState() {
  return (
    <div className={styles.emptyState} data-testid="analytics-empty">
      <span className={styles.emptyIcon}>📊</span>
      <p className={styles.emptyText}>暂无数据</p>
      <a href="/" className={styles.emptyLink}>开始使用 VibeX →</a>
    </div>
  );
}

// ============================================================
// Main Widget
// ============================================================

/** AnalyticsWidget — 4-state dashboard analytics widget with pure SVG line chart */
export function AnalyticsWidget() {
  const [state, setState] = useState<WidgetState>('idle');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const fetchAnalytics = useCallback(async () => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/analytics', {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json: AnalyticsData = await res.json();

      // Determine if empty — check data.data (PRD contract)
      const data2 = json.data;
      const hasData = data2 &&
        (Object.keys(data2) as Array<keyof MetricData>).some(
          (k) => (data2[k]?.length ?? 0) > 0
        );

      setData(json);
      setState(hasData ? 'success' : 'empty');
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setErrorMsg((err as Error).message || '加载失败');
      setState('error');
    }
  }, []);

  // Trigger fetch on mount
  useEffect(() => {
    fetchAnalytics();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchAnalytics]);

  return (
    <section className={styles.widget} aria-label="数据分析">
      <div className={styles.widgetHeader}>
        <h2 className={styles.widgetTitle}>📊 数据分析</h2>
        <div className={styles.legend}>
          {(Object.entries(METRIC_CONFIG) as [keyof MetricData, typeof METRIC_CONFIG[keyof typeof METRIC_CONFIG]][]).map(
            ([key, config]) => (
              <span key={key} className={styles.legendItem}>
                <span
                  className={styles.legendDot}
                  style={{ background: config.color }}
                />
                {config.label}
              </span>
            )
          )}
        </div>
      </div>

      <div className={styles.widgetBody}>
        {state === 'idle' || state === 'loading' ? (
          <Skeleton />
        ) : state === 'error' ? (
          <ErrorState errorMsg={errorMsg} onRetry={fetchAnalytics} />
        ) : state === 'empty' || !data ? (
          <EmptyState />
        ) : (
          <>
            <LineChart data={data.data} />
            <MetricCards data={data.data} />
          </>
        )}
      </div>
    </section>
  );
}
