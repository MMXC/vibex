/**
 * GET /api/analytics/funnel
 * Analytics 趋势分析 API
 * E06 S1: 30 天日/周聚合数据
 *
 * Query params:
 *   range=7d|30d|90d (default: 30d)
 *   projectId=xxx (optional, for multi-project)
 */
import { NextRequest, NextResponse } from 'next/server';
import { safeError } from '@/lib/log-sanitizer';
import { aggregateHistoricalData } from '@/lib/analytics/Aggregator';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const range = (searchParams.get('range') ?? '30d') as '7d' | '30d' | '90d';
    const projectId = searchParams.get('projectId') ?? 'default';

    const validRanges = ['7d', '30d', '90d'];
    if (!validRanges.includes(range)) {
      return NextResponse.json(
        { error: 'INVALID_RANGE', message: 'range must be 7d, 30d, or 90d' },
        { status: 400 }
      );
    }

    const result = aggregateHistoricalData(projectId, range);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    safeError('[analytics/funnel] Error:', err);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Analytics 数据获取失败' },
      { status: 500 }
    );
  }
}