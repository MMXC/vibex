import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/agents - List all agents (or filter by userId)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    const agents = await prisma.agent.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest) {
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
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}
