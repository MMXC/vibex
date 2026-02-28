import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthUser } from '@/lib/auth';
import { getEnv } from '@/lib/env';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const env = getEnv();
    const auth = getAuthUser(request, env.JWT_SECRET);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'projectId is required', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    // Verify the user owns this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: auth.userId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const messages = await prisma.message.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        projectId: msg.projectId,
        createdAt: msg.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = getEnv();
    const auth = getAuthUser(request, env.JWT_SECRET);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, projectId, role = 'user' } = body;

    if (!content || !projectId) {
      return NextResponse.json(
        { success: false, error: 'content and projectId are required', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    // Verify the user owns this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: auth.userId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const message = await prisma.message.create({
      data: {
        content,
        role,
        projectId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: message.id,
          role: message.role,
          content: message.content,
          projectId: message.projectId,
          createdAt: message.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create message error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
