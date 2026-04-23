import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';

import prisma from '@/lib/prisma';

import { safeError } from '@/lib/log-sanitizer';


// E-P0-3: API v0 deprecation header (per architecture.md ADR-003)
const V0_DEPRECATION_HEADERS = {
  'Deprecation': 'true',
  'Sunset': 'Sat, 31 May 2026 23:59:59 GMT',
  'X-API-Deprecation-Info': 'https://docs.vibex.ai/api-v0-sunset',
};

export const dynamic = 'force-dynamic';

// GET /api/pages - List all pages (or filter by projectId)
export async function GET(request: NextRequest) {
    // Auth check
    const { success, user } = getAuthUserFromRequest(request);
    if (!success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    return NextResponse.json({ pages }, { headers: V0_DEPRECATION_HEADERS });
  } catch (error) {
    safeError('Error fetching pages:', error);
    return NextResponse.json({ error: 'Failed to fetch pages' }, { headers: V0_DEPRECATION_HEADERS, status: 500 });
  }
}

// POST /api/pages - Create a new page
export async function POST(request: NextRequest) {
    // Auth check
    const { success, user } = getAuthUserFromRequest(request);
    if (!success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  try {
    const body = await request.json();
    const { name, content, projectId } = body;

    if (!name || !projectId) {
      return NextResponse.json({ error: 'Missing required fields: name, projectId' }, { headers: V0_DEPRECATION_HEADERS, status: 400 });
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

    return NextResponse.json({ page }, { headers: V0_DEPRECATION_HEADERS, status: 201 });
  } catch (error) {
    safeError('Error creating page:', error);
    return NextResponse.json({ error: 'Failed to create page' }, { headers: V0_DEPRECATION_HEADERS, status: 500 });
  }
}
