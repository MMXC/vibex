/**
 * analyticsStore.test.ts — Vitest tests for analyticsStore
 * S95-E1: Canvas Analytics Dashboard
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAnalyticsStore } from '../analyticsStore';

const mockFetch = vi.fn();

vi.stubGlobal('fetch', mockFetch);

describe('analyticsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsStore.setState({
      isPanelOpen: false,
      currentCanvasId: null,
      range: '7d',
      analytics: null,
      isLoading: false,
      error: null,
    });
  });

  describe('initial state', () => {
    it('has correct initial values', () => {
      const state = useAnalyticsStore.getState();
      expect(state.isPanelOpen).toBe(false);
      expect(state.currentCanvasId).toBe(null);
      expect(state.range).toBe('7d');
      expect(state.analytics).toBe(null);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });
  });

  describe('fetchAnalytics success', () => {
    it('sets analytics data on successful fetch', async () => {
      const mockData = {
        ok: true,
        views: { today: 12, week: 35, month: 120 },
        editCount: 8,
        uniqueUsers: 5,
        shareCount: 2,
        exportCount: 1,
        dailyTrend: [
          { date: '2026-06-07', views: 5, edits: 2 },
          { date: '2026-06-08', views: 3, edits: 1 },
        ],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const { fetchAnalytics } = useAnalyticsStore.getState();
      await fetchAnalytics('canvas-001', '7d');

      const state = useAnalyticsStore.getState();
      expect(state.analytics).toMatchObject({
        views: { today: 12, week: 35, month: 120 },
        editCount: 8,
        uniqueUsers: 5,
        shareCount: 2,
        exportCount: 1,
        dailyTrend: mockData.dailyTrend,
      });
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.currentCanvasId).toBe('canvas-001');
      expect(state.range).toBe('7d');
    });
  });

  describe('fetchAnalytics error', () => {
    it('sets error on failed fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ ok: false, error: 'Server error' }),
      });

      const { fetchAnalytics } = useAnalyticsStore.getState();
      await fetchAnalytics('canvas-001');

      const state = useAnalyticsStore.getState();
      expect(state.error).toBe('Server error');
      expect(state.isLoading).toBe(false);
      expect(state.analytics).toBe(null);
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { fetchAnalytics } = useAnalyticsStore.getState();
      await fetchAnalytics('canvas-001');

      const state = useAnalyticsStore.getState();
      expect(state.error).toBe('Network error');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('setRange', () => {
    it('updates range and refetches analytics', async () => {
      const mockData = {
        ok: true,
        views: { today: 5, week: 20, month: 80 },
        editCount: 3,
        uniqueUsers: 2,
        shareCount: 1,
        exportCount: 0,
        dailyTrend: [],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      useAnalyticsStore.setState({ currentCanvasId: 'canvas-001', analytics: null });
      const { setRange } = useAnalyticsStore.getState();
      setRange('30d');

      expect(useAnalyticsStore.getState().range).toBe('30d');
      expect(mockFetch).toHaveBeenCalledWith('/api/canvas/canvas-001/analytics?range=30d');
    });
  });

  describe('exportCSV', () => {
    it('exports CSV when analytics data exists', async () => {
      const clickSpy = vi.fn();
      const revokeSpy = vi.fn();
      vi.stubGlobal('URL', {
        createObjectURL: vi.fn(() => 'blob:test-url'),
        revokeObjectURL: revokeSpy,
      });
      vi.stubGlobal('document', {
        createElement: vi.fn(() => ({ href: '', download: '', click: clickSpy })),
      });

      useAnalyticsStore.setState({
        analytics: {
          views: { today: 5, week: 20, month: 80 },
          editCount: 3,
          uniqueUsers: 2,
          shareCount: 1,
          exportCount: 0,
          dailyTrend: [{ date: '2026-06-13', views: 5, edits: 2 }],
        },
      });

      const { exportCSV } = useAnalyticsStore.getState();
      await exportCSV('canvas-001');

      expect(clickSpy).toHaveBeenCalled();
      expect(revokeSpy).toHaveBeenCalledWith('blob:test-url');
    });
  });
});
