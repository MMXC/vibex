/**
 * /api/templates/analytics — Template Author Analytics API
 *
 * S91-E4: Template Analytics Dashboard
 *
 * GET /api/templates/analytics — Get analytics for all templates owned by the authenticated user
 *   Query params:
 *     - range?: '7d' | '30d' | '90d' (default: '7d')
 *   Returns: { ok: boolean; analytics: TemplateAnalytics[] }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { queryDB, safeError, Env } from '@/lib/db';

export const dynamic = 'force-dynamic';

type TimeRange = '7d' | '30d' | '90d';

interface TemplateAnalytics {
  templateId: string;
  title: string;
  views: number;
  uses: number;
  rating: number;
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

    // Map range to days number for future use
    const rangeDays = range === '7d' ? 7 : range === '30d' ? 30 : 90;

    void rangeDays; // reserved for future time-based filtering

    const rows = await queryDB<{
      id: string;
      name: string;
      usage_count: number;
      avg_rating: number;
    }>(
      env,
      `SELECT id, name, usage_count, avg_rating
       FROM templates
       WHERE author_id = ?`,
      [user.id]
    );

    const analytics: TemplateAnalytics[] = rows.map((r) => ({
      templateId: r.id,
      title: r.name,
      views: 0, // views column not yet in schema; reserved for future
      uses: r.usage_count,
      rating: Math.round(r.avg_rating * 10) / 10,
    }));

    return NextResponse.json({ ok: true, analytics });
  } catch (err) {
    safeError('[TemplateAnalytics GET] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
