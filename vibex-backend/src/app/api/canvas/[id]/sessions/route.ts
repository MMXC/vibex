/**
 * /api/canvas/:id/sessions — Collaboration Session History API
 *
 * S85-E2: 协作会话历史记录
 *
 * GET /api/canvas/:id/sessions
 *   Query params:
 *     - page (int, default 1)
 *     - limit (int, default 20, max 100)
 *     - operationType (optional: 'edit' | 'merge' | 'comment' | 'permission' | 'create' | 'delete')
 *     - userId (optional: filter by specific user)
 *     - search (optional: keyword search in operation_detail)
 *
 * POST /api/canvas/:id/sessions
 *   Body: { userId, userName, userAvatar?, operationType, operationTarget?, operationDetail? }
 *   Records a new session event and broadcasts via WebSocket.
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';
import { safeError } from '@/lib/logger/safeError';

// ==================== Types ====================

export type OperationType = 'edit' | 'merge' | 'comment' | 'permission' | 'create' | 'delete';

export interface CollabSessionRow {
  id: string;
  canvas_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  operation_type: OperationType;
  operation_target: string | null;
  operation_detail: string | null;
  created_at: number; // Unix ms timestamp
}

export interface CollabSession {
  id: string;
  canvasId: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  operationType: OperationType;
  operationTarget: string | null;
  operationDetail: string | null;
  createdAt: number;
}

interface SessionsQuery {
  sessions: CollabSession[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== GET /api/canvas/:id/sessions ====================

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

    if (!env.DB) {
      return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const offset = (page - 1) * limit;
    const operationType = searchParams.get('operationType') as OperationType | null;
    const userId = searchParams.get('userId');
    const search = searchParams.get('search')?.trim() || null;

    // Validate operationType
    const validTypes: OperationType[] = ['edit', 'merge', 'comment', 'permission', 'create', 'delete'];
    if (operationType && !validTypes.includes(operationType)) {
      return NextResponse.json({ error: `operationType must be one of: ${validTypes.join(', ')}` }, { status: 400 });
    }

    // Build WHERE clause dynamically
    const whereParts: string[] = ['canvas_id = ?'];
    const params: unknown[] = [canvasId];

    if (operationType) {
      whereParts.push('operation_type = ?');
      params.push(operationType);
    }

    if (userId) {
      whereParts.push('user_id = ?');
      params.push(userId);
    }

    if (search) {
      whereParts.push('operation_detail LIKE ?');
      params.push(`%${search}%`);
    }

    const whereClause = whereParts.join(' AND ');

    // Count total
    const countRow = await queryOne<{ cnt: number }>(env,
      `SELECT COUNT(*) as cnt FROM collab_sessions WHERE ${whereClause}`,
      params
    );
    const total = countRow?.cnt ?? 0;
    const totalPages = Math.ceil(total / limit);

    // Fetch page
    const rows = await queryDB<CollabSessionRow>(env,
      `SELECT * FROM collab_sessions
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const sessions: CollabSession[] = rows.map(row => ({
      id: row.id,
      canvasId: row.canvas_id,
      userId: row.user_id,
      userName: row.user_name,
      userAvatar: row.user_avatar,
      operationType: row.operation_type,
      operationTarget: row.operation_target,
      operationDetail: row.operation_detail,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ sessions, total, page, limit, totalPages } satisfies SessionsQuery, { status: 200 });
  } catch (err) {
    safeError('[Sessions GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ==================== POST /api/canvas/:id/sessions ====================

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

    if (!env.DB) {
      return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    }

    let body: {
      userId?: string;
      userName?: string;
      userAvatar?: string;
      operationType?: string;
      operationTarget?: string;
      operationDetail?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { userId, userName, userAvatar, operationType, operationTarget, operationDetail } = body;

    if (!userId || !userName || !operationType) {
      return NextResponse.json({ error: 'userId, userName, and operationType are required' }, { status: 400 });
    }

    const validTypes: OperationType[] = ['edit', 'merge', 'comment', 'permission', 'create', 'delete'];
    if (!validTypes.includes(operationType as OperationType)) {
      return NextResponse.json({ error: `operationType must be one of: ${validTypes.join(', ')}` }, { status: 400 });
    }

    const id = generateId('sess_');
    const createdAt = Date.now();

    await executeDB(env,
      `INSERT INTO collab_sessions (id, canvas_id, user_id, user_name, user_avatar, operation_type, operation_target, operation_detail, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, canvasId, userId, userName, userAvatar ?? null, operationType, operationTarget ?? null, operationDetail ?? null, createdAt]
    );

    const session: CollabSession = {
      id,
      canvasId,
      userId,
      userName,
      userAvatar: userAvatar ?? null,
      operationType: operationType as OperationType,
      operationTarget: operationTarget ?? null,
      operationDetail: operationDetail ?? null,
      createdAt,
    };

    // Broadcast via WebSocket if DO is available
    if (env.COLLABORATION_DO) {
      try {
        const { getCollaborationRoomStub } = await import('@/websocket');
        const stub = getCollaborationRoomStub(env.COLLABORATION_DO as DurableObjectNamespace, canvasId);
        await stub.fetch(new Request('http://localhost/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'collab:session',
            payload: session,
            timestamp: createdAt,
          }),
        }));
      } catch (wsErr) {
        // Non-fatal: log but don't fail the request
        safeError('[Sessions POST] WebSocket broadcast error:', wsErr);
      }
    }

    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    safeError('[Sessions POST] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
