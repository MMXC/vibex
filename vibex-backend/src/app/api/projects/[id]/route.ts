/**
 * GET /api/projects/[id] — Project detail (merged from [projectId]/route.ts)
 * - Adds auth + ownership check + _count + soft delete filter
 * - Matches IMPLEMENTATION_PLAN E1 Phase 1 requirements
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { safeError } from '@/lib/log-sanitizer';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { getLocalEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

const DEPRECATION_HEADERS = {
  'Deprecation': 'true',
  'Sunset': 'Sat, 31 May 2026 23:59:59 GMT',
  'X-API-Deprecation-Info': 'https://docs.vibex.ai/api-v0-sunset',
};

// GET /api/projects/[id] — Get a single project with _count
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const env = getLocalEnv();
    const { success, user } = getAuthUserFromRequest(request);

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized: authentication required' },
        { status: 401 }
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [
          { userId: user?.userId },
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
        { status: 404 }
      );
    }

    return NextResponse.json({ project }, { status: 200, headers: DEPRECATION_HEADERS });
  } catch (error) {
    safeError('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] — Update a project (with ownership check)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const env = getLocalEnv();
    const { success, user } = getAuthUserFromRequest(request);

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized: authentication required' },
        { status: 401 }
      );
    }

    // Ownership check
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing || existing.userId !== user?.userId) {
      return NextResponse.json(
        { error: 'Forbidden: not the project owner' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
      include: {
        user: { select: { id: true, email: true } },
        _count: { select: { pages: true, messages: true, flows: true } },
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    safeError('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] — Soft delete a project (with ownership check)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const env = getLocalEnv();
    const { success, user } = getAuthUserFromRequest(request);

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized: authentication required' },
        { status: 401 }
      );
    }

    // Ownership check
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing || existing.userId !== user?.userId) {
      return NextResponse.json(
        { error: 'Forbidden: not the project owner' },
        { status: 403 }
      );
    }

    // Soft delete: set deletedAt instead of hard delete
    await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    safeError('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
