/**
 * GET /api/v1/canvas/health
 * Canvas API 健康检查端点
 */
import { NextResponse } from 'next/server';
import { getLocalEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const env = getLocalEnv();
  const hasApiKey = !!env.MINIMAX_API_KEY;

  return NextResponse.json(
    {
      status: hasApiKey ? 'healthy' : 'degraded',
      hasApiKey,
      timestamp: new Date().toISOString(),
      endpoints: {
        'generate-contexts': '/api/v1/canvas/generate-contexts',
        'generate-flows': '/api/v1/canvas/generate-flows',
        'generate-components': '/api/v1/canvas/generate-components',
      },
    },
    { status: hasApiKey ? 200 : 503 }
  );
}
