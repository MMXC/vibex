/**
 * useAlignmentTools — vitest tests
 *
 * E4: 多选批量操作
 */

import { describe, it, expect } from 'vitest';
import {
  alignCardsLeft,
  alignCardsRight,
  alignCardsCenterH,
  alignCardsCenterV,
  applyAlignment,
} from '../useAlignmentTools';

describe('useAlignmentTools', () => {
  const makeCards = (positions: Array<{ id: string; x: number; y: number }>) =>
    positions.map((p) => ({ id: p.id, position: { x: p.x, y: p.y } }));

  describe('alignCardsLeft', () => {
    it('aligns all cards to the leftmost x position', () => {
      const cards = makeCards([
        { id: 'a', x: 100, y: 0 },
        { id: 'b', x: 200, y: 0 },
        { id: 'c', x: 150, y: 0 },
      ]);
      const result = alignCardsLeft(cards);
      expect(result).toHaveLength(3);
      expect(result.find((r) => r.cardId === 'a')?.position.x).toBe(100);
      expect(result.find((r) => r.cardId === 'b')?.position.x).toBe(100);
      expect(result.find((r) => r.cardId === 'c')?.position.x).toBe(100);
    });

    it('returns empty array for 0 cards', () => {
      expect(alignCardsLeft([])).toEqual([]);
    });

    it('returns empty array for 1 card', () => {
      expect(alignCardsLeft(makeCards([{ id: 'a', x: 100, y: 0 }]))).toEqual([]);
    });
  });

  describe('alignCardsRight', () => {
    it('aligns all cards to the rightmost x position', () => {
      const cards = makeCards([
        { id: 'a', x: 100, y: 0 },
        { id: 'b', x: 200, y: 0 },
        { id: 'c', x: 150, y: 0 },
      ]);
      const result = alignCardsRight(cards);
      // CARD_WIDTH = 200, so rightmost right edge = 200 + 200 = 400, ref x = 400 - 200 = 200
      expect(result.find((r) => r.cardId === 'a')?.position.x).toBe(200);
      expect(result.find((r) => r.cardId === 'b')?.position.x).toBe(200);
      expect(result.find((r) => r.cardId === 'c')?.position.x).toBe(200);
    });
  });

  describe('alignCardsCenterH', () => {
    it('aligns all cards to the horizontal center', () => {
      const cards = makeCards([
        { id: 'a', x: 100, y: 0 },
        { id: 'b', x: 200, y: 0 },
      ]);
      const result = alignCardsCenterH(cards);
      // min=100, max=400 (200+200), center=250, ref x = 250 - 100 = 150
      expect(result.find((r) => r.cardId === 'a')?.position.x).toBe(150);
      expect(result.find((r) => r.cardId === 'b')?.position.x).toBe(150);
    });
  });

  describe('alignCardsCenterV', () => {
    it('aligns all cards to the vertical center', () => {
      const cards = makeCards([
        { id: 'a', x: 0, y: 50 },
        { id: 'b', x: 0, y: 150 },
      ]);
      const result = alignCardsCenterV(cards);
      // min=50, max=250 (150+100), center=150, ref y = 150 - 50 = 100
      expect(result.find((r) => r.cardId === 'a')?.position.y).toBe(100);
      expect(result.find((r) => r.cardId === 'b')?.position.y).toBe(100);
    });
  });

  describe('applyAlignment', () => {
    it('routes to alignCardsLeft for "left"', () => {
      const cards = makeCards([{ id: 'a', x: 100, y: 0 }, { id: 'b', x: 200, y: 0 }]);
      const result = applyAlignment(cards, 'left');
      expect(result.every((r) => r.position.x === 100)).toBe(true);
    });

    it('routes to alignCardsRight for "right"', () => {
      const cards = makeCards([{ id: 'a', x: 100, y: 0 }, { id: 'b', x: 200, y: 0 }]);
      const result = applyAlignment(cards, 'right');
      expect(result.every((r) => r.position.x === 200)).toBe(true);
    });

    it('routes to alignCardsCenterH for "centerH"', () => {
      const cards = makeCards([{ id: 'a', x: 50, y: 0 }, { id: 'b', x: 150, y: 0 }]);
      const result = applyAlignment(cards, 'centerH');
      // min=50, max=350 (150+200), center=200, ref x = 200 - 100 = 100
      expect(result.every((r) => r.position.x === 100)).toBe(true);
    });

    it('routes to alignCardsCenterV for "centerV"', () => {
      const cards = makeCards([{ id: 'a', x: 0, y: 50 }, { id: 'b', x: 0, y: 150 }]);
      const result = applyAlignment(cards, 'centerV');
      expect(result.every((r) => r.position.y === 100)).toBe(true);
    });
  });
});
