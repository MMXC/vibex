/**
 * GET /api/snapshot/[id] — Retrieve a public shareable canvas snapshot
 *
 * S45-P005-E5: Canvas Snapshot Sharing
 *
 * Flow: GET /api/snapshot/[id] → D1 → return { canvasJSON, projectName, createdAt }
 * Auth: public, no authentication required
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryOne, Env } from '@/lib/db';
import { safeError } from '@/lib/log-sanitizer';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params, env }: { params: Promise<{ id: string }>; env: Env }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing snapshot ID', code: 'MISSING_ID' },
        { status: 400 }
      );
    }

    const row = await queryOne<{ id: string; canvasJSON: string; projectName: string | null; createdAt: string }>(
      env,
      'SELECT id, canvasJSON, projectName, createdAt FROM PublicSnapshot WHERE id = ?',
      [id]
    );

    if (!row) {
      return NextResponse.json(
        { error: 'Snapshot not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Parse canvasJSON back to object
    let canvasJSON: unknown;
    try {
      canvasJSON = JSON.parse(row.canvasJSON);
    } catch {
      return NextResponse.json(
        { error: 'Corrupted snapshot data', code: 'CORRUPTED_DATA' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { canvasJSON, projectName: row.projectName, createdAt: row.createdAt },
      { status: 200 }
    );
  } catch (err) {
    safeError('[GET /api/snapshot/[id]] Error:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve snapshot', code: 'FETCH_FAILED' },
      { status: 500 }
    );
  }
}
