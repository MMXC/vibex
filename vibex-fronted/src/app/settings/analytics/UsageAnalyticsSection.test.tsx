'use client';

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsageAnalyticsSection } from './UsageAnalyticsSection';

// Mock the stores
vi.mock('@/stores/canvasListStore', () => ({
  useCanvasListStore: vi.fn((selector?) => {
    const state = {
      canvases: mockCanvases,
    };
    if (typeof selector === 'function') return selector(state);
    return state;
  }),
}));

vi.mock('@/stores/dds/canvasAccessHistoryStore', () => ({
  useCanvasAccessHistoryStore: vi.fn((selector?) => {
    const state = {
      getRecentAccessors: (canvasId: string) => mockAccessors[canvasId] ?? [],
    };
    if (typeof selector === 'function') return selector(state);
    return state;
  }),
}));

const mockCanvases = [
  {
    id: 'canvas-1',
    name: 'Template: SaaS Product',
    thumbnail: null,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['template'],
  },
  {
    id: 'canvas-2',
    name: 'My Prototype App',
    thumbnail: null,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    tags: [],
  },
  {
    id: 'canvas-3',
    name: 'Blank Canvas',
    thumbnail: null,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    tags: [],
  },
] as any[];

const mockAccessors: Record<string, any[]> = {
  'canvas-1': [
    { userId: 'u1', userName: 'Alice', avatarUrl: null, accessedAt: Date.now() - 60000 },
    { userId: 'u2', userName: 'Bob', avatarUrl: null, accessedAt: Date.now() - 120000 },
  ],
  'canvas-2': [
    { userId: 'u1', userName: 'Alice', avatarUrl: null, accessedAt: Date.now() - 3600000 },
  ],
  'canvas-3': [],
};

describe('UsageAnalyticsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the section with stats grid', () => {
    render(<UsageAnalyticsSection />);
    expect(screen.getByTestId('usage-analytics-section')).toBeInTheDocument();
    expect(screen.getByTestId('analytics-stats-grid')).toBeInTheDocument();
  });

  it('shows total canvas count', () => {
    render(<UsageAnalyticsSection />);
    expect(screen.getByTestId('stat-total')).toHaveTextContent('3');
  });

  it('shows created-this-month count', () => {
    render(<UsageAnalyticsSection />);
    // canvas-2 was created 5 days ago (this month)
    const el = screen.getByTestId('stat-created-month');
    expect(parseInt(el.textContent ?? '0')).toBeGreaterThanOrEqual(1);
  });

  it('shows type distribution pie chart', () => {
    render(<UsageAnalyticsSection />);
    expect(screen.getByTestId('type-distribution')).toBeInTheDocument();
    expect(screen.getByTestId('type-pie-chart')).toBeInTheDocument();
  });

  it('shows canvas rows with recent accessors', () => {
    render(<UsageAnalyticsSection />);
    // canvas-2 is most recently updated
    expect(screen.getByTestId('canvas-row-canvas-2')).toBeInTheDocument();
    expect(screen.getByTestId('accessors-canvas-1')).toBeInTheDocument();
  });

  it('shows avatar initials when no avatarUrl', () => {
    render(<UsageAnalyticsSection />);
    const accessorBlock = screen.getByTestId('accessors-canvas-1');
    // Should show 'A' for Alice and 'B' for Bob initials
    expect(accessorBlock.textContent).toContain('AB');
  });

  it('shows empty state when no canvases', () => {
    const { useCanvasListStore } = vi.mocked() as any;
    (useCanvasListStore as ReturnType<typeof vi.fn>).mockImplementation((selector?) => {
      const state = { canvases: [] };
      if (typeof selector === 'function') return selector(state);
      return state;
    });
    render(<UsageAnalyticsSection />);
    expect(screen.getByTestId('no-canvases-message')).toBeInTheDocument();
  });
});
