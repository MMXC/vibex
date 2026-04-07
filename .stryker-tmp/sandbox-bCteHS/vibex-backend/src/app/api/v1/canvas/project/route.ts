/**
 * POST /api/canvas/project — Create a canvas project from three-tree data
 *
 * Epic 5: S5.1 创建项目
 * Input: { requirementText, contexts, flows, components }
 * Output: { projectId, status: 'created' }
 */
// @ts-nocheck

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requirementText, contexts, flows, components } = body as {
      requirementText: string;
      contexts: unknown[];
      flows: unknown[];
      components: unknown[];
    };

    if (!requirementText || !contexts || !flows || !components) {
      return NextResponse.json(
        { error: 'Missing required fields: requirementText, contexts, flows, components' },
        { status: 400 }
      );
    }

    // Find or create a default user for canvas projects
    let user = await prisma.user.findFirst({ take: 1 });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'canvas@vibex.local',
          password: 'canvas-placeholder',
          name: 'Canvas System',
          role: 'editor',
        },
      });
    }

    // Create standard Project first
    const project = await prisma.project.create({
      data: {
        name: requirementText || '未命名画布项目',
        userId: user.id,
      },
    });

    // Create CanvasProject
    const canvasProject = await prisma.canvasProject.create({
      data: {
        projectId: project.id,
        name: requirementText || '未命名画布项目',
        contextsJson: JSON.stringify(contexts),
        flowsJson: JSON.stringify(flows),
        componentsJson: JSON.stringify(components),
      },
    });

    return NextResponse.json(
      { projectId: canvasProject.id, status: 'created' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[canvas/project] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create canvas project' },
      { status: 500 }
    );
  }
}
