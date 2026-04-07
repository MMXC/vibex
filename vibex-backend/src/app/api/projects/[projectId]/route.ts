/**
 * Project Detail API — E-P0-4 P0-13
 * GET /api/projects/:projectId
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { getLocalEnv } from '@/lib/env';

const DEPRECATION_HEADERS = {
  'Deprecation': 'true',
  'Sunset': 'Sat, 31 May 2026 23:59:59 GMT',
  'X-API-Deprecation-Info': 'https://docs.vibex.ai/api-v0-sunset',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const env = getLocalEnv();
  const auth = getAuthUserFromRequest(request, env.JWT_SECRET);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized: authentication required' }, { status: 401 });
  }

  const { projectId } = await params;
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      deletedAt: null,
      OR: [
        { userId: auth.userId },
        { isPublic: true },
      ],
    },
    include: {
      user: { select: { id: true, email: true } },
      _count: { select: { pages: true, messages: true, flows: true } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json({ project }, { status: 200, headers: DEPRECATION_HEADERS });
}
