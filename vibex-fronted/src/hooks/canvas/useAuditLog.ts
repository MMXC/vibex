/**
 * useAuditLog.ts — S94-E3: Canvas Audit Log Hook
 *
 * Fetches audit log entries from GET /api/canvas/{id}/audit-log.
 * Returns { entries, total, isLoading, error, fetchAuditLog, fetchNextPage }.
 */

import { useCallback } from 'react';
import { useAuditStore, AuditFilters, AuditLogEntry } from '@/stores/auditStore';

export function useAuditLog(canvasId: string) {
  const entries = useAuditStore((s) => s.entries);
  const total = useAuditStore((s) => s.total);
  const isLoading = useAuditStore((s) => s.isLoading);
  const error = useAuditStore((s) => s.error);
  const filters = useAuditStore((s) => s.filters);
  const limit = useAuditStore((s) => s.limit);
  const offset = useAuditStore((s) => s.offset);
  const setEntries = useAuditStore((s) => s.setEntries);
  const setLoading = useAuditStore((s) => s.setLoading);
  const setError = useAuditStore((s) => s.setError);
  const setOffset = useAuditStore((s) => s.setOffset);

  const buildQueryString = useCallback((f: AuditFilters, l: number, o: number) => {
    const params = new URLSearchParams();
    if (f.userId) params.set('user_id', f.userId);
    if (f.action && f.action !== 'all') params.set('action', f.action);
    if (f.from) params.set('from', f.from);
    if (f.to) params.set('to', f.to);
    params.set('limit', String(l));
    params.set('offset', String(o));
    return params.toString();
  }, []);

  const fetchAuditLog = useCallback(
    async (overrideFilters?: AuditFilters, overrideOffset?: number) => {
      const effectiveFilters = overrideFilters ?? filters;
      const effectiveOffset = overrideOffset ?? 0;
      setLoading(true);
      setError(null);

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? '' : '';
        const qs = buildQueryString(effectiveFilters, limit, effectiveOffset);
        const response = await fetch(`/api/canvas/${canvasId}/audit-log?${qs}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch audit log: ${response.status}`);
        }

        const data = (await response.json()) as { ok: boolean; entries: AuditLogEntry[]; total: number };
        if (!data.ok) {
          throw new Error('API returned ok=false');
        }

        setEntries(data.entries, data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch audit log');
      }
    },
    [canvasId, filters, limit, buildQueryString, setLoading, setError, setEntries]
  );

  const fetchNextPage = useCallback(async () => {
    const nextOffset = offset + limit;
    setOffset(nextOffset);
    await fetchAuditLog(filters, nextOffset);
  }, [offset, limit, filters, fetchAuditLog, setOffset]);

  const hasMore = offset + entries.length < total;

  return {
    entries,
    total,
    isLoading,
    error,
    hasMore,
    fetchAuditLog,
    fetchNextPage,
  };
}
