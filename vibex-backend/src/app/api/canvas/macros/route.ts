/**
 * /api/canvas/macros — Canvas Macro CRUD
 * Sprint92 E1: Canvas Workflow Automation
 *
 * GET  — List macros for current user (auth required)
 * POST — Create a new macro
 *
 * Macro steps_json format:
 * Array<{
 *   type: 'create-node' | 'update-node' | 'delete-node' | 'move-node' | 'add-edge' | 'remove-edge',
 *   timestamp: number,
 *   data: Record<string, unknown>
 * }>
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateId, Env } from '@/lib/db';
import { safeError } from '@/lib/log-sanitizer';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';

export const runtime = 'edge';

// ==================== Types ====================

export interface MacroStep {
  type: 'create-node' | 'update-node' | 'delete-node' | 'move-node' | 'add-edge' | 'remove-edge';
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

// ==================== GET /api/canvas/macros ====================

export async function GET(
  request: NextRequest,
  context: { env: Env }
) {
  try {
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');
    const userId = user.userId;

    const env = context.env;
    if (!env.DB) {
      return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    }

    const rows = await env.DB
      .prepare(
        `SELECT id, user_id, name, description, steps_json, share_token,
                created_at, updated_at, step_count
         FROM canvas_macros
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(userId, limit, offset)
      .all();

    const macros = ((rows.results as MacroRow[]) || []).map(rowToMacro);

    return NextResponse.json({ ok: true, macros, limit, offset });
  } catch (err) {
    safeError(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ==================== POST /api/canvas/macros ====================

export async function POST(
  request: NextRequest,
  context: { env: Env }
) {
  try {
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, steps } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    if (!Array.isArray(steps)) {
      return NextResponse.json({ error: 'steps must be an array' }, { status: 400 });
    }

    const env = context.env;
    if (!env.DB) {
      return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    }

    const id = generateId();
    const now = Date.now();
    const stepsJson = JSON.stringify(steps);
    const userId = user.userId;

    await env.DB
      .prepare(
        `INSERT INTO canvas_macros (id, user_id, name, description, steps_json, created_at, updated_at, step_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, userId, name.trim(), description || '', stepsJson, now, now, steps.length)
      .run();

    const macro: CanvasMacro = {
      id,
      userId,
      name: name.trim(),
      description: description || '',
      steps: steps as MacroStep[],
      shareToken: null,
      createdAt: now,
      updatedAt: now,
      stepCount: steps.length,
    };

    return NextResponse.json({ ok: true, macro }, { status: 201 });
  } catch (err) {
    safeError(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
