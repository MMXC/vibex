/**
 * useQualityData — CI 质量数据 hook
 * E5 S5.2 + S5.3: CI 质量仪表盘 + 质量异常报警
 *
 * 从 /api/quality/metrics 获取数据
 * - E2E 通过率 < 90% 时自动触发 Slack 报警（S5.3）
 * - 5 分钟自动刷新
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

export interface QualityMetrics {
  /** E2E 测试通过率 (%) */
  e2ePassRate: number;
  /** CI 构建状态 */
  ciBuildStatus: 'success' | 'failed' | 'running' | 'pending';
  /** TypeScript 错误数 */
  tsErrorCount: number;
  /** 构建时长 (秒) */
  buildDuration: number;
  /** 最近更新时间 */
  updatedAt: number;
  /** E2E 通过率历史 (最近7天) */
  e2ePassRateHistory: Array<{ date: string; rate: number }>;
  /** TS 错误数历史 (最近7天) */
  tsErrorHistory: Array<{ date: string; count: number }>;
  /** 构建状态历史 */
  buildStatusHistory: Array<{ date: string; status: QualityMetrics['ciBuildStatus'] }>;
}

export interface UseQualityDataReturn {
  data: QualityMetrics | undefined;
  error: Error | null;
  loading: boolean;
  isAlarming: boolean;
  lastAlertTime: number | null;
}

let lastAlertTime: number | null = null;
const ALERT_COOLDOWN_MS = 30 * 60 * 1000; // 30 分钟报警冷却

/** 触发 Slack 报警 (通过 Feedback API) */
async function triggerAlert(metrics: QualityMetrics): Promise<void> {
  const now = Date.now();
  // 冷却检查
  if (lastAlertTime && now - lastAlertTime < ALERT_COOLDOWN_MS) {
    return;
  }

  const messages: string[] = [];
  if (metrics.e2ePassRate < 90) {
    messages.push(`⚠️ E2E 通过率过低: **${metrics.e2ePassRate}%** (目标 ≥90%)`);
  }
  if (metrics.tsErrorCount > 0) {
    messages.push(`🔴 TypeScript 错误: **${metrics.tsErrorCount}** 个`);
  }
  if (metrics.ciBuildStatus === 'failed') {
    messages.push(`❌ CI 构建失败`);
  }

  if (messages.length === 0) return;

  const alertPayload = {
    title: '🚨 CI 质量异常报警',
    content: messages.join('\n'),
    timestamp: now,
  };

  try {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertPayload),
    });
    lastAlertTime = now;
  } catch {
    // 报警失败不影响主流程
    console.error('[useQualityData] Alert trigger failed');
  }
}

/**
 * 获取 CI 质量指标
 * - 5 分钟自动刷新
 * - E2E 通过率 < 90% 时自动报警
 */
export function useQualityData(): UseQualityDataReturn {
  const { data, error, isLoading } = useQuery<QualityMetrics, Error>({
    queryKey: ['quality', 'metrics'],
    queryFn: () => fetch('/api/quality/metrics').then((r) => r.json()),
    staleTime: 5 * 60 * 1000, // 5 分钟
    refetchInterval: 5 * 60 * 1000, // 5 分钟自动刷新
  });

  // S5.3: 质量异常报警逻辑
  useEffect(() => {
    if (!data) return;
    if (data.e2ePassRate < 90 || data.ciBuildStatus === 'failed') {
      triggerAlert(data);
    }
  }, [data]);

  return {
    data,
    error: error ?? null,
    loading: isLoading,
    isAlarming: Boolean(data && (data.e2ePassRate < 90 || data.ciBuildStatus === 'failed')),
    lastAlertTime,
  };
}
