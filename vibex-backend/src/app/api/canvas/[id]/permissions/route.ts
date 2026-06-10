/**
 * /api/canvas/:id/permissions — Canvas Permission Management API
 *
 * S85-E1: 画布级权限体系
 *
 * GET  /api/canvas/:id/permissions          — List all collaborators on a canvas
 * POST /api/canvas/:id/permissions          — Add or update a collaborator's permission
 * DELETE /api/canvas/:id/permissions         — Remove a collaborator's access
 *
 * Query/Body params documented per method below.
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryDB, executeDB, generateId, Env } from '@/lib/db';
import { safeError } from '@/lib/logger/safeError';

interface PermissionRow {
  id: string;
  canvas_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  created_at: string;
  updated_at: string;
}

interface CollaboratorRow {
  id: string;
  permission_id: string;
  canvas_id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  invited_by: string | null;
  joined_at: string;
  last_active_at: string | null;
}

type CanvasRole = 'owner' | 'admin' | 'editor' | 'viewer';

// GET /api/canvas/:id/permissions — List collaborators
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { id: canvasId } = await context.params;
    const env = context.env;

    if (!canvasId) {
      return NextResponse.json({ error: 'Missing canvas ID' }, { status: 400 });
    }

    const collaborators = await queryDB<CollaboratorRow & { role: CanvasRole }>(
      env,
      `SELECT c.*, p.role
       FROM canvas_collaborators c
       JOIN canvas_permissions p ON c.permission_id = p.id
       WHERE c.canvas_id = ?
       ORDER BY c.joined_at DESC`,
      [canvasId]
    );

    return NextResponse.json({ collaborators }, { status: 200 });
  } catch (err) {
    safeError('[Permissions GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/canvas/:id/permissions — Add or update a collaborator
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

    let body: { userId?: string; role?: string; email?: string; displayName?: string; invitedBy?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { userId, role, email, displayName, invitedBy } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
    }

    const validRoles: CanvasRole[] = ['owner', 'admin', 'editor', 'viewer'];
    if (!validRoles.includes(role as CanvasRole)) {
      return NextResponse.json({ error: `role must be one of: ${validRoles.join(', ')}` }, { status: 400 });
    }

    const userIdClean = userId.trim();
    const roleClean = role as CanvasRole;

    // Check if permission already exists — update if so, insert if not
    const existing = await queryOne<PermissionRow>(env,
      'SELECT id FROM canvas_permissions WHERE canvas_id = ? AND user_id = ?',
      [canvasId, userIdClean]
    );

    let permissionId: string;

    if (existing) {
      // Update existing permission
      await executeDB(env,
        'UPDATE canvas_permissions SET role = ?, updated_at = datetime("now") WHERE id = ?',
        [roleClean, existing.id]
      );
      permissionId = existing.id;
    } else {
      // Insert new permission
      permissionId = generateId('perm_');
      await executeDB(env,
        `INSERT INTO canvas_permissions (id, canvas_id, user_id, role)
         VALUES (?, ?, ?, ?)`,
        [permissionId, canvasId, userIdClean, roleClean]
      );

      // Insert collaborator metadata
      const collabId = generateId('collab_');
      await executeDB(env,
        `INSERT INTO canvas_collaborators (id, permission_id, canvas_id, user_id, email, display_name, invited_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [collabId, permissionId, canvasId, userIdClean, email ?? null, displayName ?? null, invitedBy ?? null]
      );
    }

    return NextResponse.json({ permissionId, canvasId, userId: userIdClean, role: roleClean }, { status: 200 });
  } catch (err) {
    safeError('[Permissions POST] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/canvas/:id/permissions?userId=xxx — Remove a collaborator
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { id: canvasId } = await context.params;
    const env = context.env;

    if (!canvasId) {
      return NextResponse.json({ error: 'Missing canvas ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId query param is required' }, { status: 400 });
    }

    // Cannot remove the owner
    const ownerRow = await queryOne<{ role: string }>(env,
      'SELECT role FROM canvas_permissions WHERE canvas_id = ? AND user_id = ?',
      [canvasId, userId]
    );

    if (!ownerRow) {
      return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 });
    }

    if (ownerRow.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove the canvas owner' }, { status: 403 });
    }

    // cascade delete via FK removes canvas_collaborators row too
    await executeDB(env,
      'DELETE FROM canvas_permissions WHERE canvas_id = ? AND user_id = ?',
      [canvasId, userId]
    );

    return NextResponse.json({ removed: true, canvasId, userId }, { status: 200 });
  } catch (err) {
    safeError('[Permissions DELETE] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
