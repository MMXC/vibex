import { Hono } from 'hono';
import { verifyPassword, generateToken } from '@/lib/auth';
import { queryOne, Env } from '@/lib/db';

const login = new Hono<{ Bindings: Env }>();

interface UserRow {
  id: string;
  email: string;
  name: string;
  password: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

// POST /api/auth/login
login.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json(
        { success: false, error: 'Email and password are required', code: 'BAD_REQUEST' },
        400
      );
    }

    const env = c.env;

    // Find user using D1
    const user = await queryOne<UserRow>(
      env,
      'SELECT id, email, name, password, avatar, createdAt, updatedAt FROM User WHERE email = ?',
      [email]
    );

    if (!user) {
      return c.json(
        { success: false, error: 'Invalid email or password', code: 'UNAUTHORIZED' },
        401
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return c.json(
        { success: false, error: 'Invalid email or password', code: 'UNAUTHORIZED' },
        401
      );
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return c.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      500
    );
  }
});

export default login;