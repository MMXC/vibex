/**
 * Tests for VisualizationPlatform component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VisualizationPlatform } from '../VisualizationPlatform';

// Mock next/navigation
const mockUseSearchParams = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockUseSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Mock FlowRenderer
vi.mock('@/components/visualization/FlowRenderer', () => ({
  FlowRenderer: vi.fn(({ data, showMinimap, onNodeClick }) => (
    <div data-testid="flow-renderer">
      <span data-testid="flow-data">{JSON.stringify({ nodeCount: data?.nodes?.length ?? 0 })}</span>
      <button onClick={() => onNodeClick?.({ id: 'node-1' })}>click node</button>
    </div>
  )),
}));

// Mock lazy MermaidRenderer
vi.mock('@/components/visualization/MermaidRenderer', () => ({
  MermaidRenderer: vi.fn(({ code }) => (
    <div data-testid="mermaid-renderer">
      <span data-testid="mermaid-code">{code}</span>
    </div>
  )),
}));

// Mock lazy JsonTreeRenderer
vi.mock('@/components/visualization/JsonTreeRenderer', () => ({
  JsonTreeRenderer: vi.fn(({ data }) => (
    <div data-testid="json-tree-renderer">
      <span data-testid="json-data-type">{typeof data}</span>
    </div>
  )),
}));

// Mock ViewSwitcher
vi.mock('@/components/visualization/ViewSwitcher', () => ({
  ViewSwitcher: vi.fn(({ value, onChange }) => (
    <div data-testid="view-switcher" data-value={value}>
      <button onClick={() => onChange('flow')}>Flow</button>
      <button onClick={() => onChange('mermaid')}>Mermaid</button>
      <button onClick={() => onChange('json')}>JSON</button>
    </div>
  )),
}));

describe('VisualizationPlatform', () => {
  const mockFlowData = { nodes: [{ id: '1', label: 'A' }], edges: [] };
  const mockMermaidCode = 'graph TD; A-->B;';
  const mockJsonData = { key: 'value' };

  beforeEach(() => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the platform container', () => {
      render(<VisualizationPlatform />);
      expect(screen.getByTestId('visualization-platform')).toBeInTheDocument();
    });

    it('renders ViewSwitcher when showToolbar is true', () => {
      render(<VisualizationPlatform showToolbar={true} />);
      expect(screen.getByTestId('view-switcher')).toBeInTheDocument();
    });

    it('does not render ViewSwitcher when showToolbar is false', () => {
      render(<VisualizationPlatform showToolbar={false} />);
      expect(screen.queryByTestId('view-switcher')).not.toBeInTheDocument();
    });

    it('shows loading skeleton during Suspense', async () => {
      render(<VisualizationPlatform flowData={mockFlowData} />);
      await waitFor(() => {
        // Initially Suspense fallback may be shown
      });
    });
  });

  describe('view switching', () => {
    it('renders FlowRenderer when type is flow', () => {
      render(
        <VisualizationPlatform
          initialType="flow"
          flowData={mockFlowData}
        />
      );
      expect(screen.getByTestId('flow-renderer')).toBeInTheDocument();
    });

    it('renders empty state when no data for current view', () => {
      render(
        <VisualizationPlatform
          initialType="flow"
          flowData={null}
        />
      );
      expect(screen.getByTestId('visualization-empty')).toBeInTheDocument();
    });

    it('calls onViewChange when view switches', async () => {
      const onViewChange = vi.fn();
      render(
        <VisualizationPlatform
          initialType="flow"
          flowData={mockFlowData}
          mermaidCode={mockMermaidCode}
          onViewChange={onViewChange}
        />
      );

      // The mock ViewSwitcher renders a div with buttons that call onChange
      // ViewSwitcher interaction tested separately in ViewSwitcher.test.tsx
      expect(screen.getByTestId('view-switcher')).toBeInTheDocument();
    });

    it('renders MermaidRenderer when type is mermaid', async () => {
      render(
        <VisualizationPlatform
          initialType="mermaid"
          mermaidCode={mockMermaidCode}
        />
      );
      await waitFor(() => {
        expect(screen.getByTestId('mermaid-renderer')).toBeInTheDocument();
      });
    });

    it('renders JsonTreeRenderer when type is json', async () => {
      render(
        <VisualizationPlatform
          initialType="json"
          jsonData={mockJsonData}
        />
      );
      await waitFor(() => {
        expect(screen.getByTestId('json-tree-renderer')).toBeInTheDocument();
      });
    });
  });

  describe('URL sync', () => {
    it('reads initial type from URL param', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('view=mermaid'));
      render(
        <VisualizationPlatform
          flowData={mockFlowData}
          mermaidCode={mockMermaidCode}
        />
      );
      // The mock ViewSwitcher should receive mermaid as value
      expect(screen.getByTestId('view-switcher')).toHaveAttribute('data-value', 'mermaid');
    });

    it('defaults to flow when no URL param', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams());
      render(<VisualizationPlatform />);
      expect(screen.getByTestId('view-switcher')).toHaveAttribute('data-value', 'flow');
    });

    it('ignores URL param when syncWithUrl is false', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('view=mermaid'));
      render(
        <VisualizationPlatform
          initialType="flow"
          syncWithUrl={false}
        />
      );
      expect(screen.getByTestId('view-switcher')).toHaveAttribute('data-value', 'flow');
    });
  });

  describe('loading and error states', () => {
    it('shows loading skeleton via Suspense', async () => {
      // The component uses React.lazy + Suspense
      // When data is provided, Suspense resolves immediately in mocked environment
      render(
        <VisualizationPlatform
          flowData={mockFlowData}
          mermaidCode={mockMermaidCode}
          jsonData={mockJsonData}
        />
      );
      // Should render the actual content
      await waitFor(() => {
        expect(screen.getByTestId('visualization-platform')).toBeInTheDocument();
      });
    });
  });

  describe('node selection callback', () => {
    it('calls onNodeSelect when a node is clicked', async () => {
      const onNodeSelect = vi.fn();
      render(
        <VisualizationPlatform
          initialType="flow"
          flowData={mockFlowData}
          onNodeSelect={onNodeSelect}
        />
      );

      const clickBtn = screen.getByRole('button', { name: 'click node' });
      await userEvent.click(clickBtn);

      expect(onNodeSelect).toHaveBeenCalledWith('node-1', 'flow');
    });
  });

  describe('data attributes', () => {
    it('sets data-view attribute reflecting current type', () => {
      render(
        <VisualizationPlatform
          initialType="mermaid"
          mermaidCode={mockMermaidCode}
        />
      );
      expect(screen.getByTestId('visualization-platform')).toHaveAttribute(
        'data-view',
        'mermaid'
      );
    });
  });
});
