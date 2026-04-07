/**
 * Test authentication utilities for API route tests
 *
 * Provides valid JWT tokens for testing protected routes.
 */
import jwt from 'jsonwebtoken';

const TEST_SECRET = process.env.JWT_SECRET || 'vibex-dev-secret';

/**
 * Generate a valid test JWT token
 */
export function createTestToken(userId = 'test-user-123', email = 'test@example.com'): string {
  return jwt.sign({ userId, email }, TEST_SECRET, { expiresIn: '1h' });
}

/**
 * Create an Authorization header with valid JWT
 */
export function authHeader(userId = 'test-user-123', email = 'test@example.com'): HeadersInit {
  return {
    'Authorization': `Bearer ${createTestToken(userId, email)}`,
    'Content-Type': 'application/json',
  };
}
