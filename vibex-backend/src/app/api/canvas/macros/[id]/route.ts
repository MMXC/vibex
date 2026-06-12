/**
 * /api/canvas/macros/[id] — Canvas Macro single-item operations
 * Sprint92 E1: Canvas Workflow Automation
 *
 * GET    — Get single macro by ID
 * DELETE — Delete macro by ID
 * PATCH  — Update macro name/description (share_token handled separately)
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateId, Env } from '@/lib/db';
import { safeError } from '@/lib/log-sanitizer';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';

export const runtime = 'edge';

interface MacroStep {
  type: string;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface CanvasMacro {
  id: string;
  userId: string;
  name: string;
  description: string;
  steps: MacroStep[];
  shareToken: string | null;
  createdAt: number;
  updatedAt: number;
  stepCount: number;
}

interface MacroRow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  steps_json: string;
  share_token: string | null;
  created_at: string;
  updated_at: string;
  step_count: number;
}

function rowToMacro(row: MacroRow): CanvasMacro {
  let steps: MacroStep[] = [];
  try {
    steps = JSON.parse(row.steps_json);
  } catch {
    steps = [];
  }
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    steps,
    shareToken: row.share_token ?? null,
    createdAt: parseInt(row.created_at),
    updatedAt: parseInt(row.updated_at),
    stepCount: row.step_count,
  };
}

type RouteContext = { params: { id: string }; env: Env };

// ==================== GET /api/canvas/macros/[id] ====================

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = context.params;
    const env = context.env;
    if (!env.DB) {
      return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    }

    const row = await env.DB
      .prepare(
        `SELECT id, user_id, name, description, steps_json, share_token,
                created_at, updated_at, step_count
         FROM canvas_macros WHERE id = ?`
      )
      .bind(id)
      .first<MacroRow>();

    if (!row) {
      return NextResponse.json({ error: 'Macro not found' }, { status: 404 });
    }

    // Allow owner or share-token holder
    if (row.user_id !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ ok: true, macro: rowToMacro(row) });
  } catch (err) {
    safeError(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ==================== DELETE /api/canvas/macros/[id] ====================

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = context.params;
    const env = context.env;
    if (!env.DB) {
      return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    }

    const row = await env.DB
      .prepare('SELECT id, user_id FROM canvas_macros WHERE id = ?')
      .bind(id)
      .first<{ id: string; user_id: string }>();

    if (!row) {
      return NextResponse.json({ error: 'Macro not found' }, { status: 404 });
    }

    if (row.user_id !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await env.DB.prepare('DELETE FROM canvas_macros WHERE id = ?').bind(id).run();

    return NextResponse.json({ ok: true });
  } catch (err) {
    safeError(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ==================== PATCH /api/canvas/macros/[id] ====================

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = context.params;
    const body = await request.json();
    const env = context.env;
    if (!env.DB) {
      return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    }

    const row = await env.DB
      .prepare('SELECT id, user_id FROM canvas_macros WHERE id = ?')
      .bind(id)
      .first<{ id: string; user_id: string }>();

    if (!row) {
      return NextResponse.json({ error: 'Macro not found' }, { status: 404 });
    }

    if (row.user_id !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates: string[] = [];
    const binds: (string | number)[] = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      binds.push(String(body.name).trim());
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      binds.push(String(body.description));
    }
    if (body.steps !== undefined) {
      updates.push('steps_json = ?', 'step_count = ?');
      binds.push(JSON.stringify(body.steps), body.steps.length);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = ?');
    binds.push(Date.now());
    binds.push(id);

    await env.DB
      .prepare(`UPDATE canvas_macros SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...binds)
      .run();

    return NextResponse.json({ ok: true });
  } catch (err) {
    safeError(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
