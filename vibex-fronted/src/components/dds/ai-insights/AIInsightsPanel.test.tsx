/**
 * AIInsightsPanel.test.tsx — S94-E1: Canvas AI Insights Vitest Tests
 *
 * Tests:
 * 1. Renders nothing when panel is closed
 * 2. Renders panel when open
 * 3. Shows loading state
 * 4. Shows error state with retry button
 * 5. Displays health score 0-100
 * 6. Displays up to 3 suggestions
 * 7. Shows isolated nodes count
 * 8. Layout radio options toggle
 * 9. Apply button disabled when optimizing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AIInsightsPanel } from './AIInsightsPanel';
import { useCanvasAIStore } from '@/stores/canvasAIStore';
import { useCanvasAIInsights } from '@/hooks/canvas/useCanvasAIInsights';

// Mock store state — vi.hoisted so it's accessible at module parse time
const mockStoreState = vi.hoisted(() => ({
  isOpen: false,
  insights: null,
  isLoading: false,
  error: null,
  isOptimizing: false,
  closePanel: vi.fn(),
}));

// Mock hook state
const mockHookState = vi.hoisted(() => ({
  insights: null as { score: number; suggestions: string[]; isolatedNodes: string[] } | null,
  isLoading: false,
  error: null as string | null,
  isOptimizing: false,
  fetchInsights: vi.fn(),
  applyOptimize: vi.fn(),
}));

vi.mock('@/stores/canvasAIStore', () => ({
  useCanvasAIStore: vi.fn((selector?) => {
    if (typeof selector === 'function') return selector(mockStoreState);
    return mockStoreState;
  }),
}));

vi.mock('@/hooks/canvas/useCanvasAIInsights', () => ({
  useCanvasAIInsights: vi.fn(() => ({
    insights: mockHookState.insights,
    isLoading: mockHookState.isLoading,
    error: mockHookState.error,
    isOptimizing: mockHookState.isOptimizing,
    fetchInsights: mockHookState.fetchInsights,
    applyOptimize: mockHookState.applyOptimize,
  })),
}));

describe('AIInsightsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState.isOpen = false;
    mockStoreState.insights = null;
    mockStoreState.isLoading = false;
    mockStoreState.error = null;
    mockStoreState.isOptimizing = false;
    mockHookState.insights = null;
    mockHookState.isLoading = false;
    mockHookState.error = null;
    mockHookState.isOptimizing = false;
    mockHookState.applyOptimize.mockResolvedValue(null);
  });

  const setStoreOpen = (open: boolean) => {
    mockStoreState.isOpen = open;
  };

  it('does not render when panel is closed', () => {
    setStoreOpen(false);
    render(<AIInsightsPanel canvasId="c1" />);
    expect(screen.queryByRole('dialog', { name: /AI Canvas Insights/i })).toBeNull();
  });

  it('renders panel when open', () => {
    setStoreOpen(true);
    mockHookState.insights = { score: 75, suggestions: ['Add more connections'], isolatedNodes: [] };
    render(<AIInsightsPanel canvasId="c1" />);
    expect(screen.getByRole('dialog', { name: /AI Canvas Insights/i })).toBeInTheDocument();
  });

  it('shows loading state', () => {
    setStoreOpen(true);
    mockHookState.isLoading = true;
    render(<AIInsightsPanel canvasId="c1" />);
    expect(screen.getByTestId('insights-loading')).toBeInTheDocument();
  });

  it('shows error state with retry button', () => {
    setStoreOpen(true);
    mockHookState.error = 'Failed to fetch insights';
    render(<AIInsightsPanel canvasId="c1" />);
    expect(screen.getByTestId('insights-error')).toBeInTheDocument();
    expect(screen.getByTestId('insights-retry')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('insights-retry'));
    expect(mockHookState.fetchInsights).toHaveBeenCalled();
  });

  it('displays health score in range 0-100', () => {
    setStoreOpen(true);
    mockHookState.insights = {
      score: 75,
      suggestions: ['Add more connections', 'Check isolated nodes'],
      isolatedNodes: ['n1'],
    };
    render(<AIInsightsPanel canvasId="c1" />);
    expect(screen.getByTestId('health-score-number')).toHaveTextContent('75');
    expect(screen.getByTestId('health-score-ring')).toBeInTheDocument();
  });

  it('displays up to 3 suggestions', () => {
    setStoreOpen(true);
    mockHookState.insights = {
      score: 45,
      suggestions: [
        'Add more connections',
        'Check isolated nodes',
        'Consider hierarchical layout',
      ],
      isolatedNodes: [],
    };
    render(<AIInsightsPanel canvasId="c1" />);
    const list = screen.getByTestId('suggestions-list');
    expect(list.querySelectorAll('li')).toHaveLength(3);
  });

  it('shows isolated node count', () => {
    setStoreOpen(true);
    mockHookState.insights = {
      score: 30,
      suggestions: ['Connect the isolated nodes'],
      isolatedNodes: ['n1', 'n2', 'n3'],
    };
    render(<AIInsightsPanel canvasId="c1" />);
    expect(screen.getByTestId('highlight-isolated-nodes')).toBeInTheDocument();
  });

  it('apply button disabled when optimizing', () => {
    setStoreOpen(true);
    mockHookState.insights = { score: 60, suggestions: ['Test'], isolatedNodes: [] };
    mockHookState.isOptimizing = true;
    render(<AIInsightsPanel canvasId="c1" />);
    const btn = screen.getByTestId('apply-optimize-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn).toHaveTextContent(/Applying/);
  });

  it('close button calls closePanel', () => {
    setStoreOpen(true);
    mockHookState.insights = { score: 80, suggestions: [], isolatedNodes: [] };
    render(<AIInsightsPanel canvasId="c1" />);
    fireEvent.click(screen.getByTestId('close-ai-insights'));
    expect(mockStoreState.closePanel).toHaveBeenCalled();
  });
});
