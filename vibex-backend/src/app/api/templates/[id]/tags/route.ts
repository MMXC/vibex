/**
 * /api/templates/[id]/tags — Template Tag Management API
 *
 * S86-E3: 模板增强搜索与筛选
 *
 * PUT /api/templates/:id/tags — Update template tags
 *   Body: { tags: string[] }
 *   Returns: { ok: boolean; template?: TemplateRow; error?: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { executeDB, queryOne, safeError, Env } from '@/lib/db';

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

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { env } = context;
    const { id } = await context.params;

    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    let body: { tags?: string[] };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body.tags || !Array.isArray(body.tags)) {
      return NextResponse.json({ ok: false, error: 'tags must be an array of strings' }, { status: 400 });
    }

    // Verify template exists
    const existing = await queryOne<{ id: string }>(
      env,
      'SELECT id FROM templates WHERE id = ?',
      [id]
    );
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Template not found' }, { status: 404 });
    }

    const tagsJson = JSON.stringify(body.tags);
    await executeDB(
      env,
      'UPDATE templates SET tags = ? WHERE id = ?',
      [tagsJson, id]
    );

    const template = await queryOne<TemplateRow>(
      env,
      `SELECT id, name, description, author_id, author_name, tags,
              thumbnail, canvas_id, usage_count, avg_rating, rating_count,
              created_at, published_at
       FROM templates WHERE id = ?`,
      [id]
    );

    return NextResponse.json({
      ok: true,
      template: template ? { ...template, tags: JSON.parse(template.tags || '[]') } : null,
    });
  } catch (err) {
    safeError('[Templates Tags PUT] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
