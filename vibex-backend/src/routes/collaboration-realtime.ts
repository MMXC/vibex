/**
 * @deprecated This router uses the legacy Page Router API.
 * All routes have been migrated to Next.js App Router (app/api/).
 * See: docs/migration/page-router-to-app-router.md
 * This file will be removed after E1 security fixes are complete.
 */
/**
 * Collaboration API with Real-time Features
 *
 * Phase 6: 协作功能 - 在现有协作 API 基础上集成实时功能
 * - 项目协作邀请管理
 * - 实时在线状态
 * - 协作锁集成
 * - 消息历史
 */

import { Hono } from 'hono';
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';
import { getAuthUserFromHono } from '@/lib/auth';

import { safeError } from '@/lib/log-sanitizer';
import { apiError, ERROR_CODES } from '@/lib/api-error';

const collaboration = new Hono<{ Bindings: Env }>();

// ============================================
// Types
// ============================================

type CollaboratorRole = 'owner' | 'admin' | 'editor' | 'viewer';
type CollaborationStatus = 'active' | 'pending' | 'revoked';

interface CollaborationRow {
  id: string;
  projectId: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  role: CollaboratorRole;
  status: CollaborationStatus;
  invitedBy: string | null;
  invitedAt: string | null;
  joinedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CollaborationMessage {
  id: string;
  collaborationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

// ============================================
// GET /api/collaboration - List collaborators
// ============================================

collaboration.get('/', async (c) => {
  try {
    const projectId = c.req.query('projectId');
    const userId = c.req.query('userId');
    const status = c.req.query('status') as CollaborationStatus | undefined;
    const role = c.req.query('role') as CollaboratorRole | undefined;

    let sql = 'SELECT * FROM PrototypeCollaboration';
    const conditions: string[] = [];
    const params: any[] = [];

    if (projectId) {
      conditions.push('projectId = ?');
      params.push(projectId);
    }
    if (userId) {
      conditions.push('userId = ?');
      params.push(userId);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (role) {
      conditions.push('role = ?');
      params.push(role);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY createdAt DESC';

    const results = await queryDB<CollaborationRow>(c.env, sql, params);
    return c.json({ success: true, data: results });
  } catch (error) {
    safeError('Error listing collaborations:', error);
    return c.json(apiError('Failed to list collaborations', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// GET /api/collaboration/:id - Get collaboration details
// ============================================

collaboration.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const collaboration = await queryOne<CollaborationRow>(
      c.env,
      'SELECT * FROM PrototypeCollaboration WHERE id = ?',
      [id]
    );

    if (!collaboration) {
      return c.json(apiError('Collaboration not found', ERROR_CODES.NOT_FOUND), 404);
    }

    // Get participants
    const participants = await queryDB<CollaborationRow>(
      c.env,
      'SELECT * FROM PrototypeCollaboration WHERE projectId = ? AND status = ?',
      [collaboration.projectId, 'active']
    );

    return c.json({
      success: true,
      data: {
        ...collaboration,
        participants: participants.map(p => ({
          userId: p.userId,
          userName: p.userName,
          role: p.role,
        })),
      },
    });
  } catch (error) {
    safeError('Error getting collaboration:', error);
    return c.json(apiError('Failed to get collaboration', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// POST /api/collaboration/invite - Invite collaborator
// ============================================

collaboration.post('/invite', async (c) => {
  try {
    const user = getAuthUserFromHono(c);
    if (!user) {
      return c.json(apiError('Unauthorized', ERROR_CODES.UNAUTHORIZED), 401);
    }

    const { projectId, email, role = 'editor' } = await c.req.json();

    // Check if user is owner or admin
    const existing = await queryOne<CollaborationRow>(
      c.env,
      'SELECT * FROM PrototypeCollaboration WHERE projectId = ? AND userId = ?',
      [projectId, user.userId]
    );

    if (!existing || !['owner', 'admin'].includes(existing.role)) {
      return c.json(apiError('Insufficient permissions', ERROR_CODES.FORBIDDEN), 403);
    }

    // Check if already invited
    const existingInvite = await queryOne<CollaborationRow>(
      c.env,
      'SELECT * FROM PrototypeCollaboration WHERE projectId = ? AND userEmail = ?',
      [projectId, email]
    );

    if (existingInvite) {
      return c.json(apiError('User already invited', ERROR_CODES.CONFLICT), 409);
    }

    // Create invitation
    const id = generateId();
    const now = new Date().toISOString();

    await executeDB(
      c.env,
      `INSERT INTO PrototypeCollaboration (id, projectId, userId, userEmail, role, status, invitedBy, invitedAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, projectId, '', email, role, 'pending', user.userId, now, now, now]
    );

    return c.json({
      success: true,
      data: { id, projectId, email, role, status: 'pending' },
    });
  } catch (error) {
    safeError('Error inviting collaborator:', error);
    return c.json(apiError('Failed to invite collaborator', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// POST /api/collaboration/:id/join - Join collaboration
// ============================================

collaboration.post('/:id/join', async (c) => {
  try {
    const user = getAuthUserFromHono(c);
    if (!user) {
      return c.json(apiError('Unauthorized', ERROR_CODES.UNAUTHORIZED), 401);
    }

    const id = c.req.param('id');
    const collaboration = await queryOne<CollaborationRow>(
      c.env,
      'SELECT * FROM PrototypeCollaboration WHERE id = ?',
      [id]
    );

    if (!collaboration) {
      return c.json(apiError('Collaboration not found', ERROR_CODES.NOT_FOUND), 404);
    }

    if (collaboration.status !== 'pending') {
      return c.json(apiError('Invitation no longer valid', ERROR_CODES.BAD_REQUEST), 400);
    }

    // Update to active
    const now = new Date().toISOString();
    await executeDB(
      c.env,
      `UPDATE PrototypeCollaboration SET userId = ?, status = ?, joinedAt = ?, updatedAt = ? WHERE id = ?`,
      [user.userId, 'active', now, now, id]
    );

    return c.json({
      success: true,
      data: { id, status: 'active', userId: user.userId },
    });
  } catch (error) {
    safeError('Error joining collaboration:', error);
    return c.json(apiError('Failed to join collaboration', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// GET /api/collaboration/:id/messages - Get chat messages
// ============================================

collaboration.get('/:id/messages', async (c) => {
  try {
    const id = c.req.param('id');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    const messages = await queryDB<CollaborationMessage[]>(
      c.env,
      'SELECT * FROM collaboration_messages WHERE collaborationId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
      [id, limit, offset]
    );

    return c.json({
      success: true,
      data: messages.reverse(),
    });
  } catch (error) {
    safeError('Error getting messages:', error);
    return c.json(apiError('Failed to get messages', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// POST /api/collaboration/:id/messages - Send message
// ============================================

collaboration.post('/:id/messages', async (c) => {
  try {
    const user = getAuthUserFromHono(c);
    if (!user) {
      return c.json(apiError('Unauthorized', ERROR_CODES.UNAUTHORIZED), 401);
    }

    const id = c.req.param('id');
    const { content } = await c.req.json();

    // Verify user is a collaborator
    const collab = await queryOne<CollaborationRow>(
      c.env,
      'SELECT * FROM PrototypeCollaboration WHERE id = ? AND userId = ? AND status = ?',
      [id, user.userId, 'active']
    );

    if (!collab) {
      return c.json(apiError('Not a collaborator', ERROR_CODES.FORBIDDEN), 403);
    }

    // Save message (create table if not exists)
    const messageId = generateId();
    const now = new Date().toISOString();

    // Try to insert, create table if error
    try {
      await executeDB(
        c.env,
        `INSERT INTO collaboration_messages (id, collaborationId, senderId, senderName, content, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [messageId, id, user.userId, user.email || 'Unknown', content, now]
      );
    } catch (dbError) {
      // Table might not exist, create it
      await executeDB(
        c.env,
        `CREATE TABLE IF NOT EXISTS collaboration_messages (
          id TEXT PRIMARY KEY,
          collaborationId TEXT NOT NULL,
          senderId TEXT NOT NULL,
          senderName TEXT,
          content TEXT NOT NULL,
          createdAt TEXT NOT NULL
        )`
      );
      await executeDB(
        c.env,
        `INSERT INTO collaboration_messages (id, collaborationId, senderId, senderName, content, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [messageId, id, user.userId, user.email || 'Unknown', content, now]
      );
    }

    // Broadcast via WebSocket would happen here in production

    return c.json({
      success: true,
      data: {
        id: messageId,
        senderId: user.userId,
        content,
        createdAt: now,
      },
    });
  } catch (error) {
    safeError('Error sending message:', error);
    return c.json(apiError('Failed to send message', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// DELETE /api/collaboration/:id - Remove collaborator
// ============================================

collaboration.delete('/:id', async (c) => {
  try {
    const user = getAuthUserFromHono(c);
    if (!user) {
      return c.json(apiError('Unauthorized', ERROR_CODES.UNAUTHORIZED), 401);
    }

    const id = c.req.param('id');

    // Check permissions
    const existing = await queryOne<CollaborationRow>(
      c.env,
      'SELECT * FROM PrototypeCollaboration WHERE id = ?',
      [id]
    );

    if (!existing) {
      return c.json(apiError('Collaboration not found', ERROR_CODES.NOT_FOUND), 404);
    }

    // Only owner can remove
    const owner = await queryOne<CollaborationRow>(
      c.env,
      'SELECT * FROM PrototypeCollaboration WHERE projectId = ? AND userId = ? AND role = ?',
      [existing.projectId, user.userId, 'owner']
    );

    if (!owner) {
      return c.json(apiError('Insufficient permissions', ERROR_CODES.FORBIDDEN), 403);
    }

    await executeDB(
      c.env,
      'DELETE FROM PrototypeCollaboration WHERE id = ?',
      [id]
    );

    return c.json({ success: true });
  } catch (error) {
    safeError('Error removing collaborator:', error);
    return c.json(apiError('Failed to remove collaborator', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

export default collaboration;
