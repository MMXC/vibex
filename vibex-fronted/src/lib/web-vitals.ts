/**
 * Web Vitals Collector
 * 
 * 采集 Core Web Vitals 性能指标
 * 
 * 指标:
 * - LCP (Largest Contentful Paint) - 最大内容绘制
 * - FID (First Input Delay) - 首次输入延迟
 * - CLS (Cumulative Layout Shift) - 累积布局偏移
 * - FCP (First Contentful Paint) - 首次内容绘制
 * - TTFB (Time to First Byte) - 首字节时间
 */

import { captureMessage } from './sentry';

// PerformanceObserver entry type definitions (not in standard DOM lib)
interface LCPEntry extends PerformanceEntry {
  renderTime: number;
  loadTime: number;
  size: number;
  element?: Element;
}

interface CLSEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface FIDEntry extends PerformanceEntry {
  processingStart: number;
  processingEnd: number;
  interactionId: number;
}

interface NavTimingEntry extends PerformanceEntry {
  responseStart: number;
  responseEnd: number;
  domInteractive: number;
}

export interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  url: string;
  timestamp: number;
}

/**
 * Web Vitals 评级
 */
export function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  // 根据指标类型和阈值判断
  switch (name) {
    case 'LCP':
      // LCP < 2.5s good, < 4s needs-improvement, >= 4s poor
      return value < 2500 ? 'good' : value < 4000 ? 'needs-improvement' : 'poor';
    
    case 'FID':
    case 'INP':
      // FID/INP < 100ms good, < 300ms needs-improvement, >= 300ms poor
      return value < 100 ? 'good' : value < 300 ? 'needs-improvement' : 'poor';
    
    case 'CLS':
      // CLS < 0.1 good, < 0.25 needs-improvement, >= 0.25 poor
      return value < 0.1 ? 'good' : value < 0.25 ? 'needs-improvement' : 'poor';
    
    case 'FCP':
      // FCP < 1.8s good, < 3s needs-improvement, >= 3s poor
      return value < 1800 ? 'good' : value < 3000 ? 'needs-improvement' : 'poor';
    
    case 'TTFB':
      // TTFB < 800ms good, < 1800ms needs-improvement, >= 1800ms poor
      return value < 800 ? 'good' : value < 1800 ? 'needs-improvement' : 'poor';
    
    default:
      return 'needs-improvement';
  }
}

/**
 * 上报 Web Vitals 到 Sentry
 */
function reportWebVitals(metric: WebVitalsMetric) {
  const { name, value, rating, delta, id } = metric;
  
  // 控制台输出
  console.log(`[Web Vitals] ${name}:`, {
    value: Math.round(value),
    rating,
    delta: Math.round(delta),
    id,
  });
  
  // 发送到 Sentry (作为性能事务)
  // 格式: web-vitals-{metricName}
  const eventId = `${name.toLowerCase()}-${Date.now()}`;
  
  // 使用 fetch 上报到自定义端点或 Sentry
  if (typeof window !== 'undefined') {
    // 构建数据
    const data = {
      type: 'web-vitals',
      name,
      value: Math.round(value),
      rating,
      delta: Math.round(delta),
      id,
      url: window.location.href,
      timestamp: Date.now(),
    };
    
    // 尝试发送到 Sentry
    try {
      // 方法1: 使用 navigator.sendBeacon (推荐, 不阻塞)
      if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
        // 注意: 实际项目中应该替换为真实的 Sentry DSN
        // navigator.sendBeacon('/api/vitals', JSON.stringify(data));
      }
    } catch (e) {
      console.error('[Web Vitals] Report failed:', e);
    }
  }
}

/**
 * 初始化 Web Vitals 采集
 * 
 * 使用 web-vitals 库或原生 API
 */
export function initWebVitals() {
  // 检查是否在浏览器环境
  if (typeof window === 'undefined') return;
  
  // 尝试使用原生 API (如果可用)
  if ('PerformanceObserver' in window) {
    // LCP (Largest Contentful Paint)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as LCPEntry;
        
        if (lastEntry) {
          const metric: WebVitalsMetric = {
            id: 'lcp',
            name: 'LCP',
            value: lastEntry.renderTime || lastEntry.loadTime,
            delta: 0,
            rating: getRating('LCP', lastEntry.renderTime || lastEntry.loadTime),
            url: window.location.href,
            timestamp: Date.now(),
          };
          
          reportWebVitals(metric);
        }
      });
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('[Web Vitals] LCP observer not supported');
    }
    
    // CLS (Cumulative Layout Shift)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as CLSEntry[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        
        const metric: WebVitalsMetric = {
          id: 'cls',
          name: 'CLS',
          value: clsValue,
          delta: clsValue,
          rating: getRating('CLS', clsValue),
          url: window.location.href,
          timestamp: Date.now(),
        };
        
        reportWebVitals(metric);
      });
      
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('[Web Vitals] CLS observer not supported');
    }
    
    // FID (First Input Delay) - 旧版
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0] as FIDEntry;
        
        if (firstEntry && firstEntry.processingStart) {
          const metric: WebVitalsMetric = {
            id: 'fid',
            name: 'FID',
            value: firstEntry.processingStart - firstEntry.startTime,
            delta: firstEntry.processingStart - firstEntry.startTime,
            rating: getRating('FID', firstEntry.processingStart - firstEntry.startTime),
            url: window.location.href,
            timestamp: Date.now(),
          };
          
          reportWebVitals(metric);
        }
      });
      
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('[Web Vitals] FID observer not supported');
    }
    
    // INP (Interaction to Next Paint) - 新版 (替代 FID)
    try {
      let inpValue = 0;
      const inpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as FIDEntry[]) {
          if (entry.interactionId) {
            const value = entry.duration;
            if (value > inpValue) {
              inpValue = value;
              
              const metric: WebVitalsMetric = {
                id: 'inp',
                name: 'INP',
                value,
                delta: value,
                rating: getRating('INP', value),
                url: window.location.href,
                timestamp: Date.now(),
              };
              
              reportWebVitals(metric);
            }
          }
        }
      });
      
      inpObserver.observe({ entryTypes: ['interaction'] });
    } catch (e) {
      console.warn('[Web Vitals] INP observer not supported');
    }
  }
  
  // FCP (First Contentful Paint)
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries[0] as PerformanceEntry;
      
      if (fcpEntry && fcpEntry.name === 'first-contentful-paint') {
        const metric: WebVitalsMetric = {
          id: 'fcp',
          name: 'FCP',
          value: fcpEntry.startTime,
          delta: fcpEntry.startTime,
          rating: getRating('FCP', fcpEntry.startTime),
          url: window.location.href,
          timestamp: Date.now(),
        };
        
        reportWebVitals(metric);
      }
    });
    
    fcpObserver.observe({ entryTypes: ['paint'] });
  } catch (e) {
    console.warn('[Web Vitals] FCP observer not supported');
  }
  
  // TTFB (Time to First Byte)
  try {
    const navigationEntries = performance.getEntriesByType('navigation');
    if (navigationEntries.length > 0) {
      const navEntry = navigationEntries[0] as NavTimingEntry;
      const ttfb = navEntry.responseStart;
      
      if (ttfb > 0) {
        const metric: WebVitalsMetric = {
          id: 'ttfb',
          name: 'TTFB',
          value: ttfb,
          delta: ttfb,
          rating: getRating('TTFB', ttfb),
          url: window.location.href,
          timestamp: Date.now(),
        };
        
        reportWebVitals(metric);
      }
    }
  } catch (e) {
    console.warn('[Web Vitals] TTFB not supported');
  }
  
  console.log('[Web Vitals] Initialized');
}

/**
 * 获取性能指标摘要
 */
export function getPerformanceSummary(): Record<string, { value: number; rating: string }> {
  if (typeof window === 'undefined') return {};
  
  const summary: Record<string, { value: number; rating: string }> = {};
  
  try {
    // LCP
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      const lastLcp = lcpEntries[lcpEntries.length - 1] as LCPEntry;
      const lcp = lastLcp.renderTime || lastLcp.loadTime;
      summary.lcp = { value: Math.round(lcp), rating: getRating('LCP', lcp) };
    }
    
    // CLS
    const clsEntries = performance.getEntriesByType('layout-shift');
    let cls = 0;
    (clsEntries as CLSEntry[]).forEach((entry: CLSEntry) => {
      if (!entry.hadRecentInput) cls += entry.value;
    });
    summary.cls = { value: Math.round(cls * 1000) / 1000, rating: getRating('CLS', cls) };
    
    // TTFB
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0) {
      const ttfb = (navEntries[0] as NavTimingEntry).responseStart;
      if (ttfb > 0) {
        summary.ttfb = { value: ttfb, rating: getRating('TTFB', ttfb) };
      }
    }
  } catch (e) {
    // ignore
  }
  
  return summary;
}

export default { initWebVitals, getPerformanceSummary, getRating };
