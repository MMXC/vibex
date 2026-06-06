/**
 * SvgExporter — SVG export service for VibeX DDS Canvas
 *
 * S67-E5: 画布导出增强 PDF/SVG
 *
 * Provides a clean `exportSvg()` API wrapping the canvas node serializer.
 * Generates a standalone SVG document containing all canvas nodes with
 * their structural relationships rendered as vector graphics.
 *
 * Constraints:
 * - No `any` types
 * - Dynamic import for heavy deps
 */

import type { DDSCard } from '@/types/dds';

// ==================== Types ====================

export interface SvgExportOptions {
  /** Background color (default: transparent) */
  backgroundColor?: string;
  /** Canvas width in px (default: 1200) */
  width?: number;
  /** Canvas height in px (default: 800) */
  height?: number;
  /** Include all chapters or just a specific one */
  chapterId?: string;
}

export interface SvgExportResult {
  /** Complete SVG string including xml declaration and svg root */
  svg: string;
  /** Number of nodes rendered */
  nodeCount: number;
  /** Chapter IDs included */
  chapters: string[];
}

// ==================== Constants ====================

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 800;
const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;

// DDS card type → SVG fill color mapping
const CARD_TYPE_COLORS: Record<string, string> = {
  context: '#4ECDC4',
  flow: '#45B7D1',
  component: '#96CEB4',
  api: '#DDA0DD',
  requirement: '#F7DC6F',
  'business-rules': '#F1948A',
  default: '#6C757D',
};

// ==================== Helpers ====================

function svgEscape(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getColor(cardType: string): string {
  return CARD_TYPE_COLORS[cardType] ?? CARD_TYPE_COLORS['default'];
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Generate SVG rect element for a card node.
 */
function cardToSvgRect(
  card: DDSCard,
  x: number,
  y: number,
  color: string
): string {
  const escapedName = svgEscape(card.title ?? card.id);
  const escapedType = svgEscape(card.cardType ?? 'default');

  return `<g transform="translate(${x}, ${y})">
  <rect width="${NODE_WIDTH}" height="${NODE_HEIGHT}" rx="8" ry="8"
        fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/>
  <text x="90" y="32" text-anchor="middle" font-size="12" font-weight="600"
        font-family="system-ui, sans-serif" fill="rgba(255,255,255,0.9)">${escapedName.slice(0, 18)}</text>
  <text x="90" y="50" text-anchor="middle" font-size="10"
        font-family="system-ui, sans-serif" fill="rgba(255,255,255,0.6)">${escapedType}</text>
</g>`;
}

/**
 * Generate SVG arrow connector between two points.
 */
function arrowSvg(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  const arrowLen = 10;
  const ax1 = x2 - arrowLen * Math.cos(angle - Math.PI / 6);
  const ay1 = y2 - arrowLen * Math.sin(angle - Math.PI / 6);
  const ax2 = x2 - arrowLen * Math.cos(angle + Math.PI / 6);
  const ay2 = y2 - arrowLen * Math.sin(angle + Math.PI / 6);

  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
        stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
  <polygon points="${x2},${y2} ${ax1},${ay1} ${ax2},${ay2}"
           fill="rgba(255,255,255,0.5)"/>`;
}

// ==================== Main Export ====================

/**
 * Export DDS canvas nodes as a standalone SVG document.
 *
 * @param cards - Array of DDSCard from the canvas store
 * @param options - Export options (background, dimensions, chapter filter)
 * @returns SvgExportResult - SVG string + metadata
 *
 * @example
 * const result = await exportSvg(cards, { backgroundColor: '#0f0f1a' });
 * console.log(result.svg); // full SVG document
 */
export async function exportSvg(
  cards: DDSCard[],
  options: SvgExportOptions = {}
): Promise<SvgExportResult> {
  const {
    backgroundColor = 'transparent',
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
  } = options;

  if (!cards || cards.length === 0) {
    return {
      svg: buildSvgDocument([], width, height, backgroundColor),
      nodeCount: 0,
      chapters: [],
    };
  }

  // Group cards by chapter
  const byChapter = new Map<string, DDSCard[]>();
  for (const card of cards) {
    const chapterId = card.chapterId ?? 'default';
    if (!byChapter.has(chapterId)) {
      byChapter.set(chapterId, []);
    }
    byChapter.get(chapterId)!.push(card);
  }

  const chapters = Array.from(byChapter.keys());

  // Calculate grid layout: position each card
  const MARGIN = 20;
  const CARD_GAP_X = 40;
  const CARD_GAP_Y = 30;
  const COLS = Math.max(1, Math.floor((width - MARGIN * 2) / (NODE_WIDTH + CARD_GAP_X)));

  const positionedCards = cards.map((card, idx) => {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const x = MARGIN + col * (NODE_WIDTH + CARD_GAP_X);
    const y = MARGIN + row * (NODE_HEIGHT + CARD_GAP_Y);
    return { card, x, y };
  });

  // Build SVG elements
  const elements: string[] = [];

  // Background
  if (backgroundColor !== 'transparent') {
    elements.push(`<rect width="100%" height="100%" fill="${backgroundColor}"/>`);
  }

  // Cards
  for (const { card, x, y } of positionedCards) {
    const color = getColor(card.cardType ?? 'default');
    elements.push(cardToSvgRect(card, x, y, color));
  }

  // Arrows between connected cards (by parent-child relationship)
  const cardMap = new Map<string, typeof positionedCards[0]>();
  for (const pc of positionedCards) {
    cardMap.set(pc.card.id, pc);
  }

  for (const card of cards) {
    if (!card.parentId) continue;
    const parent = cardMap.get(card.parentId);
    const child = cardMap.get(card.id);
    if (parent && child) {
      const x1 = parent.x + NODE_WIDTH;
      const y1 = parent.y + NODE_HEIGHT / 2;
      const x2 = child.x;
      const y2 = child.y + NODE_HEIGHT / 2;
      elements.push(arrowSvg(x1, y1, x2, y2));
    }
  }

  // Header
  elements.push(`<text x="${width / 2}" y="20" text-anchor="middle"
        font-size="14" font-weight="600" font-family="system-ui, sans-serif"
        fill="rgba(255,255,255,0.6)">VibeX Canvas — ${cards.length} 个节点</text>`);

  return {
    svg: buildSvgDocument(elements, width, height, backgroundColor),
    nodeCount: cards.length,
    chapters,
  };
}

// ==================== SVG Document Builder ====================

function buildSvgDocument(
  elements: string[],
  width: number,
  height: number,
  bg: string
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${width}" height="${height}"
     viewBox="0 0 ${width} ${height}">
  ${bg !== 'transparent' ? `<rect width="100%" height="100%" fill="${bg}"/>` : ''}
  ${elements.join('\n  ')}
</svg>`;
}
