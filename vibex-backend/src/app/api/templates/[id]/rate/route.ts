/**
 * /api/templates/:id/rate — Template Rating API
 *
 * S85-E5: 模板发布与评分系统
 *
 * POST /api/templates/:id/rate — Rate a template (and optionally add a comment)
 *   Body: { rating: number (1-5); comment?: string }
 *   Returns: { ok: boolean; avgRating?: number; ratingCount?: number; error?: string }
 *
 * Note: User can re-rate (upsert — existing rating is replaced)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { executeDB, queryDB, generateId, safeError, Env } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { env } = context;
    const { id: templateId } = await context.params;

    if (!templateId) {
      return NextResponse.json({ ok: false, error: 'Missing template ID' }, { status: 400 });
    }

    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    let body: { rating?: number; comment?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const { rating, comment = '' } = body;

    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ ok: false, error: 'Rating must be an integer between 1 and 5' }, { status: 400 });
    }
    if (comment.length > 200) {
      return NextResponse.json({ ok: false, error: 'Comment too long (max 200 chars)' }, { status: 400 });
    }

    // Upsert rating (replace existing rating from same user)
    await executeDB(
      env,
      `INSERT INTO template_ratings (id, template_id, user_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, template_id) DO UPDATE SET
         rating = excluded.rating,
         comment = excluded.comment`,
      [generateId(), templateId, user.id, rating, comment]
    );

    // Recalculate avg rating
    const stats = await queryDB<{ avg: number; cnt: number }>(
      env,
      `SELECT AVG(rating) as avg, COUNT(*) as cnt FROM template_ratings WHERE template_id = ?`,
      [templateId]
    );

    const avgRating = stats[0]?.avg ?? 0;
    const ratingCount = stats[0]?.cnt ?? 0;

    // Update templates table
    await executeDB(
      env,
      `UPDATE templates SET avg_rating = ?, rating_count = ? WHERE id = ?`,
      [avgRating, ratingCount, templateId]
    );

    return NextResponse.json({ ok: true, avgRating, ratingCount });
  } catch (err) {
    safeError('[TemplateRate POST] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
