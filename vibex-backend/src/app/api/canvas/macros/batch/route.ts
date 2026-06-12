/**
 * /api/canvas/macros/batch — Batch execute multiple macros on a canvas
 * Sprint92 E1: Canvas Workflow Automation
 *
 * POST — Execute multiple macros in sequence
 *   Body: {
 *     macros: Array<{ macroId: string; canvasId: string; params?: Record<string, unknown> }>,
 *     onError?: 'stop' | 'continue'  // default: continue
 *   }
 */
import { NextRequest, NextResponse } from 'next/server';
import { Env } from '@/lib/db';
import { safeError } from '@/lib/log-sanitizer';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';

export const runtime = 'edge';

interface MacroStep {
  type: string;
  timestamp: number;
  data: Record<string, unknown>;
}

interface MacroEntry {
  macroId: string;
  canvasId: string;
  params?: Record<string, unknown>;
}

interface BatchBody {
  macros: MacroEntry[];
  onError?: 'stop' | 'continue';
}

function substituteParams(value: unknown, params: Record<string, unknown>): unknown {
  if (typeof value === 'string') {
    return value.replace(/\{\{param\.(\w+)\}\}/g, (_, key) => {
      return String(params[key] ?? value);
    });
  }
  if (Array.isArray(value)) {
    return value.map(v => substituteParams(v, params));
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = substituteParams(v, params);
    }
    return result;
  }
  return value;
}

export async function POST(
  request: NextRequest,
  context: { env: Env }
) {
  try {
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: BatchBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { macros, onError = 'continue' } = body;

    if (!Array.isArray(macros) || macros.length === 0) {
      return NextResponse.json({ error: 'macros must be a non-empty array' }, { status: 400 });
    }

    const env = context.env;
    if (!env.DB) {
      return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    }

    const results: Array<{
      macroId: string;
      canvasId: string;
      ok: boolean;
      stepsExecuted?: number;
      error?: string;
    }> = [];

    for (const entry of macros) {
      if (!entry.macroId || !entry.canvasId) {
        if (onError === 'stop') break;
        results.push({ macroId: entry.macroId || '', canvasId: entry.canvasId || '', ok: false, error: 'Invalid entry' });
        continue;
      }

      const macroRow = await env.DB
        .prepare('SELECT id, user_id, steps_json FROM canvas_macros WHERE id = ?')
        .bind(entry.macroId)
        .first<{ id: string; user_id: string; steps_json: string }>();

      if (!macroRow || macroRow.user_id !== user.userId) {
        const err = !macroRow ? 'Macro not found' : 'Forbidden';
        if (onError === 'stop') {
          return NextResponse.json({ error: err }, { status: !macroRow ? 404 : 403 });
        }
        results.push({ macroId: entry.macroId, canvasId: entry.canvasId, ok: false, error: err });
        continue;
      }

      let steps: MacroStep[] = [];
      try {
        steps = JSON.parse(macroRow.steps_json);
      } catch {
        if (onError === 'stop') {
          return NextResponse.json({ error: 'Invalid macro steps_json' }, { status: 500 });
        }
        results.push({ macroId: entry.macroId, canvasId: entry.canvasId, ok: false, error: 'Invalid steps_json' });
        continue;
      }

      const params = entry.params || {};
      const resolved = steps.map((step, i) => ({
        stepIndex: i,
        type: step.type,
        resolved: substituteParams({ ...step.data, canvasId: entry.canvasId }, params),
      }));

      results.push({
        macroId: entry.macroId,
        canvasId: entry.canvasId,
        ok: true,
        stepsExecuted: resolved.length,
      });
    }

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    safeError(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
