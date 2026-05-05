/**
 * GET /api/v1/projects/:id/versions — List all versions for a project
 * DELETE /api/v1/projects/:id/versions — Clear all versions for a project
 *
 * E2-S5: Version History API Endpoints (PRD compliant)
 * E2-S6: Batch delete version history (clear)
 *
 * Based on: app/api/canvas/snapshots/route.ts
 * Differences: PRD path (/projects/:id/versions) vs internal path (/canvas/snapshots)
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';
import { safeError } from '@/lib/log-sanitizer';

// GET /api/v1/projects/:id/versions
export async function GET(
  request: NextRequest,
  context: { env: Env; params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const env = context.env;

    const snapshots = await queryDB<{
      id: string;
      projectId: string;
      version: number;
      name: string | null;
      description: string | null;
      data: string;
      createdAt: string;
      createdBy: string | null;
      isAutoSave: number;
    }>(
      env,
      `SELECT id, projectId, version, name, description, data, createdAt, createdBy, isAutoSave
       FROM CanvasSnapshot
       WHERE projectId = ?
       ORDER BY version DESC
       LIMIT ? OFFSET ?`,
      [projectId, limit, offset]
    );

    const countResult = await queryDB<{ cnt: number }>(
      env,
      'SELECT COUNT(*) as cnt FROM CanvasSnapshot WHERE projectId = ?',
      [projectId]
    );
    const total = countResult[0]?.cnt || 0;

    // PRD S2.5 response format: { versions: [{ id, snapshot_json, created_at, created_by }] }
    return NextResponse.json({
      versions: snapshots.map((s) => {
        let parsedData: Record<string, unknown> = {};
        try {
          parsedData = JSON.parse(s.data);
        } catch {
          parsedData = {};
        }
        return {
          id: s.id,
          snapshot_json: parsedData,
          created_at: s.createdAt,
          created_by: s.createdBy,
          version: s.version,
          name: s.name,
          description: s.description,
          is_auto_save: Boolean(s.isAutoSave),
          context_count: Array.isArray(parsedData.contexts) ? parsedData.contexts.length : 0,
          flow_count: Array.isArray(parsedData.flows) ? parsedData.flows.length : 0,
          component_count: Array.isArray(parsedData.components) ? parsedData.components.length : 0,
        };
      }),
      total,
      limit,
      offset,
    });
  } catch (err) {
    safeError('[projects/:id/versions] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
  }
}

// DELETE /api/v1/projects/:id/versions — Clear all versions for a project (E2-S6)
export async function DELETE(
  request: NextRequest,
  context: { env: Env; params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;
    const env = context.env;

    const result = await executeDB(
      env,
      'DELETE FROM CanvasSnapshot WHERE projectId = ?',
      [projectId]
    );

    return NextResponse.json({ success: true, projectId });
  } catch (err) {
    safeError('[projects/:id/versions] DELETE error:', err);
    return NextResponse.json({ error: 'Failed to delete versions' }, { status: 500 });
  }
}