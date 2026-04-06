/**
 * POST /api/canvas/project — Create a canvas project from three-tree data
 *
 * Epic 5: S5.1 创建项目
 * Input: { requirementText, contexts, flows, components }
 * Output: { projectId, status: 'created' }
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Auth helper for canvas routes
function checkAuth(req: NextRequest) {
  const jwtSecret = process.env.JWT_SECRET || 'vibex-dev-secret';
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { auth: null, error: 'Unauthorized: authentication required' };
  }
  const token = authHeader.substring(7);
  try {
    const jwt = require('jsonwebtoken');
    const auth = jwt.verify(token, jwtSecret) as { userId: string; email: string };
    return { auth, error: null };
  } catch {
    return { auth: null, error: 'Invalid or expired token' };
  }
}

export async function POST(request: NextRequest) {
  // E1: Authentication check
  const { auth, error } = checkAuth(request);
  if (!auth) {
    return NextResponse.json(
      { error, code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

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
