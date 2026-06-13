/**
 * /api/canvas/[id]/export-profiles/[profileId] — Canvas Export Profile Delete API
 * Sprint95 E4: Export Profile Templates
 *
 * DELETE — Delete an export profile
 *
 * DELETE /api/canvas/[id]/export-profiles/[profileId]
 *   Auth: required
 *   Returns: 204 No Content on success
 *         { ok: false, error: 'Not found' } — 404 when profile doesn't exist or belongs to another user
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { executeDB, queryDB, Env } from '@/lib/db';
import { safeError } from '@/lib/logger/safeError';

export const runtime = 'edge';

interface ProfileRow {
  id: string;
  canvas_id: string;
  user_id: string;
}

// DELETE /api/canvas/[id]/export-profiles/[profileId] — Delete an export profile
export async function DELETE(
  request: NextRequest,
  { params, env }: { params: Promise<{ id: string; profileId: string }>; env: Env }
) {
  try {
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: canvasId, profileId } = await params;

    // Check profile exists and belongs to the user
    const rows = await queryDB<ProfileRow>(
      env,
      `SELECT id, canvas_id, user_id FROM canvas_export_profiles WHERE id = ? AND canvas_id = ?`,
      [profileId, canvasId]
    );

    if (rows.length === 0 || rows[0].user_id !== user.userId) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }

    await executeDB(
      env,
      `DELETE FROM canvas_export_profiles WHERE id = ? AND canvas_id = ? AND user_id = ?`,
      [profileId, canvasId, user.userId]
    );

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    safeError('[ExportProfile DELETE] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
