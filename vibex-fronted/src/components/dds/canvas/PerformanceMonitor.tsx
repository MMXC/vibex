/**
 * PerformanceMonitor — Real-time canvas performance overlay
 * S81-E3: 画布性能监控面板
 *
 * Displays:
 * - Current FPS (red warning if < 30)
 * - Node count
 * - Edge count
 *
 * Features:
 * - Collapsible (click header to toggle)
 * - Bottom-right corner overlay
 * - Uses usePerformanceMonitor hook
 */
'use client';

import React, { useEffect, useState } from 'react';
import { usePerformanceMonitor } from '@/hooks/canvas/usePerformanceMonitor';
import styles from './PerformanceMonitor.module.css';

export function PerformanceMonitor() {
  const { metrics, start, stop } = usePerformanceMonitor();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  const fpsClass =
    metrics.fps === 0
      ? styles.fpsNeutral
      : metrics.fps < 30
        ? styles.fpsWarning
        : styles.fpsOk;

  return (
    <div className={styles.container} data-testid="performance-monitor">
      {/* Header — click to collapse/expand */}
      <button
        className={styles.header}
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? '展开性能监控' : '收起性能监控'}
        aria-expanded={!collapsed}
      >
        <span className={styles.headerTitle}>性能监控</span>
        <span className={styles.chevron}>{collapsed ? '▲' : '▼'}</span>
      </button>

      {/* Metrics row — hidden when collapsed */}
      {!collapsed && (
        <div className={styles.metrics} data-testid="performance-metrics">
          {/* FPS */}
          <div className={styles.metric} data-testid="perf-fps">
            <span className={styles.metricLabel}>FPS</span>
            <span className={`${styles.metricValue} ${fpsClass}`} data-testid="perf-fps-value">
              {metrics.fps}
            </span>
          </div>

          {/* Node count */}
          <div className={styles.metric} data-testid="perf-node-count">
            <span className={styles.metricLabel}>节点</span>
            <span className={styles.metricValue} data-testid="perf-node-value">
              {metrics.nodeCount}
            </span>
          </div>

          {/* Edge count */}
          <div className={styles.metric} data-testid="perf-edge-count">
            <span className={styles.metricLabel}>连线</span>
            <span className={styles.metricValue} data-testid="perf-edge-value">
              {metrics.edgeCount}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
