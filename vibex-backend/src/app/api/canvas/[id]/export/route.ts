/**
 * /api/canvas/[id]/export — Canvas Export as Code API
 * Sprint94 E4: Canvas Export as Code
 *
 * GET /api/canvas/{id}/export?format=react|svg|md|json
 *   Auth: required (owner only for export)
 *   Query: format — one of 'react' | 'svg' | 'md' | 'json'
 *   Returns: { ok: true, data: string, filename: string, mimeType: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { queryDB, Env } from '@/lib/db';
import { safeError } from '@/lib/log-sanitizer';

export const runtime = 'edge';

type ExportFormat = 'react' | 'svg' | 'md' | 'json';

interface CanvasCardRow {
  id: string;
  canvas_id: string;
  chapter_id: string | null;
  title: string | null;
  description: string | null;
  content: string | null;
  type: string | null;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
  metadata: string | null;
}

interface CanvasEdgeRow {
  id: string;
  canvas_id: string;
  source_card_id: string | null;
  target_card_id: string | null;
  source_chapter_id: string | null;
  target_chapter_id: string | null;
  label: string | null;
  type: string | null;
}

interface CanvasRow {
  id: string;
  name: string | null;
  owner_id: string | null;
}

/** Escape special XML characters */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Escape JSX special characters */
function escapeJsx(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Serialize cards to React/JSX component string
 */
function serializeToReact(cards: CanvasCardRow[], edges: CanvasEdgeRow[]): string {
  const reactImports = `import React from 'react';\n\n`;
  const componentName = 'CanvasDiagram';

  // Build a node map for edges
  const nodeMap = new Map(cards.map((c) => [c.id, c]));

  // Group cards by chapter
  const byChapter = new Map<string, CanvasCardRow[]>();
  for (const card of cards) {
    const chapter = card.chapter_id ?? 'default';
    if (!byChapter.has(chapter)) byChapter.set(chapter, []);
    byChapter.get(chapter)!.push(card);
  }

  // Build edges JSX
  const edgesJsx: string[] = [];
  for (const edge of edges) {
    if (!edge.source_card_id || !edge.target_card_id) continue;
    const src = nodeMap.get(edge.source_card_id);
    const tgt = nodeMap.get(edge.target_card_id);
    if (!src || !tgt) continue;
    const sx = src.x ?? 0;
    const sy = (src.y ?? 0) + (src.height ?? 80);
    const tx = tgt.x ?? 0;
    const ty = tgt.y ?? 0;
    const label = edge.label ? ` label="${escapeJsx(edge.label)}"` : '';
    edgesJsx.push(
      `  <line x1={${sx}} y1={${sy}} x2={${tx}} y2={${ty}} stroke="#00ffff" strokeWidth={2}${label} />`
    );
  }

  const nodesJsx: string[] = [];
  for (const card of cards) {
    const x = card.x ?? 0;
    const y = card.y ?? 0;
    const w = card.width ?? 160;
    const h = card.height ?? 80;
    const title = escapeJsx(card.title ?? card.id);
    const type = escapeJsx(card.type ?? 'default');
    const desc = card.description
      ? `\n      <p style={{ fontSize: 12, color: '#a0a0a0', margin: 0 }}>${escapeJsx(card.description)}</p>`
      : '';
    nodesJsx.push(
      `  <div key="${escapeJsx(card.id)}" style={{ position: 'absolute', left: ${x}, top: ${y}, width: ${w}, height: ${h}, background: '#1e1e22', border: '1px solid #00ffff', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>${title}</span>
      <span style={{ fontSize: 10, color: '#00ffff' }}>[${type}]</span>${desc}
    </div>`
    );
  }

  const svgWidth = Math.max(...cards.map((c) => (c.x ?? 0) + (c.width ?? 160)), 800);
  const svgHeight = Math.max(...cards.map((c) => (c.y ?? 0) + (c.height ?? 80)), 600);

  const chaptersSection =
    byChapter.size > 1
      ? Array.from(byChapter.entries())
          .map(([chapterId, chapterCards]) => {
            const cardKeys = chapterCards.map((c) => `"${escapeJsx(c.id)}"`).join(', ');
            return `  // Chapter: ${escapeJsx(chapterId)}\n  const chapter${chapterId.replace(/[^a-zA-Z0-9]/g, '')}Cards = [${cardKeys}];`;
          })
          .join('\n')
      : '  // Single chapter\n  const cards = [' + cards.map((c) => `"${escapeJsx(c.id)}"`).join(', ') + '];';

  return `${reactImports}/**
 * ${componentName} — Auto-generated from VibeX Canvas
 * Format: React/JSX
 * Cards: ${cards.length} | Edges: ${edges.length}
 */
export function ${componentName}({ width = ${svgWidth}, height = ${svgHeight} }: { width?: number; height?: number }) {
${chaptersSection}

  return (
    <svg width={width} height={height} style={{ background: '#0f0f1a', overflow: 'visible' }}>
      {/* Edges */}
      ${edgesJsx.join('\n')}

      {/* Nodes */}
      <foreignObject width="100%" height="100%" style={{ overflow: 'visible' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          ${nodesJsx.join('\n')}
        </div>
      </foreignObject>
    </svg>
  );
}

export default ${componentName};
`;
}

/**
 * Serialize cards to SVG string with layout preservation
 */
function serializeToSvg(cards: CanvasCardRow[], edges: CanvasEdgeRow[]): string {
  const nodeMap = new Map(cards.map((c) => [c.id, c]));

  const svgWidth = Math.max(...cards.map((c) => (c.x ?? 0) + (c.width ?? 160)), 800);
  const svgHeight = Math.max(...cards.map((c) => (c.y ?? 0) + (c.height ?? 80)), 600);

  const defs = `<defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#00ffff" />
    </marker>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;

  const edgesSvg: string[] = [];
  for (const edge of edges) {
    if (!edge.source_card_id || !edge.target_card_id) continue;
    const src = nodeMap.get(edge.source_card_id);
    const tgt = nodeMap.get(edge.target_card_id);
    if (!src || !tgt) continue;
    const sx = (src.x ?? 0) + (src.width ?? 160) / 2;
    const sy = (src.y ?? 0) + (src.height ?? 80);
    const tx = (tgt.x ?? 0) + (tgt.width ?? 160) / 2;
    const ty = tgt.y ?? 0;
    const midY = (sy + ty) / 2;
    const label = edge.label ? `<text x="${(sx + tx) / 2}" y="${midY - 8}" text-anchor="middle" fill="#a0a0a0" font-size="11">${escapeXml(edge.label)}</text>` : '';
    edgesSvg.push(
      `<path d="M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}" stroke="#00ffff" stroke-width="2" fill="none" marker-end="url(#arrowhead)" />\n      ${label}`
    );
  }

  const nodesSvg: string[] = [];
  for (const card of cards) {
    const x = card.x ?? 0;
    const y = card.y ?? 0;
    const w = card.width ?? 160;
    const h = card.height ?? 80;
    const title = escapeXml(card.title ?? card.id);
    const type = escapeXml(card.type ?? 'default');
    const desc = card.description ? `<tspan x="${x + 12}" dy="20">${escapeXml(card.description.slice(0, 60))}</tspan>` : '';
    nodesSvg.push(
      `<g transform="translate(${x}, ${y})" filter="url(#glow)">
        <rect width="${w}" height="${h}" rx="8" fill="#1e1e22" stroke="#00ffff" stroke-width="1" />
        <text x="12" y="22" fill="#fff" font-size="13" font-weight="600" font-family="system-ui">${title}</text>
        <text x="12" y="40" fill="#00ffff" font-size="10" font-family="system-ui">[${type}]</text>
        ${desc}
      </g>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- VibeX Canvas Export — SVG Format -->
<!-- Cards: ${cards.length} | Edges: ${edges.length} | Generated: ${new Date().toISOString()} -->
<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" style="background: #0f0f1a;">
${defs}
<!-- Edges -->
${edgesSvg.join('\n')}
<!-- Nodes -->
${nodesSvg.join('\n')}
</svg>`;
}

/**
 * Serialize cards to structured Markdown
 */
function serializeToMarkdown(
  cards: CanvasCardRow[],
  edges: CanvasEdgeRow[],
  canvasName: string
): string {
  const nodeMap = new Map(cards.map((c) => [c.id, c]));
  const lines: string[] = [];

  lines.push(`# ${escapeXml(canvasName || 'Canvas Export')}`);
  lines.push('');
  lines.push(`> Exported on ${new Date().toLocaleString('zh-CN')} — VibeX`);
  lines.push('');
  lines.push(`| Cards | ${cards.length} |`);
  lines.push(`| Edges | ${edges.length} |`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Group by chapter
  const byChapter = new Map<string, CanvasCardRow[]>();
  for (const card of cards) {
    const chapter = card.chapter_id ?? 'default';
    if (!byChapter.has(chapter)) byChapter.set(chapter, []);
    byChapter.get(chapter)!.push(card);
  }

  for (const [chapterId, chapterCards] of byChapter.entries()) {
    lines.push(`## ${escapeXml(chapterId === 'default' ? 'Canvas' : chapterId)}`);
    lines.push('');
    for (const card of chapterCards) {
      const title = card.title ?? card.id;
      const type = card.type ?? 'card';
      const status = 'active';
      lines.push(`### ${status === 'active' ? '✅' : '⏳'} ${escapeXml(title)}`);
      lines.push('');
      if (card.description) {
        lines.push(`> ${escapeXml(card.description)}`);
        lines.push('');
      }
      lines.push(`- **Type:** \`${escapeXml(type)}\``);
      lines.push(`- **Position:** (${card.x ?? 0}, ${card.y ?? 0})`);
      if (card.width && card.height) {
        lines.push(`- **Size:** ${card.width}×${card.height}`);
      }
      lines.push(`- **ID:** \`${escapeXml(card.id)}\``);
      lines.push('');
    }
  }

  // Edges section
  lines.push('## Connections');
  lines.push('');
  if (edges.length === 0) {
    lines.push('_No connections_');
    lines.push('');
  } else {
    for (const edge of edges) {
      const src = nodeMap.get(edge.source_card_id ?? '');
      const tgt = nodeMap.get(edge.target_card_id ?? '');
      const srcName = src?.title ?? src?.id ?? edge.source_card_id ?? '?';
      const tgtName = tgt?.title ?? tgt?.id ?? edge.target_card_id ?? '?';
      const label = edge.label ? ` (${edge.label})` : '';
      const edgeType = edge.type ?? 'arrow';
      lines.push(`- **${escapeXml(edgeType)}:** \`${escapeXml(srcName)}\` → \`${escapeXml(tgtName)}\`${label}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Serialize full canvas state as JSON
 */
function serializeToJson(
  cards: CanvasCardRow[],
  edges: CanvasEdgeRow[],
  canvas: CanvasRow
): string {
  const result = {
    ok: true,
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    format: 'canvas-export-v1',
    canvas: {
      id: canvas.id,
      name: canvas.name,
      ownerId: canvas.owner_id,
    },
    cards: cards.map((c) => ({
      id: c.id,
      chapterId: c.chapter_id,
      title: c.title,
      description: c.description,
      content: c.content,
      type: c.type,
      x: c.x,
      y: c.y,
      width: c.width,
      height: c.height,
      metadata: c.metadata ? JSON.parse(c.metadata) : null,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      sourceCardId: e.source_card_id,
      targetCardId: e.target_card_id,
      sourceChapterId: e.source_chapter_id,
      targetChapterId: e.target_chapter_id,
      label: e.label,
      type: e.type,
    })),
    stats: {
      totalCards: cards.length,
      totalEdges: edges.length,
      chapters: [...new Set(cards.map((c) => c.chapter_id ?? 'default'))].length,
    },
  };
  return JSON.stringify(result, null, 2);
}

// GET /api/canvas/[id]/export?format=react|svg|md|json
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
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') ?? 'json') as ExportFormat;

    if (!['react', 'svg', 'md', 'json'].includes(format)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid format. Must be one of: react, svg, md, json' },
        { status: 400 }
      );
    }

    // Check canvas exists and user has access
    const canvases = await queryDB<CanvasRow>(
      env,
      `SELECT id, name, owner_id FROM canvases WHERE id = ? LIMIT 1`,
      [canvasId]
    );

    if (canvases.length === 0) {
      return NextResponse.json({ ok: false, error: 'Canvas not found' }, { status: 404 });
    }

    const canvas = canvases[0];

    // Owner-only export check
    if (canvas.owner_id && canvas.owner_id !== user.userId) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all cards for this canvas
    const cards = await queryDB<CanvasCardRow>(
      env,
      `SELECT id, canvas_id, chapter_id, title, description, content, type, x, y, width, height, metadata
       FROM canvas_cards WHERE canvas_id = ?`,
      [canvasId]
    );

    // Fetch all edges for this canvas
    const edges = await queryDB<CanvasEdgeRow>(
      env,
      `SELECT id, canvas_id, source_card_id, target_card_id, source_chapter_id, target_chapter_id, label, type
       FROM canvas_edges WHERE canvas_id = ?`,
      [canvasId]
    );

    const canvasName = canvas.name ?? 'canvas';
    const timestamp = new Date().toISOString().slice(0, 10);

    let data: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'react':
        data = serializeToReact(cards, edges);
        filename = `${canvasName}-${timestamp}.jsx`;
        mimeType = 'text/javascript';
        break;
      case 'svg':
        data = serializeToSvg(cards, edges);
        filename = `${canvasName}-${timestamp}.svg`;
        mimeType = 'image/svg+xml';
        break;
      case 'md':
        data = serializeToMarkdown(cards, edges, canvasName);
        filename = `${canvasName}-${timestamp}.md`;
        mimeType = 'text/markdown';
        break;
      case 'json':
      default:
        data = serializeToJson(cards, edges, canvas);
        filename = `${canvasName}-${timestamp}.json`;
        mimeType = 'application/json';
        break;
    }

    return NextResponse.json(
      { ok: true, data, filename, mimeType, stats: { cards: cards.length, edges: edges.length } },
      {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'private, no-cache',
        },
      }
    );
  } catch (err) {
    safeError('[CanvasExport GET] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
