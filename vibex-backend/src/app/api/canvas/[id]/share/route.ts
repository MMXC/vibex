/**
 * /api/canvas/:id/share — Advanced Canvas Share Link API
 *
 * S94-E2: Advanced Canvas Sharing
 * - POST: Create share link with role selection, expiration, password protection
 * - GET: Get share info by token; supports ?embed=1 for embed URL
 *
 * Role types: owner, editor, viewer, commenter
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryDB, executeDB, generateId, Env } from '@/lib/db';
import { safeError } from '@/lib/logger/safeError';

export type ShareRole = 'owner' | 'editor' | 'viewer' | 'commenter';

const VALID_ROLES: ShareRole[] = ['owner', 'editor', 'viewer', 'commenter'];

// In production, use bcrypt or similar. For D1 edge, we use a simple HMAC-based hash.
// This is a placeholder — replace with real crypto in production.
function hashPassword(password: string): string {
  // Simple reversible encoding for demo; use real crypto in production
  // In production, use Web Crypto API: SHA-256 HMAC
  return Buffer.from(password).toString('base64');
}

function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function buildEmbedUrl(token: string, role: ShareRole, embedMode = false): string {
  const base = `/canvas/share?token=${token}`;
  if (embedMode) {
    return `${base}&embed=1&mode=${role}`;
  }
  return base;
}

// POST /api/canvas/:id/share — Create advanced share link
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

    let body: {
      role?: string;
      expiresInHours?: number;
      password?: string;
      allowComments?: boolean;
      allowDownload?: boolean;
      metadata?: Record<string, unknown>;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const role = (body.role ?? 'viewer') as ShareRole;
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `role must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    const expiresInHours = body.expiresInHours ?? 720; // default 30 days
    const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString();

    const authHeader = request.headers.get('Authorization') ?? '';
    const createdBy = authHeader.replace('Bearer ', '').split('-')[0] || 'anonymous';

    const shareId = generateId();
    const token = generateShareToken();
    const passwordHash = body.password ? hashPassword(body.password) : null;
    const metadata = body.metadata ? JSON.stringify(body.metadata) : null;

    await executeDB(env,
      `INSERT INTO canvas_share_links (
        id, canvas_id, token, role, created_by, expires_at,
        password_hash, allow_comments, allow_download, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        shareId,
        canvasId,
        token,
        role,
        createdBy,
        expiresAt,
        passwordHash,
        body.allowComments !== false ? 1 : 0,
        body.allowDownload === true ? 1 : 0,
        metadata,
      ]
    );

    const shareUrl = buildEmbedUrl(token, role);
    const embedUrl = buildEmbedUrl(token, role, true);

    return NextResponse.json({
      id: shareId,
      token,
      shareUrl,
      embedUrl,
      role,
      expiresAt,
      hasPassword: !!body.password,
      allowComments: body.allowComments !== false,
      allowDownload: body.allowDownload === true,
    }, { status: 201 });
  } catch (err) {
    safeError('[Share POST] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/canvas/:id/share — Get share info by token
// Supports ?embed=1 for embed mode URL generation
// Supports ?canvasId=<id> to list all shares for a canvas
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { id: canvasId } = await context.params;
    const env = context.env;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const embedMode = searchParams.get('embed') === '1';

    if (!token && !canvasId) {
      return NextResponse.json({ error: 'token or canvasId query param is required' }, { status: 400 });
    }

    // If canvasId param is provided, list all shares for that canvas
    const listCanvasId = searchParams.get('canvasId') || canvasId;

    if (token) {
      // Single share lookup
      const share = await queryOne<{
        id: string; canvas_id: string; token: string; role: string;
        created_by: string; created_at: string; expires_at: string | null;
        is_active: number; password_hash: string | null;
        allow_comments: number; allow_download: number; view_count: number;
        metadata: string | null;
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

      const shareUrl = buildEmbedUrl(token, share.role as ShareRole);
      let embedUrl: string | undefined;
      if (embedMode) {
        embedUrl = buildEmbedUrl(token, share.role as ShareRole, true);
      }

      return NextResponse.json({
        id: share.id,
        canvasId: share.canvas_id,
        role: share.role,
        createdAt: share.created_at,
        expiresAt: share.expires_at,
        hasPassword: !!share.password_hash,
        allowComments: share.allow_comments === 1,
        allowDownload: share.allow_download === 1,
        viewCount: share.view_count,
        metadata: share.metadata ? JSON.parse(share.metadata) : null,
        shareUrl,
        ...(embedUrl ? { embedUrl } : {}),
      }, { status: 200 });
    } else {
      // List all shares for canvas
      const shares = await queryDB<{
        id: string; canvas_id: string; token: string; role: string;
        created_by: string; created_at: string; expires_at: string | null;
        is_active: number; password_hash: string | null;
        allow_comments: number; allow_download: number; view_count: number;
        metadata: string | null;
      }>(env,
        'SELECT * FROM canvas_share_links WHERE canvas_id = ? AND is_active = 1 ORDER BY created_at DESC',
        [listCanvasId]
      );

      return NextResponse.json({
        shares: shares.map((s) => ({
          id: s.id,
          token: s.token,
          role: s.role,
          createdAt: s.created_at,
          expiresAt: s.expires_at,
          hasPassword: !!s.password_hash,
          allowComments: s.allow_comments === 1,
          allowDownload: s.allow_download === 1,
          viewCount: s.view_count,
          shareUrl: buildEmbedUrl(s.token, s.role as ShareRole),
          embedUrl: buildEmbedUrl(s.token, s.role as ShareRole, true),
        })),
      }, { status: 200 });
    }
  } catch (err) {
    safeError('[Share GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/canvas/:id/share — Revoke a share link
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'token query param is required' }, { status: 400 });
    }

    await executeDB(context.env,
      'UPDATE canvas_share_links SET is_active = 0 WHERE token = ?',
      [token]
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    safeError('[Share DELETE] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
