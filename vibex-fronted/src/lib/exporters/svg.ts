/**
 * svg.ts — E4-Export-Formats S4.3
 *
 * Generates SVG from canvas node data.
 * Includes fallback strategy with try-catch.
 */

import type { BoundedContextNode, BusinessFlowNode, ComponentNode } from '@/lib/canvas/types';

export interface SVGExportResult {
  success: boolean;
  svg?: string;
  error?: string;
  fallbackMessage?: string;
}

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;
const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;
const CONTEXT_COLORS: Record<string, string> = {
  core: '#4ECDC4',
  supporting: '#45B7D1',
  generic: '#96CEB4',
  external: '#DDA0DD',
};

function svgEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateContextSVG(contexts: BoundedContextNode[]): string {
  const elements: string[] = [];
  const cols = Math.ceil(Math.sqrt(contexts.length));
  const spacingX = CANVAS_WIDTH / (cols + 1);
  const spacingY = CANVAS_HEIGHT / (Math.ceil(contexts.length / cols) + 1);

  contexts.forEach((ctx, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = spacingX * (col + 1) - NODE_WIDTH / 2;
    const y = spacingY * (row + 1) - NODE_HEIGHT / 2;
    const color = CONTEXT_COLORS[ctx.type] ?? '#4ECDC4';

    elements.push(`
<g transform="translate(${x}, ${y})">
  <rect width="${NODE_WIDTH}" height="${NODE_HEIGHT}" rx="8" ry="8"
        fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/>
  <text x="90" y="30" text-anchor="middle" font-size="12" font-weight="600"
        fill="rgba(255,255,255,0.9)">${svgEscape(ctx.name)}</text>
  <text x="90" y="48" text-anchor="middle" font-size="10"
        fill="rgba(255,255,255,0.6)">${svgEscape(ctx.type)}</text>
  <text x="90" y="64" text-anchor="middle" font-size="9"
        fill="rgba(255,255,255,0.4)">${svgEscape((ctx.description ?? '').split('\n')[0] ?? '')}</text>
</g>`);
  });

  // Draw relationships
  for (const ctx of contexts) {
    if (!ctx.relationships) continue;
    for (const rel of ctx.relationships) {
      const sourceIdx = contexts.indexOf(ctx);
      const targetIdx = contexts.findIndex((c) => c.nodeId === rel.targetId);
      if (sourceIdx < 0 || targetIdx < 0) continue;

      const sCol = sourceIdx % cols;
      const sRow = Math.floor(sourceIdx / cols);
      const tCol = targetIdx % cols;
      const tRow = Math.floor(targetIdx / cols);

      const x1 = spacingX * (sCol + 1);
      const y1 = spacingY * (sRow + 1) + NODE_HEIGHT / 2;
      const x2 = spacingX * (tCol + 1);
      const y2 = spacingY * (tRow + 1) - NODE_HEIGHT / 2;

      elements.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
        stroke="rgba(255,255,255,0.3)" stroke-width="1" stroke-dasharray="4"/>`);
    }
  }

  return elements.join('\n');
}

function generateFlowSVG(flows: BusinessFlowNode[]): string {
  const elements: string[] = [];
  const flowY = CANVAS_HEIGHT - 150;

  flows.forEach((flow, idx) => {
    const x = 60 + idx * (NODE_WIDTH + 20);
    if (x > CANVAS_WIDTH - NODE_WIDTH) return;

    elements.push(`
<g transform="translate(${x}, ${flowY})">
  <rect width="${NODE_WIDTH}" height="${NODE_HEIGHT}" rx="6" ry="6"
        fill="#45B7D1" fill-opacity="0.3" stroke="#45B7D1" stroke-width="1.5"/>
  <text x="90" y="30" text-anchor="middle" font-size="11" font-weight="600"
        fill="rgba(255,255,255,0.9)">${svgEscape(flow.name)}</text>
  <text x="90" y="48" text-anchor="middle" font-size="10"
        fill="rgba(255,255,255,0.6)">${flow.steps.length} steps</text>
</g>`);
  });

  return elements.join('\n');
}

/**
 * Generates SVG from canvas data.
 * On failure, returns result with fallbackMessage.
 */
export function generateSVG(
  contexts: BoundedContextNode[],
  flows: BusinessFlowNode[],
  components: ComponentNode[],
): SVGExportResult {
  try {
    const contextSvg = generateContextSVG(contexts);
    const flowSvg = generateFlowSVG(flows);

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}"
     width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}">
  <style>
    text { font-family: system-ui, sans-serif; }
  </style>
  <!-- Background -->
  <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="#1e1e2e"/>
  <!-- Title -->
  <text x="20" y="30" font-size="16" font-weight="700" fill="rgba(255,255,255,0.8)">VibeX Canvas Export</text>
  <!-- Contexts -->
  ${contextSvg}
  <!-- Flows -->
  ${flowSvg}
</svg>`;

    return { success: true, svg };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'SVG export failed',
      fallbackMessage: '当前视图不支持 SVG 导出',
    };
  }
}
