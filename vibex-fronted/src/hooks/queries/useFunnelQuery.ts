import { useQuery } from '@tanstack/react-query';

export interface FunnelStep {
  name: string;
  count: number;
  rate: number;
}

export interface FunnelData {
  steps: FunnelStep[];
}

export function useFunnelQuery(range: '7d' | '30d' = '7d') {
  return useQuery<{ success: boolean; data: FunnelData }>({
    queryKey: ['funnel', range],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/funnel?range=${range}`);
      if (!res.ok) throw new Error(`Funnel API error: ${res.status}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5-minute TTL per AGENTS.md
    refetchInterval: 5 * 60 * 1000, // E4-U5: auto-refresh every 5 min
  });
}
