/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
import { Hono } from 'hono';

import { getAuthUserFromHono, hashPassword } from '@/lib/auth';
import { queryOne, executeDB, Env } from '@/lib/db';

import { safeError } from '@/lib/log-sanitizer';
import { apiError, ERROR_CODES } from '@/lib/api-error';

const users = new Hono<{ Bindings: Env }>();

interface UserRow {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

// GET /api/users/:userId - Get user profile
users.get('/:userId', async (c) => {
  try {
    const auth = getAuthUserFromHono(c);
    if (!auth) {
      return c.json(
        { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' },
        401
      );
    }

    const userId = c.req.param('userId');

    // Only allow users to get their own profile
    if (auth.userId !== userId) {
      return c.json(apiError('Forbidden', ERROR_CODES.FORBIDDEN), 403);
    }

    const user = await queryOne<UserRow>(
      c.env,
      'SELECT id, email, name, avatar, createdAt, updatedAt FROM User WHERE id = ?',
      [userId]
    );

    if (!user) {
      return c.json(apiError('User not found', ERROR_CODES.USER_NOT_FOUND), 404);
    }

    return c.json({
      success: true,
      data: user,
    });
  } catch (error) {
    safeError('Get user error:', error);
    return c.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      500
    );
  }
});

// PUT /api/users/:userId - Update user profile
users.put('/:userId', async (c) => {
  try {
    const auth = getAuthUserFromHono(c);
    if (!auth) {
      return c.json(
        { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' },
        401
      );
    }

    const userId = c.req.param('userId');

    // Only allow users to update their own profile
    if (auth.userId !== userId) {
      return c.json(apiError('Forbidden', ERROR_CODES.FORBIDDEN), 403);
    }

    const body = await c.req.json();
    const { name, avatar, password } = body;

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(avatar);
    }
    if (password !== undefined) {
      updates.push('password = ?');
      const hashedPassword = await hashPassword(password);
      values.push(hashedPassword);
    }

    if (updates.length > 0) {
      updates.push('updatedAt = ?');
      values.push(now);
      values.push(userId!);

      await executeDB(
        c.env,
        `UPDATE User SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    // Fetch updated user
    const user = await queryOne<UserRow>(
      c.env,
      'SELECT id, email, name, avatar, createdAt, updatedAt FROM User WHERE id = ?',
      [userId]
    );

    return c.json({
      success: true,
      data: user,
    });
  } catch (error) {
    safeError('Update user error:', error);
    return c.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      500
    );
  }
});

export default users;