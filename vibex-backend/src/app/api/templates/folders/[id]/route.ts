/**
 * /api/templates/folders/[id] — Template Folder Update/Delete API
 *
 * S87-E5: 模板文件夹管理
 *
 * PUT    /api/templates/folders/:id   — Update a folder
 * DELETE /api/templates/folders/:id   — Delete a folder
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { executeDB, queryOne, safeError, Env } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

// PUT — update a template folder
export async function PUT(
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
    const body = await request.json() as { name?: string; icon?: string; sortOrder?: number };
    const { name, icon, sortOrder } = body;

    // Verify ownership
    const existing = await queryOne<{ folder_id: string }>(
      env,
      'SELECT folder_id FROM template_folders WHERE folder_id = ? AND user_id = ?',
      id, user.userId
    );
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Folder not found' }, { status: 404 });
    }

    // Build update fields
    const updates: string[] = ['updated_at = ?'];
    const values: (string | number)[] = [new Date().toISOString()];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ success: false, error: 'Invalid folder name' }, { status: 400 });
      }
      if (name.trim().length > 100) {
        return NextResponse.json({ success: false, error: 'Folder name too long' }, { status: 400 });
      }
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      values.push(icon);
    }
    if (sortOrder !== undefined && typeof sortOrder === 'number') {
      updates.push('sort_order = ?');
      values.push(sortOrder);
    }

    values.push(id);
    await executeDB(
      env,
      `UPDATE template_folders SET ${updates.join(', ')} WHERE folder_id = ?`,
      ...values
    );

    // Fetch updated folder
    const folder = await queryOne<{
      folder_id: string; name: string; icon: string;
      sort_order: number; template_count: number;
      created_at: string; updated_at: string;
    }>(
      env,
      `SELECT f.folder_id, f.name, f.icon, f.sort_order, f.created_at, f.updated_at,
              (SELECT COUNT(*) FROM templates t WHERE t.folder_id = f.folder_id) as template_count
       FROM template_folders f WHERE f.folder_id = ?`,
      id
    );

    return NextResponse.json({
      success: true,
      folder: folder ? {
        folderId: folder.folder_id,
        name: folder.name,
        icon: folder.icon,
        sortOrder: folder.sort_order,
        templateCount: folder.template_count,
        createdAt: folder.created_at,
        updatedAt: folder.updated_at,
      } : null,
    });
  } catch (err) {
    safeError('[PUT /api/templates/folders/:id]', err);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

// DELETE — delete a template folder (templates move to uncategorized)
export async function DELETE(
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

    // Verify ownership
    const existing = await queryOne<{ folder_id: string }>(
      env,
      'SELECT folder_id FROM template_folders WHERE folder_id = ? AND user_id = ?',
      id, user.userId
    );
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Folder not found' }, { status: 404 });
    }

    // Move templates in this folder to uncategorized (folder_id = null)
    await executeDB(
      env,
      'UPDATE templates SET folder_id = NULL WHERE folder_id = ? AND author_id = ?',
      id, user.userId
    );

    // Delete the folder
    await executeDB(
      env,
      'DELETE FROM template_folders WHERE folder_id = ? AND user_id = ?',
      id, user.userId
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    safeError('[DELETE /api/templates/folders/:id]', err);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
