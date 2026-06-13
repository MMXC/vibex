/**
 * /api/canvas/[id]/nodes/[nodeId]/lock — Node Edit Lock API
 * Sprint95 E3: Node Edit Locking
 *
 * POST — Acquire an edit lock on a node (TTL 60s)
 * DELETE — Release the edit lock on a node
 *
 * POST /api/canvas/[id]/nodes/[nodeId]/lock
 *   Auth: required
 *   Returns: { acquired: true, locked_by: userId, expires_at: timestamp }
 *         or { acquired: false, locked_by: userId, expires_at: timestamp }
 *
 * DELETE /api/canvas/[id]/nodes/[nodeId]/lock
 *   Auth: required
 *   Returns: { ok: true } or { ok: false, error: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { queryDB, executeDB, generateId, safeError, Env } from '@/lib/db';

export const runtime = 'edge';

const LOCK_TTL_MS = 60_000; // 60 seconds

interface NodeLockRow {
  id: string;
  canvas_id: string;
  node_id: string;
  user_id: string;
  user_name: string;
  avatar: string | null;
  expires_at: number;
}

interface LockInfo {
  locked_by: string;
  user_name: string;
  avatar: string | null;
  expires_at: number;
}

async function getExistingLock(
  env: Env,
  canvasId: string,
  nodeId: string
): Promise<{ row: NodeLockRow | null; expired: boolean }> {
  const now = Date.now();
  const rows = await queryDB<NodeLockRow>(
    env,
    `SELECT id, canvas_id, node_id, user_id, user_name, avatar, expires_at
     FROM canvas_node_locks
     WHERE canvas_id = ? AND node_id = ?`,
    [canvasId, nodeId]
  );
  const row = rows[0] ?? null;
  const expired = row ? row.expires_at < now : false;
  return { row, expired };
}

async function deleteExpiredLock(env: Env, canvasId: string, nodeId: string) {
  const now = Date.now();
  await executeDB(
    env,
    `DELETE FROM canvas_node_locks WHERE canvas_id = ? AND node_id = ? AND expires_at < ?`,
    [canvasId, nodeId, now]
  );
}

// POST — Acquire lock
export async function POST(
  request: NextRequest,
  { params, env }: { params: Promise<{ id: string; nodeId: string }>; env: Env }
) {
  try {
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: canvasId, nodeId } = await params;
    const userId = user.userId;

    // Clean up any expired lock first
    await deleteExpiredLock(env, canvasId, nodeId);

    // Check if already locked
    const { row } = await getExistingLock(env, canvasId, nodeId);

    if (row && row.user_id === userId) {
      // Re-acquire: extend the lock
      const expiresAt = Date.now() + LOCK_TTL_MS;
      await executeDB(
        env,
        `UPDATE canvas_node_locks SET expires_at = ?, user_name = ?, avatar = ?
         WHERE id = ?`,
        [expiresAt, user.name ?? userId, user.avatar ?? null, row.id]
      );
      return NextResponse.json({
        acquired: true,
        locked_by: userId,
        user_name: user.name ?? userId,
        avatar: user.avatar ?? null,
        expires_at: expiresAt,
      });
    }

    if (row) {
      // Locked by another user
      return NextResponse.json({
        acquired: false,
        locked_by: row.user_id,
        user_name: row.user_name,
        avatar: row.avatar,
        expires_at: row.expires_at,
      });
    }

    // No existing lock — acquire
    const expiresAt = Date.now() + LOCK_TTL_MS;
    const lockId = generateId();
    await executeDB(
      env,
      `INSERT INTO canvas_node_locks (id, canvas_id, node_id, user_id, user_name, avatar, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [lockId, canvasId, nodeId, userId, user.name ?? userId, user.avatar ?? null, expiresAt]
    );

    return NextResponse.json({
      acquired: true,
      locked_by: userId,
      user_name: user.name ?? userId,
      avatar: user.avatar ?? null,
      expires_at: expiresAt,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: safeError(err) }, { status: 500 });
  }
}

// DELETE — Release lock
export async function DELETE(
  request: NextRequest,
  { params, env }: { params: Promise<{ id: string; nodeId: string }>; env: Env }
) {
  try {
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: canvasId, nodeId } = await params;
    const userId = user.userId;

    // Only the lock owner can release
    const result = await executeDB(
      env,
      `DELETE FROM canvas_node_locks
       WHERE canvas_id = ? AND node_id = ? AND user_id = ?`,
      [canvasId, nodeId, userId]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: safeError(err) }, { status: 500 });
  }
}
