/**
 * /api/quality/metrics — CI 质量指标接口
 * E5 S5.2: CI 质量仪表盘数据源
 *
 * GET: 返回最新的 CI 质量指标 (mock 数据)
 *
 * 数据来自 CI webhook，在生产环境应替换为真实数据源
 */
import { NextResponse } from 'next/server';
import type { QualityMetrics } from '@/hooks/useQualityData';

// Mock 数据 — 实际部署时应从 CI webhook 或数据库获取
function getMockMetrics(): QualityMetrics {
  const now = Date.now();
  const today = new Date();

  // 生成最近 7 天历史数据
  const e2ePassRateHistory = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const rate = 85 + Math.floor(Math.random() * 12); // 85-97%
    return {
      date: d.toISOString().slice(0, 10),
      rate,
    };
  });

  const tsErrorHistory = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toISOString().slice(0, 10),
      count: Math.floor(Math.random() * 5),
    };
  });

  const buildStatusHistory: Array<{ date: string; status: QualityMetrics['ciBuildStatus'] }> = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const rand = Math.random();
    const status: QualityMetrics['ciBuildStatus'] = rand > 0.8 ? 'failed' : rand > 0.3 ? 'success' : 'running';
    return { date: d.toISOString().slice(0, 10), status };
  });

  return {
    e2ePassRate: 92,
    ciBuildStatus: 'success',
    tsErrorCount: 1,
    buildDuration: 180,
    updatedAt: now,
    e2ePassRateHistory,
    tsErrorHistory,
    buildStatusHistory,
  };
}

export async function GET() {
  const metrics = getMockMetrics();
  return NextResponse.json(metrics);
}
