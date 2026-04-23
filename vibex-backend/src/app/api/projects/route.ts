/**
 * Projects API — E-P0-4 P0-13: 项目搜索过滤
 * GET /api/projects?q=xxx&status=&limit=&offset=
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { getLocalEnv } from '@/lib/env';
import { safeError } from '@/lib/log-sanitizer';

const DEPRECATION_HEADERS = {
  'Deprecation': 'true',
  'Sunset': 'Sat, 31 May 2026 23:59:59 GMT',
  'X-API-Deprecation-Info': 'https://docs.vibex.ai/api-v0-sunset',
};

export async function GET(request: NextRequest) {
  const env = getLocalEnv();
  const { success, user } = getAuthUserFromRequest(request);
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

  // Filters
  if (status) where.status = status;
  if (isPublicParam !== null) where.isPublic = isPublicParam === 'true';
  if (isTemplateParam !== null) where.isTemplate = isTemplateParam === 'true';

  // Users only see their own projects by default, unless isPublic=true
  // Search by name or description (combines with user filter when applicable)
  if (q) {
    const searchOR = [
      { name: { contains: q } },
      { description: { contains: q } },
    ];
    if (userId) {
      // Explicit userId + search
      where.userId = userId;
      where.OR = searchOR;
    } else if (user?.userId) {
      // Auth user filter + search
      where.AND = [
        { OR: searchOR },
        { OR: [{ userId: user?.userId }, { isPublic: true }] },
      ];
    } else {
      where.OR = searchOR;
    }
  } else if (userId) {
    // Explicit userId filter only
    where.userId = userId;
  } else if (user?.userId) {
    // Default: auth user's own projects + public
    where.OR = [
      { userId: user?.userId },
      { isPublic: true },
    ];
  }

  try {
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
  } catch (error) {
    safeError('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
