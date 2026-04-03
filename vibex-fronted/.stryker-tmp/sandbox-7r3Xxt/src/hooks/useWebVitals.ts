/**
 * useWebVitals Hook
 * 
 * React Hook for Web Vitals monitoring
 */
// @ts-nocheck


'use client';

import { useEffect } from 'react';
import { initWebVitals, getPerformanceSummary, type WebVitalsMetric } from '@/lib/web-vitals';

/**
 * Web Vitals Hook 配置选项
 */
export interface UseWebVitalsOptions {
  /** 是否报告 */
  report?: boolean;
  /** 报告回调 */
  onReport?: (metric: WebVitalsMetric) => void;
  /** 关键指标阈值 */
  thresholds?: {
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
  };
}

/**
 * Web Vitals Hook
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
    
    // 初始化 Web Vitals 采集
    initWebVitals();
    
    // 监听报告
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      // 捕获 Web Vitals 日志
      if (args[0] && typeof args[0] === 'string' && args[0].startsWith('[Web Vitals]')) {
        const [, data] = args;
        if (data && data.name && data.value !== undefined) {
          // 检查阈值
          if (thresholds) {
            const threshold = thresholds[data.name.toLowerCase() as keyof typeof thresholds];
            if (threshold && data.value > threshold) {
              console.warn(`[Web Vitals] ${data.name} exceeded threshold: ${data.value} > ${threshold}`);
            }
          }
          
          // 调用回调
          if (onReport) {
            onReport(data);
          }
        }
      }
      originalConsoleLog.apply(console, args);
    };
    
    return () => {
      console.log = originalConsoleLog;
    };
  }, [report, onReport, thresholds]);
  
  // 返回性能摘要
  const metrics = typeof window !== 'undefined' ? getPerformanceSummary() : {};
  
  return {
    metrics,
    // 浏览器支持检测
    isSupported: typeof window !== 'undefined' && 'PerformanceObserver' in window,
  };
}

export default useWebVitals;
