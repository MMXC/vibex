/**
 * Performance Dashboard
 * 
 * 性能监控仪表盘组件
 * 展示 Core Web Vitals 指标
 */

'use client';

import React, { useState, useEffect } from 'react';
import { getPerformanceSummary, getRating } from '@/lib/web-vitals';
import styles from './PerformanceDashboard.module.css';

interface PerformanceData {
  lcp?: { value: number; rating: string };
  fid?: { value: number; rating: string };
  cls?: { value: number; rating: string };
  fcp?: { value: number; rating: string };
  ttfb?: { value: number; rating: string };
}

export function PerformanceDashboard() {
  const [data, setData] = useState<PerformanceData>({});
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // 定期更新性能数据
    const updateData = () => {
      const summary = getPerformanceSummary();
      setData(summary);
    };

    // 初始加载
    updateData();

    // 定期更新 (每5秒)
    const interval = setInterval(updateData, 5000);

    return () => clearInterval(interval);
  }, []);

  // 格式化值
  const formatValue = (value?: number, unit: string = 'ms'): string => {
    if (value === undefined) return '-';
    return `${Math.round(value)}${unit}`;
  };

  // 获取评级样式
  const getRatingClass = (rating?: string): string => {
    switch (rating) {
      case 'good':
        return styles.ratingGood;
      case 'needs-improvement':
        return styles.ratingNeedsImprovement;
      case 'poor':
        return styles.ratingPoor;
      default:
        return '';
    }
  };

  // 指标定义
  const metrics = [
    { key: 'lcp', name: 'LCP', label: '最大内容绘制', description: '页面主要内容加载完成的时间' },
    { key: 'fid', name: 'FID', label: '首次输入延迟', description: '首次用户交互的响应时间' },
    { key: 'cls', name: 'CLS', label: '累积布局偏移', description: '页面视觉稳定性' },
    { key: 'fcp', name: 'FCP', label: '首次内容绘制', description: '首次内容出现在屏幕的时间' },
    { key: 'ttfb', name: 'TTFB', label: '首字节时间', description: '服务器响应时间' },
  ];

  return (
    <div className={`${styles.dashboard} ${isExpanded ? styles.expanded : ''}`}>
      {/* 标题 */}
      <div 
        className={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className={styles.title}>⚡ 性能指标</span>
        <span className={styles.toggle}>
          {isExpanded ? '−' : '+'}
        </span>
      </div>

      {/* 指标内容 */}
      {isExpanded && (
        <div className={styles.content}>
          {metrics.map(metric => {
            const metricData = data[metric.key as keyof PerformanceData];
            const value = metricData?.value;
            const rating = metricData?.rating;

            return (
              <div key={metric.key} className={styles.metric}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricName}>{metric.name}</span>
                  <span className={`${styles.metricValue} ${getRatingClass(rating)}`}>
                    {metric.key === 'cls' 
                      ? formatValue(value, '')
                      : formatValue(value)
                    }
                    {metric.key === 'cls' && <span className={styles.unit}>({Math.round((value || 0) * 100)}%)</span>}
                  </span>
                </div>
                <div className={styles.metricLabel}>{metric.label}</div>
                <div className={styles.progressBar}>
                  <div 
                    className={`${styles.progressFill} ${getRatingClass(rating)}`}
                    style={{ 
                      width: value !== undefined 
                        ? `${Math.min(100, (value / (metric.key === 'cls' ? 0.25 : metric.key === 'lcp' ? 4000 : metric.key === 'fid' ? 300 : 2000)) * 100)}%`
                        : '0%' 
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 底部状态 */}
      {isExpanded && (
        <div className={styles.footer}>
          <span className={styles.hint}>
            基于 Google Core Web Vitals 标准
          </span>
        </div>
      )}
    </div>
  );
}

export default PerformanceDashboard;
