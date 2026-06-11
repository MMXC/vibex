/**
 * /api/templates/[id]/folder — Move Template to/from Folder
 *
 * S87-E5: 模板文件夹管理
 *
 * POST /api/templates/:id/folder  — Move template to a folder (or uncategorized)
 *   Body: { folderId: string | null }  (null = move to uncategorized)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { executeDB, queryOne, safeError, Env } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

export async function POST(
  request: NextRequest,
  { env, params }: { env: Env } & RouteContext
) {
  const { success, user } = getAuthUserFromRequest(request);
  if (!success || !user?.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!env.DB) {
      return NextResponse.json({ success: false, error: 'DB not configured' }, { status: 500 });
    }

    const { id } = params;
    const body = await request.json() as { folderId?: string | null };
    const { folderId } = body;

    // Verify the template exists and belongs to the user
    const template = await queryOne<{ id: string; name: string; author_id: string }>(
      env,
      'SELECT id, name, author_id FROM templates WHERE id = ?',
      id
    );
    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }
    if (template.author_id !== user.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Validate folderId if provided (must be the user's folder)
    if (folderId !== null && folderId !== undefined) {
      const folder = await queryOne<{ folder_id: string }>(
        env,
        'SELECT folder_id FROM template_folders WHERE folder_id = ? AND user_id = ?',
        folderId, user.userId
      );
      if (!folder) {
        return NextResponse.json({ success: false, error: 'Folder not found' }, { status: 404 });
      }
    }

    await executeDB(
      env,
      'UPDATE templates SET folder_id = ? WHERE id = ? AND author_id = ?',
      folderId ?? null, id, user.userId
    );

    return NextResponse.json({
      success: true,
      templateId: id,
      folderId: folderId ?? null,
    });
  } catch (err) {
    safeError('[POST /api/templates/:id/folder]', err);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
