/**
 * analytics.ts — Canvas Analytics API client
 * S95-E1: Canvas Analytics Dashboard
 */

export type AnalyticsRange = '7d' | '30d' | '90d';

export interface DailyTrendPoint {
  date: string;
  views: number;
  edits: number;
}

export interface CanvasAnalytics {
  views: {
    today: number;
    week: number;
    month: number;
  };
  editCount: number;
  uniqueUsers: number;
  shareCount: number;
  exportCount: number;
  dailyTrend: DailyTrendPoint[];
}

export async function fetchCanvasAnalytics(
  canvasId: string,
  range: AnalyticsRange = '7d'
): Promise<CanvasAnalytics> {
  const res = await fetch(`/api/canvas/${canvasId}/analytics?range=${range}`);
  const data = (await res.json()) as { ok: boolean; error?: string } & CanvasAnalytics;
  if (!data.ok) throw new Error(data.error || 'Failed to fetch analytics');
  return data;
}
