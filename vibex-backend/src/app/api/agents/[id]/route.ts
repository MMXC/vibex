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

// GET /api/agents/[id] - Get a single agent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const agent = await prisma.agent.findUnique({
      where: { id },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { headers: V0_DEPRECATION_HEADERS, status: 404 });
    }

    return NextResponse.json({ agent }, { headers: V0_DEPRECATION_HEADERS });
  } catch (error) {
    safeError('Error fetching agent:', error);
    return NextResponse.json({ error: 'Failed to fetch agent' }, { headers: V0_DEPRECATION_HEADERS, status: 500 });
  }
}

// PUT /api/agents/[id] - Update an agent
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, prompt, model, temperature } = body;

    const agent = await prisma.agent.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(prompt && { prompt }),
        ...(model && { model }),
        ...(temperature !== undefined && { temperature }),
      },
    });

    return NextResponse.json({ agent }, { headers: V0_DEPRECATION_HEADERS });
  } catch (error) {
    safeError('Error updating agent:', error);
    return NextResponse.json({ error: 'Failed to update agent' }, { headers: V0_DEPRECATION_HEADERS, status: 500 });
  }
}

// DELETE /api/agents/[id] - Delete an agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.agent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { headers: V0_DEPRECATION_HEADERS });
  } catch (error) {
    safeError('Error deleting agent:', error);
    return NextResponse.json({ error: 'Failed to delete agent' }, { headers: V0_DEPRECATION_HEADERS, status: 500 });
  }
}
