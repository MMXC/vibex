import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/prototype-snapshots/[id] - Get a single snapshot
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const snapshot = await prisma.prototypeSnapshot.findUnique({
      where: { id },
    });

    if (!snapshot) {
      return NextResponse.json(
        { error: 'Prototype snapshot not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ prototypeSnapshot: snapshot });
  } catch (error) {
    console.error('Error fetching prototype snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prototype snapshot' },
      { status: 500 }
    );
  }
}

// PUT /api/prototype-snapshots/[id] - Update a snapshot
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, content, version } = body;

    const snapshot = await prisma.prototypeSnapshot.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(content !== undefined && { content }),
        ...(version !== undefined && { version }),
      },
    });

    return NextResponse.json({ prototypeSnapshot: snapshot });
  } catch (error) {
    console.error('Error updating prototype snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to update prototype snapshot' },
      { status: 500 }
    );
  }
}

// DELETE /api/prototype-snapshots/[id] - Delete a snapshot
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.prototypeSnapshot.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prototype snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to delete prototype snapshot' },
      { status: 500 }
    );
  }
}