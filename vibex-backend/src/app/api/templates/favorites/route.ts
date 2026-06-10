/**
 * GET /api/templates/favorites — List user's favorited template IDs
 * POST /api/templates/favorites — Bulk-add template IDs to favorites
 *
 * S84-E4: 模板搜索增强与收藏
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { generateId, Env } from '@/lib/db';
import { safeError } from '@/lib/logger/safeError';

const V0_DEPRECATION_HEADERS = {
  'Deprecation': 'true',
  'Sunset': 'Sat, 31 May 2026 23:59:59 GMT',
  'X-API-Deprecation-Info': 'https://docs.vibex.ai/api-v0-sunset',
};

// GET — list all favorited template IDs for the authenticated user
export async function GET(
  request: NextRequest,
  { env }: { env: Env }
) {
  const { success, user } = getAuthUserFromRequest(request);
  if (!success || !user?.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    if (!env.DB) {
      return NextResponse.json({ success: false, error: 'DB not configured' }, { status: 500 });
    }

    // Ensure the table exists (graceful migration)
    try {
      await env.DB.exec(`
        CREATE TABLE IF NOT EXISTS user_template_favorites (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          templateId TEXT NOT NULL,
          createdAt TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE(userId, templateId)
        );
      `);
    } catch {
      // Table might already exist — safe to ignore
    }

    const result = await env.DB.prepare(
      'SELECT templateId, createdAt FROM user_template_favorites WHERE userId = ? ORDER BY createdAt DESC'
    ).bind(user.userId).all();

    const favorites = (result.results ?? []).map((row: Record<string, unknown>) => ({
      templateId: row.templateId as string,
      createdAt: row.createdAt as string,
    }));

    return NextResponse.json(
      { success: true, favorites },
      { headers: V0_DEPRECATION_HEADERS }
    );
  } catch (err) {
    safeError('[TemplateFavorites] GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

// POST — bulk-add template IDs to favorites
export async function POST(
  request: NextRequest,
  { env }: { env: Env }
) {
  const { success, user } = getAuthUserFromRequest(request);
  if (!success || !user?.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  let body: { templateIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const templateIds = body.templateIds;
  if (!Array.isArray(templateIds) || templateIds.length === 0) {
    return NextResponse.json({ success: false, error: 'templateIds must be a non-empty array' }, { status: 400 });
  }

  try {
    if (!env.DB) {
      return NextResponse.json({ success: false, error: 'DB not configured' }, { status: 500 });
    }

    // Ensure the table exists (graceful migration)
    try {
      await env.DB.exec(`
        CREATE TABLE IF NOT EXISTS user_template_favorites (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          templateId TEXT NOT NULL,
          createdAt TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE(userId, templateId)
        );
      `);
    } catch {
      // Table might already exist — safe to ignore
    }

    const inserted: string[] = [];
    for (const templateId of templateIds) {
      const id = generateId();
      const result = await env.DB.prepare(
        'INSERT OR IGNORE INTO user_template_favorites (id, userId, templateId, createdAt) VALUES (?, ?, ?, datetime("now"))'
      ).bind(id, user.userId, templateId).run();
      if (result.meta?.changes ?? 0 > 0) {
        inserted.push(templateId);
      }
    }

    return NextResponse.json(
      { success: true, added: inserted, total: templateIds.length },
      { headers: V0_DEPRECATION_HEADERS }
    );
  } catch (err) {
    safeError('[TemplateFavorites] POST error:', err);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
