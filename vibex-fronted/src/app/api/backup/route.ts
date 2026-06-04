/**
 * /api/backup/route.ts — Cloud backup API
 *
 * GET /api/backup?canvasId=xxx — List cloud backups for a canvas
 * POST /api/backup — Create a new cloud backup (upload canvas state)
 *
 * S62-E3: Canvas Cloud Backup and Recovery
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

const BACKEND_URL = process.env.VIBEX_BACKEND_URL ?? 'https://api.vibex.top';

/** List cloud backups for a canvas */
export async function GET(request: NextRequest) {
  const canvasId = request.nextUrl.searchParams.get('canvasId');
  if (!canvasId) {
    return NextResponse.json({ error: 'canvasId query param required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/backup?canvasId=${encodeURIComponent(canvasId)}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to list cloud backups' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Cloud backup service unavailable' }, { status: 503 });
  }
}

/** Upload a new cloud backup */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${BACKEND_URL}/api/backup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to create cloud backup' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Cloud backup upload failed' }, { status: 503 });
  }
}
