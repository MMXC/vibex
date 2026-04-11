/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';

import { safeError } from '@/lib/log-sanitizer';

const collaboration = new Hono<{ Bindings: Env }>();

// ============================================
// Types & Interfaces
// ============================================

// Permission roles enum
type CollaboratorRole = 'owner' | 'admin' | 'editor' | 'viewer';
type CollaborationStatus = 'active' | 'pending' | 'revoked';

// Collaboration record interface
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

// Invitation link interface
interface InvitationLinkRow {
  id: string;
  projectId: string;
  token: string;
  role: CollaboratorRole;
  expiresAt: string | null;
  maxUses: number | null;
  uses: number;
  createdBy: string;
  createdAt: string;
  revokedAt: string | null;
}

// ============================================
// Permission Helpers
// ============================================

const ROLE_PERMISSIONS: Record<CollaboratorRole, string[]> = {
  owner: ['read', 'write', 'delete', 'manage', 'invite'],
  admin: ['read', 'write', 'delete', 'manage', 'invite'],
  editor: ['read', 'write', 'invite'],
  viewer: ['read'],
};

function hasPermission(role: CollaboratorRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

function canManageCollaborators(role: CollaboratorRole): boolean {
  return hasPermission(role, 'manage');
}

function canInvite(role: CollaboratorRole): boolean {
  return hasPermission(role, 'invite');
}

// ============================================
// Routes: GET /api/collaboration - List collaborators
// ============================================

// GET /api/collaboration - List all collaborations with filters
collaboration.get('/', async (c) => {
  try {
    const projectId = c.req.query('projectId');
    const userId = c.req.query('userId');
    const status = c.req.query('status') as CollaborationStatus | undefined;
    const role = c.req.query('role') as CollaboratorRole | undefined;
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

    if (role) {
      conditions.push('role = ?');
      params.push(role);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY createdAt DESC';

    const collaborations = await queryDB<CollaborationRow>(env, sql, params);

    // Enrich with permission info
    const enrichedCollaborators = collaborations.map(collab => ({
      ...collab,
      permissions: ROLE_PERMISSIONS[collab.role],
      canEdit: hasPermission(collab.role, 'write'),
      canDelete: hasPermission(collab.role, 'delete'),
      canManage: canManageCollaborators(collab.role),
      canInvite: canInvite(collab.role),
    }));

    return c.json({ 
      collaborators: enrichedCollaborators,
      total: enrichedCollaborators.length,
      roles: Object.keys(ROLE_PERMISSIONS),
      permissions: ROLE_PERMISSIONS,
    });
  } catch (error) {
    safeError('Error fetching collaborations:', error);
    return c.json({ error: 'Failed to fetch collaborations' }, 500);
  }
});

// GET /api/collaboration/roles - Get available roles and their permissions
collaboration.get('/roles', async (c) => {
  return c.json({
    roles: Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => ({
      role,
      permissions,
      description: getRoleDescription(role as CollaboratorRole),
    })),
  });
});

function getRoleDescription(role: CollaboratorRole): string {
  const descriptions: Record<CollaboratorRole, string> = {
    owner: 'Full access to the project, can manage all settings and collaborators',
    admin: 'Can manage project settings, collaborators, and content',
    editor: 'Can view and edit project content, can invite viewers',
    viewer: 'Read-only access to the project',
  };
  return descriptions[role];
}

// ============================================
// Routes: POST /api/collaboration - Add collaborator
// ============================================

// POST /api/collaboration - Add a new collaborator
collaboration.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { projectId, userId, userName, userEmail, role, invitedBy } = body;

    if (!projectId || !userId) {
      return c.json({ error: 'Missing required fields: projectId, userId' }, 400);
    }

    // Validate role
    const validRoles: CollaboratorRole[] = ['owner', 'admin', 'editor', 'viewer'];
    if (role && !validRoles.includes(role)) {
      return c.json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, 400);
    }

    const env = c.env;
    const collaborationId = generateId();
    const now = new Date().toISOString();

    // Check if collaboration already exists
    const existing = await queryOne<CollaborationRow>(
      env,
      'SELECT * FROM PrototypeCollaboration WHERE projectId = ? AND userId = ?',
      [projectId, userId]
    );

    if (existing) {
      // Update existing collaboration
      await executeDB(
        env,
        'UPDATE PrototypeCollaboration SET status = ?, role = ?, updatedAt = ? WHERE id = ?',
        ['active', role || existing.role, now, existing.id]
      );

      const updated = await queryOne<CollaborationRow>(
        env,
        'SELECT * FROM PrototypeCollaboration WHERE id = ?',
        [existing.id]
      );

      return c.json({ 
        collaborator: {
          ...updated,
          permissions: ROLE_PERMISSIONS[updated!.role],
        },
        isExisting: true,
      });
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

    const collaboration = await queryOne<CollaborationRow>(
      env,
      'SELECT * FROM PrototypeCollaboration WHERE id = ?',
      [collaborationId]
    );

    return c.json({ 
      collaborator: {
        ...collaboration,
        permissions: ROLE_PERMISSIONS[collaboration!.role],
      },
      isExisting: false,
    }, 201);
  } catch (error) {
    safeError('Error creating collaboration:', error);
    return c.json({ error: 'Failed to create collaboration' }, 500);
  }
});

// ============================================
// Routes: POST /api/collaboration/invite - Create invitation link
// ============================================

// POST /api/collaboration/invite - Create an invitation link
collaboration.post('/invite', async (c) => {
  try {
    const body = await c.req.json();
    const { projectId, email, role, expiresIn, maxUses, invitedBy } = body;

    if (!projectId) {
      return c.json({ error: 'Missing required field: projectId' }, 400);
    }

    // Validate role
    const validRoles: CollaboratorRole[] = ['admin', 'editor', 'viewer'];
    if (role && !validRoles.includes(role)) {
      return c.json({ error: `Invalid role for invitation. Must be one of: ${validRoles.join(', ')}` }, 400);
    }

    const env = c.env;
    const invitationId = generateId();
    const token = generateId() + generateId(); // Generate a longer token
    const now = new Date().toISOString();

    // Calculate expiration date
    let expiresAt: string | null = null;
    if (expiresIn) {
      const expiresDate = new Date(now);
      if (expiresIn.endsWith('h')) {
        expiresDate.setHours(expiresDate.getHours() + parseInt(expiresIn));
      } else if (expiresIn.endsWith('d')) {
        expiresDate.setDate(expiresDate.getDate() + parseInt(expiresIn));
      } else if (expiresIn.endsWith('m')) {
        expiresDate.setMonth(expiresDate.getMonth() + parseInt(expiresIn));
      }
      expiresAt = expiresDate.toISOString();
    }

    // Check if we need to create an invitation link table
    // For now, we'll store in a simple way using the PrototypeCollaboration table
    // with a pending status and special token

    // Create pending invitation
    const pendingId = generateId();
    
    if (email) {
      // Find user by email if provided
      const user = await queryOne<{ id: string; name: string | null; email: string }>(
        env,
        'SELECT id, name, email FROM User WHERE email = ?',
        [email]
      );

      if (user) {
        // Check if already a collaborator
        const existing = await queryOne<CollaborationRow>(
          env,
          'SELECT * FROM PrototypeCollaboration WHERE projectId = ? AND userId = ?',
          [projectId, user.id]
        );

        if (existing) {
          return c.json({ error: 'User is already a collaborator', collaboration: existing }, 400);
        }

        // Create active collaboration
        await executeDB(
          env,
          `INSERT INTO PrototypeCollaboration 
           (id, projectId, userId, userName, userEmail, role, status, invitedBy, invitedAt, joinedAt, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            pendingId,
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

        const collaboration = await queryOne<CollaborationRow>(
          env,
          'SELECT * FROM PrototypeCollaboration WHERE id = ?',
          [pendingId]
        );

        return c.json({ 
          collaborator: collaboration,
          userJoined: true,
        }, 201);
      }
    }

    // Create invitation link record in PrototypeCollaboration with pending status
    await executeDB(
      env,
      `INSERT INTO PrototypeCollaboration 
       (id, projectId, userId, userName, userEmail, role, status, invitedBy, invitedAt, joinedAt, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invitationId,
        projectId,
        `invite:${token}`, // Token as userId for pending invites
        null,
        email || null,
        role || 'viewer',
        'pending',
        invitedBy || null,
        now,
        null,
        now,
        now,
      ]
    );

    const invitation = await queryOne<CollaborationRow>(
      env,
      'SELECT * FROM PrototypeCollaboration WHERE id = ?',
      [invitationId]
    );

    // Generate the invitation link
    const baseUrl = process.env.APP_URL || 'https://vibex.app';
    const invitationLink = `${baseUrl}/invite/${token}?projectId=${projectId}&role=${role || 'viewer'}`;

    return c.json({ 
      invitation: {
        ...invitation,
        token,
        invitationLink,
        expiresAt,
        maxUses: maxUses || null,
        uses: 0,
      },
      userJoined: false,
    }, 201);
  } catch (error) {
    safeError('Error creating invitation:', error);
    return c.json({ error: 'Failed to create invitation' }, 500);
  }
});

// ============================================
// Routes: GET /api/collaboration/invite/:token - Accept invitation
// ============================================

// GET /api/collaboration/invite/:token - Get invitation details by token
collaboration.get('/invite/:token', async (c) => {
  try {
    const token = c.req.param('token');
    const env = c.env;

    const invitation = await queryOne<CollaborationRow>(
      env,
      "SELECT * FROM PrototypeCollaboration WHERE userId = ? AND status = 'pending'",
      [`invite:${token}`]
    );

    if (!invitation) {
      return c.json({ error: 'Invitation not found or already used' }, 404);
    }

    // Check if expired (if we have expiration logic)
    if (invitation.updatedAt) {
      const invitationDate = new Date(invitation.invitedAt || invitation.createdAt);
      const now = new Date();
      const daysSinceInvite = (now.getTime() - invitationDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceInvite > 7) {
        return c.json({ error: 'Invitation has expired' }, 410);
      }
    }

    return c.json({
      invitation: {
        projectId: invitation.projectId,
        email: invitation.userEmail,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        invitedAt: invitation.invitedAt,
      },
    });
  } catch (error) {
    safeError('Error fetching invitation:', error);
    return c.json({ error: 'Failed to fetch invitation' }, 500);
  }
});

// POST /api/collaboration/invite/:token/accept - Accept invitation
collaboration.post('/invite/:token/accept', async (c) => {
  try {
    const token = c.req.param('token');
    const body = await c.req.json();
    const { userId, userName, userEmail } = body;

    if (!userId) {
      return c.json({ error: 'Missing required field: userId' }, 400);
    }

    const env = c.env;
    const now = new Date().toISOString();

    // Find the pending invitation
    const invitation = await queryOne<CollaborationRow>(
      env,
      "SELECT * FROM PrototypeCollaboration WHERE userId = ? AND status = 'pending'",
      [`invite:${token}`]
    );

    if (!invitation) {
      return c.json({ error: 'Invitation not found or already used' }, 404);
    }

    // Check if user already has access
    const existing = await queryOne<CollaborationRow>(
      env,
      'SELECT * FROM PrototypeCollaboration WHERE projectId = ? AND userId = ?',
      [invitation.projectId, userId]
    );

    if (existing) {
      // Update existing to active
      await executeDB(
        env,
        'UPDATE PrototypeCollaboration SET status = ?, role = ?, updatedAt = ? WHERE id = ?',
        ['active', invitation.role, now, existing.id]
      );

      // Delete the invitation
      await executeDB(
        env,
        'DELETE FROM PrototypeCollaboration WHERE id = ?',
        [invitation.id]
      );

      const updated = await queryOne<CollaborationRow>(
        env,
        'SELECT * FROM PrototypeCollaboration WHERE id = ?',
        [existing.id]
      );

      return c.json({ 
        collaborator: {
          ...updated,
          permissions: ROLE_PERMISSIONS[updated!.role],
        },
      });
    }

    // Create new active collaboration
    const newCollabId = generateId();
    await executeDB(
      env,
      `INSERT INTO PrototypeCollaboration 
       (id, projectId, userId, userName, userEmail, role, status, invitedBy, invitedAt, joinedAt, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newCollabId,
        invitation.projectId,
        userId,
        userName || null,
        userEmail || null,
        invitation.role,
        'active',
        invitation.invitedBy,
        invitation.invitedAt,
        now,
        now,
        now,
      ]
    );

    // Delete the invitation
    await executeDB(
      env,
      'DELETE FROM PrototypeCollaboration WHERE id = ?',
      [invitation.id]
    );

    const collaboration = await queryOne<CollaborationRow>(
      env,
      'SELECT * FROM PrototypeCollaboration WHERE id = ?',
      [newCollabId]
    );

    return c.json({ 
      collaborator: {
        ...collaboration,
        permissions: ROLE_PERMISSIONS[collaboration!.role],
      },
    }, 201);
  } catch (error) {
    safeError('Error accepting invitation:', error);
    return c.json({ error: 'Failed to accept invitation' }, 500);
  }
});

// ============================================
// Routes: Batch operations
// ============================================

// POST /api/collaboration/batch - Batch add collaborators
collaboration.post('/batch', async (c) => {
  try {
    const body = await c.req.json();
    const { projectId, collaborators, invitedBy } = body;

    if (!projectId || !collaborators || !Array.isArray(collaborators)) {
      return c.json({ error: 'Missing required fields: projectId, collaborators (array)' }, 400);
    }

    const env = c.env;
    const now = new Date().toISOString();
    const results: CollaborationRow[] = [];
    const errors: string[] = [];

    for (const collab of collaborators) {
      const { userId, userName, userEmail, role } = collab;
      
      if (!userId) {
        errors.push('Missing userId in one of the collaborators');
        continue;
      }

      const collaborationId = generateId();

      const existing = await queryOne<CollaborationRow>(
        env,
        'SELECT * FROM PrototypeCollaboration WHERE projectId = ? AND userId = ?',
        [projectId, userId]
      );

      if (existing) {
        await executeDB(
          env,
          'UPDATE PrototypeCollaboration SET status = ?, role = ?, updatedAt = ? WHERE id = ?',
          ['active', role || 'viewer', now, existing.id]
        );
        results.push({ ...existing, status: 'active', role: role || 'viewer' });
      } else {
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

        const newCollab = await queryOne<CollaborationRow>(
          env,
          'SELECT * FROM PrototypeCollaboration WHERE id = ?',
          [collaborationId]
        );
        if (newCollab) results.push(newCollab);
      }
    }

    // Enrich with permissions
    const enrichedResults = results.map(collab => ({
      ...collab,
      permissions: ROLE_PERMISSIONS[collab.role],
    }));

    return c.json({ 
      collaborators: enrichedResults,
      errors: errors.length > 0 ? errors : undefined,
      count: enrichedResults.length,
    }, results.length > 0 ? 201 : 400);
  } catch (error) {
    safeError('Error batch adding collaborators:', error);
    return c.json({ error: 'Failed to batch add collaborators' }, 500);
  }
});

// POST /api/collaboration/batch/invite - Batch create invitation links
collaboration.post('/batch/invite', async (c) => {
  try {
    const body = await c.req.json();
    const { projectId, emails, role, invitedBy } = body;

    if (!projectId || !emails || !Array.isArray(emails)) {
      return c.json({ error: 'Missing required fields: projectId, emails (array)' }, 400);
    }

    const env = c.env;
    const now = new Date().toISOString();
    const results: { email: string; invitation?: CollaborationRow; error?: string }[] = [];

    for (const email of emails) {
      // Check if user exists
      const user = await queryOne<{ id: string; name: string | null; email: string }>(
        env,
        'SELECT id, name, email FROM User WHERE email = ?',
        [email]
      );

      if (user) {
        // Check if already a collaborator
        const existing = await queryOne<CollaborationRow>(
          env,
          'SELECT * FROM PrototypeCollaboration WHERE projectId = ? AND userId = ?',
          [projectId, user.id]
        );

        if (existing) {
          results.push({ email, error: 'Already a collaborator' });
          continue;
        }

        // Create active collaboration
        const collabId = generateId();
        await executeDB(
          env,
          `INSERT INTO PrototypeCollaboration 
           (id, projectId, userId, userName, userEmail, role, status, invitedBy, invitedAt, joinedAt, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            collabId,
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

        const collaboration = await queryOne<CollaborationRow>(
          env,
          'SELECT * FROM PrototypeCollaboration WHERE id = ?',
          [collabId]
        );

        results.push({ email, invitation: collaboration! });
      } else {
        // Create pending invitation
        const token = generateId() + generateId();
        const inviteId = generateId();

        await executeDB(
          env,
          `INSERT INTO PrototypeCollaboration 
           (id, projectId, userId, userName, userEmail, role, status, invitedBy, invitedAt, joinedAt, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            inviteId,
            projectId,
            `invite:${token}`,
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

        const invitation = await queryOne<CollaborationRow>(
          env,
          'SELECT * FROM PrototypeCollaboration WHERE id = ?',
          [inviteId]
        );

        results.push({ 
          email, 
          invitation: {
            ...invitation!,
            invitationLink: `${process.env.APP_URL || 'https://vibex.app'}/invite/${token}?projectId=${projectId}&role=${role || 'viewer'}`,
          } as CollaborationRow & { invitationLink: string },
        });
      }
    }

    return c.json({ 
      invitations: results,
      successCount: results.filter(r => !r.error).length,
      errorCount: results.filter(r => r.error).length,
    }, 201);
  } catch (error) {
    safeError('Error batch creating invitations:', error);
    return c.json({ error: 'Failed to batch create invitations' }, 500);
  }
});

export default collaboration;
