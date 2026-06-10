/**
 * /api/canvas/:id/share — Canvas Share Link API
 *
 * S85-E1: 画布级权限体系
 *
 * POST /api/canvas/:id/share — Create a share link with viewer/editor permission
 *
 * Body: { role?: 'viewer' | 'editor', expiresInHours?: number }
 * Returns: { token, shareUrl, expiresAt }
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryOne, executeDB, generateId, Env } from '@/lib/db';
import { safeError } from '@/lib/logger/safeError';

function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// POST /api/canvas/:id/share — Create share link
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { id: canvasId } = await context.params;
    const env = context.env;

    if (!canvasId) {
      return NextResponse.json({ error: 'Missing canvas ID' }, { status: 400 });
    }

    let body: { role?: string; expiresInHours?: number };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const role = (body.role ?? 'viewer') as 'viewer' | 'editor';
    if (!['viewer', 'editor'].includes(role)) {
      return NextResponse.json({ error: "role must be 'viewer' or 'editor'" }, { status: 400 });
    }

    const expiresInHours = body.expiresInHours ?? 720; // default 30 days
    const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString();

    // Get the creator from auth header or use a default
    const authHeader = request.headers.get('Authorization') ?? '';
    const createdBy = authHeader.replace('Bearer ', '').split('-')[0] || 'anonymous';

    const shareId = generateId('share_');
    const token = generateShareToken();

    await executeDB(env,
      `INSERT INTO canvas_share_links (id, canvas_id, token, role, created_by, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [shareId, canvasId, token, role, createdBy, expiresAt]
    );

    const shareUrl = `/canvas/share?token=${token}`;

    return NextResponse.json({
      id: shareId,
      token,
      shareUrl,
      role,
      expiresAt,
    }, { status: 201 });
  } catch (err) {
    safeError('[Share POST] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/canvas/:id/share — Get share info by token
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { id: canvasId } = await context.params;
    const env = context.env;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'token query param is required' }, { status: 400 });
    }

    const share = await queryOne<{
      id: string; canvas_id: string; token: string; role: string;
      created_by: string; created_at: string; expires_at: string | null; is_active: number;
    }>(env,
      'SELECT * FROM canvas_share_links WHERE token = ? AND is_active = 1',
      [token]
    );

    if (!share) {
      return NextResponse.json({ error: 'Share link not found or inactive' }, { status: 404 });
    }

    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 });
    }

    return NextResponse.json({
      id: share.id,
      canvasId: share.canvas_id,
      role: share.role,
      createdAt: share.created_at,
      expiresAt: share.expires_at,
    }, { status: 200 });
  } catch (err) {
    safeError('[Share GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
