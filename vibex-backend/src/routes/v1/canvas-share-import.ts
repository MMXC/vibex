/**
 * Canvas Share Import API — S83-E2: Import canvas via share link
 *
 * POST /v1/canvas-share/import  — Validate share token and return canvas data
 * GET  /v1/canvas-share/import?token=xxx — Validate token and get canvas metadata (public)
 *
 * This route is public — no auth required.
 * Used when a user receives a share link (?import=<token>) and wants to import
 * the shared canvas into their own workspace.
 *
 * Token storage: in-memory Map (module-level, persists across requests in same worker)
 * matching the pattern used in canvas-share.ts.
 *
 * The frontend shareService syncs newly generated tokens to this store via
 * POST /v1/canvas-share/import/register when generateShareLink() is called.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '@/lib/db';
import { queryOne } from '@/lib/db';
import { apiError, ERROR_CODES } from '@/lib/api-error';
import { safeError } from '@/lib/log-sanitizer';
import type { ShareRole } from '@/lib/api/canvas-share';

const shareImport = new Hono<{ Bindings: Env }>();

// ============================================
// In-memory ShareToken store
// Key: shareToken string, Value: ShareTokenRecord
// ============================================

interface ShareTokenRecord {
  token: string;
  canvasId: string;
  role: ShareRole;
  createdBy: string | null;
  createdAt: string;
  expiresAt: string | null;
}

// Module-level store (persists across requests in same worker instance)
const tokenStore = new Map<string, ShareTokenRecord>();

// ============================================
// Schemas
// ============================================

const RegisterTokenSchema = z.object({
  token: z.string().min(1).max(64),
  canvasId: z.string().min(1),
  role: z.enum(['viewer', 'editor']),
  createdBy: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
});

const ImportSchema = z.object({
  token: z.string().min(1).max(64),
});

// ============================================
// GET /v1/canvas-share/import?token=xxx
// Public endpoint — validate token and return canvas metadata
// ============================================

shareImport.get('/', async (c) => {
  try {
    const token = c.req.query('token');

    if (!token) {
      return c.json(apiError('token query param is required', ERROR_CODES.BAD_REQUEST), 400);
    }

    const record = tokenStore.get(token);

    if (!record) {
      return c.json(apiError('Share token not found or expired', ERROR_CODES.NOT_FOUND), 404);
    }

    // Check expiration
    if (record.expiresAt) {
      const expiresAt = new Date(record.expiresAt).getTime();
      if (expiresAt < Date.now()) {
        tokenStore.delete(token);
        return c.json(apiError('Share link has expired', ERROR_CODES.GONE), 410);
      }
    }

    // Look up canvas snapshot data
    let canvasData: unknown = null;
    let canvasName: string | null = null;

    try {
      const snapshot = await queryOne<{
        id: string;
        projectId: string;
        name: string | null;
        data: string;
      }>(
        c.env,
        'SELECT id, projectId, name, data FROM CanvasSnapshot WHERE projectId = ? ORDER BY version DESC LIMIT 1',
        [record.canvasId]
      );

      if (snapshot) {
        canvasData = JSON.parse(snapshot.data);
        canvasName = snapshot.name;
      }
    } catch {
      // CanvasSnapshot table may not exist in all environments — continue without data
    }

    return c.json({
      success: true,
      token: record.token,
      canvasId: record.canvasId,
      canvasName,
      role: record.role,
      expiresAt: record.expiresAt,
      canvasData,
    });
  } catch (err) {
    safeError('[canvas-share-import] GET error:', err);
    return c.json(apiError('Failed to validate share token', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// POST /v1/canvas-share/import/register
// Register a share token (called by shareService when generating a link)
// This endpoint is authenticated — requires x-user-id header
// ============================================

shareImport.post('/register', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    const body = await c.req.json();
    const parsed = RegisterTokenSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(apiError('Invalid request body', ERROR_CODES.BAD_REQUEST), 400);
    }

    const { token, canvasId, role, expiresAt } = parsed.data;

    const record: ShareTokenRecord = {
      token,
      canvasId,
      role,
      createdBy: userId ?? null,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt ?? null,
    };

    tokenStore.set(token, record);

    return c.json({ success: true, token: record.token }, 201);
  } catch (err) {
    safeError('[canvas-share-import] POST /register error:', err);
    return c.json(apiError('Failed to register share token', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// POST /v1/canvas-share/import
// Validate a share token and retrieve canvas data for import
// Public endpoint — used by the import dialog
// ============================================

shareImport.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = ImportSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(apiError('Invalid request body', ERROR_CODES.BAD_REQUEST), 400);
    }

    const { token } = parsed.data;
    const record = tokenStore.get(token);

    if (!record) {
      return c.json(apiError('Share token not found or expired', ERROR_CODES.NOT_FOUND), 404);
    }

    // Check expiration
    if (record.expiresAt) {
      const expiresAt = new Date(record.expiresAt).getTime();
      if (expiresAt < Date.now()) {
        tokenStore.delete(token);
        return c.json(apiError('Share link has expired', ERROR_CODES.GONE), 410);
      }
    }

    // Look up canvas snapshot data
    let canvasData: unknown = null;
    let canvasName: string | null = null;
    let canvasVersion: number | null = null;

    try {
      const snapshot = await queryOne<{
        id: string;
        projectId: string;
        name: string | null;
        version: number;
        data: string;
      }>(
        c.env,
        'SELECT id, projectId, name, version, data FROM CanvasSnapshot WHERE projectId = ? ORDER BY version DESC LIMIT 1',
        [record.canvasId]
      );

      if (snapshot) {
        canvasData = JSON.parse(snapshot.data);
        canvasName = snapshot.name;
        canvasVersion = snapshot.version;
      }
    } catch {
      // CanvasSnapshot table may not exist — continue without data
    }

    return c.json({
      success: true,
      token: record.token,
      canvasId: record.canvasId,
      canvasName,
      canvasVersion,
      role: record.role,
      expiresAt: record.expiresAt,
      canvasData,
    });
  } catch (err) {
    safeError('[canvas-share-import] POST error:', err);
    return c.json(apiError('Failed to import from share link', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// DELETE /v1/canvas-share/import?token=xxx
// Revoke a share token (authenticated)
// ============================================

shareImport.delete('/', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    const token = c.req.query('token');

    if (!token) {
      return c.json(apiError('token query param is required', ERROR_CODES.BAD_REQUEST), 400);
    }

    const record = tokenStore.get(token);

    if (!record) {
      return c.json(apiError('Share token not found', ERROR_CODES.NOT_FOUND), 404);
    }

    // Only the creator or admin can revoke
    if (record.createdBy && record.createdBy !== userId) {
      return c.json(apiError('Permission denied', ERROR_CODES.FORBIDDEN), 403);
    }

    tokenStore.delete(token);

    return c.json({ success: true });
  } catch (err) {
    safeError('[canvas-share-import] DELETE error:', err);
    return c.json(apiError('Failed to revoke share token', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

export default shareImport;
