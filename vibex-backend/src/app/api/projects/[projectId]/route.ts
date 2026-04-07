/**
 * Project Detail API — DEPRECATED (merged into [id]/route.ts)
 *
 * This route is kept for backward compatibility but redirects callers
 * to the merged [id] route. Add Deprecation header to all responses.
 *
 * Migration: use /api/projects/{id} instead of /api/projects/{projectId}
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { getLocalEnv } from '@/lib/env';

const DEPRECATION_HEADERS = {
  'Deprecation': 'true',
  'Sunset': 'Sat, 31 May 2026 23:59:59 GMT',
  'X-API-Deprecation-Info': 'https://docs.vibex.ai/api-v0-sunset',
  'X-Migration': 'Use /api/projects/{id} instead of /api/projects/{projectId}',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const env = getLocalEnv();
  const auth = getAuthUserFromRequest(request, env.JWT_SECRET);
  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized: authentication required' },
      { status: 401, headers: DEPRECATION_HEADERS }
    );
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
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404, headers: DEPRECATION_HEADERS }
    );
  }

  return NextResponse.json(
    { project, _migratedTo: `/api/projects/${projectId}` },
    { status: 200, headers: DEPRECATION_HEADERS }
  );
}
