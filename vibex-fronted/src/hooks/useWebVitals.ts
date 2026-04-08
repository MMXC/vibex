/**
 * useWebVitals Hook
 *
 * React Hook for Web Vitals monitoring
 *
 * E2-S2: Completes threshold alerting (LCP>4000ms, CLS>0.1) with console.warn()
 */

'use client';

import { useEffect } from 'react';
import { initWebVitals, getPerformanceSummary, type WebVitalsMetric } from '@/lib/web-vitals';
import { canvasLogger } from '@/lib/canvas/canvasLogger';

// ============================================================
// Alert thresholds (from MEMORY.md A-010)
// ============================================================

const ALERT_THRESHOLDS: Record<string, number | undefined> = {
  LCP: 4000,   // ms — poor > 4000ms
  CLS: 100,    // in ms*10^6 units for CLS (0.1 = 100000)
  FCP: 3000,   // ms
  TTFB: 800,   // ms
  FID: 300,    // ms (deprecated, use INP)
  INP: 300,    // ms
};

// ============================================================
// Options
// ============================================================

export interface UseWebVitalsOptions {
  /** Whether to report metrics */
  report?: boolean;
  /** Custom report callback */
  onReport?: (metric: WebVitalsMetric) => void;
  /** Override thresholds (key must match metric.name uppercase) */
  thresholds?: Record<string, number>;
}

/**
 * useWebVitals — React hook for Web Vitals monitoring
 *
 * @example
 * ```tsx
 * const { metrics, isSupported } = useWebVitals({
 *   onReport: (metric) => console.log(metric)
 * });
 * ```
 */
export function useWebVitals(options: UseWebVitalsOptions = {}) {
  const { report = true, onReport, thresholds } = options;

  useEffect(() => {
    if (!report || typeof window === 'undefined') return;

    // Initialize Web Vitals collection
    initWebVitals();

    // Intercept canvasLogger debug to capture Web Vitals output
    const originalDebug = canvasLogger.default.debug.bind(canvasLogger.default);
    canvasLogger.default.debug = (...args: Parameters<typeof console.log>) => {
      originalDebug(...args);

      // Capture [Web Vitals] log lines
      const firstArg = args[0];
      if (typeof firstArg === 'string' && firstArg.startsWith('[Web Vitals]')) {
        try {
          // Format: "[Web Vitals] LCP: 1200ms"
          const metricStr = firstArg.replace('[Web Vitals] ', '');
          const [name, valueStr] = metricStr.split(': ');
          const value = parseFloat(valueStr?.replace(/[^0-9.]/g, '') ?? '0');
          if (!name || isNaN(value)) return;

          // E2-S2: Threshold alert check
          const effectiveThresholds = { ...ALERT_THRESHOLDS, ...thresholds };
          const threshold = effectiveThresholds[name.toUpperCase()];

          if (threshold !== undefined && value > threshold) {
            const warningMsg = `[Performance] WARNING: ${name} = ${value}ms > ${threshold}ms (threshold exceeded)`;
            // E2-S2: Use console.warn() as specified
            console.warn(warningMsg);
          }

          if (onReport) {
            onReport({ name, value, delta: value, id: `auto-${name}`, rating: 'good', url: '', timestamp: Date.now() });
          }
        } catch {
          // Ignore parse errors — non-critical
        }
      }
    };

    return () => {
      canvasLogger.default.debug = originalDebug;
    };
  }, [report, onReport, thresholds]);

  // Return performance summary (snapshot)
  const metrics = typeof window !== 'undefined' ? getPerformanceSummary() : {};

  return {
    metrics,
    isSupported: typeof window !== 'undefined' && 'PerformanceObserver' in window,
  };
}

export default useWebVitals;
