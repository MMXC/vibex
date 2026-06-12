/**
 * /api/templates/public — Public Template Gallery API
 *
 * S90-E3: Template Sharing & Public Gallery
 *
 * GET /api/templates/public — List all public templates with pagination
 *   Query params:
 *     - category?: string (matches against tags JSON)
 *     - sort?: 'recent' | 'rating' | 'usage' (default: 'recent')
 *     - page?: number (default: 1)
 *     - limit?: number (default: 20, max: 100)
 *   Returns: { ok: boolean; templates: TemplateRow[]; total: number; page: number }
 *
 * No auth required — this is a public endpoint.
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryDB, safeError, Env } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface PublicTemplate {
  id: string;
  name: string;
  description: string;
  author_name: string;
  tags: string[];
  thumbnail: string | null;
  usage_count: number;
  avg_rating: number;
  rating_count: number;
  share_token: string | null;
  published_at: string;
}

export async function GET(
  request: NextRequest,
  context: { env: Env }
) {
  try {
    const { env } = context;
    const { searchParams } = new URL(request.url);

    const sort = searchParams.get('sort') || 'recent';
    const category = searchParams.get('category');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    let orderBy = 'published_at DESC';
    if (sort === 'rating') orderBy = 'avg_rating DESC, rating_count DESC';
    else if (sort === 'usage') orderBy = 'usage_count DESC';

    const queryParams: (string | number)[] = [];
    let whereClause = 'WHERE is_public = 1';

    if (category && category.trim().length > 0) {
      // Category filter: matches against tags JSON
      whereClause += ` AND tags LIKE ?`;
      queryParams.push(`%${category.trim()}%`);
    }

    // Get total count
    const countResult = await queryDB<{ cnt: number }>(
      env,
      `SELECT COUNT(*) as cnt FROM templates ${whereClause}`,
      queryParams
    );
    const total = countResult[0]?.cnt ?? 0;

    // Get paginated templates
    const rows = await queryDB<PublicTemplate>(
      env,
      `SELECT id, name, description, author_name, tags, thumbnail,
              usage_count, avg_rating, rating_count, share_token, published_at
       FROM templates
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const templates = rows.map((r) => ({
      ...r,
      tags: JSON.parse(r.tags || '[]') as string[],
    }));

    return NextResponse.json({
      ok: true,
      templates,
      total,
      page,
      limit,
    });
  } catch (err) {
    safeError('[TemplatesPublic GET] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
