import { Hono } from 'hono';

const logout = new Hono();

// POST /api/auth/logout
// For stateless JWT auth, logout is handled client-side by removing the token
logout.post('/', async (c) => {
  return c.json({
    success: true,
    message: 'Logged out successfully. Please remove the token from client storage.',
  });
});

export default logout;
