/**
 * /api/templates/analytics/export — Template Analytics CSV Export API
 *
 * S91-E4: Template Analytics Dashboard
 *
 * GET /api/templates/analytics/export — Export analytics as CSV
 *   Query params:
 *     - range?: '7d' | '30d' | '90d' (default: '7d')
 *   Returns: CSV file download
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { queryDB, safeError, Env } from '@/lib/db';

export const dynamic = 'force-dynamic';

type TimeRange = '7d' | '30d' | '90d';

interface TemplateRow {
  id: string;
  name: string;
  usage_count: number;
  avg_rating: number;
  rating_count: number;
}

export async function GET(
  request: NextRequest,
  { env }: { env: Env }
) {
  const { success, user } = getAuthUserFromRequest(request);
  if (!success || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawRange = searchParams.get('range') || '7d';
    const validRanges: TimeRange[] = ['7d', '30d', '90d'];
    const range = validRanges.includes(rawRange as TimeRange) ? (rawRange as TimeRange) : '7d';

    void range; // reserved for future time-based filtering

    const rows = await queryDB<TemplateRow>(
      env,
      `SELECT id, name, usage_count, avg_rating, rating_count
       FROM templates
       WHERE author_id = ?`,
      [user.id]
    );

    // Get comment count per template
    const templateIds = rows.map((r) => r.id);
    const commentsMap: Record<string, number> = {};

    if (templateIds.length > 0) {
      const placeholders = templateIds.map(() => '?').join(',');
      const commentCounts = await queryDB<{ template_id: string; comment_cnt: number }>(
        env,
        `SELECT template_id, COUNT(*) as comment_cnt
         FROM template_ratings
         WHERE template_id IN (${placeholders}) AND comment != ''
         GROUP BY template_id`,
        templateIds
      );
      for (const row of commentCounts) {
        commentsMap[row.template_id] = row.comment_cnt;
      }
    }

    const date = new Date().toISOString().split('T')[0];
    const csvHeader = 'templateId,title,views,uses,rating,comments';
    const csvRows = rows.map((r) => {
      const title = `"${r.name.replace(/"/g, '""')}"`;
      return [r.id, title, 0, r.usage_count, Math.round(r.avg_rating * 10) / 10, commentsMap[r.id] ?? 0].join(',');
    });
    const csv = [csvHeader, ...csvRows].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=template-analytics-${date}.csv`,
      },
    });
  } catch (err) {
    safeError('[TemplateAnalyticsExport GET] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
