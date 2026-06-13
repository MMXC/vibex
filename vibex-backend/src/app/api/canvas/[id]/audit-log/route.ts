/**
 * /api/canvas/[id]/audit-log — Canvas Audit Log API
 * Sprint94 E3: Canvas Audit Log
 *
 * GET — List audit log entries for a canvas with optional filters
 * Query params:
 *   user_id   — filter by actor user ID
 *   action    — filter by action type (create/update/delete/share/permission)
 *   from      — ISO timestamp lower bound
 *   to        — ISO timestamp upper bound
 *   limit     — max results (default 50, max 200)
 *   offset    — pagination offset
 *
 * Auth: required
 * Returns: { ok: true, entries: AuditLogEntry[], total: number }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { queryDB, generateId, safeError, Env } from '@/lib/db';

export const runtime = 'edge';

interface AuditLogRow {
  id: string;
  canvas_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  canvasId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

function rowToEntry(row: AuditLogRow): AuditLogEntry {
  let details: Record<string, unknown> | null = null;
  if (row.details) {
    try {
      details = JSON.parse(row.details) as Record<string, unknown>;
    } catch {
      details = { raw: row.details };
    }
  }
  return {
    id: row.id,
    canvasId: row.canvas_id,
    userId: row.user_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    details,
    createdAt: row.created_at,
  };
}

// GET /api/canvas/[id]/audit-log
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
    const { searchParams } = new URL(request.url);

    const userIdFilter = searchParams.get('user_id');
    const actionFilter = searchParams.get('action');
    const fromFilter = searchParams.get('from');
    const toFilter = searchParams.get('to');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    const conditions: string[] = ['canvas_id = ?'];
    const paramsList: unknown[] = [canvasId];

    if (userIdFilter) {
      conditions.push('user_id = ?');
      paramsList.push(userIdFilter);
    }

    if (actionFilter) {
      conditions.push('action = ?');
      paramsList.push(actionFilter);
    }

    if (fromFilter) {
      conditions.push('created_at >= ?');
      paramsList.push(fromFilter);
    }

    if (toFilter) {
      conditions.push('created_at <= ?');
      paramsList.push(toFilter);
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countRows = await queryDB<{ cnt: number }>(
      env,
      `SELECT COUNT(*) as cnt FROM audit_log WHERE ${whereClause}`,
      paramsList
    );
    const total = countRows[0]?.cnt ?? 0;

    // Get paginated entries
    const rows = await queryDB<AuditLogRow>(
      env,
      `SELECT id, canvas_id, user_id, action, entity_type, entity_id, details, created_at
       FROM audit_log
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...paramsList, limit, offset]
    );

    const entries: AuditLogEntry[] = rows.map(rowToEntry);

    return NextResponse.json({ ok: true, entries, total });
  } catch (err) {
    safeError('[CanvasAuditLog GET] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
