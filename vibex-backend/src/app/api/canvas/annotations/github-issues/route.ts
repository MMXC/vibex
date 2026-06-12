/**
 * /api/canvas/annotations/github-issues — Design Review Dashboard backend
 * Sprint91 E2: GitHub Design Review Loop
 *
 * GET — List all annotations with GitHub Issues linked
 *   Auth: required
 *   Returns: { ok: true, annotations: Annotation[] }
 *
 * Used by the DesignReviewDashboard frontend component to show
 * all design review annotations across all canvases.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { queryDB, Env } from '@/lib/db';
import { safeError } from '@/lib/log-sanitizer';

export const runtime = 'edge';

interface AnnotationWithCanvasName {
  id: string;
  canvas_id: string;
  content: string;
  x: number;
  y: number;
  type: string;
  author_id: string;
  author_name: string | null;
  status: string;
  color: string;
  github_issue_url: string;
  github_issue_number: number;
  github_commit_sha: string | null;
  created_at: number;
  updated_at: number;
  canvas_name?: string;
}

// GET /api/canvas/annotations/github-issues
export async function GET(
  request: NextRequest,
  { env }: { params: Promise<Record<string, never>>; env: Env }
) {
  try {
    // Auth check
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Query all annotations with GitHub Issues
    // Returns annotations joined with canvas name for display
    const annotations = await queryDB<AnnotationWithCanvasName>(
      env,
      `SELECT
        a.id,
        a.canvas_id,
        a.content,
        a.x,
        a.y,
        a.type,
        a.author_id,
        a.author_name,
        a.status,
        a.color,
        a.github_issue_url,
        a.github_issue_number,
        a.github_commit_sha,
        a.created_at,
        a.updated_at,
        c.name as canvas_name
      FROM annotations a
      LEFT JOIN canvas c ON a.canvas_id = c.id
      WHERE a.github_issue_url IS NOT NULL
      ORDER BY a.created_at DESC`,
      []
    );

    return NextResponse.json({ ok: true, annotations });
  } catch (err) {
    safeError('[AnnotationsGithubIssues GET] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
