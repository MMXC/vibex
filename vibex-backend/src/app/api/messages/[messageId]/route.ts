import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { getEnv } from '@/lib/env';

import { safeError } from '@/lib/log-sanitizer';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';



// E-P0-3: API v0 deprecation header (per architecture.md ADR-003)
const V0_DEPRECATION_HEADERS = {
  'Deprecation': 'true',
  'Sunset': 'Sat, 31 May 2026 23:59:59 GMT',
  'X-API-Deprecation-Info': 'https://docs.vibex.ai/api-v0-sunset',
};

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const env = getEnv();
    const { success, user } = getAuthUserFromRequest(request);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' }, { headers: V0_DEPRECATION_HEADERS, status: 401 });
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
      return NextResponse.json({ success: false, error: 'Message not found', code: 'NOT_FOUND' }, { headers: V0_DEPRECATION_HEADERS, status: 404 });
    }

    // Only allow users to delete their own messages
    if (message.project.userId !== user?.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden', code: 'FORBIDDEN' }, { headers: V0_DEPRECATION_HEADERS, status: 403 });
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Message deleted successfully' },
    }, { headers: V0_DEPRECATION_HEADERS });
  } catch (error) {
    safeError('Delete message error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }, { headers: V0_DEPRECATION_HEADERS, status: 500 });
  }
}
