/**
 * useAlignmentTools — Alignment helpers for DDS canvas cards
 *
 * E4: 多选批量操作
 * 框选 2+ 卡片后，可使用对齐工具将选中卡片按左/右/水平居中/垂直居中对齐
 *
 * Pure utility — no React dependencies, can be used in tests directly.
 */

import type { DDSCard } from '@/types/dds';
import type { Position } from '@/types/dds';

export type AlignmentType = 'left' | 'right' | 'centerH' | 'centerV';

interface CardWithPosition {
  id: string;
  position: Position;
}

interface AlignmentResult {
  cardId: string;
  position: Position;
}

/**
 * Get bounding box of a set of cards
 */
function getBoundingBox(cards: CardWithPosition[]): {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
} {
  if (cards.length === 0) {
    return { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
  }

  // Use a default card size of 200x100 for cards without explicit dimensions
  const CARD_WIDTH = 200;
  const CARD_HEIGHT = 100;

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const card of cards) {
    const left = card.position.x;
    const right = card.position.x + CARD_WIDTH;
    const top = card.position.y;
    const bottom = card.position.y + CARD_HEIGHT;

    if (left < minX) minX = left;
    if (right > maxX) maxX = right;
    if (top < minY) minY = top;
    if (bottom > maxY) maxY = bottom;
  }

  return {
    left: minX,
    right: maxX,
    top: minY,
    bottom: maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

/**
 * Align cards to the left edge (minimum x)
 */
export function alignCardsLeft(cards: CardWithPosition[]): AlignmentResult[] {
  if (cards.length < 2) return [];
  const box = getBoundingBox(cards);
  const refX = box.left;
  return cards.map((card) => ({
    cardId: card.id,
    position: { ...card.position, x: refX },
  }));
}

/**
 * Align cards to the right edge (maximum x)
 */
export function alignCardsRight(cards: CardWithPosition[]): AlignmentResult[] {
  if (cards.length < 2) return [];
  const box = getBoundingBox(cards);
  const CARD_WIDTH = 200;
  const refX = box.right - CARD_WIDTH;
  return cards.map((card) => ({
    cardId: card.id,
    position: { ...card.position, x: refX },
  }));
}

/**
 * Align cards to horizontal center (average centerX)
 */
export function alignCardsCenterH(cards: CardWithPosition[]): AlignmentResult[] {
  if (cards.length < 2) return [];
  const box = getBoundingBox(cards);
  const CARD_WIDTH = 200;
  const refX = box.centerX - CARD_WIDTH / 2;
  return cards.map((card) => ({
    cardId: card.id,
    position: { ...card.position, x: refX },
  }));
}

/**
 * Align cards to vertical center (average centerY)
 */
export function alignCardsCenterV(cards: CardWithPosition[]): AlignmentResult[] {
  if (cards.length < 2) return [];
  const box = getBoundingBox(cards);
  const CARD_HEIGHT = 100;
  const refY = box.centerY - CARD_HEIGHT / 2;
  return cards.map((card) => ({
    cardId: card.id,
    position: { ...card.position, y: refY },
  }));
}

/**
 * Apply alignment to cards, returning updated positions
 */
export function applyAlignment(
  cards: CardWithPosition[],
  alignment: AlignmentType
): AlignmentResult[] {
  switch (alignment) {
    case 'left': return alignCardsLeft(cards);
    case 'right': return alignCardsRight(cards);
    case 'centerH': return alignCardsCenterH(cards);
    case 'centerV': return alignCardsCenterV(cards);
  }
}
