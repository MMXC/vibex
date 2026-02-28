import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CloudflareEnv } from './env';

const JWT_EXPIRES_IN = '7d';

export interface JWTPayload {
  userId: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: JWTPayload, jwtSecret: string): string {
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return jwt.sign(payload, jwtSecret, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string, jwtSecret: string): JWTPayload | null {
  if (!jwtSecret) {
    return null;
  }
  try {
    return jwt.verify(token, jwtSecret) as JWTPayload;
  } catch {
    return null;
  }
}

export function getAuthUser(request: Request, jwtSecret: string): JWTPayload | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  return verifyToken(token, jwtSecret);
}

// Hono compatible auth helper
export function getAuthUserFromHeader(authHeader: string | null, jwtSecret: string): JWTPayload | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return verifyToken(token, jwtSecret);
}

export function getAuthUserFromHono(c: { env: CloudflareEnv; req: { header: (name: string) => string | undefined } }): JWTPayload | null {
  const authHeader = c.req.header('Authorization');
  return getAuthUserFromHeader(authHeader || null, c.env.JWT_SECRET);
}