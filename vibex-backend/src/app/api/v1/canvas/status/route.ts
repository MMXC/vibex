/**
 * GET /api/canvas/status?projectId=xxx — Poll prototype generation status
 *
 * Epic 5: S5.4 轮询进度更新
 * Output: { projectId, pages: PrototypePage[], overallProgress: number }
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import { safeError } from '@/lib/log-sanitizer';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { getLocalEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

// Auth helper for canvas routes
function checkAuth(req: NextRequest) {
  const env = getLocalEnv();
  const auth = getAuthUserFromRequest(req, env.JWT_SECRET);
  return auth;
}

export async function GET(request: NextRequest) {
  // E1: Authentication check
  const auth = checkAuth(request);
  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized: authentication required', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    const projectId = request.nextUrl.searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId query parameter' }, { status: 400 });
    }

    const canvasProject = await prisma.canvasProject.findUnique({
      where: { id: projectId },
      include: { pages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!canvasProject) {
      return NextResponse.json({ error: 'Canvas project not found' }, { status: 404 });
    }

    const pages = canvasProject.pages.map((p: { id: string; componentId: string; name: string; status: string; progress: number; retryCount: number; errorMessage: string | null; generatedAt: Date | null }) => ({
      pageId: p.id,
      componentId: p.componentId,
      name: p.name,
      status: p.status,
      progress: p.progress,
      retryCount: p.retryCount,
      errorMessage: p.errorMessage ?? undefined,
      generatedAt: p.generatedAt ? p.generatedAt.getTime() : undefined,
    }));

    const totalProgress = pages.length > 0
      ? Math.round(pages.reduce((sum: number, p: { progress: number }) => sum + p.progress, 0) / pages.length)
      : 0;

    return NextResponse.json({
      projectId: canvasProject.id,
      pages,
      overallProgress: totalProgress,
    });
  } catch (error) {
    safeError('[canvas/status] Error:', error);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}
