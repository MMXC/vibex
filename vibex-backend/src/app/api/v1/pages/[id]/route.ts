import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cuidSchema } from '@/schemas/common';
import { AppError, ValidationError } from '@/lib/errors';
import { errorToResponse } from '@/lib/errors';

import { safeError } from '@/lib/log-sanitizer';

export const dynamic = 'force-dynamic';

// GET /api/pages/[id] - Get a single page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // E3: Validate id format
    const parsed = cuidSchema.safeParse(id);
    if (!parsed.success) {
      const error = new ValidationError(`Invalid page ID format: ${id}`);
      return NextResponse.json(errorToResponse(error), { status: 400 });
    }

    const page = await prisma.page.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ page });
  } catch (error) {
    safeError('Error fetching page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page' },
      { status: 500 }
    );
  }
}

// PUT /api/pages/[id] - Update a page (for flow data persistence)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // E3: Validate id format
    const parsed = cuidSchema.safeParse(id);
    if (!parsed.success) {
      const error = new ValidationError(`Invalid page ID format: ${id}`);
      return NextResponse.json(errorToResponse(error), { status: 400 });
    }

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

    return NextResponse.json({ page });
  } catch (error) {
    safeError('Error updating page:', error);
    return NextResponse.json(
      { error: 'Failed to update page' },
      { status: 500 }
    );
  }
}

// DELETE /api/pages/[id] - Delete a page
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // E3: Validate id format
    const parsed = cuidSchema.safeParse(id);
    if (!parsed.success) {
      const error = new ValidationError(`Invalid page ID format: ${id}`);
      return NextResponse.json(errorToResponse(error), { status: 400 });
    }

    await prisma.page.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    safeError('Error deleting page:', error);
    return NextResponse.json(
      { error: 'Failed to delete page' },
      { status: 500 }
    );
  }
}
