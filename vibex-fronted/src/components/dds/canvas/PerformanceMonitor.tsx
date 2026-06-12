/**
 * PerformanceMonitor — Real-time canvas performance overlay
 * S81-E3: 画布性能监控面板
 * S93-E4: Extended with FP/FCP/LCP Core Web Vitals
 *
 * Displays:
 * - Current FPS (red warning if < 30)
 * - Node count
 * - Edge count
 * - FP (First Paint) — Core Web Vital
 * - FCP (First Contentful Paint) — Core Web Vital
 * - LCP (Largest Contentful Paint) — Core Web Vital
 *
 * Features:
 * - Collapsible (click header to toggle)
 * - Bottom-right corner overlay
 * - Uses usePerformanceMonitor hook
 * - PerformanceObserver for LCP tracking
 */
'use client';

import React, { useEffect, useState } from 'react';
import { usePerformanceMonitor } from '@/hooks/canvas/usePerformanceMonitor';
import styles from './PerformanceMonitor.module.css';

interface CoreWebVitals {
  fp: number | null;  // First Paint (ms)
  fcp: number | null; // First Contentful Paint (ms)
  lcp: number | null; // Largest Contentful Paint (ms)
}

export function PerformanceMonitor() {
  const { metrics, start, stop } = usePerformanceMonitor();
  const [collapsed, setCollapsed] = useState(false);
  const [vitals, setVitals] = useState<CoreWebVitals>({ fp: null, fcp: null, lcp: null });

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  // S93-E4: Collect FP/FCP/LCP using PerformanceObserver API
  useEffect(() => {
    if (typeof performance === 'undefined') return;

    const newVitals: CoreWebVitals = { fp: null, fcp: null, lcp: null };

    // Get historical paint entries (FP, FCP)
    try {
      const paintEntries = performance.getEntriesByType('paint') as PerformancePaintTiming[];
      for (const entry of paintEntries) {
        if (entry.name === 'first-paint') {
          newVitals.fp = Math.round(entry.startTime);
        } else if (entry.name === 'first-contentful-paint') {
          newVitals.fcp = Math.round(entry.startTime);
        }
      }
    } catch {
      // getEntriesByType may not be available in all environments
    }

    // Set initial vitals if already collected
    if (newVitals.fp !== null || newVitals.fcp !== null) {
      setVitals((prev) => ({ ...prev, ...newVitals }));
    }

    // Watch for LCP using PerformanceObserver
    let lcpObserver: PerformanceObserver | null = null;
    try {
      lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEntry[];
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          setVitals((prev) => ({
            ...prev,
            lcp: Math.round(lastEntry.startTime),
          }));
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // PerformanceObserver may not be supported in test environments
    }

    return () => {
      lcpObserver?.disconnect();
    };
  }, []);

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

          {/* FP — First Paint */}
          <div className={styles.metric} data-testid="perf-fp">
            <span className={styles.metricLabel}>FP</span>
            <span
              className={styles.metricValue}
              data-testid="perf-fp-value"
              title="First Paint — Core Web Vital"
            >
              {vitals.fp !== null ? `${vitals.fp}ms` : '—'}
            </span>
          </div>

          {/* FCP — First Contentful Paint */}
          <div className={styles.metric} data-testid="perf-fcp">
            <span className={styles.metricLabel}>FCP</span>
            <span
              className={styles.metricValue}
              data-testid="perf-fcp-value"
              title="First Contentful Paint — Core Web Vital"
            >
              {vitals.fcp !== null ? `${vitals.fcp}ms` : '—'}
            </span>
          </div>

          {/* LCP — Largest Contentful Paint */}
          <div className={styles.metric} data-testid="perf-lcp">
            <span className={styles.metricLabel}>LCP</span>
            <span
              className={styles.metricValue}
              data-testid="perf-lcp-value"
              title="Largest Contentful Paint — Core Web Vital"
            >
              {vitals.lcp !== null ? `${vitals.lcp}ms` : '—'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
