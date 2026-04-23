import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import { safeError } from '@/lib/log-sanitizer';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { getLocalEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

// Auth helper
function checkAuth(req: NextRequest) {
  const env = getLocalEnv();
  const { success, user } = getAuthUserFromRequest(req);
  return { success, user };
    }

    // GET /api/pages - List all pages (or filter by projectId)
export async function GET(request: NextRequest) {
  // E1: Authentication check
  const { success, user } = checkAuth(request);
    if (!success) {
    return NextResponse.json(
      { error: 'Unauthorized: authentication required', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    const pages = await prisma.page.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        project: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ pages });
  } catch (error) {
    safeError('Error fetching pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

// POST /api/pages - Create a new page
export async function POST(request: NextRequest) {
  // E1: Authentication check
  const { success, user } = checkAuth(request);
    if (!success) {
    return NextResponse.json(
      { error: 'Unauthorized: authentication required', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { name, content, projectId } = body;

    if (!name || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, projectId' },
        { status: 400 }
      );
    }

    const page = await prisma.page.create({
      data: {
        name,
        content: content || null,
        projectId,
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    safeError('Error creating page:', error);
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    );
  }
}
