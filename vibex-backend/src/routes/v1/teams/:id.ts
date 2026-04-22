/**
 * Team by ID — GET, PUT, DELETE
 * E6: Teams API
 * GET    /v1/teams/:id      — get team details
 * PUT    /v1/teams/:id      — update team
 * DELETE /v1/teams/:id      — delete team (owner only)
 */
import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '@/lib/db';
import { apiError, ERROR_CODES } from '@/lib/api-error';
import { TeamService, TeamNotFoundError, ForbiddenError } from '@/services/TeamService';
import { safeError } from '@/lib/log-sanitizer';

const teamById = new Hono<{ Bindings: Env }>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getUserId(c: any): string {
  const userId = c.req.header('x-user-id');
  if (!userId) throw new Error('User ID required');
  return userId;
}

// ============================================
// Schemas
// ============================================

const UpdateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

// ============================================
// GET /v1/teams/:id
// ============================================

teamById.get('/', async (c) => {
  try {
    const userId = getUserId(c);
    const teamId = c.req.param('id') ?? '';
    const svc = new TeamService(c.env);

    const team = await svc.getTeam(teamId);
    if (!team) {
      return c.json(apiError('Team not found', ERROR_CODES.NOT_FOUND), 404);
    }

    const isMember = await svc.isMember(teamId, userId);
    if (!isMember) {
      return c.json(apiError('You are not a member of this team', ERROR_CODES.FORBIDDEN), 403);
    }

    return c.json({ success: true, team });
  } catch (err) {
    safeError('[teams/:id] GET error:', err);
    if (err instanceof Error && err.message.includes('User ID required')) {
      return c.json(apiError('Unauthorized', ERROR_CODES.UNAUTHORIZED), 401);
    }
    return c.json(apiError('Failed to get team', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// PUT /v1/teams/:id — Update team (admin+)
// ============================================

teamById.put('/', async (c) => {
  try {
    const userId = getUserId(c);
    const teamId = c.req.param('id') ?? '';
    const body = await c.req.json();
    const parsed = UpdateTeamSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(apiError('Invalid request body', ERROR_CODES.BAD_REQUEST), 400);
    }

    const svc = new TeamService(c.env);

    try {
      const team = await svc.updateTeam(teamId, userId, parsed.data);
      return c.json({ success: true, team });
    } catch (err) {
      if (err instanceof TeamNotFoundError) {
        return c.json(apiError('Team not found', ERROR_CODES.NOT_FOUND), 404);
      }
      if (err instanceof ForbiddenError) {
        return c.json(apiError(err.message, ERROR_CODES.FORBIDDEN), 403);
      }
      throw err;
    }
  } catch (err) {
    safeError('[teams/:id] PUT error:', err);
    if (err instanceof Error && err.message.includes('User ID required')) {
      return c.json(apiError('Unauthorized', ERROR_CODES.UNAUTHORIZED), 401);
    }
    return c.json(apiError('Failed to update team', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// DELETE /v1/teams/:id — Delete team (owner only)
// ============================================

teamById.delete('/', async (c) => {
  try {
    const userId = getUserId(c);
    const teamId = c.req.param('id') ?? '';
    const svc = new TeamService(c.env);

    try {
      await svc.deleteTeam(teamId, userId);
      return c.json({ success: true });
    } catch (err) {
      if (err instanceof TeamNotFoundError) {
        return c.json(apiError('Team not found', ERROR_CODES.NOT_FOUND), 404);
      }
      if (err instanceof ForbiddenError) {
        return c.json(apiError(err.message, ERROR_CODES.FORBIDDEN), 403);
      }
      throw err;
    }
  } catch (err) {
    safeError('[teams/:id] DELETE error:', err);
    if (err instanceof Error && err.message.includes('User ID required')) {
      return c.json(apiError('Unauthorized', ERROR_CODES.UNAUTHORIZED), 401);
    }
    return c.json(apiError('Failed to delete team', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

export default teamById;
