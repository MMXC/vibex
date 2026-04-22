/**
 * Team Permissions — Check user role in team
 * E6: Teams API
 * GET /v1/teams/:id/permissions — get current user's role in the team
 */
import { Hono } from 'hono';
import { Env } from '@/lib/db';
import { apiError, ERROR_CODES } from '@/lib/api-error';
import { TeamService } from '@/services/TeamService';
import { safeError } from '@/lib/log-sanitizer';

const permissions = new Hono<{ Bindings: Env }>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getUserId(c: any): string {
  const userId = c.req.header('x-user-id');
  if (!userId) throw new Error('User ID required');
  return userId;
}

// GET /v1/teams/:id/permissions — Get user's role
permissions.get('/', async (c) => {
  try {
    const userId = getUserId(c);
    const teamId = c.req.param('id') ?? '';
    const svc = new TeamService(c.env);

    const role = await svc.getUserRole(teamId, userId);
    if (role === null) {
      return c.json(apiError('You are not a member of this team', ERROR_CODES.FORBIDDEN), 403);
    }

    return c.json({ success: true, role });
  } catch (err) {
    safeError('[teams/:id/permissions] GET error:', err);
    if (err instanceof Error && err.message.includes('User ID required')) {
      return c.json(apiError('Unauthorized', ERROR_CODES.UNAUTHORIZED), 401);
    }
    return c.json(apiError('Failed to get permissions', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

export default permissions;
