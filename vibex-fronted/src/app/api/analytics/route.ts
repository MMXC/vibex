/**
 * /api/analytics — Analytics GET endpoint (App Router)
 *
 * E1-S1 fix: Unified PRD contract
 * PRD defines GET /api/v1/analytics returns:
 *   { success, data: { page_view/canvas_open/component_create/delivery_export }, meta }
 *
 * Backend (v1/analytics.ts) stores raw events with event name + timestamp.
 * This route transforms raw events into the PRD aggregation format.
 *
 * Frontend AnalyticsWidget expects:
 *   { metrics: MetricData, period: { start, end } }
 *
 * Resolution:
 *   1. Fetches raw events from backend (or D1 directly if available)
 *   2. Aggregates by metric type and daily buckets
 *   3. Returns the unified PRD contract format
 */

export const dynamic = 'force-static';

import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top';
const ANALYTICS_ENDPOINT = `${BACKEND_URL}/api/v1/analytics`;

// Map raw event names to PRD metric categories
// PRD metrics: page_view, canvas_open, component_create, delivery_export
const METRIC_MAP: Record<string, keyof typeof METRIC_CONFIG | null> = {
  page_view: 'page_view',
  canvas_open: 'canvas_open',
  component_create: 'component_create',
  delivery_export: 'delivery_export',
  // Aliases from analytics/client.ts
  project_create: null,       // tracked but not shown in dashboard widget
  treemap_complete: null,
  ai_generate: null,
  export: 'delivery_export',  // aliased to delivery_export
  collab_enabled: null,
  node_sync: null,
  health_warning: null,
};

const METRIC_CONFIG = {
  page_view: { label: '页面浏览' },
  canvas_open: { label: '画布打开' },
  component_create: { label: '组件创建' },
  delivery_export: { label: '交付导出' },
} as const;

type MetricKey = keyof typeof METRIC_CONFIG;

interface RawEvent {
  id: string;
  event: string;
  sessionId?: string;
  userId?: string;
  properties?: Record<string, unknown>;
  createdAt: number;
  expiresAt: number;
}

interface MetricPoint {
  date: string;
  count: number;
}

type MetricData = Record<MetricKey, MetricPoint[]>;

interface AggregationResult {
  metrics: MetricData;
  meta: {
    start_date: string;
    end_date: string;
    total_days: number;
  };
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\//g, '-');
}

/**
 * Aggregate raw events into daily metric buckets
 */
function aggregateEvents(events: RawEvent[]): AggregationResult {
  // Initialize 7-day buckets
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const buckets: Record<string, Record<string, number>> = {};

  // Initialize all metrics for all 7 days
  for (const metricKey of Object.keys(METRIC_CONFIG) as MetricKey[]) {
    buckets[metricKey] = {};
  }

  // Aggregate events
  for (const ev of events) {
    const metricName = METRIC_MAP[ev.event];
    if (!metricName) continue;

    const dateStr = formatDate(ev.createdAt);
    buckets[metricName]![dateStr] = (buckets[metricName]![dateStr] ?? 0) + 1;
  }

  // Build result
  const startDate = formatDate(sevenDaysAgo);
  const endDate = formatDate(now);

  // Collect all unique dates
  const allDates = new Set<string>();
  for (const metricKey of Object.keys(METRIC_CONFIG) as MetricKey[]) {
    Object.keys(buckets[metricKey]).forEach(d => allDates.add(d));
  }
  const sortedDates = Array.from(allDates).sort();

  const metrics: MetricData = {} as MetricData;
  for (const metricKey of Object.keys(METRIC_CONFIG) as MetricKey[]) {
    const metricBuckets = buckets[metricKey];
    metrics[metricKey] = sortedDates.map(date => ({
      date,
      count: metricBuckets[date] ?? 0,
    }));
  }

  return {
    metrics,
    meta: {
      start_date: startDate,
      end_date: endDate,
      total_days: sortedDates.length || 7,
    },
  };
}

export async function GET() {
  try {
    // Fetch raw events from backend
    const backendRes = await fetch(ANALYTICS_ENDPOINT, {
      next: { revalidate: 60 }, // Cache for 60s (analytics don't need real-time)
    });

    let rawEvents: RawEvent[] = [];

    if (backendRes.ok) {
      const json = await backendRes.json();
      // Handle both legacy {events: [...]} and new {_fallback: true} formats
      rawEvents = Array.isArray(json.events) ? json.events : [];
    }

    const result = aggregateEvents(rawEvents);

    return NextResponse.json({
      success: true,
      data: result.metrics,
      meta: result.meta,
    });
  } catch (err) {
    // Graceful degradation: return empty data on error
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const emptyMetrics = Object.keys(METRIC_CONFIG).reduce((acc, key) => {
      acc[key as MetricKey] = [];
      return acc;
    }, {} as MetricData);

    return NextResponse.json({
      success: false,
      data: emptyMetrics,
      meta: {
        start_date: formatDate(sevenDaysAgo),
        end_date: formatDate(now),
        total_days: 7,
      },
    });
  }
}
