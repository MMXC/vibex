import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, hashPassword } from '@/lib/auth';
import { getEnv } from '@/lib/env';

import { safeError } from '@/lib/log-sanitizer';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';



// E-P0-3: API v0 deprecation header (per architecture.md ADR-003)
const V0_DEPRECATION_HEADERS = {
  'Deprecation': 'true',
  'Sunset': 'Sat, 31 May 2026 23:59:59 GMT',
  'X-API-Deprecation-Info': 'https://docs.vibex.ai/api-v0-sunset',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const env = getEnv();
    const auth = getAuthUserFromRequest(request, env.JWT_SECRET);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' }, { headers: V0_DEPRECATION_HEADERS, status: 401 });
    }

    const { userId } = await params;

    // Only allow users to get their own profile
    if (auth.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Forbidden', code: 'FORBIDDEN' }, { headers: V0_DEPRECATION_HEADERS, status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found', code: 'NOT_FOUND' }, { headers: V0_DEPRECATION_HEADERS, status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user,
    }, { headers: V0_DEPRECATION_HEADERS });
  } catch (error) {
    safeError('Get user error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }, { headers: V0_DEPRECATION_HEADERS, status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const env = getEnv();
    const auth = getAuthUserFromRequest(request, env.JWT_SECRET);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' }, { headers: V0_DEPRECATION_HEADERS, status: 401 });
    }

    const { userId } = await params;

    // Only allow users to update their own profile
    if (auth.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Forbidden', code: 'FORBIDDEN' }, { headers: V0_DEPRECATION_HEADERS, status: 403 });
    }

    const body = await request.json();
    const { name, avatar, password } = body;

    const updateData: { name?: string; avatar?: string; password?: string } = {};
    
    if (name !== undefined) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (password !== undefined) {
      updateData.password = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
    }, { headers: V0_DEPRECATION_HEADERS });
  } catch (error) {
    safeError('Update user error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }, { headers: V0_DEPRECATION_HEADERS, status: 500 });
  }
}
