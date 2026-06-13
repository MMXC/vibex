/**
 * /api/canvas/[id]/analytics — Canvas Analytics API
 * Sprint95 E1: Canvas Analytics Dashboard
 *
 * GET — Get analytics for a canvas
 * Query params:
 *   range — "7d" | "30d" | "90d" (default: "7d")
 *
 * Auth: required
 * Returns: { ok: true, views: { today, week, month }, editCount, uniqueUsers, shareCount, exportCount, dailyTrend: [{ date, views, edits }] }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { queryDB, Env } from '@/lib/db';
import { safeError } from '@/lib/logger/safeError';

export const runtime = 'edge';

type Range = '7d' | '30d' | '90d';

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function todayStart(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function nowISO(): string {
  return new Date().toISOString();
}

function getDateRange(range: Range): { start: string; days: number } {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return { start: daysAgo(days), days };
}

function dateRangeForTrend(range: Range): string[] {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

// GET /api/canvas/[id]/analytics
export async function GET(
  request: NextRequest,
  { params, env }: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: canvasId } = await params;
    const { searchParams } = new URL(request.url);

    const rawRange = searchParams.get('range') ?? '7d';
    const range: Range = (rawRange === '30d' || rawRange === '90d' ? rawRange : '7d') as Range;

    const now = nowISO();
    const today = todayStart();
    const weekStart = daysAgo(7);
    const monthStart = daysAgo(30);
    const { start: rangeStart, days } = getDateRange(range);

    // Views: today, week, month
    const [viewsTodayRows, viewsWeekRows, viewsMonthRows] = await Promise.all([
      queryDB<{ cnt: number }>(env, `SELECT COUNT(*) as cnt FROM audit_log WHERE canvas_id = ? AND action = 'view' AND created_at >= ?`, [canvasId, today]),
      queryDB<{ cnt: number }>(env, `SELECT COUNT(*) as cnt FROM audit_log WHERE canvas_id = ? AND action = 'view' AND created_at >= ?`, [canvasId, weekStart]),
      queryDB<{ cnt: number }>(env, `SELECT COUNT(*) as cnt FROM audit_log WHERE canvas_id = ? AND action = 'view' AND created_at >= ?`, [canvasId, monthStart]),
    ]);

    // Edit count: 'update' or 'create' actions
    const editCountRows = await queryDB<{ cnt: number }>(
      env,
      `SELECT COUNT(*) as cnt FROM audit_log WHERE canvas_id = ? AND action IN ('update', 'create') AND created_at >= ?`,
      [canvasId, rangeStart]
    );

    // Unique users
    const uniqueUsersRows = await queryDB<{ cnt: number }>(
      env,
      `SELECT COUNT(DISTINCT user_id) as cnt FROM audit_log WHERE canvas_id = ? AND created_at >= ?`,
      [canvasId, rangeStart]
    );

    // Share count
    const shareCountRows = await queryDB<{ cnt: number }>(
      env,
      `SELECT COUNT(*) as cnt FROM audit_log WHERE canvas_id = ? AND action = 'share' AND created_at >= ?`,
      [canvasId, rangeStart]
    );

    // Export count
    const exportCountRows = await queryDB<{ cnt: number }>(
      env,
      `SELECT COUNT(*) as cnt FROM audit_log WHERE canvas_id = ? AND action IN ('export', 'export_canvas') AND created_at >= ?`,
      [canvasId, rangeStart]
    );

    // Daily trend: views and edits per day using GROUP BY date(created_at)
    const trendRows = await queryDB<{ day: string; views: number; edits: number }>(
      env,
      `SELECT
        date(created_at) as day,
        SUM(CASE WHEN action = 'view' THEN 1 ELSE 0 END) as views,
        SUM(CASE WHEN action IN ('update', 'create') THEN 1 ELSE 0 END) as edits
       FROM audit_log
       WHERE canvas_id = ? AND created_at >= ?
       GROUP BY date(created_at)
       ORDER BY day ASC`,
      [canvasId, rangeStart]
    );

    // Fill in missing days with zeros
    const trendMap = new Map<string, { views: number; edits: number }>();
    for (const row of trendRows) {
      trendMap.set(row.day, { views: Number(row.views), edits: Number(row.edits) });
    }
    const trendDates = dateRangeForTrend(range);
    const dailyTrend = trendDates.map((date) => ({
      date,
      views: trendMap.get(date)?.views ?? 0,
      edits: trendMap.get(date)?.edits ?? 0,
    }));

    return NextResponse.json({
      ok: true,
      views: {
        today: Number(viewsTodayRows[0]?.cnt ?? 0),
        week: Number(viewsWeekRows[0]?.cnt ?? 0),
        month: Number(viewsMonthRows[0]?.cnt ?? 0),
      },
      editCount: Number(editCountRows[0]?.cnt ?? 0),
      uniqueUsers: Number(uniqueUsersRows[0]?.cnt ?? 0),
      shareCount: Number(shareCountRows[0]?.cnt ?? 0),
      exportCount: Number(exportCountRows[0]?.cnt ?? 0),
      dailyTrend,
    });
  } catch (err) {
    safeError('[CanvasAnalytics GET] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
