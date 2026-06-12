/**
 * /api/canvas/[id]/versions — Canvas Version History API
 * Sprint93 E1: Canvas Version History
 *
 * GET  — List all versions for a canvas (ordered by version_number DESC)
 * POST — Create a new version snapshot
 *
 * GET /api/canvas/{id}/versions
 *   Auth: required
 *   Returns: { ok: true, versions: CanvasVersion[] }
 *
 * POST /api/canvas/{id}/versions
 *   Auth: required
 *   Body: { snapshotData: string; description?: string }
 *   Returns: { ok: true, version: CanvasVersion }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { queryDB, executeDB, generateId, safeError, Env } from '@/lib/db';

export const runtime = 'edge';

interface CanvasVersionRow {
  id: string;
  canvas_id: string;
  version_number: number;
  snapshot_data: string;
  description: string | null;
  created_by: string | null;
  created_at: number;
}

export interface CanvasVersion {
  id: string;
  canvasId: string;
  versionNumber: number;
  snapshotData: string;
  description: string | null;
  createdBy: string | null;
  createdAt: number;
}

function rowToVersion(row: CanvasVersionRow): CanvasVersion {
  return {
    id: row.id,
    canvasId: row.canvas_id,
    versionNumber: row.version_number,
    snapshotData: row.snapshot_data,
    description: row.description ?? null,
    createdBy: row.created_by ?? null,
    createdAt: row.created_at,
  };
}

// GET /api/canvas/[id]/versions
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

    const rows = await queryDB<CanvasVersionRow>(
      env,
      `SELECT id, canvas_id, version_number, snapshot_data, description, created_by, created_at
       FROM canvas_versions
       WHERE canvas_id = ?
       ORDER BY version_number DESC`,
      [canvasId]
    );

    const versions: CanvasVersion[] = rows.map(rowToVersion);

    return NextResponse.json({ ok: true, versions });
  } catch (err) {
    safeError('[CanvasVersions GET] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/canvas/[id]/versions
export async function POST(
  request: NextRequest,
  { params, env }: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: canvasId } = await params;
    const body = await request.json() as {
      snapshotData: string;
      description?: string;
    };

    if (!body.snapshotData) {
      return NextResponse.json({ ok: false, error: 'snapshotData is required' }, { status: 400 });
    }

    // Get the next version number for this canvas
    const maxRow = await queryDB<{ max_version: number | null }>(
      env,
      `SELECT MAX(version_number) as max_version FROM canvas_versions WHERE canvas_id = ?`,
      [canvasId]
    );

    const nextVersion = (maxRow[0]?.max_version ?? 0) + 1;
    const id = generateId();

    await executeDB(
      env,
      `INSERT INTO canvas_versions (id, canvas_id, version_number, snapshot_data, description, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, canvasId, nextVersion, body.snapshotData, body.description ?? null, user.id]
    );

    const version: CanvasVersion = {
      id,
      canvasId,
      versionNumber: nextVersion,
      snapshotData: body.snapshotData,
      description: body.description ?? null,
      createdBy: user.id,
      createdAt: Math.floor(Date.now() / 1000),
    };

    return NextResponse.json({ ok: true, version });
  } catch (err) {
    safeError('[CanvasVersions POST] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
