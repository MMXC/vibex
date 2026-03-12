import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/pages - List all pages (or filter by projectId)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    const pages = await prisma.page.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        project: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ pages });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

// POST /api/pages - Create a new page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, content, projectId } = body;

    if (!name || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, projectId' },
        { status: 400 }
      );
    }

    const page = await prisma.page.create({
      data: {
        name,
        content: content || null,
        projectId,
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    );
  }
}
