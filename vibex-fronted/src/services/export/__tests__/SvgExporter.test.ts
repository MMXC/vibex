/**
 * SvgExporter.test.ts — S67-E5: 画布导出增强 PDF/SVG
 *
 * Tests:
 * - D5.2: exportSvg() returns SVG string containing <svg>
 * - D5.2: exportSvg() returns SVG containing node rects
 * - D5.2: exportSvg() returns correct nodeCount
 * - D5.2: exportSvg() returns chapter IDs
 * - D5.2: exportSvg() handles empty cards
 * - D5.2: exportSvg() applies background color
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportSvg } from '../SvgExporter';
import type { DDSCard } from '@/types/dds';

function makeCard(id: string, title: string, chapterId = 'ch-1', cardType = 'bounded-context'): DDSCard {
  return {
    id,
    title,
    type: cardType as DDSCard['type'],
    chapterId,
  } as DDSCard;
}

describe('SvgExporter — D5.2', () => {
  beforeEach(() => {});

  it('D5.2a: exportSvg returns SVG string containing <svg> element', async () => {
    const cards = [makeCard('card-1', '上下文A')];
    const result = await exportSvg(cards);
    expect(result.svg).toContain('<svg');
    expect(result.svg).toContain('</svg>');
    expect(result.svg).toContain('<?xml version="1.0"');
  });

  it('D5.2b: exportSvg returns SVG containing node name text', async () => {
    const cards = [makeCard('card-1', '上下文A')];
    const result = await exportSvg(cards);
    expect(result.svg).toContain('上下文A');
  });

  it('D5.2c: exportSvg returns correct nodeCount', async () => {
    const cards = [
      makeCard('card-1', '上下文A'),
      makeCard('card-2', '上下文B'),
      makeCard('card-3', '上下文C'),
    ];
    const result = await exportSvg(cards);
    expect(result.nodeCount).toBe(3);
  });

  it('D5.2d: exportSvg returns chapter IDs', async () => {
    const cards = [
      makeCard('card-1', '上下文A', 'ch-context'),
      makeCard('card-2', '上下文B', 'ch-flow'),
    ];
    const result = await exportSvg(cards);
    expect(result.chapters).toContain('ch-context');
    expect(result.chapters).toContain('ch-flow');
  });

  it('D5.2e: exportSvg handles empty cards array', async () => {
    const result = await exportSvg([]);
    expect(result.svg).toContain('<svg');
    expect(result.nodeCount).toBe(0);
    expect(result.chapters).toEqual([]);
  });

  it('D5.2f: exportSvg applies background color', async () => {
    const cards = [makeCard('card-1', '上下文A')];
    const result = await exportSvg(cards, { backgroundColor: '#1a1a2e' });
    expect(result.svg).toContain('#1a1a2e');
  });

  it('D5.2g: exportSvg renders rect elements for each card', async () => {
    const cards = [makeCard('card-1', '上下文A')];
    const result = await exportSvg(cards);
    expect(result.svg).toContain('<rect');
  });

  it('D5.2h: exportSvg includes VibeX Canvas title', async () => {
    const cards = [makeCard('card-1', '上下文A')];
    const result = await exportSvg(cards);
    expect(result.svg).toContain('VibeX Canvas');
  });

  it('D5.2i: exportSvg escapes special characters', async () => {
    const cards = [makeCard('card-1', 'A & B <C> "D"')];
    const result = await exportSvg(cards);
    expect(result.svg).toContain('&amp;');
    expect(result.svg).toContain('&lt;');
    expect(result.svg).not.toContain('A & B');
  });

  it('D5.2j: exportSvg uses default canvas dimensions', async () => {
    const cards = [makeCard('card-1', '上下文A')];
    const result = await exportSvg(cards);
    expect(result.svg).toContain('width="1200"');
    expect(result.svg).toContain('height="800"');
  });

  it('D5.2k: exportSvg uses custom dimensions when provided', async () => {
    const cards = [makeCard('card-1', '上下文A')];
    const result = await exportSvg(cards, { width: 1920, height: 1080 });
    expect(result.svg).toContain('width="1920"');
    expect(result.svg).toContain('height="1080"');
  });
});
