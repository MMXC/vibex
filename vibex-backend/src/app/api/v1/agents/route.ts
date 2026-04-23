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

    // GET /api/agents - List all agents (or filter by userId)
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
    const userId = searchParams.get('userId');

    const agents = await prisma.agent.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ agents });
  } catch (error) {
    safeError('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

// POST /api/agents - Create a new agent
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
    const { name, prompt, model, temperature, userId } = body;

    if (!name || !prompt || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, prompt, userId' },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        prompt,
        model: model || 'abab6.5s-chat',
        temperature: temperature ?? 0.7,
        userId,
      },
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    safeError('Error creating agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}
