/**
 * auditStore.ts — S94-E3: Canvas Audit Log
 *
 * Manages audit log entries, filters, and panel state for the canvas audit log.
 * Fetches from GET /api/canvas/{id}/audit-log.
 */

import { create } from 'zustand';

export type AuditAction = 'create' | 'update' | 'delete' | 'share' | 'permission' | 'all';

export interface AuditLogEntry {
  id: string;
  canvasId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditFilters {
  userId?: string;
  action?: AuditAction;
  from?: string;
  to?: string;
}

interface AuditLogState {
  /** Whether the audit log panel is open */
  isPanelOpen: boolean;
  /** Current canvas ID being audited */
  canvasId: string | null;
  /** Audit entries */
  entries: AuditLogEntry[];
  /** Total count (for pagination) */
  total: number;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Filters */
  filters: AuditFilters;
  /** Pagination */
  limit: number;
  offset: number;
  /** Open the panel for a specific canvas */
  openPanel(canvasId: string): void;
  /** Close the panel */
  closePanel(): void;
  /** Set filters */
  setFilters(filters: Partial<AuditFilters>): void;
  /** Clear all filters */
  clearFilters(): void;
  /** Set entries */
  setEntries(entries: AuditLogEntry[], total: number): void;
  /** Set loading state */
  setLoading(loading: boolean): void;
  /** Set error */
  setError(error: string | null): void;
  /** Set pagination */
  setOffset(offset: number): void;
  /** Export audit log as CSV */
  exportCSV(canvasId: string): Promise<void>;
}

const ACTION_LABELS: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  share: '分享',
  permission: '权限',
};

const ENTITY_LABELS: Record<string, string> = {
  canvas: '画布',
  share_link: '分享链接',
  node: '节点',
  comment: '评论',
  permission: '权限',
};

export function formatAuditAction(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export function formatEntityType(type: string): string {
  return ENTITY_LABELS[type] ?? type;
}

function entriesToCSV(entries: AuditLogEntry[]): string {
  const header = 'ID,Canvas ID,用户,操作,实体类型,实体ID,详情,时间';
  const rows = entries.map((e) => [
    e.id,
    e.canvasId,
    e.userId,
    formatAuditAction(e.action),
    formatEntityType(e.entityType),
    e.entityId ?? '',
    e.details ? JSON.stringify(e.details) : '',
    e.createdAt,
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
  return [header, ...rows].join('\n');
}

export const useAuditStore = create<AuditLogState>()((set, get) => ({
  isPanelOpen: false,
  canvasId: null,
  entries: [],
  total: 0,
  isLoading: false,
  error: null,
  filters: {},
  limit: 50,
  offset: 0,

  openPanel(canvasId: string) {
    set({ isPanelOpen: true, canvasId, entries: [], total: 0, error: null, offset: 0, filters: {} });
  },

  closePanel() {
    set({ isPanelOpen: false });
  },

  setFilters(filters) {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      offset: 0,
    }));
  },

  clearFilters() {
    set({ filters: {}, offset: 0 });
  },

  setEntries(entries, total) {
    set({ entries, total, isLoading: false, error: null });
  },

  setLoading(loading) {
    set({ isLoading: loading });
  },

  setError(error) {
    set({ error, isLoading: false });
  },

  setOffset(offset) {
    set({ offset });
  },

  async exportCSV(canvasId: string) {
    try {
      const response = await fetch('/api/admin/export-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined'
            ? { Authorization: `Bearer ${localStorage.getItem('authToken') ?? ''}` }
            : {}),
        },
        body: JSON.stringify({ canvasId, format: 'csv' }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${canvasId}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Export failed' });
    }
  },
}));
