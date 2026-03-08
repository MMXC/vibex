import { Hono } from 'hono';
import { queryOne, executeDB, Env } from '@/lib/db';

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
      return c.json({ error: 'Prototype collaboration not found' }, 404);
    }

    return c.json({ prototypeCollaboration: collaboration });
  } catch (error) {
    console.error('Error fetching prototype collaboration:', error);
    return c.json({ error: 'Failed to fetch prototype collaboration' }, 500);
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
      return c.json({ error: 'Prototype collaboration not found' }, 404);
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
    console.error('Error updating prototype collaboration:', error);
    return c.json({ error: 'Failed to update prototype collaboration' }, 500);
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
      return c.json({ error: 'Prototype collaboration not found' }, 404);
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
    console.error('Error patching prototype collaboration:', error);
    return c.json({ error: 'Failed to patch prototype collaboration' }, 500);
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
      return c.json({ error: 'Prototype collaboration not found' }, 404);
    }

    // Don't allow removing the owner
    if (existing.role === 'owner') {
      return c.json({ error: 'Cannot remove the owner from collaboration' }, 400);
    }

    await executeDB(env, 'DELETE FROM PrototypeCollaboration WHERE id = ?', [existing.id]);

    return c.json({ success: true, message: 'Collaboration removed successfully' });
  } catch (error) {
    console.error('Error deleting prototype collaboration:', error);
    return c.json({ error: 'Failed to delete prototype collaboration' }, 500);
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
      return c.json({ error: 'Prototype collaboration not found' }, 404);
    }

    // Don't allow revoking the owner
    if (existing.role === 'owner') {
      return c.json({ error: 'Cannot revoke the owner from collaboration' }, 400);
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
    console.error('Error revoking prototype collaboration:', error);
    return c.json({ error: 'Failed to revoke prototype collaboration' }, 500);
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
      return c.json({ error: 'Prototype collaboration not found' }, 404);
    }

    if (existing.status !== 'revoked') {
      return c.json({ error: 'Collaboration is not revoked' }, 400);
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
    console.error('Error restoring prototype collaboration:', error);
    return c.json({ error: 'Failed to restore prototype collaboration' }, 500);
  }
});

export default prototypeCollaborationId;
