'use client';
/**
 * useCanvasComments — hook for managing canvas comment bubbles
 * S92-E3: Fetches/manages canvas comment bubbles + real-time updates
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { CanvasCommentBubble, CanvasComment } from '@/types/comment';

interface UseCanvasCommentsOptions {
  canvasId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;  // ms
}

export function useCanvasComments({
  canvasId,
  autoRefresh = false,
  refreshInterval = 15000,
}: UseCanvasCommentsOptions) {
  const [bubbles, setBubbles] = useState<CanvasCommentBubble[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchBubbles = useCallback(async () => {
    if (!canvasId) return;
    try {
      const res = await fetch(`/api/canvas/${canvasId}/comments/bubbles`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBubbles(data.bubbles || []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch bubbles');
    }
  }, [canvasId]);

  const createComment = useCallback(
    async (x: number, y: number, content: string, authorId: string, authorName: string) => {
      const res = await fetch(`/api/canvas/${canvasId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canvas_id: canvasId,
          x,
          y,
          content,
          author_id: authorId,
          author_name: authorName,
          mentions: [],
        }),
      });
      const data = await res.json();
      if (data.comment) {
        await fetchBubbles();
      }
      return data;
    },
    [canvasId, fetchBubbles]
  );

  const resolveComment = useCallback(
    async (commentId: string) => {
      const res = await fetch(`/api/canvas/${canvasId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: true }),
      });
      if (res.ok) {
        await fetchBubbles();
      }
    },
    [canvasId, fetchBubbles]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      const res = await fetch(`/api/canvas/${canvasId}/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchBubbles();
      }
    },
    [canvasId, fetchBubbles]
  );

  const updateComment = useCallback(
    async (commentId: string, content: string) => {
      const res = await fetch(`/api/canvas/${canvasId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        await fetchBubbles();
      }
    },
    [canvasId, fetchBubbles]
  );

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    fetchBubbles().finally(() => setLoading(false));
  }, [fetchBubbles]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchBubbles, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchBubbles]);

  return {
    bubbles,
    loading,
    error,
    createComment,
    resolveComment,
    deleteComment,
    updateComment,
    refreshBubbles: fetchBubbles,
  };
}
