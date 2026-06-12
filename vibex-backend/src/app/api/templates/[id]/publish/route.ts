/**
 * /api/templates/:id/publish — Toggle Template Public Status
 *
 * S90-E3: Template Sharing & Public Gallery
 *
 * POST /api/templates/:id/publish — Toggle public/private status
 *   Body: { isPublic: boolean }
 *   Returns: { ok: boolean; isPublic?: boolean; shareToken?: string; error?: string }
 *
 * Auth required — only the template author can toggle publish status.
 * When making public: generates a random 32-char share_token if not already set.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { executeDB, queryOne, safeError, Env } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface TemplateRow {
  id: string;
  author_id: string;
  is_public: number;
  share_token: string | null;
  name: string;
}

/** Generate a random 32-character hex token */
function generateShareToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

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

    // Fetch template
    const template = await queryOne<TemplateRow>(
      env,
      `SELECT id, author_id, is_public, share_token, name FROM templates WHERE id = ?`,
      [templateId]
    );

    if (!template) {
      return NextResponse.json({ ok: false, error: 'Template not found' }, { status: 404 });
    }

    // Only author can publish their own template
    if (template.author_id !== user.userId) {
      return NextResponse.json({ ok: false, error: 'Forbidden: not the template author' }, { status: 403 });
    }

    let body: { isPublic?: boolean };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const { isPublic } = body;

    if (typeof isPublic !== 'boolean') {
      return NextResponse.json({ ok: false, error: 'isPublic must be a boolean' }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (isPublic) {
      // Generate share token if not already set
      const shareToken = template.share_token || generateShareToken();
      const tokenParam = template.share_token ? [] : [shareToken];
      const tokenSet = template.share_token ? '' : ', share_token = ?';

      await executeDB(
        env,
        `UPDATE templates SET is_public = 1, published_at = ?${tokenSet} WHERE id = ?`,
        template.share_token ? [now, templateId] : [now, shareToken, templateId]
      );

      return NextResponse.json({
        ok: true,
        isPublic: true,
        shareToken: template.share_token || shareToken,
      });
    } else {
      // Make private
      await executeDB(
        env,
        `UPDATE templates SET is_public = 0 WHERE id = ?`,
        [templateId]
      );

      return NextResponse.json({
        ok: true,
        isPublic: false,
      });
    }
  } catch (err) {
    safeError('[TemplatePublish POST] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
