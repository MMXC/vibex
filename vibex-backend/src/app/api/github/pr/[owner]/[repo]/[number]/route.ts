/**
 * /api/github/pr/[owner]/[repo]/[number] — GitHub PR Status API
 * Sprint89 E4: GitHub Integration Deep Link
 *
 * GET — Fetch PR status from GitHub API
 *   Auth: requires Bearer token (GitHub OAuth)
 *   Returns: PR title, state (open/closed/merged), author, URL, etc.
 *
 * Note: This is a PROXY route — it calls GitHub API on behalf of the frontend.
 * The frontend passes the user's GitHub OAuth token via Authorization header.
 */
import { NextRequest, NextResponse } from 'next/server';
import { safeError, Env } from '@/lib/db';

export const runtime = 'edge';

export interface GitHubPR {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  htmlUrl: string;
  user: {
    login: string;
    avatarUrl: string;
  };
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  additions?: number;
  deletions?: number;
  draft?: boolean;
}

// GET /api/github/pr/:owner/:repo/:number
export async function GET(
  request: NextRequest,
  { params, env }: { params: Promise<{ owner: string; repo: string; number: string }>; env: Env }
) {
  try {
    // Auth: user must provide their GitHub OAuth Bearer token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: 'GitHub token required. Pass Authorization: Bearer <token>' },
        { status: 401 }
      );
    }
    const githubToken = authHeader.slice(7);

    const { owner, repo, number } = await params;
    const prNumber = parseInt(number, 10);
    if (isNaN(prNumber) || prNumber <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid PR number' }, { status: 400 });
    }

    // Call GitHub REST API
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'VibeX-Canvas',
          Authorization: `Bearer ${githubToken}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ ok: false, error: 'PR not found' }, { status: 404 });
      }
      if (response.status === 401) {
        return NextResponse.json({ ok: false, error: 'Invalid GitHub token' }, { status: 401 });
      }
      return NextResponse.json(
        { ok: false, error: 'GitHub API error' },
        { status: response.status }
      );
    }

    const data = await response.json() as {
      number: number;
      title: string;
      state: string;
      html_url: string;
      user: { login: string; avatar_url: string };
      created_at: string;
      updated_at: string;
      merged_at: string | null;
      closed_at: string | null;
      additions?: number;
      deletions?: number;
      draft?: boolean;
    };

    // Determine merged state — GitHub sets merged_at when PR is merged
    const state: GitHubPR['state'] =
      data.merged_at ? 'merged' : (data.state as 'open' | 'closed');

    const pr: GitHubPR = {
      number: data.number,
      title: data.title,
      state,
      htmlUrl: data.html_url,
      user: {
        login: data.user.login,
        avatarUrl: data.user.avatar_url,
      },
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      mergedAt: data.merged_at,
      closedAt: data.closed_at,
      additions: data.additions,
      deletions: data.deletions,
      draft: data.draft,
    };

    return NextResponse.json({ ok: true, pr });
  } catch (err) {
    safeError('[GitHubPR GET] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
