/**
 * coords.ts — screenToFlowCoords / flowToScreenCoords tests
 * S58-E3: 协作者 Cursor 同步完善
 */
import { describe, it, expect } from 'vitest';
import {
  screenToFlowCoords,
  flowToScreenCoords,
  type ViewportBounds,
} from '../coords';

// Mock @xyflow/react's screenToFlowPosition
// (coords.ts imports from @xyflow/react at runtime; mock it here)
vi.mock('@xyflow/react', async () => {
  const actual = await import('@xyflow/react');
  return {
    ...actual,
    screenToFlowPosition: ({ x, y }: { x: number; y: number }) => ({
      x: x * 2 + 10,
      y: y * 2 + 20,
    }),
  };
});

describe('screenToFlowCoords', () => {
  it('converts positive screen coordinates with zoom', () => {
    const viewport: ViewportBounds = { x: 0, y: 0, zoom: 1 };
    const result = screenToFlowCoords(100, 50, viewport);
    // Mocked screenToFlowPosition: x * 2 + 10, y * 2 + 20
    expect(result.x).toBe(210); // 100 * 2 + 10
    expect(result.y).toBe(120); // 50 * 2 + 20
  });

  it('handles negative screen coordinates', () => {
    const viewport: ViewportBounds = { x: 0, y: 0, zoom: 1 };
    const result = screenToFlowCoords(-50, -30, viewport);
    expect(result.x).toBe(-90); // -50 * 2 + 10
    expect(result.y).toBe(-40); // -30 * 2 + 20
  });

  it('handles zero zoom', () => {
    const viewport: ViewportBounds = { x: 0, y: 0, zoom: 0 };
    const result = screenToFlowCoords(100, 100, viewport);
    expect(result.x).toBe(210);
    expect(result.y).toBe(220);
  });

  it('handles zero screen coordinates', () => {
    const viewport: ViewportBounds = { x: 0, y: 0, zoom: 1 };
    const result = screenToFlowCoords(0, 0, viewport);
    expect(result.x).toBe(10);  // 0 * 2 + 10
    expect(result.y).toBe(20);  // 0 * 2 + 20
  });

  it('returns XYPosition shape', () => {
    const viewport: ViewportBounds = { x: 0, y: 0, zoom: 1 };
    const result = screenToFlowCoords(10, 10, viewport);
    expect(result).toHaveProperty('x');
    expect(result).toHaveProperty('y');
    expect(typeof result.x).toBe('number');
    expect(typeof result.y).toBe('number');
  });
});

describe('flowToScreenCoords', () => {
  it('converts flow coordinates back to screen space', () => {
    const viewport: ViewportBounds = { x: 0, y: 0, zoom: 2 };
    const result = flowToScreenCoords(50, 30, viewport);
    // screen = flow * zoom + viewport_offset
    expect(result.x).toBe(100); // 50 * 2
    expect(result.y).toBe(60);  // 30 * 2
  });

  it('handles viewport offset', () => {
    const viewport: ViewportBounds = { x: 100, y: 50, zoom: 1 };
    const result = flowToScreenCoords(0, 0, viewport);
    expect(result.x).toBe(100);
    expect(result.y).toBe(50);
  });

  it('handles negative flow coordinates', () => {
    const viewport: ViewportBounds = { x: 0, y: 0, zoom: 1 };
    const result = flowToScreenCoords(-10, -20, viewport);
    expect(result.x).toBe(-10);
    expect(result.y).toBe(-20);
  });

  it('handles zero zoom', () => {
    const viewport: ViewportBounds = { x: 0, y: 0, zoom: 0 };
    const result = flowToScreenCoords(100, 100, viewport);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it('is inverse of screenToFlowCoords with zoom=1 and zero offset', () => {
    const viewport: ViewportBounds = { x: 0, y: 0, zoom: 1 };
    const flow = flowToScreenCoords(42, 17, viewport);
    // With zoom=1, flowToScreenCoords = identity
    expect(flow.x).toBe(42);
    expect(flow.y).toBe(17);
  });
});

describe('ViewportBounds type', () => {
  it('accepts viewport with all required fields', () => {
    const viewport: ViewportBounds = { x: 50, y: 100, zoom: 2 };
    expect(viewport.x).toBe(50);
    expect(viewport.y).toBe(100);
    expect(viewport.zoom).toBe(2);
  });

  it('accepts zero zoom', () => {
    const viewport: ViewportBounds = { x: 0, y: 0, zoom: 0 };
    expect(viewport.zoom).toBe(0);
  });
});
