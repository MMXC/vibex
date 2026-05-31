/**
 * POST /api/snapshot — Create a public shareable canvas snapshot
 *
 * S45-P005-E5: Canvas Snapshot Sharing
 *
 * Flow: POST { canvasJSON } → D1 → return { id, url }
 * Auth: requires authentication (user must be logged in via x-auth-user-id header)
 * Limit: max 10 snapshots per user
 */
import { NextRequest, NextResponse } from 'next/server';
import { executeDB, generateId, Env } from '@/lib/db';
import { safeError } from '@/lib/log-sanitizer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { env }: { env: Env }): Promise<NextResponse> {
  try {
    // Parse body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', code: 'INVALID_BODY' },
        { status: 400 }
      );
    }

    const { canvasJSON, projectName } = body as { canvasJSON?: unknown; projectName?: string };

    // Validate canvasJSON is present and is an object
    if (!canvasJSON || typeof canvasJSON !== 'object' || Array.isArray(canvasJSON)) {
      return NextResponse.json(
        { error: 'Missing or invalid canvasJSON in request body', code: 'MISSING_CANVAS_JSON' },
        { status: 400 }
      );
    }

    // Get user ID from auth header (set by gateway middleware)
    const userId = request.headers.get('x-auth-user-id') || null;

    // Count existing snapshots for this user (limit: 10 per user)
    if (userId) {
      const countResult = await executeDB(
        env,
        'SELECT COUNT(*) as count FROM PublicSnapshot WHERE createdBy = ?',
        [userId]
      ) as unknown as Array<{ count: number }>;
      if (countResult.length > 0 && countResult[0].count >= 10) {
        return NextResponse.json(
          { error: 'Maximum 10 snapshots per user. Please delete some snapshots first.', code: 'SNAPSHOT_LIMIT_EXCEEDED' },
          { status: 400 }
        );
      }
    }

    // Serialize canvasJSON to string for D1 storage
    const canvasStr = JSON.stringify(canvasJSON);

    // Generate unique ID
    const id = generateId();

    // Insert into D1
    await executeDB(
      env,
      'INSERT INTO PublicSnapshot (id, canvasJSON, projectName, createdBy) VALUES (?, ?, ?, ?)',
      [id, canvasStr, projectName || null, userId]
    );

    // Build shareable URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}/snapshot/${id}`;

    return NextResponse.json(
      { id, url },
      { status: 200 }
    );
  } catch (err) {
    safeError('[POST /api/snapshot] Error:', err);
    return NextResponse.json(
      { error: 'Failed to create snapshot', code: 'CREATE_FAILED' },
      { status: 500 }
    );
  }
}
