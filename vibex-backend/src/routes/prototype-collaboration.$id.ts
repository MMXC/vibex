/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
import { Hono } from 'hono';

import { queryOne, executeDB, Env } from '@/lib/db';

import { safeError } from '@/lib/log-sanitizer';
import { apiError, ERROR_CODES } from '@/lib/api-error';

const prototypeCollaborationId = new Hono<{ Bindings: Env }>();

interface PrototypeCollaborationRow {
  id: string;
  projectId: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  role: string;
  status: string;
  invitedBy: string | null;
  invitedAt: string | null;
  joinedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// GET /api/prototype-collaboration/:id - Get collaboration by ID
prototypeCollaborationId.get('/', async (c) => {
  try {
    const id = c.req.param('id') ?? '';
    const env = c.env;

    // Handle both direct ID and encoded ID (e.g., userId_projectId)
    let collaboration: PrototypeCollaborationRow | null = null;
    
    if (id.includes('_')) {
      // Try to find by composite key
      const [userId, projectId] = id.split('_');
      collaboration = await queryOne<PrototypeCollaborationRow>(
        env,
        'SELECT * FROM PrototypeCollaboration WHERE userId = ? AND projectId = ?',
        [userId, projectId]
      );
    } else {
      collaboration = await queryOne<PrototypeCollaborationRow>(
        env,
        'SELECT * FROM PrototypeCollaboration WHERE id = ?',
        [id]
      );
    }

    if (!collaboration) {
      return         c.json(apiError('Prototype collaboration not found', ERROR_CODES.NOT_FOUND), 404);
    }

    return c.json({ prototypeCollaboration: collaboration });
  } catch (error) {
    safeError('Error fetching prototype collaboration:', error);
    return         c.json(apiError('Failed to fetch prototype collaboration', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// PUT /api/prototype-collaboration/:id - Update collaboration (role, status)
prototypeCollaborationId.put('/', async (c) => {
  try {
    const id = c.req.param('id') ?? '';
    const body = await c.req.json();
    const { role, status, userName, userEmail } = body;
    const env = c.env;

    // Find collaboration by ID or composite key
    let existing: PrototypeCollaborationRow | null = null;
    
    if (id.includes('_')) {
      const [userId, projectId] = id.split('_');
      existing = await queryOne<PrototypeCollaborationRow>(
        env,
        'SELECT * FROM PrototypeCollaboration WHERE userId = ? AND projectId = ?',
        [userId, projectId]
      );
    } else {
      existing = await queryOne<PrototypeCollaborationRow>(
        env,
        'SELECT * FROM PrototypeCollaboration WHERE id = ?',
        [id]
      );
    }

    if (!existing) {
      return         c.json(apiError('Prototype collaboration not found', ERROR_CODES.NOT_FOUND), 404);
    }

    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (userName !== undefined) {
      updates.push('userName = ?');
      values.push(userName);
    }
    if (userEmail !== undefined) {
      updates.push('userEmail = ?');
      values.push(userEmail);
    }

    if (updates.length > 0) {
      updates.push('updatedAt = ?');
      values.push(new Date().toISOString());
      values.push(existing.id);

      await executeDB(
        env,
        `UPDATE PrototypeCollaboration SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const updated = await queryOne<PrototypeCollaborationRow>(
      env,
      'SELECT * FROM PrototypeCollaboration WHERE id = ?',
      [existing.id]
    );

    return c.json({ prototypeCollaboration: updated });
  } catch (error) {
    safeError('Error updating prototype collaboration:', error);
    return         c.json(apiError('Failed to update prototype collaboration', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// PATCH /api/prototype-collaboration/:id - Partial update (alias for PUT)
prototypeCollaborationId.patch('/', async (c) => {
  try {
    const id = c.req.param('id') ?? '';
    const body = await c.req.json();
    const env = c.env;

    // Find collaboration by ID or composite key
    let existing: PrototypeCollaborationRow | null = null;
    
    if (id.includes('_')) {
      const [userId, projectId] = id.split('_');
      existing = await queryOne<PrototypeCollaborationRow>(
        env,
        'SELECT * FROM PrototypeCollaboration WHERE userId = ? AND projectId = ?',
        [userId, projectId]
      );
    } else {
      existing = await queryOne<PrototypeCollaborationRow>(
        env,
        'SELECT * FROM PrototypeCollaboration WHERE id = ?',
        [id]
      );
    }

    if (!existing) {
      return         c.json(apiError('Prototype collaboration not found', ERROR_CODES.NOT_FOUND), 404);
    }

    const updates: string[] = [];
    const values: (string | null)[] = [];

    // Support all updatable fields
    const allowedFields = ['role', 'status', 'userName', 'userEmail'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Convert camelCase to snake_case for DB
        const dbField = field === 'userName' ? 'userName' : field === 'userEmail' ? 'userEmail' : field;
        updates.push(`${dbField} = ?`);
        values.push(body[field]);
      }
    }

    if (updates.length > 0) {
      updates.push('updatedAt = ?');
      values.push(new Date().toISOString());
      values.push(existing.id);

      await executeDB(
        env,
        `UPDATE PrototypeCollaboration SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const updated = await queryOne<PrototypeCollaborationRow>(
      env,
      'SELECT * FROM PrototypeCollaboration WHERE id = ?',
      [existing.id]
    );

    return c.json({ prototypeCollaboration: updated });
  } catch (error) {
    safeError('Error patching prototype collaboration:', error);
    return         c.json(apiError('Failed to patch prototype collaboration', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// DELETE /api/prototype-collaboration/:id - Remove collaboration
prototypeCollaborationId.delete('/', async (c) => {
  try {
    const id = c.req.param('id') ?? '';
    const env = c.env;

    // Find collaboration by ID or composite key
    let existing: PrototypeCollaborationRow | null = null;
    
    if (id.includes('_')) {
      const [userId, projectId] = id.split('_');
      existing = await queryOne<PrototypeCollaborationRow>(
        env,
        'SELECT * FROM PrototypeCollaboration WHERE userId = ? AND projectId = ?',
        [userId, projectId]
      );
    } else {
      existing = await queryOne<PrototypeCollaborationRow>(
        env,
        'SELECT * FROM PrototypeCollaboration WHERE id = ?',
        [id]
      );
    }

    if (!existing) {
      return         c.json(apiError('Prototype collaboration not found', ERROR_CODES.NOT_FOUND), 404);
    }

    // Don't allow removing the owner
    if (existing.role === 'owner') {
      return         c.json(apiError('Cannot remove the owner from collaboration', ERROR_CODES.BAD_REQUEST), 400);
    }

    await executeDB(env, 'DELETE FROM PrototypeCollaboration WHERE id = ?', [existing.id]);

    return c.json({ success: true, message: 'Collaboration removed successfully' });
  } catch (error) {
    safeError('Error deleting prototype collaboration:', error);
    return         c.json(apiError('Failed to delete prototype collaboration', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// POST /api/prototype-collaboration/:id/revoke - Revoke collaboration (soft delete)
prototypeCollaborationId.post('/revoke', async (c) => {
  try {
    const id = c.req.param('id') ?? '';
    const env = c.env;

    // Find collaboration by ID or composite key
    let existing: PrototypeCollaborationRow | null = null;
    
    if (id.includes('_')) {
      const [userId, projectId] = id.split('_');
      existing = await queryOne<PrototypeCollaborationRow>(
        env,
        'SELECT * FROM PrototypeCollaboration WHERE userId = ? AND projectId = ?',
        [userId, projectId]
      );
    } else {
      existing = await queryOne<PrototypeCollaborationRow>(
        env,
        'SELECT * FROM PrototypeCollaboration WHERE id = ?',
        [id]
      );
    }

    if (!existing) {
      return         c.json(apiError('Prototype collaboration not found', ERROR_CODES.NOT_FOUND), 404);
    }

    // Don't allow revoking the owner
    if (existing.role === 'owner') {
      return         c.json(apiError('Cannot revoke the owner from collaboration', ERROR_CODES.BAD_REQUEST), 400);
    }

    const now = new Date().toISOString();
    await executeDB(
      env,
      'UPDATE PrototypeCollaboration SET status = ?, updatedAt = ? WHERE id = ?',
      ['revoked', now, existing.id]
    );

    const updated = await queryOne<PrototypeCollaborationRow>(
      env,
      'SELECT * FROM PrototypeCollaboration WHERE id = ?',
      [existing.id]
    );

    return c.json({ prototypeCollaboration: updated });
  } catch (error) {
    safeError('Error revoking prototype collaboration:', error);
    return         c.json(apiError('Failed to revoke prototype collaboration', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// POST /api/prototype-collaboration/:id/restore - Restore revoked collaboration
prototypeCollaborationId.post('/restore', async (c) => {
  try {
    const id = c.req.param('id') ?? '';
    const env = c.env;

    // Find collaboration by ID or composite key
    let existing: PrototypeCollaborationRow | null = null;
    
    if (id.includes('_')) {
      const [userId, projectId] = id.split('_');
      existing = await queryOne<PrototypeCollaborationRow>(
        env,
        'SELECT * FROM PrototypeCollaboration WHERE userId = ? AND projectId = ?',
        [userId, projectId]
      );
    } else {
      existing = await queryOne<PrototypeCollaborationRow>(
        env,
        'SELECT * FROM PrototypeCollaboration WHERE id = ?',
        [id]
      );
    }

    if (!existing) {
      return         c.json(apiError('Prototype collaboration not found', ERROR_CODES.NOT_FOUND), 404);
    }

    if (existing.status !== 'revoked') {
      return         c.json(apiError('Collaboration is not revoked', ERROR_CODES.BAD_REQUEST), 400);
    }

    const now = new Date().toISOString();
    await executeDB(
      env,
      'UPDATE PrototypeCollaboration SET status = ?, updatedAt = ? WHERE id = ?',
      ['active', now, existing.id]
    );

    const updated = await queryOne<PrototypeCollaborationRow>(
      env,
      'SELECT * FROM PrototypeCollaboration WHERE id = ?',
      [existing.id]
    );

    return c.json({ prototypeCollaboration: updated });
  } catch (error) {
    safeError('Error restoring prototype collaboration:', error);
    return         c.json(apiError('Failed to restore prototype collaboration', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

export default prototypeCollaborationId;
