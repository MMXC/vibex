import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { getEnv } from '@/lib/env';

import { safeError } from '@/lib/log-sanitizer';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';



// E-P0-3: API v0 deprecation header (per architecture.md ADR-003)
const V0_DEPRECATION_HEADERS = {
  'Deprecation': 'true',
  'Sunset': 'Sat, 31 May 2026 23:59:59 GMT',
  'X-API-Deprecation-Info': 'https://docs.vibex.ai/api-v0-sunset',
};

export async function GET(request: NextRequest) {
  try {
    const env = getEnv();
    const auth = getAuthUserFromRequest(request, env.JWT_SECRET);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' }, { headers: V0_DEPRECATION_HEADERS, status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ success: false, error: 'projectId is required', code: 'BAD_REQUEST' }, { headers: V0_DEPRECATION_HEADERS, status: 400 });
    }

    // Verify the user owns this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: auth.userId,
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found', code: 'NOT_FOUND' }, { headers: V0_DEPRECATION_HEADERS, status: 404 });
    }

    const messages = await prisma.message.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        projectId: msg.projectId,
        createdAt: msg.createdAt.toISOString(),
      })),
    }, { headers: V0_DEPRECATION_HEADERS });
  } catch (error) {
    safeError('Get messages error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }, { headers: V0_DEPRECATION_HEADERS, status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = getEnv();
    const auth = getAuthUserFromRequest(request, env.JWT_SECRET);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' }, { headers: V0_DEPRECATION_HEADERS, status: 401 });
    }

    const body = await request.json();
    const { content, projectId, role = 'user' } = body;

    if (!content || !projectId) {
      return NextResponse.json({ success: false, error: 'content and projectId are required', code: 'BAD_REQUEST' }, { headers: V0_DEPRECATION_HEADERS, status: 400 });
    }

    // Verify the user owns this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: auth.userId,
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found', code: 'NOT_FOUND' }, { headers: V0_DEPRECATION_HEADERS, status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        content,
        role,
        projectId,
      },
    });

    return NextResponse.json({
        success: true,
        data: {
          id: message.id,
          role: message.role,
          content: message.content,
          projectId: message.projectId,
          createdAt: message.createdAt.toISOString(),
        },
      }, { headers: V0_DEPRECATION_HEADERS, status: 201 });
  } catch (error) {
    safeError('Create message error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }, { headers: V0_DEPRECATION_HEADERS, status: 500 });
  }
}
