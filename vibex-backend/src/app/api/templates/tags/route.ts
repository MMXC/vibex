/**
 * /api/templates/tags — Global Tag Management API
 *
 * S88-E3: 模板市场增强
 *
 * GET  /api/templates/tags         — List all tags with template count
 * POST /api/templates/tags         — Create a new tag
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { executeDB, queryDB, generateId, safeError, Env } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface TagRow {
  id: string;
  name: string;
  color: string;
  category: string;
  template_count: number;
  created_at: string;
}

// GET — list all tags with their associated template counts
export async function GET(
  _request: NextRequest,
  context: { env: Env }
) {
  try {
    const { env } = context;
    if (!env.DB) {
      return NextResponse.json({ success: false, error: 'DB not configured' }, { status: 500 });
    }

    // Ensure table exists (graceful migration)
    await executeDB(
      env,
      `CREATE TABLE IF NOT EXISTS template_tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT '#6366f1',
        category TEXT DEFAULT 'general',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`
    );

    const tags = await queryDB<TagRow>(
      env,
      `SELECT t.id, t.name, t.color, t.category, t.created_at,
              (SELECT COUNT(*) FROM templates ts
               WHERE ts.tags LIKE '%' || t.name || '%') as template_count
       FROM template_tags t
       ORDER BY t.name ASC`
    );

    return NextResponse.json({ success: true, tags });
  } catch (err) {
    safeError('[GET /api/templates/tags]', err);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

// POST — create a new tag
export async function POST(
  request: NextRequest,
  context: { env: Env }
) {
  const { success, user } = getAuthUserFromRequest(request);
  if (!success || !user?.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { env } = context;
    if (!env.DB) {
      return NextResponse.json({ success: false, error: 'DB not configured' }, { status: 500 });
    }

    const body = await request.json() as { name?: string; color?: string; category?: string };
    const name = (body.name ?? '').trim();

    if (!name || name.length === 0) {
      return NextResponse.json({ success: false, error: 'Tag name is required' }, { status: 400 });
    }
    if (name.length > 50) {
      return NextResponse.json({ success: false, error: 'Tag name too long (max 50 chars)' }, { status: 400 });
    }

    const id = generateId();
    const color = body.color ?? '#6366f1';
    const category = body.category ?? 'general';

    await executeDB(
      env,
      `INSERT INTO template_tags (id, name, color, category) VALUES (?, ?, ?, ?)`,
      id, name, color, category
    );

    return NextResponse.json({ success: true, tag: { id, name, color, category, template_count: 0 } });
  } catch (err) {
    safeError('[POST /api/templates/tags]', err);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
