
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/figma?url=<figma-url>
 * Proxy Figma REST API — fetch file data
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: '缺少 url 参数' }, { status: 400 });
  }

  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: '未配置 FIGMA_ACCESS_TOKEN' }, { status: 503 });
  }

  try {
    const parsed = parseFigmaUrl(url);
    if (!parsed) {
      return NextResponse.json({ error: 'Figma URL 格式无效' }, { status: 400 });
    }
    const { fileKey, nodeId } = parsed;
    const apiUrl = nodeId
      ? `https://api.figma.com/v1/files/${fileKey}/nodes/${nodeId}`
      : `https://api.figma.com/v1/files/${fileKey}`;

    const figmaRes = await fetch(apiUrl, {
      headers: { 'X-Figma-Token': token },
    });

    if (!figmaRes.ok) {
      return NextResponse.json(
        { error: `Figma API 错误: ${figmaRes.status}` },
        { status: figmaRes.status }
      );
    }

    const data = await figmaRes.json();
    return NextResponse.json({ success: true, fileKey, nodeId, data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Figma 导入失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/figma
 * Body: { fileKey: string }
 * Fetch components from a Figma file
 */
export async function POST(request: NextRequest) {
  let body: { fileKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '无效的请求体' }, { status: 400 });
  }

  const { fileKey } = body;
  if (!fileKey) {
    return NextResponse.json({ error: '缺少 fileKey' }, { status: 400 });
  }

  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: '未配置 FIGMA_ACCESS_TOKEN' }, { status: 503 });
  }

  try {
    const figmaRes = await fetch(
      `https://api.figma.com/v1/files/${fileKey}/components`,
      { headers: { 'X-Figma-Token': token } }
    );

    if (!figmaRes.ok) {
      return NextResponse.json(
        { error: `Figma API 错误: ${figmaRes.status}` },
        { status: figmaRes.status }
      );
    }

    const data = await figmaRes.json();
    return NextResponse.json({
      success: true,
      components: data.meta?.components ?? [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '获取组件失败' },
      { status: 500 }
    );
  }
}

// Inline parseFigmaUrl — same logic as figma-import.ts
function parseFigmaUrl(url: string): { fileKey: string; nodeId?: string } | null {
  const patterns = [
    /figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const fileKey = match[1];
      const nodeMatch = url.match(/[?&]node-id=([^&#]+)/);
      return {
        fileKey,
        nodeId: nodeMatch ? decodeURIComponent(nodeMatch[1]) : undefined,
      };
    }
  }
  return null;
}
