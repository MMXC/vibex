/**
 * /api/canvas/[id]/github — Canvas GitHub Link API
 * Sprint89 E4: GitHub Integration Deep Link
 *
 * GET  — Get canvas's GitHub PR/Issue link
 * POST — Save/update canvas's GitHub PR/Issue link
 *
 * GET /api/canvas/[id]/github
 *   Auth: required
 *   Returns: { ok: true, githubPrUrl: string | null }
 *
 * POST /api/canvas/[id]/github
 *   Auth: required
 *   Body: { githubPrUrl: string }
 *   Returns: { ok: true }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { queryOne, executeDB, safeError, Env } from '@/lib/db';

export const runtime = 'edge';

// URL regex: matches github.com/owner/repo/pull/number or /issues/number
const GITHUB_PR_ISSUE_REGEX =
  /^https?:\/\/github\.com\/([^/]+\/[^/]+)\/(pull|issues)\/(\d+)/i;

/**
 * Parse a GitHub PR/Issue URL and extract owner, repo, type, and number.
 * Returns null if URL is invalid.
 */
export function parseGitHubUrl(url: string): {
  owner: string;
  repo: string;
  type: 'pull' | 'issue';
  number: number;
} | null {
  const trimmed = url.trim();
  const match = trimmed.match(GITHUB_PR_ISSUE_REGEX);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[1], // owner/repo combined
    type: match[2].toLowerCase() === 'pull' ? 'pull' : 'issue',
    number: parseInt(match[3], 10),
  };
}

// GET /api/canvas/[id]/github
export async function GET(
  request: NextRequest,
  { params, env }: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: canvasId } = await params;

    const row = await queryOne<{ github_pr_url: string | null }>(
      env,
      'SELECT github_pr_url FROM canvas WHERE id = ?',
      [canvasId]
    );

    return NextResponse.json({
      ok: true,
      githubPrUrl: row?.github_pr_url ?? null,
    });
  } catch (err) {
    safeError('[CanvasGithub GET] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/canvas/[id]/github
export async function POST(
  request: NextRequest,
  { params, env }: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: canvasId } = await params;

    let body: { githubPrUrl?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const githubPrUrl = body.githubPrUrl ?? null;

    // Validate URL format if provided
    if (githubPrUrl !== null && githubPrUrl.trim() !== '') {
      const parsed = parseGitHubUrl(githubPrUrl);
      if (!parsed) {
        return NextResponse.json(
          { ok: false, error: 'Invalid GitHub URL. Expected: https://github.com/owner/repo/pull/123' },
          { status: 400 }
        );
      }
    }

    await executeDB(
      env,
      'UPDATE canvas SET github_pr_url = ? WHERE id = ?',
      [githubPrUrl, canvasId]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    safeError('[CanvasGithub POST] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
