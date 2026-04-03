/**
 * Collaboration API with Real-time Features
 * 
 * Phase 6: 协作功能 - 在现有协作 API 基础上集成实时功能
 * - 项目协作邀请管理
 * - 实时在线状态
 * - 协作锁集成
 * - 消息历史
 */
// @ts-nocheck


import { Hono } from 'hono';
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';
import { getAuthUserFromHono } from '@/lib/auth';

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

    const results = await queryDB<CollaborationRow[]>(c.env, sql, params);
    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('Error listing collaborations:', error);
    return c.json({ success: false, error: { message: 'Failed to list collaborations' } }, 500);
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
      return c.json({ success: false, error: { message: 'Collaboration not found' } }, 404);
    }

    // Get participants
    const participants = await queryDB<CollaborationRow[]>(
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
    console.error('Error getting collaboration:', error);
    return c.json({ success: false, error: { message: 'Failed to get collaboration' } }, 500);
  }
});

// ============================================
// POST /api/collaboration/invite - Invite collaborator
// ============================================

collaboration.post('/invite', async (c) => {
  try {
    const user = getAuthUserFromHono(c, c.env);
    if (!user) {
      return c.json({ success: false, error: { message: 'Unauthorized' } }, 401);
    }

    const { projectId, email, role = 'editor' } = await c.req.json();

    // Check if user is owner or admin
    const existing = await queryOne<CollaborationRow>(
      c.env,
      'SELECT * FROM PrototypeCollaboration WHERE projectId = ? AND userId = ?',
      [projectId, user.userId]
    );

    if (!existing || !['owner', 'admin'].includes(existing.role)) {
      return c.json({ success: false, error: { message: 'Insufficient permissions' } }, 403);
    }

    // Check if already invited
    const existingInvite = await queryOne<CollaborationRow>(
      c.env,
      'SELECT * FROM PrototypeCollaboration WHERE projectId = ? AND userEmail = ?',
      [projectId, email]
    );

    if (existingInvite) {
      return c.json({ success: false, error: { message: 'User already invited' } }, 409);
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
    console.error('Error inviting collaborator:', error);
    return c.json({ success: false, error: { message: 'Failed to invite collaborator' } }, 500);
  }
});

// ============================================
// POST /api/collaboration/:id/join - Join collaboration
// ============================================

collaboration.post('/:id/join', async (c) => {
  try {
    const user = getAuthUserFromHono(c, c.env);
    if (!user) {
      return c.json({ success: false, error: { message: 'Unauthorized' } }, 401);
    }

    const id = c.req.param('id');
    const collaboration = await queryOne<CollaborationRow>(
      c.env,
      'SELECT * FROM PrototypeCollaboration WHERE id = ?',
      [id]
    );

    if (!collaboration) {
      return c.json({ success: false, error: { message: 'Collaboration not found' } }, 404);
    }

    if (collaboration.status !== 'pending') {
      return c.json({ success: false, error: { message: 'Invitation no longer valid' } }, 400);
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
    console.error('Error joining collaboration:', error);
    return c.json({ success: false, error: { message: 'Failed to join collaboration' } }, 500);
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
    console.error('Error getting messages:', error);
    return c.json({ success: false, error: { message: 'Failed to get messages' } }, 500);
  }
});

// ============================================
// POST /api/collaboration/:id/messages - Send message
// ============================================

collaboration.post('/:id/messages', async (c) => {
  try {
    const user = getAuthUserFromHono(c, c.env);
    if (!user) {
      return c.json({ success: false, error: { message: 'Unauthorized' } }, 401);
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
      return c.json({ success: false, error: { message: 'Not a collaborator' } }, 403);
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
    console.error('Error sending message:', error);
    return c.json({ success: false, error: { message: 'Failed to send message' } }, 500);
  }
});

// ============================================
// DELETE /api/collaboration/:id - Remove collaborator
// ============================================

collaboration.delete('/:id', async (c) => {
  try {
    const user = getAuthUserFromHono(c, c.env);
    if (!user) {
      return c.json({ success: false, error: { message: 'Unauthorized' } }, 401);
    }

    const id = c.req.param('id');

    // Check permissions
    const existing = await queryOne<CollaborationRow>(
      c.env,
      'SELECT * FROM PrototypeCollaboration WHERE id = ?',
      [id]
    );

    if (!existing) {
      return c.json({ success: false, error: { message: 'Collaboration not found' } }, 404);
    }

    // Only owner can remove
    const owner = await queryOne<CollaborationRow>(
      c.env,
      'SELECT * FROM PrototypeCollaboration WHERE projectId = ? AND userId = ? AND role = ?',
      [existing.projectId, user.userId, 'owner']
    );

    if (!owner) {
      return c.json({ success: false, error: { message: 'Insufficient permissions' } }, 403);
    }

    await executeDB(
      c.env,
      'DELETE FROM PrototypeCollaboration WHERE id = ?',
      [id]
    );

    return c.json({ success: true });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    return c.json({ success: false, error: { message: 'Failed to remove collaborator' } }, 500);
  }
});

export default collaboration;
