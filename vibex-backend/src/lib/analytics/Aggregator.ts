/**
 * Aggregator — 内存聚合分析
 * E06 S2: 历史数据聚合 + 趋势计算
 */

export interface AnalyticsFunnel {
  date: string; // YYYY-MM-DD
  views: number;
  interactions: number;
  conversions: number;
  conversionRate: number; // 0-1
  trend?: number; // 与前一天差值 (percentage points, e.g. 0.05 = +5%)
}

export interface AggregatorOptions {
  range?: '7d' | '30d' | '90d';
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * 模拟生成历史趋势数据（V1 内存聚合，无真实 schema）
 * 现实场景中应从 DB 查询 projectId 对应的 analytics events
 */
export function aggregateHistoricalData(
  projectId: string,
  range: '7d' | '30d' | '90d' = '30d'
): { data: AnalyticsFunnel[]; summary: Record<string, number> } {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const data: AnalyticsFunnel[] = [];

  // 生成模拟趋势数据（带随机波动，模拟真实趋势）
  const seed = projectId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  let baseRate = 0.1 + (seed % 20) / 100; // 10%~30% 基准转化率
  let prevRate = baseRate;

  for (let i = days; i >= 0; i--) {
    const date = daysAgo(i);
    const views = Math.floor(100 + (seed * (i + 1)) % 500);
    const rawRate = baseRate + (Math.sin(i / 5) * 0.05) + (Math.random() * 0.04 - 0.02);
    const rate = Math.max(0.01, Math.min(0.99, rawRate));
    const conversions = Math.floor(views * rate);
    const interactions = Math.floor(views * (0.3 + (seed % 10) / 50));
    const trend = i < days ? rate - prevRate : undefined;
    prevRate = rate;

    data.push({
      date,
      views,
      interactions,
      conversions,
      conversionRate: Math.round(rate * 1000) / 1000,
      trend: trend !== undefined ? Math.round(trend * 1000) / 1000 : undefined,
    });
  }

  // 计算 summary
  const avgRate = data.reduce((s, d) => s + d.conversionRate, 0) / data.length;
  const totalViews = data.reduce((s, d) => s + d.views, 0);
  const totalConversions = data.reduce((s, d) => s + d.conversions, 0);
  const firstRate = data[0]?.conversionRate ?? 0;
  const lastRate = data[data.length - 1]?.conversionRate ?? 0;
  const overallTrend = firstRate > 0 ? (lastRate - firstRate) / firstRate : 0;

  return {
    data,
    summary: {
      totalViews,
      totalConversions,
      avgConversionRate: Math.round(avgRate * 1000) / 1000,
      overallTrend: Math.round(overallTrend * 1000) / 1000,
    },
  };
}