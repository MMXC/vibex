/**
 * Team Members — Manage team membership
 * E6: Teams API
 * GET    /v1/teams/:id/members     — list members
 * POST   /v1/teams/:id/members     — add member
 * PUT    /v1/teams/:id/members/:userId — update member role
 * DELETE /v1/teams/:id/members/:userId — remove member
 */
import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '@/lib/db';
import { apiError, ERROR_CODES } from '@/lib/api-error';
import {
  TeamService,
  TeamNotFoundError,
  MemberNotFoundError,
  ForbiddenError,
  ConflictError,
} from '@/services/TeamService';
import { safeError } from '@/lib/log-sanitizer';

const members = new Hono<{ Bindings: Env }>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getUserId(c: any): string {
  const userId = c.req.header('x-user-id');
  if (!userId) throw new Error('User ID required');
  return userId;
}

// ============================================
// Schemas
// ============================================

const AddMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['admin', 'member']),
});

const UpdateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member']),
});

// ============================================
// GET /v1/teams/:id/members — List members
// ============================================

members.get('/', async (c) => {
  try {
    const userId = getUserId(c);
    const teamId = c.req.param('id') ?? '';
    const svc = new TeamService(c.env);

    const isMember = await svc.isMember(teamId, userId);
    if (!isMember) {
      return c.json(apiError('You are not a member of this team', ERROR_CODES.FORBIDDEN), 403);
    }

    const memberList = await svc.listMembers(teamId);
    return c.json({ success: true, members: memberList });
  } catch (err) {
    safeError('[teams/:id/members] GET error:', err);
    if (err instanceof Error && err.message.includes('User ID required')) {
      return c.json(apiError('Unauthorized', ERROR_CODES.UNAUTHORIZED), 401);
    }
    return c.json(apiError('Failed to list members', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// POST /v1/teams/:id/members — Add member
// ============================================

members.post('/', async (c) => {
  try {
    const userId = getUserId(c);
    const teamId = c.req.param('id') ?? '';
    const body = await c.req.json();
    const parsed = AddMemberSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(apiError('Invalid request body', ERROR_CODES.BAD_REQUEST), 400);
    }

    const svc = new TeamService(c.env);

    try {
      const member = await svc.addMember(teamId, {
        userId: parsed.data.userId,
        role: parsed.data.role,
        invitedBy: userId,
      });
      return c.json({ success: true, member }, 201);
    } catch (err) {
      if (err instanceof TeamNotFoundError) {
        return c.json(apiError('Team not found', ERROR_CODES.NOT_FOUND), 404);
      }
      if (err instanceof ForbiddenError) {
        return c.json(apiError(err.message, ERROR_CODES.FORBIDDEN), 403);
      }
      if (err instanceof ConflictError) {
        return c.json(apiError(err.message, ERROR_CODES.CONFLICT), 409);
      }
      throw err;
    }
  } catch (err) {
    safeError('[teams/:id/members] POST error:', err);
    if (err instanceof Error && err.message.includes('User ID required')) {
      return c.json(apiError('Unauthorized', ERROR_CODES.UNAUTHORIZED), 401);
    }
    return c.json(apiError('Failed to add member', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// PUT /v1/teams/:id/members/:userId — Update member role
// ============================================

members.put('/:userId', async (c) => {
  try {
    const userId = getUserId(c);
    const teamId = c.req.param('id') ?? '';
    const targetUserId = c.req.param('userId') ?? '';
    const body = await c.req.json();
    const parsed = UpdateMemberRoleSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(apiError('Invalid request body', ERROR_CODES.BAD_REQUEST), 400);
    }

    const svc = new TeamService(c.env);

    try {
      const member = await svc.updateMemberRole(teamId, targetUserId, userId, parsed.data.role);
      return c.json({ success: true, member });
    } catch (err) {
      if (err instanceof TeamNotFoundError) {
        return c.json(apiError('Team not found', ERROR_CODES.NOT_FOUND), 404);
      }
      if (err instanceof MemberNotFoundError) {
        return c.json(apiError('Member not found', ERROR_CODES.NOT_FOUND), 404);
      }
      if (err instanceof ForbiddenError) {
        return c.json(apiError(err.message, ERROR_CODES.FORBIDDEN), 403);
      }
      throw err;
    }
  } catch (err) {
    safeError('[teams/:id/members/:userId] PUT error:', err);
    if (err instanceof Error && err.message.includes('User ID required')) {
      return c.json(apiError('Unauthorized', ERROR_CODES.UNAUTHORIZED), 401);
    }
    return c.json(apiError('Failed to update member role', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// DELETE /v1/teams/:id/members/:userId — Remove member
// ============================================

members.delete('/:userId', async (c) => {
  try {
    const userId = getUserId(c);
    const teamId = c.req.param('id') ?? '';
    const targetUserId = c.req.param('userId') ?? '';
    const svc = new TeamService(c.env);

    try {
      await svc.removeMember(teamId, targetUserId, userId);
      return c.json({ success: true });
    } catch (err) {
      if (err instanceof TeamNotFoundError) {
        return c.json(apiError('Team not found', ERROR_CODES.NOT_FOUND), 404);
      }
      if (err instanceof MemberNotFoundError) {
        return c.json(apiError('Member not found', ERROR_CODES.NOT_FOUND), 404);
      }
      if (err instanceof ForbiddenError) {
        return c.json(apiError(err.message, ERROR_CODES.FORBIDDEN), 403);
      }
      throw err;
    }
  } catch (err) {
    safeError('[teams/:id/members/:userId] DELETE error:', err);
    if (err instanceof Error && err.message.includes('User ID required')) {
      return c.json(apiError('Unauthorized', ERROR_CODES.UNAUTHORIZED), 401);
    }
    return c.json(apiError('Failed to remove member', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

export default members;
