import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/schemas/security';  // S3.1: Auth route validation'
import { PrismaClient } from '@prisma/client';
import { verifyPassword, generateToken } from '@/lib/auth';
import { getEnv } from '@/lib/env';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const env = getEnv();
    const jwtSecret = env.JWT_SECRET;
    // S3.1: Validate with Zod schema - JSON parse error tolerance
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
    }, jwtSecret);

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
