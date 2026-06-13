/**
 * analyticsStore.ts — S95-E1: Canvas Analytics Dashboard
 *
 * Manages analytics data for the canvas analytics dashboard.
 * Fetches from GET /api/canvas/{id}/analytics.
 */

import { create } from 'zustand';

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

interface AnalyticsState {
  /** Whether the analytics panel is open */
  isPanelOpen: boolean;
  /** Current canvas ID being analyzed */
  currentCanvasId: string | null;
  /** Selected time range */
  range: AnalyticsRange;
  /** Analytics data */
  analytics: CanvasAnalytics | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Open the panel for a specific canvas */
  openPanel(canvasId: string): void;
  /** Close the panel */
  closePanel(): void;
  /** Fetch analytics for a canvas */
  fetchAnalytics(canvasId: string, range?: AnalyticsRange): Promise<void>;
  /** Set time range */
  setRange(range: AnalyticsRange): void;
  /** Export analytics as CSV */
  exportCSV(canvasId: string): Promise<void>;
}

function analyticsToCSV(analytics: CanvasAnalytics): string {
  const header = 'Date,Views,Edits';
  const rows = analytics.dailyTrend.map((d) =>
    [d.date, d.views, d.edits].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
  );
  const summary = [
    '',
    'Summary',
    `Views Today,${analytics.views.today}`,
    `Views This Week,${analytics.views.week}`,
    `Views This Month,${analytics.views.month}`,
    `Edit Count,${analytics.editCount}`,
    `Unique Users,${analytics.uniqueUsers}`,
    `Share Count,${analytics.shareCount}`,
    `Export Count,${analytics.exportCount}`,
  ];
  return [header, ...rows, ...summary].join('\n');
}

export const useAnalyticsStore = create<AnalyticsState>()((set, get) => ({
  isPanelOpen: false,
  currentCanvasId: null,
  range: '7d',
  analytics: null,
  isLoading: false,
  error: null,

  openPanel(canvasId: string) {
    const { currentCanvasId, range, fetchAnalytics } = get();
    set({ isPanelOpen: true, currentCanvasId: canvasId, error: null });
    if (currentCanvasId !== canvasId) {
      fetchAnalytics(canvasId, range);
    }
  },

  closePanel() {
    set({ isPanelOpen: false });
  },

  async fetchAnalytics(canvasId: string, range?: AnalyticsRange) {
    const r = range ?? get().range;
    set({ isLoading: true, error: null, analytics: null });
    try {
      const res = await fetch(`/api/canvas/${canvasId}/analytics?range=${r}`);
      const data = (await res.json()) as { ok: boolean; error?: string } & CanvasAnalytics;
      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch analytics');
      }
      set({
        analytics: {
          views: data.views,
          editCount: data.editCount,
          uniqueUsers: data.uniqueUsers,
          shareCount: data.shareCount,
          exportCount: data.exportCount,
          dailyTrend: data.dailyTrend,
        },
        currentCanvasId: canvasId,
        range: r,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch analytics',
        isLoading: false,
      });
    }
  },

  setRange(range: AnalyticsRange) {
    const { currentCanvasId, fetchAnalytics } = get();
    set({ range });
    if (currentCanvasId) {
      fetchAnalytics(currentCanvasId, range);
    }
  },

  async exportCSV(canvasId: string) {
    const { analytics } = get();
    if (!analytics) return;
    try {
      const csv = analyticsToCSV(analytics);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${canvasId}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Export failed' });
    }
  },
}));
