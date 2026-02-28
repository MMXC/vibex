import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// JWT 配置 - 生产环境强制要求环境变量，测试/开发环境使用默认值
const JWT_SECRET = process.env.JWT_SECRET || (
  process.env.NODE_ENV === 'production' 
    ? undefined 
    : 'vibex-dev-secret-key-not-for-production'
);
const JWT_EXPIRES_IN = '7d';

// 启动时验证 JWT_SECRET 已配置
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}

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

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function getAuthUser(request: Request): JWTPayload | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  return verifyToken(token);
}

// Hono compatible auth helper
export function getAuthUserFromHeader(authHeader: string | null): JWTPayload | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return verifyToken(token);
}

export function getAuthUserFromHono(c: any): JWTPayload | null {
  const authHeader = c.req.header('Authorization');
  return getAuthUserFromHeader(authHeader);
}
