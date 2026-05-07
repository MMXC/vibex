/**
 * TrendChart — 纯 SVG 折线趋势图
 * E06 S3: Analytics 趋势分析图表
 *
 * 特性：
 * - 纯 SVG，无 Recharts/Chart.js 依赖
 * - X 轴：日期标签
 * - Y 轴：转化率（0-1）
 * - 7d/30d/90d 切换按钮
 * - 数据 < 3 条时显示空状态
 */
'use client';

import React, { useMemo } from 'react';
import styles from './TrendChart.module.css';

export interface TrendDataPoint {
  date: string;
  conversionRate: number;
  trend?: number;
}

interface TrendChartProps {
  /** 趋势数据点 */
  data: TrendDataPoint[];
  /** 当前时间范围 */
  range?: '7d' | '30d' | '90d';
  /** 范围切换回调 */
  onRangeChange?: (range: '7d' | '30d' | '90d') => void;
  /** 图表标题 */
  title?: string;
}

const WIDTH = 600;
const HEIGHT = 200;
const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
const CHART_W = WIDTH - PADDING.left - PADDING.right;
const CHART_H = HEIGHT - PADDING.top - PADDING.bottom;

export function TrendChart({ data, range = '30d', onRangeChange, title = '转化率趋势' }: TrendChartProps) {
  // 空状态：数据 < 3 条不 crash
  if (!data || data.length < 3) {
    return (
      <div className={styles.container}>
        {title && <h4 className={styles.title}>{title}</h4>}
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📊</span>
          <span className={styles.emptyText}>趋势数据不足（需要 ≥ 3 天数据）</span>
        </div>
      </div>
    );
  }

  const points = useMemo(() => {
    const rates = data.map((d) => d.conversionRate);
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);
    const range_rate = maxRate - minRate || 0.1;

    return data.map((d, i) => {
      const x = PADDING.left + (i / (data.length - 1)) * CHART_W;
      const y = PADDING.top + ((maxRate - d.conversionRate) / range_rate) * CHART_H;
      return { x, y, date: d.date, rate: d.conversionRate, trend: d.trend };
    });
  }, [data]);

  // Y 轴刻度
  const yTicks = useMemo(() => {
    const rates = data.map((d) => d.conversionRate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    return [0, 0.25, 0.5, 0.75, 1].filter(
      (t) => t >= Math.floor(min * 10) / 10 - 0.1 && t <= Math.ceil(max * 10) / 10 + 0.1
    );
  }, [data]);

  // X 轴刻度（最多显示 6 个）
  const xTicks = useMemo(() => {
    const step = Math.max(1, Math.floor(data.length / 6));
    return points.filter((_, i) => i % step === 0);
  }, [points, data.length]);

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // 渐变区域
  const areaPath = `M ${PADDING.left},${PADDING.top + CHART_H}
    L ${points.map((p) => `${p.x},${p.y}`).join(' L ')}
    L ${points[points.length - 1]!.x},${PADDING.top + CHART_H} Z`;

  return (
    <div className={styles.container}>
      {title && <h4 className={styles.title}>{title}</h4>}

      {/* 切换按钮 */}
      <div className={styles.rangeButtons}>
        {(['7d', '30d', '90d'] as const).map((r) => (
          <button
            key={r}
            className={`${styles.rangeBtn} ${range === r ? styles.active : ''}`}
            onClick={() => onRangeChange?.(r)}
            type="button"
          >
            {r}
          </button>
        ))}
      </div>

      {/* SVG 图表 */}
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.svg} role="img" aria-label={`转化率趋势图，${data.length}天数据`}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Y 轴网格线 */}
        {yTicks.map((tick) => {
          const y = PADDING.top + ((1 - tick) * CHART_H);
          return (
            <g key={tick}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={PADDING.left + CHART_W}
                y2={y}
                stroke="#222"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <text x={PADDING.left - 8} y={y + 4} className={styles.axisLabel} textAnchor="end">
                {(tick * 100).toFixed(0)}%
              </text>
            </g>
          );
        })}

        {/* 面积填充 */}
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* 折线 */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* 数据点 */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="#3b82f6"
            stroke="#0a0a0a"
            strokeWidth="1.5"
          />
        ))}

        {/* X 轴标签 */}
        {xTicks.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={PADDING.top + CHART_H + 16}
            className={styles.axisLabel}
            textAnchor="middle"
          >
            {p.date.slice(5)}
          </text>
        ))}

        {/* 趋势指示（最后一天相对前一天） */}
        {points.length > 1 && (
          <text
            x={PADDING.left + CHART_W}
            y={PADDING.top + 8}
            className={styles.trendLabel}
            textAnchor="end"
          >
            {(() => {
              const last = points[points.length - 1];
              if (!last) return null;
              if (last.trend === undefined) return null;
              return (
                <>
                  {last.trend > 0 ? '📈' : '📉'} {(Math.abs(last.trend) * 100).toFixed(1)}%
                </>
              );
            })()}
          </text>
        )}
      </svg>
    </div>
  );
}