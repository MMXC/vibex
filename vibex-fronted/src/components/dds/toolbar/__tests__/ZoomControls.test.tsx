/**
 * ZoomControls Tests
 * S88-E1: Canvas Zoom & Navigation Enhancement
 *
 * Uses Pattern F — real Zustand create() store mock.
 * Tests E1-F1 (zoom buttons) and E1-F2 (grid spacing).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { create } from 'zustand';
import { ZoomControls } from '../ZoomControls';

// ============ Mock stores (Pattern F — real Zustand) ============

interface ViewportStore {
  viewport: { x: number; y: number; zoom: number };
  zoomTo: (level: number) => void;
  resetViewport: () => void;
  setViewport: (vp: Partial<{ x: number; y: number; zoom: number }>) => void;
}

const viewportTestStore = create<ViewportStore>((set) => ({
  viewport: { x: 0, y: 0, zoom: 1 },
  zoomTo: (level) =>
    set((s) => ({ viewport: { ...s.viewport, zoom: level } })),
  resetViewport: () =>
    set({ viewport: { x: 0, y: 0, zoom: 1 } }),
  setViewport: (vp) =>
    set((s) => ({ viewport: { ...s.viewport, ...vp } })),
}));

interface GridStore {
  gridSize: 'small' | 'medium' | 'large' | 'none';
  setGridSize: (size: 'small' | 'medium' | 'large' | 'none') => void;
  cycleGridSize: () => void;
}

const gridTestStore = create<GridStore>((set, get) => ({
  gridSize: 'medium',
  setGridSize: (size) => set({ gridSize: size }),
  cycleGridSize: () => {
    const order: Array<'small' | 'medium' | 'large' | 'none'> = ['medium', 'small', 'large', 'none'];
    const idx = order.indexOf(get().gridSize);
    set({ gridSize: order[(idx + 1) % order.length] });
  },
}));

// ============ Module-level mocks ============
vi.mock('@/lib/canvas/stores/canvasViewportStore', () => ({
  useCanvasViewportStore:
    (selector?: (s: ViewportStore) => unknown) => {
      const state = viewportTestStore.getState();
      if (typeof selector === 'function') return selector(state);
      return state;
    },
}));

vi.mock('@/stores/dds/gridSettingsStore', () => ({
  useGridSettingsStore:
    (selector?: (s: GridStore) => unknown) => {
      const state = gridTestStore.getState();
      if (typeof selector === 'function') return selector(state);
      return state;
    },
}));

// ============ Helpers ============
const user = userEvent.setup();

describe('ZoomControls', () => {
  beforeEach(() => {
    viewportTestStore.setState({ viewport: { x: 0, y: 0, zoom: 1 } });
    gridTestStore.setState({ gridSize: 'medium' });
  });

  // E1-F1: Zoom control buttons

  describe('E1-F1 zoom buttons', () => {
    it('renders zoom buttons [-] [+] [100%]', () => {
      render(<ZoomControls />);
      expect(screen.getByRole('button', { name: /缩小 25%/ })).toBeTruthy();
      expect(screen.getByRole('button', { name: /放大 25%/ })).toBeTruthy();
      expect(screen.getByRole('button', { name: /重置到 100%/ })).toBeTruthy();
      expect(screen.getByRole('button', { name: /适应屏幕/ })).toBeTruthy();
    });

    it('displays current zoom percentage', () => {
      viewportTestStore.setState({ viewport: { x: 0, y: 0, zoom: 0.75 } });
      render(<ZoomControls />);
      // Use role to find the span (zoomPercent display, not the preset button)
      const zoomDisplay = screen.getByRole('generic', { name: /点击切换缩放预设/ });
      expect(zoomDisplay).toBeTruthy();
      expect(zoomDisplay.textContent).toContain('75');
    });

    it('zoom in increases zoom by 25%', async () => {
      viewportTestStore.setState({ viewport: { x: 0, y: 0, zoom: 1 } });
      render(<ZoomControls />);
      const zoomInBtn = screen.getByRole('button', { name: /放大 25%/ });
      await user.click(zoomInBtn);
      expect(viewportTestStore.getState().viewport.zoom).toBeCloseTo(1.25, 2);
    });

    it('zoom out decreases zoom by 25%', async () => {
      viewportTestStore.setState({ viewport: { x: 0, y: 0, zoom: 1 } });
      render(<ZoomControls />);
      const zoomOutBtn = screen.getByRole('button', { name: /缩小 25%/ });
      await user.click(zoomOutBtn);
      expect(viewportTestStore.getState().viewport.zoom).toBeCloseTo(0.75, 2);
    });

    it('reset button resets viewport to (0,0,1)', async () => {
      viewportTestStore.setState({ viewport: { x: 100, y: 200, zoom: 0.5 } });
      render(<ZoomControls />);
      const resetBtn = screen.getByRole('button', { name: /重置到 100%/ });
      await user.click(resetBtn);
      const { viewport } = viewportTestStore.getState();
      expect(viewport).toEqual({ x: 0, y: 0, zoom: 1 });
    });
  });

  // E1-F2: Grid spacing switch

  describe('E1-F2 grid spacing button', () => {
    it('renders grid cycle button', () => {
      render(<ZoomControls />);
      expect(screen.getByRole('button', { name: /网格间距/ })).toBeTruthy();
    });

    it('cycles grid size on click', async () => {
      gridTestStore.setState({ gridSize: 'medium' });
      render(<ZoomControls />);
      const gridBtn = screen.getByRole('button', { name: /网格间距/ });
      await user.click(gridBtn);
      expect(gridTestStore.getState().gridSize).toBe('small');

      await user.click(gridBtn);
      expect(gridTestStore.getState().gridSize).toBe('large');

      await user.click(gridBtn);
      expect(gridTestStore.getState().gridSize).toBe('none');

      await user.click(gridBtn);
      expect(gridTestStore.getState().gridSize).toBe('medium');
    });
  });
});
