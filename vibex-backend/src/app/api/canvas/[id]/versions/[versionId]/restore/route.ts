/**
 * /api/canvas/[id]/versions/[versionId]/restore — Restore Canvas Version API
 * Sprint93 E1: Canvas Version History
 *
 * PATCH — Restore a canvas to a specific version
 *
 * PATCH /api/canvas/{id}/versions/{versionId}/restore
 *   Auth: required
 *   Returns: { ok: true, version: CanvasVersion }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { queryDB, safeError, Env } from '@/lib/db';

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

interface CanvasVersion {
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

// PATCH /api/canvas/[id]/versions/[versionId]/restore
export async function PATCH(
  request: NextRequest,
  { params, env }: { params: Promise<{ id: string; versionId: string }>; env: Env }
) {
  try {
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: canvasId, versionId } = await params;

    // Fetch the version to restore
    const rows = await queryDB<CanvasVersionRow>(
      env,
      `SELECT id, canvas_id, version_number, snapshot_data, description, created_by, created_at
       FROM canvas_versions
       WHERE id = ? AND canvas_id = ?`,
      [versionId, canvasId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'Version not found' }, { status: 404 });
    }

    const version = rowToVersion(rows[0]!);

    return NextResponse.json({ ok: true, version });
  } catch (err) {
    safeError('[CanvasVersionsRestore PATCH] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
