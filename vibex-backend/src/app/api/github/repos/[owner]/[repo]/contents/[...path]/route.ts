/**
 * GitHub Repository Contents API
 * GET /api/github/repos/:owner/:repo/contents/:path*
 */

import { NextRequest, NextResponse } from 'next/server';

interface GitHubContentItem {
  name: string;
  path: string;
  type: 'file' | 'dir' | 'symlink';
  size: number;
  sha: string;
  download_url: string | null;
  content?: string;
  encoding?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string; path?: string[] }> }
) {
  try {
    const { owner, repo } = await params;
    const searchParams = request.nextUrl.searchParams;
    const ref = searchParams.get('ref') || undefined;
    
    const pathParts = (await params).path || [];
    const itemPath = pathParts.join('/');

    let url = `https://api.github.com/repos/${owner}/${repo}/contents`;
    if (itemPath) {
      url += `/${itemPath}`;
    }
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
        { success: false, message: 'Failed to fetch contents' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Handle both single file and directory responses
    const items: GitHubContentItem[] = Array.isArray(data) ? data : [data];

    const result = items.map((item: GitHubContentItem) => ({
      name: item.name,
      path: item.path,
      type: item.type,
      size: item.size,
      sha: item.sha,
      downloadUrl: item.download_url,
      // Only include decoded content for small files
      content: item.content && item.size < 100000 
        ? Buffer.from(item.content, 'base64').toString('utf-8')
        : undefined,
      encoding: item.encoding,
    }));

    return NextResponse.json({
      success: true,
      data: Array.isArray(data) ? result : result[0],
    });
  } catch (error) {
    console.error('GitHub contents API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
