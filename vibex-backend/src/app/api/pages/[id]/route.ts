import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import { safeError } from '@/lib/log-sanitizer';


// E-P0-3: API v0 deprecation header (per architecture.md ADR-003)
const V0_DEPRECATION_HEADERS = {
  'Deprecation': 'true',
  'Sunset': 'Sat, 31 May 2026 23:59:59 GMT',
  'X-API-Deprecation-Info': 'https://docs.vibex.ai/api-v0-sunset',
};

export const dynamic = 'force-dynamic';

// GET /api/pages/[id] - Get a single page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const page = await prisma.page.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { headers: V0_DEPRECATION_HEADERS, status: 404 });
    }

    return NextResponse.json({ page }, { headers: V0_DEPRECATION_HEADERS });
  } catch (error) {
    safeError('Error fetching page:', error);
    return NextResponse.json({ error: 'Failed to fetch page' }, { headers: V0_DEPRECATION_HEADERS, status: 500 });
  }
}

// PUT /api/pages/[id] - Update a page (for flow data persistence)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, content } = body;

    const page = await prisma.page.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(content !== undefined && { content }),
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json({ page }, { headers: V0_DEPRECATION_HEADERS });
  } catch (error) {
    safeError('Error updating page:', error);
    return NextResponse.json({ error: 'Failed to update page' }, { headers: V0_DEPRECATION_HEADERS, status: 500 });
  }
}

// DELETE /api/pages/[id] - Delete a page
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.page.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { headers: V0_DEPRECATION_HEADERS });
  } catch (error) {
    safeError('Error deleting page:', error);
    return NextResponse.json({ error: 'Failed to delete page' }, { headers: V0_DEPRECATION_HEADERS, status: 500 });
  }
}
