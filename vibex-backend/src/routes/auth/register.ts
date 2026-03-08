import { Hono } from 'hono';
import { hashPassword, generateToken } from '@/lib/auth';
import { queryOne, executeDB, generateId, Env } from '@/lib/db';

const register = new Hono<{ Bindings: Env }>();

// POST /api/auth/register
register.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return c.json(
        { success: false, error: 'Email and password are required', code: 'BAD_REQUEST' },
        400
      );
    }

    const env = c.env;
    const jwtSecret = env.JWT_SECRET;

    if (!jwtSecret) {
      return c.json(
        { success: false, error: 'Server configuration error', code: 'INTERNAL_ERROR' },
        500
      );
    }

    // Check if user already exists using D1
    const existingUser = await queryOne<{ id: string }>(
      env,
      'SELECT id FROM User WHERE email = ?',
      [email]
    );

    if (existingUser) {
      return c.json(
        { success: false, error: 'Email already registered', code: 'CONFLICT' },
        409
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    const userId = generateId();
    const now = new Date().toISOString();

    // Create user using D1
    await executeDB(
      env,
      'INSERT INTO User (id, email, name, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, email, name || email.split('@')[0], hashedPassword, now, now]
    );

    // Generate token
    const token = generateToken({
      userId: userId,
      email: email,
    }, jwtSecret);

    return c.json(
      {
        success: true,
        data: {
          token,
          user: {
            id: userId,
            email: email,
            name: name || email.split('@')[0],
            avatar: null,
            createdAt: now,
            updatedAt: now,
          },
        },
      },
      201
    );
  } catch (error) {
    console.error('Register error:', error);
    return c.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      500
    );
  }
});

export default register;