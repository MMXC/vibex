/**
 * /api/templates — Template Publishing API
 *
 * S85-E5: 模板发布与评分系统
 *
 * GET  /api/templates     — List published templates (with sort/filter)
 * POST /api/templates     — Publish a canvas as a template
 *   Body: {
 *     name: string;
 *     description?: string;
 *     tags?: string[];
 *     thumbnail?: string;   // base64 or URL
 *     canvasId?: string;
 *     contentJson?: string; // serialized canvas data
 *   }
 *   Returns: { ok: boolean; template?: TemplateRow; error?: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { executeDB, queryDB, queryOne, generateId, safeError, Env } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface TemplateRow {
  id: string;
  name: string;
  description: string;
  author_id: string;
  author_name: string;
  tags: string;
  thumbnail: string | null;
  canvas_id: string | null;
  usage_count: number;
  avg_rating: number;
  rating_count: number;
  created_at: string;
  published_at: string;
}

export async function GET(
  request: NextRequest,
  context: { env: Env }
) {
  try {
    const { env } = context;
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'recent'; // recent | rating | usage
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    let orderBy = 'published_at DESC';
    if (sort === 'rating') orderBy = 'avg_rating DESC, rating_count DESC';
    else if (sort === 'usage') orderBy = 'usage_count DESC';

    const rows = await queryDB<TemplateRow>(
      env,
      `SELECT id, name, description, author_id, author_name, tags,
              thumbnail, canvas_id, usage_count, avg_rating, rating_count,
              created_at, published_at
       FROM templates
       ORDER BY ${orderBy}
       LIMIT ?`,
      [limit]
    );

    return NextResponse.json({
      ok: true,
      templates: rows.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]') })),
    });
  } catch (err) {
    safeError('[Templates GET] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { env: Env }
) {
  try {
    const { env } = context;

    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    let body: {
      name?: string;
      description?: string;
      tags?: string[];
      thumbnail?: string;
      canvasId?: string;
      contentJson?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const { name, description = '', tags = [], thumbnail, canvasId, contentJson = '{}' } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ ok: false, error: 'Template name is required' }, { status: 400 });
    }
    if (name.trim().length > 200) {
      return NextResponse.json({ ok: false, error: 'Template name too long (max 200 chars)' }, { status: 400 });
    }

    const templateId = generateId();
    const tagsJson = JSON.stringify(tags);

    await executeDB(
      env,
      `INSERT INTO templates (id, name, description, author_id, author_name, tags,
                              thumbnail, canvas_id, content_json, usage_count, avg_rating, rating_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0)`,
      [templateId, name.trim(), description.trim(), user.id, user.name || 'Anonymous', tagsJson,
       thumbnail || null, canvasId || null, contentJson]
    );

    const template = await queryOne<TemplateRow>(
      env,
      `SELECT id, name, description, author_id, author_name, tags,
              thumbnail, canvas_id, usage_count, avg_rating, rating_count,
              created_at, published_at
       FROM templates WHERE id = ?`,
      [templateId]
    );

    return NextResponse.json({
      ok: true,
      template: template ? { ...template, tags: JSON.parse(template.tags || '[]') } : null,
    });
  } catch (err) {
    safeError('[Templates POST] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
