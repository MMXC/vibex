/**
 * useTrendData — Analytics 趋势数据查询
 * E06 S4: 获取 /api/analytics/funnel 趋势数据
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';

interface TrendDataPoint {
  date: string;
  conversionRate: number;
  trend?: number;
}

interface TrendResponse {
  data: TrendDataPoint[];
  summary: {
    totalViews: number;
    totalConversions: number;
    avgConversionRate: number;
    overallTrend: number;
  };
}

export function useTrendData(range: '7d' | '30d' | '90d' = '30d') {
  return useQuery({
    queryKey: ['analytics', 'trend', range],
    queryFn: async (): Promise<TrendResponse> => {
      const res = await fetch(`/api/analytics/funnel?range=${range}`);
      if (!res.ok) throw new Error('Failed to fetch trend data');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5min cache
    retry: 1,
  });
}