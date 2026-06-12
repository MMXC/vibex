/**
 * /api/canvas/export/markdown — Canvas Markdown Export API
 *
 * S89-E5: Advanced Export Formats
 *
 * POST — Export canvas cards as Markdown format
 */
import { NextRequest, NextResponse } from 'next/server';
import type { Env } from '@/lib/db';

interface DDSCard {
  id: string;
  type?: string;
  title?: string;
  description?: string;
  content?: string;
  [key: string]: unknown;
}

interface ExportRequest {
  cards: DDSCard[];
  canvasName?: string;
}

function cardsToMarkdown(cards: DDSCard[], canvasName: string): string {
  const lines: string[] = [];

  lines.push(`# ${canvasName || 'Canvas Export'}`);
  lines.push('');
  lines.push(`> Exported on ${new Date().toLocaleString('zh-CN')}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Group by chapter
  const chapterMap = new Map<string, DDSCard[]>();
  for (const card of cards) {
    const chapterId = (card.chapterId || 'default') as string;
    if (!chapterMap.has(chapterId)) chapterMap.set(chapterId, []);
    chapterMap.get(chapterId)!.push(card);
  }

  if (chapterMap.size > 1) {
    for (const [chapterName, chapterCards] of chapterMap.entries()) {
      lines.push(`## ${chapterName || 'Chapter'}`);
      lines.push('');
      for (const card of chapterCards) {
        const title = (card.title || card.id) as string;
        const description = (card.description || card.content || '') as string;
        lines.push(`### ${title}`);
        lines.push('');
        if (description) {
          lines.push(description);
          lines.push('');
        }
        lines.push(`> ID: \`${card.id}\` | Type: ${card.type || 'unknown'}`);
        lines.push('');
      }
    }
  } else {
    for (const card of cards) {
      const title = (card.title || card.id) as string;
      const description = (card.description || card.content || '') as string;
      lines.push(`## ${title}`);
      lines.push('');
      if (description) {
        lines.push(description);
        lines.push('');
      }
      lines.push(`> ID: \`${card.id}\` | Type: ${card.type || 'unknown'}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

// POST — Export as Markdown
export async function POST(
  request: NextRequest,
  _context: { params: Record<string, string>; env: Env }
) {
  try {
    let body: ExportRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const cards = body.cards ?? [];
    const canvasName = body.canvasName ?? 'Canvas Export';

    if (!Array.isArray(cards)) {
      return NextResponse.json({ error: 'cards must be an array' }, { status: 400 });
    }

    const markdown = cardsToMarkdown(cards, canvasName);
    const encoder = new TextEncoder();
    const bytes = encoder.encode(markdown);

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(canvasName)}.md"`,
        'Content-Length': String(bytes.byteLength),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
