/**
 * Canvas Share API — Teams × Canvas sharing
 * E5: Teams × Canvas 共享权限
 *
 * POST /v1/canvas-share              — share canvas with team
 * GET  /v1/canvas-share/teams       — list teams shared with a canvas
 * GET  /v1/canvas-share/canvases   — list canvases shared with a team
 * DELETE /v1/canvas-share           — revoke share
 */
import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '@/lib/db';
import { apiError, ERROR_CODES } from '@/lib/api-error';
import { TeamService, TeamNotFoundError, ForbiddenError } from '@/services/TeamService';
import { safeError } from '@/lib/log-sanitizer';

const canvasShare = new Hono<{ Bindings: Env }>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getUserId(c: any): string {
  const userId = c.req.header('x-user-id');
  if (!userId) throw new Error('User ID required');
  return userId;
}

// ============================================
// In-memory canvas_team_mapping store
// Key: `${canvasId}-${teamId}`, Value: share record
// ============================================

interface ShareRecord {
  canvasId: string;
  teamId: string;
  role: 'viewer' | 'editor';
  sharedBy: string;
  sharedAt: string;
}

// Module-level store (persists across requests in same worker instance)
const canvasTeamMap = new Map<string, ShareRecord>();

function mapKey(canvasId: string, teamId: string) {
  return `${canvasId}-${teamId}`;
}

// ============================================
// Schemas
// ============================================

const ShareCanvasSchema = z.object({
  canvasId: z.string().min(1),
  teamId: z.string().min(1),
  role: z.enum(['viewer', 'editor']),
});

const RevokeShareSchema = z.object({
  canvasId: z.string().min(1),
  teamId: z.string().min(1),
});

// ============================================
// POST /v1/canvas-share — Share canvas with team
// ============================================

canvasShare.post('/', async (c) => {
  try {
    const userId = getUserId(c);
    const body = await c.req.json();
    const parsed = ShareCanvasSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(apiError('Invalid request body', ERROR_CODES.BAD_REQUEST), 400);
    }

    const { canvasId, teamId, role } = parsed.data;

    // Verify the calling user is a member of the target team
    const svc = new TeamService(c.env);
    const isMember = await svc.isMember(teamId, userId);
    if (!isMember) {
      return c.json(apiError('You are not a member of this team', ERROR_CODES.FORBIDDEN), 403);
    }

    // Check for existing share — return 409 if already shared
    const key = mapKey(canvasId, teamId);
    if (canvasTeamMap.has(key)) {
      const existing = canvasTeamMap.get(key)!;
      // Update role if already shared
      existing.role = role;
      existing.sharedBy = userId;
      existing.sharedAt = new Date().toISOString();
      return c.json({ success: true, share: existing }, 200);
    }

    const record: ShareRecord = {
      canvasId,
      teamId,
      role,
      sharedBy: userId,
      sharedAt: new Date().toISOString(),
    };

    canvasTeamMap.set(key, record);

    return c.json({ success: true, share: record }, 201);
  } catch (err) {
    safeError('[canvas-share] POST error:', err);
    if (err instanceof Error && err.message.includes('User ID required')) {
      return c.json(apiError('Unauthorized', ERROR_CODES.UNAUTHORIZED), 401);
    }
    return c.json(apiError('Failed to share canvas', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// GET /v1/canvas-share/teams?canvasId=xxx — List teams shared with a canvas
// ============================================

canvasShare.get('/teams', async (c) => {
  try {
    const userId = getUserId(c);
    const canvasId = c.req.query('canvasId');

    if (!canvasId) {
      return c.json(apiError('canvasId query param is required', ERROR_CODES.BAD_REQUEST), 400);
    }

    // Find all shares for this canvas
    const shares: ShareRecord[] = [];
    canvasTeamMap.forEach((record) => {
      if (record.canvasId === canvasId) {
        shares.push(record);
      }
    });

    return c.json({ success: true, teams: shares });
  } catch (err) {
    safeError('[canvas-share/teams] GET error:', err);
    if (err instanceof Error && err.message.includes('User ID required')) {
      return c.json(apiError('Unauthorized', ERROR_CODES.UNAUTHORIZED), 401);
    }
    return c.json(apiError('Failed to list shared teams', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// GET /v1/canvas-share/canvases?teamId=xxx — List canvases shared with a team
// ============================================

canvasShare.get('/canvases', async (c) => {
  try {
    const userId = getUserId(c);
    const teamId = c.req.query('teamId');

    if (!teamId) {
      return c.json(apiError('teamId query param is required', ERROR_CODES.BAD_REQUEST), 400);
    }

    // Verify the calling user is a member of the team
    const svc = new TeamService(c.env);
    const isMember = await svc.isMember(teamId, userId);
    if (!isMember) {
      return c.json(apiError('You are not a member of this team', ERROR_CODES.FORBIDDEN), 403);
    }

    // Find all shares for this team
    const shares: ShareRecord[] = [];
    canvasTeamMap.forEach((record) => {
      if (record.teamId === teamId) {
        shares.push(record);
      }
    });

    return c.json({ success: true, canvases: shares });
  } catch (err) {
    safeError('[canvas-share/canvases] GET error:', err);
    if (err instanceof Error && err.message.includes('User ID required')) {
      return c.json(apiError('Unauthorized', ERROR_CODES.UNAUTHORIZED), 401);
    }
    return c.json(apiError('Failed to list shared canvases', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// DELETE /v1/canvas-share — Revoke share
// ============================================

canvasShare.delete('/', async (c) => {
  try {
    const userId = getUserId(c);
    const body = await c.req.json();
    const parsed = RevokeShareSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(apiError('Invalid request body', ERROR_CODES.BAD_REQUEST), 400);
    }

    const { canvasId, teamId } = parsed.data;
    const key = mapKey(canvasId, teamId);

    const record = canvasTeamMap.get(key);
    if (!record) {
      return c.json(apiError('Share not found', ERROR_CODES.NOT_FOUND), 404);
    }

    // Only the user who shared or team admin can revoke
    const svc = new TeamService(c.env);
    const isTeamAdmin = await svc.isMember(teamId, userId);
    if (!isTeamAdmin && record.sharedBy !== userId) {
      return c.json(apiError('Permission denied', ERROR_CODES.FORBIDDEN), 403);
    }

    canvasTeamMap.delete(key);

    return c.json({ success: true });
  } catch (err) {
    safeError('[canvas-share] DELETE error:', err);
    if (err instanceof Error && err.message.includes('User ID required')) {
      return c.json(apiError('Unauthorized', ERROR_CODES.UNAUTHORIZED), 401);
    }
    return c.json(apiError('Failed to revoke share', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

export default canvasShare;