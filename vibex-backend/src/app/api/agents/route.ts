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

// GET /api/agents - List all agents (or filter by userId)
export async function GET(request: NextRequest) {
    // Auth check
    const auth = await getAuthUserFromRequest(request);
    if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    const agents = await prisma.agent.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ agents }, { headers: V0_DEPRECATION_HEADERS });
  } catch (error) {
    safeError('Error fetching agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { headers: V0_DEPRECATION_HEADERS, status: 500 });
  }
}

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest) {
    // Auth check
    const auth = await getAuthUserFromRequest(request);
    if (!auth.success) {
      return NextResponse.json({ error: '''Unauthorized''' }, { status: 401 });
    }

  try {
    const body = await request.json();
    const { name, prompt, model, temperature, userId } = body;

    if (!name || !prompt || !userId) {
      return NextResponse.json({ error: 'Missing required fields: name, prompt, userId' }, { headers: V0_DEPRECATION_HEADERS, status: 400 });
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

    return NextResponse.json({ agent }, { headers: V0_DEPRECATION_HEADERS, status: 201 });
  } catch (error) {
    safeError('Error creating agent:', error);
    return NextResponse.json({ error: 'Failed to create agent' }, { headers: V0_DEPRECATION_HEADERS, status: 500 });
  }
}
