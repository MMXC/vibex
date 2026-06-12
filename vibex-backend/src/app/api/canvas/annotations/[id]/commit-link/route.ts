/**
 * /api/canvas/annotations/[id]/commit-link — Annotation GitHub Commit Link API
 * Sprint91 E2: GitHub Design Review Loop
 *
 * POST — Link a GitHub commit SHA to an annotation
 *   Auth: required
 *   Body: { commitSha: string }
 *   Returns: { ok: true, commitSha: string }
 *
 * Flow:
 * 1. Auth check (401 if fail)
 * 2. Fetch annotation from D1 by ID
 * 3. If not found → 404
 * 4. Validate commitSha format (40-char hex string)
 * 5. Update annotation: set github_commit_sha in D1
 * 6. Return { ok: true, commitSha }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { queryOne, executeDB, Env } from '@/lib/db';
import { safeError } from '@/lib/log-sanitizer';

export const runtime = 'edge';

interface AnnotationRow {
  id: string;
  github_commit_sha: string | null;
}

interface CommitLinkRequestBody {
  commitSha: string;
}

// Valid GitHub commit SHA format: 40-character hexadecimal string
const COMMIT_SHA_REGEX = /^[a-f0-9]{40}$/i;

// POST /api/canvas/annotations/[id]/commit-link
export async function POST(
  request: NextRequest,
  { params, env }: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    // 1. Auth check
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: annotationId } = await params;

    // 2. Fetch annotation from D1
    const annotation = await queryOne<AnnotationRow>(
      env,
      'SELECT id, github_commit_sha FROM annotations WHERE id = ?',
      [annotationId]
    );

    if (!annotation) {
      return NextResponse.json({ ok: false, error: 'Annotation not found' }, { status: 404 });
    }

    // 3. Parse body
    let body: CommitLinkRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const { commitSha } = body;

    if (!commitSha || typeof commitSha !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'commitSha is required' },
        { status: 400 }
      );
    }

    // 4. Validate commitSha format (40-char hex string)
    const normalizedSha = commitSha.trim().toLowerCase();
    if (!COMMIT_SHA_REGEX.test(normalizedSha)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid commit SHA format. Expected a 40-character hexadecimal string.' },
        { status: 400 }
      );
    }

    // 5. Update annotation
    await executeDB(
      env,
      'UPDATE annotations SET github_commit_sha = ?, updated_at = ? WHERE id = ?',
      [normalizedSha, Date.now(), annotationId]
    );

    return NextResponse.json({ ok: true, commitSha: normalizedSha });
  } catch (err) {
    safeError('[AnnotationCommitLink POST] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
