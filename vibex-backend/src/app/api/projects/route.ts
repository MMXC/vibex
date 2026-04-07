/**
 * Projects API — E-P0-4 P0-13: 项目搜索过滤
 * GET /api/projects?q=xxx&status=&limit=&offset=
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

export async function GET(request: NextRequest) {
  const env = getLocalEnv();
  const auth = getAuthUserFromRequest(request, env.JWT_SECRET);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized: authentication required' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const status = searchParams.get('status');
  const isPublicParam = searchParams.get('isPublic');
  const isTemplateParam = searchParams.get('isTemplate');
  const userId = searchParams.get('userId');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  const startTime = Date.now();

  const where: Record<string, unknown> = {
    deletedAt: null, // exclude soft-deleted
  };

  // Search by name or description
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
    ];
  }

  // Filters
  if (status) where.status = status;
  if (isPublicParam !== null) where.isPublic = isPublicParam === 'true';
  if (isTemplateParam !== null) where.isTemplate = isTemplateParam === 'true';
  // Users only see their own projects by default, unless isPublic=true
  if (!userId && auth.userId) {
    where.OR = [
      { userId: auth.userId },
      { isPublic: true },
    ];
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { id: true, email: true } },
        _count: { select: { pages: true, messages: true } },
      },
    }),
    prisma.project.count({ where }),
  ]);

  const responseTime = Date.now() - startTime;

  return NextResponse.json(
    {
      projects,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + projects.length < total,
      },
      meta: {
        responseTimeMs: responseTime,
        query: q,
      },
    },
    {
      status: 200,
      headers: DEPRECATION_HEADERS,
    }
  );
}
