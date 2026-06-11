/**
 * /api/templates/folders — Template Folder CRUD API
 *
 * S87-E5: 模板文件夹管理
 *
 * GET  /api/templates/folders    — List user's folders
 * POST /api/templates/folders    — Create a folder
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { executeDB, queryDB, generateId, safeError, Env } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET — list all template folders for the authenticated user
export async function GET(
  request: NextRequest,
  context: { env: Env }
) {
  const { success, user } = getAuthUserFromRequest(request);
  if (!success || !user?.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { env } = context;
    if (!env.DB) {
      return NextResponse.json({ success: false, error: 'DB not configured' }, { status: 500 });
    }

    // Ensure table exists (graceful migration)
    await executeDB(
      env,
      `CREATE TABLE IF NOT EXISTS template_folders (
        folder_id TEXT PRIMARY KEY,
        user_id   TEXT NOT NULL,
        name      TEXT NOT NULL,
        icon      TEXT DEFAULT '📁',
        sort_order INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`
    );

    // Get folders with template count
    const folders = await queryDB<{
      folder_id: string;
      name: string;
      icon: string;
      sort_order: number;
      template_count: number;
      created_at: string;
      updated_at: string;
    }>(
      env,
      `SELECT f.folder_id, f.name, f.icon, f.sort_order,
              f.created_at, f.updated_at,
              (SELECT COUNT(*) FROM templates t WHERE t.folder_id = f.folder_id) as template_count
       FROM template_folders f
       WHERE f.user_id = ?
       ORDER BY f.sort_order ASC, f.created_at ASC`,
      user.userId
    );

    return NextResponse.json({
      success: true,
      folders: (folders ?? []).map(row => ({
        folderId: row.folder_id,
        name: row.name,
        icon: row.icon,
        sortOrder: row.sort_order,
        templateCount: row.template_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (err) {
    safeError('[GET /api/templates/folders]', err);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

// POST — create a new template folder
export async function POST(
  request: NextRequest,
  context: { env: Env }
) {
  const { success, user } = getAuthUserFromRequest(request);
  if (!success || !user?.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { env } = context;
    if (!env.DB) {
      return NextResponse.json({ success: false, error: 'DB not configured' }, { status: 500 });
    }

    const body = await request.json() as { name?: string; icon?: string };
    const { name, icon = '📁' } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Folder name is required' }, { status: 400 });
    }
    if (name.trim().length > 100) {
      return NextResponse.json({ success: false, error: 'Folder name too long (max 100 chars)' }, { status: 400 });
    }

    const folderId = generateId();
    const now = new Date().toISOString();

    await executeDB(
      env,
      `INSERT INTO template_folders (folder_id, user_id, name, icon, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      folderId, user.userId, name.trim(), icon, now, now
    );

    return NextResponse.json({
      success: true,
      folder: {
        folderId,
        name: name.trim(),
        icon,
        sortOrder: 0,
        templateCount: 0,
        createdAt: now,
        updatedAt: now,
      },
    }, { status: 201 });
  } catch (err) {
    safeError('[POST /api/templates/folders]', err);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
