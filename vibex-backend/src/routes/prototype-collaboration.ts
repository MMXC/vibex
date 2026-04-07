import { Hono } from 'hono';
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';

import { safeError } from '@/lib/log-sanitizer';

const prototypeCollaboration = new Hono<{ Bindings: Env }>();

interface PrototypeCollaborationRow {
  id: string;
  projectId: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  role: string; // owner, editor, viewer
  status: string; // active, pending, revoked
  invitedBy: string | null;
  invitedAt: string | null;
  joinedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// GET /api/prototype-collaboration - List collaborations by project
prototypeCollaboration.get('/', async (c) => {
  try {
    const projectId = c.req.query('projectId');
    const userId = c.req.query('userId');
    const status = c.req.query('status');
    const env = c.env;

    let sql = 'SELECT * FROM PrototypeCollaboration';
    const params: string[] = [];
    const conditions: string[] = [];

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

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY createdAt DESC';

    const collaborations = await queryDB<PrototypeCollaborationRow>(env, sql, params);

    return c.json({ prototypeCollaborations: collaborations });
  } catch (error) {
    safeError('Error fetching prototype collaborations:', error);
    return c.json({ error: 'Failed to fetch prototype collaborations' }, 500);
  }
});

// GET /api/prototype-collaboration/users/:projectId - Get all users with access to a project
prototypeCollaboration.get('/users/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const env = c.env;

    const collaborations = await queryDB<PrototypeCollaborationRow>(
      env,
      'SELECT * FROM PrototypeCollaboration WHERE projectId = ? AND status = ? ORDER BY createdAt DESC',
      [projectId, 'active']
    );

    // Get project owner info
    const project = await queryOne<{ userId: string }>(
      env,
      'SELECT userId FROM Project WHERE id = ?',
      [projectId]
    );

    // Get owner details from collaborations or User table
    let ownerInfo: { userId: string; userName: string | null; userEmail: string | null } | null = null;
    
    if (project) {
      const owner = collaborations.find(collab => collab.userId === project.userId && collab.role === 'owner');
      if (owner) {
        ownerInfo = {
          userId: owner.userId,
          userName: owner.userName,
          userEmail: owner.userEmail
        };
      } else {
        // Try to get from User table
        const user = await queryOne<{ id: string; name: string | null; email: string }>(
          env,
          'SELECT id, name, email FROM User WHERE id = ?',
          [project.userId]
        );
        if (user) {
          ownerInfo = {
            userId: user.id,
            userName: user.name,
            userEmail: user.email
          };
        }
      }
    }

    // Filter out owner from collaborators list (already included in ownerInfo)
    const collaborators = collaborations.filter(collab => collab.role !== 'owner');

    return c.json({ 
      projectId,
      owner: ownerInfo,
      collaborators
    });
  } catch (error) {
    safeError('Error fetching project users:', error);
    return c.json({ error: 'Failed to fetch project users' }, 500);
  }
});

// POST /api/prototype-collaboration - Create a new collaboration (invite user)
prototypeCollaboration.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { projectId, userId, userName, userEmail, role, invitedBy } = body;

    if (!projectId || !userId) {
      return c.json({ error: 'Missing required fields: projectId, userId' }, 400);
    }

    const env = c.env;
    const collaborationId = generateId();
    const now = new Date().toISOString();

    // Check if collaboration already exists
    const existing = await queryOne<PrototypeCollaborationRow>(
      env,
      'SELECT * FROM PrototypeCollaboration WHERE projectId = ? AND userId = ?',
      [projectId, userId]
    );

    if (existing) {
      // Update existing collaboration
      await executeDB(
        env,
        'UPDATE PrototypeCollaboration SET status = ?, role = ?, updatedAt = ? WHERE id = ?',
        ['active', role || 'viewer', now, existing.id]
      );

      const updated = await queryOne<PrototypeCollaborationRow>(
        env,
        'SELECT * FROM PrototypeCollaboration WHERE id = ?',
        [existing.id]
      );

      return c.json({ prototypeCollaboration: updated });
    }

    await executeDB(
      env,
      `INSERT INTO PrototypeCollaboration 
       (id, projectId, userId, userName, userEmail, role, status, invitedBy, invitedAt, joinedAt, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        collaborationId,
        projectId,
        userId,
        userName || null,
        userEmail || null,
        role || 'viewer',
        'active',
        invitedBy || null,
        now,
        now,
        now,
        now,
      ]
    );

    const collaboration = await queryOne<PrototypeCollaborationRow>(
      env,
      'SELECT * FROM PrototypeCollaboration WHERE id = ?',
      [collaborationId]
    );

    return c.json({ prototypeCollaboration: collaboration }, 201);
  } catch (error) {
    safeError('Error creating prototype collaboration:', error);
    return c.json({ error: 'Failed to create prototype collaboration' }, 500);
  }
});

// POST /api/prototype-collaboration/invite - Send invitation (creates pending collaboration)
prototypeCollaboration.post('/invite', async (c) => {
  try {
    const body = await c.req.json();
    const { projectId, email, role, invitedBy } = body;

    if (!projectId || !email) {
      return c.json({ error: 'Missing required fields: projectId, email' }, 400);
    }

    const env = c.env;
    const collaborationId = generateId();
    const now = new Date().toISOString();

    // Find user by email
    const user = await queryOne<{ id: string; name: string | null; email: string }>(
      env,
      'SELECT id, name, email FROM User WHERE email = ?',
      [email]
    );

    if (user) {
      // User exists, check if already a collaborator
      const existing = await queryOne<PrototypeCollaborationRow>(
        env,
        'SELECT * FROM PrototypeCollaboration WHERE projectId = ? AND userId = ?',
        [projectId, user.id]
      );

      if (existing) {
        return c.json({ error: 'User is already a collaborator', existingCollaboration: existing }, 400);
      }

      // Create active collaboration directly
      await executeDB(
        env,
        `INSERT INTO PrototypeCollaboration 
         (id, projectId, userId, userName, userEmail, role, status, invitedBy, invitedAt, joinedAt, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          collaborationId,
          projectId,
          user.id,
          user.name,
          user.email,
          role || 'viewer',
          'active',
          invitedBy || null,
          now,
          now,
          now,
          now,
        ]
      );

      const collaboration = await queryOne<PrototypeCollaborationRow>(
        env,
        'SELECT * FROM PrototypeCollaboration WHERE id = ?',
        [collaborationId]
      );

      return c.json({ prototypeCollaboration: collaboration, userJoined: true }, 201);
    } else {
      // User doesn't exist, create pending invitation
      // We still create a record but with pending status
      const pendingId = generateId();
      
      await executeDB(
        env,
        `INSERT INTO PrototypeCollaboration 
         (id, projectId, userId, userName, userEmail, role, status, invitedBy, invitedAt, joinedAt, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pendingId,
          projectId,
          `pending:${email}`, // Temporary userId for pending invites
          null,
          email,
          role || 'viewer',
          'pending',
          invitedBy || null,
          now,
          null,
          now,
          now,
        ]
      );

      const invitation = await queryOne<PrototypeCollaborationRow>(
        env,
        'SELECT * FROM PrototypeCollaboration WHERE id = ?',
        [pendingId]
      );

      return c.json({ prototypeCollaboration: invitation, userJoined: false }, 201);
    }
  } catch (error) {
    safeError('Error inviting user to prototype:', error);
    return c.json({ error: 'Failed to invite user to prototype' }, 500);
  }
});

// POST /api/prototype-collaboration/batch - Batch add collaborators
prototypeCollaboration.post('/batch', async (c) => {
  try {
    const body = await c.req.json();
    const { projectId, collaborators, invitedBy } = body;

    if (!projectId || !collaborators || !Array.isArray(collaborators)) {
      return c.json({ error: 'Missing required fields: projectId, collaborators (array)' }, 400);
    }

    const env = c.env;
    const now = new Date().toISOString();
    const results: PrototypeCollaborationRow[] = [];
    const errors: string[] = [];

    for (const collab of collaborators) {
      const { userId, userName, userEmail, role } = collab;
      
      if (!userId) {
        errors.push('Missing userId in one of the collaborators');
        continue;
      }

      const collaborationId = generateId();

      // Check if collaboration already exists
      const existing = await queryOne<PrototypeCollaborationRow>(
        env,
        'SELECT * FROM PrototypeCollaboration WHERE projectId = ? AND userId = ?',
        [projectId, userId]
      );

      if (existing) {
        // Update existing
        await executeDB(
          env,
          'UPDATE PrototypeCollaboration SET status = ?, role = ?, updatedAt = ? WHERE id = ?',
          ['active', role || 'viewer', now, existing.id]
        );
        results.push({ ...existing, status: 'active', role: role || 'viewer' });
      } else {
        // Insert new
        await executeDB(
          env,
          `INSERT INTO PrototypeCollaboration 
           (id, projectId, userId, userName, userEmail, role, status, invitedBy, invitedAt, joinedAt, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            collaborationId,
            projectId,
            userId,
            userName || null,
            userEmail || null,
            role || 'viewer',
            'active',
            invitedBy || null,
            now,
            now,
            now,
            now,
          ]
        );

        const newCollab = await queryOne<PrototypeCollaborationRow>(
          env,
          'SELECT * FROM PrototypeCollaboration WHERE id = ?',
          [collaborationId]
        );
        if (newCollab) results.push(newCollab);
      }
    }

    return c.json({ 
      prototypeCollaborations: results,
      errors: errors.length > 0 ? errors : undefined
    }, results.length > 0 ? 201 : 400);
  } catch (error) {
    safeError('Error batch adding collaborators:', error);
    return c.json({ error: 'Failed to batch add collaborators' }, 500);
  }
});

export default prototypeCollaboration;
