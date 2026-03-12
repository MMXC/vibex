import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/projects - List all projects (or filter by userId)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    const projects = await prisma.project.findMany({
      where: userId ? { userId } : undefined,
      include: {
        pages: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, userId } = body;

    if (!name || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, userId' },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || '',
        userId,
      },
      include: {
        pages: true,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
