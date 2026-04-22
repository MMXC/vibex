/**
 * Teams API — List and create teams
 * E6: Teams API
 * GET  /v1/teams         — list teams for current user
 * POST /v1/teams         — create a new team
 */
import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '@/lib/db';
import { apiError, ERROR_CODES } from '@/lib/api-error';
import { TeamService } from '@/services/TeamService';
import { safeError } from '@/lib/log-sanitizer';

const teams = new Hono<{ Bindings: Env }>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getUserId(c: any): string {
  const userId = c.req.header('x-user-id');
  if (!userId) throw new Error('User ID required');
  return userId;
}

// ============================================
// Schemas
// ============================================

const CreateTeamSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

// ============================================
// GET /v1/teams — List teams
// ============================================

teams.get('/', async (c) => {
  try {
    const userId = getUserId(c);
    const svc = new TeamService(c.env);

    const teamsResult = await svc.listTeamsByUser(userId);

    return c.json({ success: true, teams: teamsResult });
  } catch (err) {
    safeError('[teams] GET / error:', err);
    if (err instanceof Error && err.message.includes('User ID required')) {
      return c.json(apiError('Unauthorized', ERROR_CODES.UNAUTHORIZED), 401);
    }
    return c.json(apiError('Failed to list teams', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// POST /v1/teams — Create team
// ============================================

teams.post('/', async (c) => {
  try {
    const userId = getUserId(c);
    const body = await c.req.json();
    const parsed = CreateTeamSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(apiError('Invalid request body', ERROR_CODES.BAD_REQUEST), 400);
    }

    const svc = new TeamService(c.env);
    const team = await svc.createTeam({
      name: parsed.data.name,
      description: parsed.data.description,
      ownerId: userId,
    });

    return c.json({ success: true, team }, 201);
  } catch (err) {
    safeError('[teams] POST / error:', err);
    if (err instanceof Error && err.message.includes('User ID required')) {
      return c.json(apiError('Unauthorized', ERROR_CODES.UNAUTHORIZED), 401);
    }
    return c.json(apiError('Failed to create team', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

export default teams;
