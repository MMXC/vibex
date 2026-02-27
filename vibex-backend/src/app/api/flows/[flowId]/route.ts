import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthUser } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  try {
    const auth = getAuthUser(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { flowId } = await params;

    const flow = await prisma.flowData.findUnique({
      where: { id: flowId },
      include: {
        project: true,
      },
    });

    if (!flow) {
      return NextResponse.json(
        { success: false, error: 'Flow not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (flow.project.userId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: flow.id,
        name: flow.name,
        nodes: JSON.parse(flow.nodes || '[]'),
        edges: JSON.parse(flow.edges || '[]'),
        projectId: flow.projectId,
        createdAt: flow.createdAt.toISOString(),
        updatedAt: flow.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get flow error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  try {
    const auth = getAuthUser(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { flowId } = await params;

    // Find the flow and verify ownership
    const existingFlow = await prisma.flowData.findUnique({
      where: { id: flowId },
      include: {
        project: true,
      },
    });

    if (!existingFlow) {
      return NextResponse.json(
        { success: false, error: 'Flow not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (existingFlow.project.userId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, nodes, edges } = body;

    const updateData: { name?: string; nodes?: string; edges?: string } = {};
    
    if (name !== undefined) updateData.name = name;
    if (nodes !== undefined) updateData.nodes = JSON.stringify(nodes);
    if (edges !== undefined) updateData.edges = JSON.stringify(edges);

    const flow = await prisma.flowData.update({
      where: { id: flowId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: flow.id,
        name: flow.name,
        nodes: JSON.parse(flow.nodes || '[]'),
        edges: JSON.parse(flow.edges || '[]'),
        projectId: flow.projectId,
        createdAt: flow.createdAt.toISOString(),
        updatedAt: flow.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Update flow error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  try {
    const auth = getAuthUser(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { flowId } = await params;

    // Find the flow and verify ownership
    const flow = await prisma.flowData.findUnique({
      where: { id: flowId },
      include: {
        project: true,
      },
    });

    if (!flow) {
      return NextResponse.json(
        { success: false, error: 'Flow not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (flow.project.userId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    await prisma.flowData.delete({
      where: { id: flowId },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Flow deleted successfully' },
    });
  } catch (error) {
    console.error('Delete flow error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
