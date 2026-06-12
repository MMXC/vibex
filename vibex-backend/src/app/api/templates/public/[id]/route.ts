/**
 * /api/templates/public/:id — Get a Public Template by Token
 *
 * S90-E3: Template Sharing & Public Gallery
 *
 * GET /api/templates/public/:id?token=<share_token>
 *   Query params: token (required) — the share_token for the template
 *   Returns: { ok: boolean; template?: TemplateDetail; error?: string }
 *
 * Token validates access to a private-but-shareable template.
 * Only returns template if is_public=1 AND share_token matches.
 * No auth required — this is a public endpoint.
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryOne, safeError, Env } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface PublicTemplateDetail {
  id: string;
  name: string;
  description: string;
  author_name: string;
  tags: string;
  thumbnail: string | null;
  content_json: string | null;
  usage_count: number;
  avg_rating: number;
  rating_count: number;
  share_token: string | null;
  published_at: string;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { env } = context;
    const { id: templateId } = await context.params;

    if (!templateId) {
      return NextResponse.json({ ok: false, error: 'Missing template ID' }, { status: 400 });
    }

    const token = new URL(request.url).searchParams.get('token');
    if (!token) {
      return NextResponse.json({ ok: false, error: 'Missing share token' }, { status: 400 });
    }

    const template = await queryOne<PublicTemplateDetail>(
      env,
      `SELECT id, name, description, author_name, tags, thumbnail,
              content_json, usage_count, avg_rating, rating_count,
              share_token, published_at
       FROM templates
       WHERE id = ? AND is_public = 1 AND share_token = ?`,
      [templateId, token]
    );

    if (!template) {
      return NextResponse.json(
        { ok: false, error: 'Template not found or not publicly accessible' },
        { status: 404 }
      );
    }

    // Increment usage count
    const { executeDB } = await import('@/lib/db');
    await executeDB(
      env,
      `UPDATE templates SET usage_count = usage_count + 1 WHERE id = ?`,
      [templateId]
    );

    return NextResponse.json({
      ok: true,
      template: {
        ...template,
        tags: JSON.parse(template.tags || '[]') as string[],
      },
    });
  } catch (err) {
    safeError('[TemplatesPublicDetail GET] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
