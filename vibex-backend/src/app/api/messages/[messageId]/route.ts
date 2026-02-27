import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthUser } from '@/lib/auth';

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const auth = getAuthUser(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { messageId } = await params;

    // Find the message and verify ownership through project
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        project: true,
      },
    });

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Only allow users to delete their own messages
    if (message.project.userId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Message deleted successfully' },
    });
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
