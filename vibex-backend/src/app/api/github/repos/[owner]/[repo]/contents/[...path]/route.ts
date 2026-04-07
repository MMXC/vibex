/**
 * GitHub Repository Contents API
 * GET /api/github/repos/:owner/:repo/contents/:path*
 * 
 * Part of: api-input-validation-layer / Epic E2 (S2.1 GitHub 路径注入防护)
 * 
 * Validates owner, repo, and path params against security schemas to prevent:
 * - Path traversal attacks (../, ../../etc/passwd)
 * - Template injection (${...})
 * - Shell special characters
 */

import { NextRequest, NextResponse } from 'next/server';
import { githubContentsParamsSchema } from '@/schemas/security';
import { validateParams } from '@/lib/high-risk-validation';

import { safeError } from '@/lib/log-sanitizer';

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
    const { owner, repo, path: pathParts } = await params;
    const searchParams = request.nextUrl.searchParams;
    const ref = searchParams.get('ref') || undefined;

    // S2.1: Validate params against security schema
    // The [...path] catch-all produces path as string[] — join to string
    const itemPath = pathParts ? pathParts.join('/') : '';
    const paramsResult = validateParams(
      { owner, repo, path: itemPath },
      githubContentsParamsSchema
    );
    if ('error' in paramsResult) {
      return paramsResult.error;
    }

    let url = `https://api.github.com/repos/${owner}/${repo}/contents`;
    if (itemPath) {
      url += `/${itemPath}`;
    }
    if (ref) {
      url += `?ref=${ref}`;
    }

    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
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
      content:
        item.content && item.size < 100000
          ? Buffer.from(item.content, 'base64').toString('utf-8')
          : undefined,
      encoding: item.encoding,
    }));

    return NextResponse.json({
      success: true,
      data: Array.isArray(data) ? result : result[0],
    });
  } catch (error) {
    safeError('GitHub contents API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
