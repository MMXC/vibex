import { hashPassword, verifyPassword, generateToken, verifyToken, authMiddleware } from '../lib/auth';
import { Hono } from 'hono';

const TEST_SECRET = 'test-secret-key-for-testing';

describe('Auth Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // Salt should be different
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);

      const isValid = await verifyPassword(password, hashed);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);

      const isValid = await verifyPassword('wrongPassword', hashed);
      expect(isValid).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a JWT token', () => {
      const payload = { userId: 'user123', email: 'test@example.com' };
      const token = generateToken(payload, TEST_SECRET);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const payload = { userId: 'user123', email: 'test@example.com' };
      const token = generateToken(payload, TEST_SECRET);

      const verified = verifyToken(token, TEST_SECRET);

      expect(verified).toBeDefined();
      expect(verified?.userId).toBe('user123');
      expect(verified?.email).toBe('test@example.com');
    });

    it('should return null for invalid token', () => {
      const verified = verifyToken('invalid-token', TEST_SECRET);

      expect(verified).toBeNull();
    });

    it('should return null for tampered token', () => {
      const payload = { userId: 'user123', email: 'test@example.com' };
      const token = generateToken(payload, TEST_SECRET);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';

      const verified = verifyToken(tamperedToken, TEST_SECRET);

      expect(verified).toBeNull();
    });
  });
});

// ─── E2.3 Test: authMiddleware CONFIG_ERROR ───────────────────────────────────

describe('E2.3: authMiddleware JWT_SECRET CONFIG_ERROR', () => {
  // Build a minimal app with authMiddleware
  const buildApp = () => {
    const app = new Hono();
    app.use('*', authMiddleware);
    app.get('/protected', (c) => c.json({ ok: true }));
    return app;
  };

  it('returns CONFIG_ERROR when JWT_SECRET is missing', async () => {
    const app = buildApp();
    const req = new Request('http://localhost/protected', { method: 'GET' });
    const res = await app.fetch(req, { env: { JWT_SECRET: undefined } });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe('CONFIG_ERROR');
    expect(body.error).toContain('JWT_SECRET');
    expect(body.error).toContain('wrangler secret put JWT_SECRET');
  });

  it('returns CONFIG_ERROR with actionable message (not INTERNAL_ERROR)', async () => {
    const app = buildApp();
    const req = new Request('http://localhost/protected', { method: 'GET' });
    const res = await app.fetch(req, { env: { JWT_SECRET: undefined } });

    const body = await res.json();
    expect(body.code).toBe('CONFIG_ERROR');
    expect(body.error).toMatch(/wrangler secret put JWT_SECRET/);
    expect(body.code).not.toBe('INTERNAL_ERROR');
  });

});
