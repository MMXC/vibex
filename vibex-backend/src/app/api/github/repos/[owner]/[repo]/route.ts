/**
 * GitHub Repository Info API
 * GET /api/github/repos/:owner/:repo
 */

import { NextRequest, NextResponse } from 'next/server';

interface GitHubRepoResponse {
  name: string;
  full_name: string;
  description: string | null;
  owner: {
    login: string;
    avatar_url: string;
  };
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  license: {
    spdx_id: string;
  } | null;
  default_branch: string;
  created_at: string;
  updated_at: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  try {
    const { owner, repo } = await params;
    
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'VibeX-Import',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, message: 'Repository not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, message: 'Failed to fetch repository' },
        { status: response.status }
      );
    }

    const data: GitHubRepoResponse = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        owner: data.owner.login,
        ownerAvatar: data.owner.avatar_url,
        stars: data.stargazers_count,
        forks: data.forks_count,
        language: data.language,
        license: data.license?.spdx_id || null,
        defaultBranch: data.default_branch,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    console.error('GitHub repo API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
