/**
 * useCanvasAIInsights — S94-E1: Canvas AI Insights Hook
 *
 * Provides AI canvas insights data with fetch/optimize actions.
 * Wraps the canvasAIStore with API integration.
 */

import { useCallback } from 'react';
import { useCanvasAIStore, CanvasInsights } from '@/stores/canvasAIStore';

export type LayoutType = 'hierarchical' | 'force-directed';

interface OptimizeResult {
  ok: boolean;
  layout: LayoutType;
  updatedCount: number;
  nodePositions: Array<{ id: string; x: number; y: number }>;
}

/**
 * Fetch AI insights for a canvas from the backend API.
 */
async function fetchInsightsAPI(canvasId: string): Promise<CanvasInsights> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  const res = await fetch(`${baseUrl}/api/canvas/${canvasId}/insights`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<CanvasInsights>;
}

/**
 * Apply layout optimization via the backend API.
 */
async function applyOptimizeAPI(
  canvasId: string,
  layout: LayoutType
): Promise<OptimizeResult> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  const res = await fetch(`${baseUrl}/api/canvas/${canvasId}/optimize`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ layout }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<OptimizeResult>;
}

/**
 * Hook: useCanvasAIInsights
 * Returns current insights, loading state, error, and actions.
 */
export function useCanvasAIInsights(canvasId: string) {
  const insights = useCanvasAIStore((s) => s.insights);
  const isLoading = useCanvasAIStore((s) => s.isLoading);
  const error = useCanvasAIStore((s) => s.error);
  const isOptimizing = useCanvasAIStore((s) => s.isOptimizing);
  const setLoading = useCanvasAIStore((s) => s.setLoading);
  const setError = useCanvasAIStore((s) => s.setError);
  const setInsights = useCanvasAIStore((s) => s.setInsights);
  const setOptimizing = useCanvasAIStore((s) => s.setOptimizing);

  const fetchInsights = useCallback(async () => {
    if (!canvasId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInsightsAPI(canvasId);
      setInsights(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch insights';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [canvasId, setLoading, setError, setInsights]);

  const applyOptimize = useCallback(
    async (layout: LayoutType): Promise<OptimizeResult | null> => {
      if (!canvasId) return null;
      setOptimizing(true);
      setError(null);
      try {
        const result = await applyOptimizeAPI(canvasId, layout);
        // Refetch insights after optimization
        await fetchInsightsAPI(canvasId).then(setInsights).catch(() => {});
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to apply optimization';
        setError(message);
        return null;
      } finally {
        setOptimizing(false);
      }
    },
    [canvasId, setOptimizing, setError, setInsights]
  );

  const clearInsights = useCallback(() => {
    useCanvasAIStore.getState().clearInsights();
  }, []);

  return {
    insights,
    isLoading,
    error,
    isOptimizing,
    fetchInsights,
    applyOptimize,
    clearInsights,
  };
}
