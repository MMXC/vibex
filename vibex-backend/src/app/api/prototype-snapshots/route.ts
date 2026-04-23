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

// GET /api/prototype-snapshots - List all snapshots (optionally filter by projectId)
export async function GET(request: NextRequest) {
    // Auth check
    const { success, user } = getAuthUserFromRequest(request);
    if (!success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    const snapshots = await prisma.prototypeSnapshot.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ prototypeSnapshots: snapshots }, { headers: V0_DEPRECATION_HEADERS });
  } catch (error) {
    safeError('Error fetching prototype snapshots:', error);
    return NextResponse.json({ error: 'Failed to fetch prototype snapshots' }, { headers: V0_DEPRECATION_HEADERS, status: 500 });
  }
}

// POST /api/prototype-snapshots - Create a new snapshot
export async function POST(request: NextRequest) {
    // Auth check
    const { success, user } = getAuthUserFromRequest(request);
    if (!success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  try {
    const body = await request.json();
    const { projectId, name, description, content, version } = body;

    if (!projectId || !content) {
      return NextResponse.json({ error: 'Missing required fields: projectId, content' }, { headers: V0_DEPRECATION_HEADERS, status: 400 });
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

    return NextResponse.json({ prototypeSnapshot: snapshot }, { headers: V0_DEPRECATION_HEADERS, status: 201 });
  } catch (error) {
    safeError('Error creating prototype snapshot:', error);
    return NextResponse.json({ error: 'Failed to create prototype snapshot' }, { headers: V0_DEPRECATION_HEADERS, status: 500 });
  }
}