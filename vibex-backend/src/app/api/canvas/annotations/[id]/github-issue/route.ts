/**
 * /api/canvas/annotations/[id]/github-issue — Annotation GitHub Issue API
 * Sprint91 E2: GitHub Design Review Loop
 *
 * POST — Create a GitHub Issue from an annotation
 *   Auth: required
 *   Body: { owner: string; repo: string; canvasUrl?: string; canvasScreenshotBase64?: string }
 *   Returns: { ok: true, issueUrl: string, issueNumber: number }
 *
 * Flow:
 * 1. Auth check (401 if fail)
 * 2. Fetch annotation from D1 by ID
 * 3. If not found → 404
 * 4. Call GitHub API POST /repos/{owner}/{repo}/issues (use env.GITHUB_TOKEN)
 *    If GITHUB_TOKEN not set → 503
 * 5. On success: update annotation with github_issue_url and github_issue_number in D1
 * 6. Return { ok: true, issueUrl, issueNumber }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { queryOne, executeDB, Env } from '@/lib/db';
import { safeError } from '@/lib/log-sanitizer';

export const runtime = 'edge';

interface AnnotationRow {
  id: string;
  canvas_id: string;
  content: string;
  x: number;
  y: number;
  type: string;
  author_id: string;
  author_name: string | null;
  status: string;
  github_issue_url: string | null;
  github_issue_number: number | null;
  github_commit_sha: string | null;
}

interface GitHubIssueRequestBody {
  owner: string;
  repo: string;
  canvasUrl?: string;
  canvasScreenshotBase64?: string;
}

// POST /api/canvas/annotations/[id]/github-issue
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
      'SELECT * FROM annotations WHERE id = ?',
      [annotationId]
    );

    if (!annotation) {
      return NextResponse.json({ ok: false, error: 'Annotation not found' }, { status: 404 });
    }

    // 3. Parse body
    let body: GitHubIssueRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const { owner, repo, canvasUrl, canvasScreenshotBase64 } = body;

    if (!owner || !repo) {
      return NextResponse.json(
        { ok: false, error: 'owner and repo are required' },
        { status: 400 }
      );
    }

    // 4. Check GITHUB_TOKEN
    const githubToken = (env as unknown as Record<string, unknown>).GITHUB_TOKEN as string | undefined;
    if (!githubToken) {
      return NextResponse.json(
        { ok: false, error: 'GitHub integration not configured. GITHUB_TOKEN is not set.' },
        { status: 503 }
      );
    }

    // 5. Call GitHub API
    const issueTitle = `[Design Review] ${annotation.content.substring(0, 80) || 'Canvas annotation'}`;
    const issueBodyLines = [
      `## Canvas Annotation`,
      ``,
      `**Content**: ${annotation.content}`,
      `**Author**: ${annotation.author_name || annotation.author_id}`,
      `**Position**: (${annotation.x}, ${annotation.y})`,
      `**Type**: ${annotation.type}`,
      `**Status**: ${annotation.status}`,
      canvasUrl ? `**Canvas URL**: ${canvasUrl}` : '',
      ``,
      `> Created via VibeX Design Review Loop`,
    ].filter(Boolean);

    const issueBody = issueBodyLines.join('\n');

    const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/issues`;
    let githubResponse: Response;
    try {
      githubResponse = await fetch(githubApiUrl, {
        method: 'POST',
        headers: {
          Authorization: `token ${githubToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'VibeX-Backend/1.0',
        },
        body: JSON.stringify({
          title: issueTitle,
          body: issueBody,
          labels: ['design-review'],
        }),
      });
    } catch (fetchErr) {
      safeError('[AnnotationGithubIssue POST] GitHub API fetch failed:', fetchErr);
      return NextResponse.json(
        { ok: false, error: 'Failed to reach GitHub API' },
        { status: 502 }
      );
    }

    let githubData: { html_url?: string; number?: number; message?: string };
    try {
      githubData = await githubResponse.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Invalid response from GitHub API' },
        { status: 502 }
      );
    }

    if (!githubResponse.ok) {
      safeError('[AnnotationGithubIssue POST] GitHub API error:', githubData);
      return NextResponse.json(
        { ok: false, error: `GitHub API error: ${(githubData as { message?: string }).message || githubResponse.statusText}` },
        { status: githubResponse.status }
      );
    }

    const issueUrl = githubData.html_url!;
    const issueNumber = githubData.number!;

    // 6. Update annotation with GitHub issue info
    await executeDB(
      env,
      'UPDATE annotations SET github_issue_url = ?, github_issue_number = ?, updated_at = ? WHERE id = ?',
      [issueUrl, issueNumber, Date.now(), annotationId]
    );

    return NextResponse.json({ ok: true, issueUrl, issueNumber });
  } catch (err) {
    safeError('[AnnotationGithubIssue POST] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
