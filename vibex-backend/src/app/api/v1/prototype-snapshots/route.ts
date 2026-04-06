import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Auth helper
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

// GET /api/prototype-snapshots - List all snapshots (optionally filter by projectId)
export async function GET(request: NextRequest) {
  // E1: Authentication check
  const { auth, error } = checkAuth(request);
  if (!auth) {
    return NextResponse.json(
      { error, code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    const snapshots = await prisma.prototypeSnapshot.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ prototypeSnapshots: snapshots });
  } catch (error) {
    console.error('Error fetching prototype snapshots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prototype snapshots' },
      { status: 500 }
    );
  }
}

// POST /api/prototype-snapshots - Create a new snapshot
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
    const { projectId, name, description, content, version } = body;

    if (!projectId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, content' },
        { status: 400 }
      );
    }

    // Get the next version number for this project if not provided
    let snapshotVersion = version;
    if (snapshotVersion === undefined) {
      const existingSnapshots = await prisma.prototypeSnapshot.findMany({
        where: { projectId },
        select: { version: true },
        orderBy: { version: 'desc' },
        take: 1,
      });
      snapshotVersion = existingSnapshots.length > 0 ? existingSnapshots[0].version + 1 : 1;
    }

    const snapshot = await prisma.prototypeSnapshot.create({
      data: {
        projectId,
        version: snapshotVersion,
        name: name || null,
        description: description || null,
        content,
      },
    });

    return NextResponse.json({ prototypeSnapshot: snapshot }, { status: 201 });
  } catch (error) {
    console.error('Error creating prototype snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to create prototype snapshot' },
      { status: 500 }
    );
  }
}