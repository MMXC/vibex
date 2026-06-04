/**
 * /api/backup/[canvasId]/route.ts — Per-canvas cloud backup operations
 *
 * GET /api/backup/[canvasId]?backupId=xxx — Get a specific cloud backup
 * POST /api/backup/[canvasId] — Restore from a cloud backup
 * DELETE /api/backup/[canvasId]?backupId=xxx — Delete a cloud backup
 *
 * S62-E3: Canvas Cloud Backup and Recovery
 */
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.VIBEX_BACKEND_URL ?? 'https://api.vibex.top';

type RouteParams = { params: Promise<{ canvasId: string }> };

/** GET /api/backup/[canvasId]?backupId=xxx — retrieve a specific cloud backup */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { canvasId } = await params;
  const backupId = request.nextUrl.searchParams.get('backupId');

  if (!backupId) {
    // List all backups for this canvas
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/backup/${encodeURIComponent(canvasId)}`,
        {
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (!res.ok) {
        return NextResponse.json({ error: 'Failed to fetch backup' }, { status: res.status });
      }
      return NextResponse.json(await res.json());
    } catch {
      return NextResponse.json({ error: 'Cloud backup service unavailable' }, { status: 503 });
    }
  }

  // Fetch specific backup
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/backup/${encodeURIComponent(canvasId)}?backupId=${encodeURIComponent(backupId)}`,
      {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: 'Cloud backup service unavailable' }, { status: 503 });
  }
}

/** POST /api/backup/[canvasId] — restore from a cloud backup */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { canvasId } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    const res = await fetch(`${BACKEND_URL}/api/backup/${encodeURIComponent(canvasId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Restore failed' }, { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: 'Cloud restore unavailable' }, { status: 503 });
  }
}

/** DELETE /api/backup/[canvasId]?backupId=xxx — delete a cloud backup */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { canvasId } = await params;
  const backupId = request.nextUrl.searchParams.get('backupId');

  if (!backupId) {
    return NextResponse.json({ error: 'backupId query param required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/backup/${encodeURIComponent(canvasId)}?backupId=${encodeURIComponent(backupId)}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Delete failed' }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Cloud backup service unavailable' }, { status: 503 });
  }
}
