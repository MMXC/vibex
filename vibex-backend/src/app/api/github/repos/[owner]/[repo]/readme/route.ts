/**
 * GitHub Repository README API
 * GET /api/github/repos/:owner/:repo/readme
 */

import { NextRequest, NextResponse } from 'next/server';

interface GitHubContentResponse {
  name: string;
  path: string;
  content?: string;
  encoding: string;
  size: number;
  download_url: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  try {
    const { owner, repo } = await params;
    const searchParams = request.nextUrl.searchParams;
    const ref = searchParams.get('ref') || undefined;

    let url = `https://api.github.com/repos/${owner}/${repo}/readme`;
    if (ref) {
      url += `?ref=${ref}`;
    }

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'VibeX-Import',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch README' },
        { status: response.status }
      );
    }

    const data: GitHubContentResponse = await response.json();

    // Content is Base64 encoded
    const content = data.content 
      ? Buffer.from(data.content, 'base64').toString('utf-8')
      : '';

    return NextResponse.json({
      success: true,
      data: {
        name: data.name,
        path: data.path,
        content,
        encoding: data.encoding,
        size: data.size,
        downloadUrl: data.download_url,
      },
    });
  } catch (error) {
    console.error('GitHub README API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
