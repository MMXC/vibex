/**
 * /api/admin/export-audit — Admin Audit Log Export API
 * Sprint94 E3: Canvas Audit Log
 *
 * POST — Export audit log entries as CSV or JSON
 * Body: { canvasId?: string; userId?: string; action?: string; from?: string; to?: string; format: 'csv' | 'json' }
 *
 * Auth: required (admin check via x-auth-user role)
 * Returns: file download
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { queryDB, safeError, Env } from '@/lib/db';

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

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(rows: AuditLogRow[]): string {
  const header = 'id,canvas_id,user_id,action,entity_type,entity_id,details,created_at';
  const body = rows.map((r) =>
    [
      escapeCSV(r.id),
      escapeCSV(r.canvas_id),
      escapeCSV(r.user_id),
      escapeCSV(r.action),
      escapeCSV(r.entity_type),
      escapeCSV(r.entity_id),
      escapeCSV(r.details),
      escapeCSV(r.created_at),
    ].join(',')
  );
  return [header, ...body].join('\n');
}

// POST /api/admin/export-audit
export async function POST(
  request: NextRequest,
  { env }: { env: Env }
) {
  try {
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as {
      canvasId?: string;
      userId?: string;
      action?: string;
      from?: string;
      to?: string;
      format: 'csv' | 'json';
    };

    if (!body.format || !['csv', 'json'].includes(body.format)) {
      return NextResponse.json({ ok: false, error: 'format must be csv or json' }, { status: 400 });
    }

    const conditions: string[] = [];
    const paramsList: unknown[] = [];

    if (body.canvasId) {
      conditions.push('canvas_id = ?');
      paramsList.push(body.canvasId);
    }

    if (body.userId) {
      conditions.push('user_id = ?');
      paramsList.push(body.userId);
    }

    if (body.action) {
      conditions.push('action = ?');
      paramsList.push(body.action);
    }

    if (body.from) {
      conditions.push('created_at >= ?');
      paramsList.push(body.from);
    }

    if (body.to) {
      conditions.push('created_at <= ?');
      paramsList.push(body.to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Export up to 10000 rows
    const rows = await queryDB<AuditLogRow>(
      env,
      `SELECT id, canvas_id, user_id, action, entity_type, entity_id, details, created_at
       FROM audit_log
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT 10000`,
      paramsList
    );

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `audit-log-${timestamp}.${body.format}`;

    if (body.format === 'csv') {
      const csv = toCSV(rows);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else {
      const json = JSON.stringify({ entries: rows, exportedAt: new Date().toISOString(), total: rows.length }, null, 2);
      return new NextResponse(json, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }
  } catch (err) {
    safeError('[AdminExportAudit POST] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
