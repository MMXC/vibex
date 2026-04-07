/**
 * CanvasPreviewModal unit tests — E3 Preview-Edit Sync
 * Tests modal open/close, sync toggle, and active node display.
 */
import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { CanvasPreviewModal } from '../CanvasPreviewModal';
import { useCanvasPreviewStore } from '@/lib/canvas/stores/canvasPreviewStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';

// Mock json-render components
vi.mock('@json-render/react', () => ({
  Renderer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="json-renderer">{children}</div>
  ),
  StateProvider: ({ children }: { children: React.ReactNode }) => children,
  VisibilityProvider: ({ children }: { children: React.ReactNode }) => children,
  ActionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the JsonRenderPreview child components
vi.mock('@/components/canvas/json-render/JsonRenderErrorBoundary', () => ({
  JsonRenderErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock vibexCanvasRegistry
vi.mock('@/lib/canvas-renderer/registry', () => ({
  vibexCanvasRegistry: {},
}));

describe('CanvasPreviewModal', () => {
  afterEach(() => {
    cleanup();
    // Reset stores
    useCanvasPreviewStore.setState({
      activeNodeId: null,
      previewSchema: null,
      syncEnabled: true,
    });
    useComponentStore.setState({
      componentNodes: [],
      componentDraft: null,
      selectedNodeIds: [],
    });
  });

  describe('preview button (closed state)', () => {
    it('should render preview button when no nodes', () => {
      render(<CanvasPreviewModal />);
      expect(screen.getByRole('button', { name: /预览/ })).toBeInTheDocument();
    });

    it('should show badge with node count when nodes exist', () => {
      useComponentStore.setState({
        componentNodes: [
          {
            nodeId: 'node-1',
            name: 'Test Page',
            type: 'page',
            flowId: 'flow-1',
            props: {},
            api: { method: 'GET', path: '/api/test', params: [] },
            status: 'confirmed',
            isActive: true,
            children: [],
          },
        ],
      });

      render(<CanvasPreviewModal />);
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('modal rendering', () => {
    it('should render modal when opened', () => {
      // Pre-set nodes to avoid disabled state
      useComponentStore.setState({
        componentNodes: [
          {
            nodeId: 'node-1',
            name: 'Test',
            type: 'page',
            flowId: 'flow-1',
            props: {},
            api: { method: 'GET', path: '/api', params: [] },
            status: 'confirmed',
            isActive: true,
            children: [],
          },
        ],
      });

      const { getByText } = render(<CanvasPreviewModal />);
      
      // Click preview button
      fireEvent.click(getByText(/预览/));
      
      // Modal should show
      expect(getByText('组件预览')).toBeInTheDocument();
      expect(getByText('1 个组件')).toBeInTheDocument();
    });

    it('should display sync toggle when modal is open', () => {
      useComponentStore.setState({
        componentNodes: [
          {
            nodeId: 'node-1',
            name: 'Test',
            type: 'page',
            flowId: 'flow-1',
            props: {},
            api: { method: 'GET', path: '/api', params: [] },
            status: 'confirmed',
            isActive: true,
            children: [],
          },
        ],
      });

      const { getByTestId, getByText } = render(<CanvasPreviewModal />);
      
      fireEvent.click(getByText(/预览/));
      
      expect(getByTestId('sync-toggle')).toBeInTheDocument();
    });

    it('should show sync enabled state by default', () => {
      useComponentStore.setState({
        componentNodes: [
          {
            nodeId: 'node-1',
            name: 'Test',
            type: 'page',
            flowId: 'flow-1',
            props: {},
            api: { method: 'GET', path: '/api', params: [] },
            status: 'confirmed',
            isActive: true,
            children: [],
          },
        ],
      });

      const { getByTestId, getByText } = render(<CanvasPreviewModal />);
      
      fireEvent.click(getByText(/预览/));
      
      expect(getByText('同步')).toBeInTheDocument();
    });

    it('should show sync disabled state when toggled', () => {
      useComponentStore.setState({
        componentNodes: [
          {
            nodeId: 'node-1',
            name: 'Test',
            type: 'page',
            flowId: 'flow-1',
            props: {},
            api: { method: 'GET', path: '/api', params: [] },
            status: 'confirmed',
            isActive: true,
            children: [],
          },
        ],
      });

      const { getByTestId, getByText } = render(<CanvasPreviewModal />);
      
      fireEvent.click(getByText(/预览/));
      fireEvent.click(getByTestId('sync-toggle'));
      
      expect(getByText('已断开')).toBeInTheDocument();
    });

    it('should not display active node when none selected', () => {
      useComponentStore.setState({
        componentNodes: [
          {
            nodeId: 'node-1',
            name: 'Test',
            type: 'page',
            flowId: 'flow-1',
            props: {},
            api: { method: 'GET', path: '/api', params: [] },
            status: 'confirmed',
            isActive: true,
            children: [],
          },
        ],
      });

      const { getByText, queryByTestId } = render(<CanvasPreviewModal />);
      
      fireEvent.click(getByText(/预览/));
      
      expect(queryByTestId('active-node')).not.toBeInTheDocument();
    });

    it('should display active node name when node is selected', () => {
      useComponentStore.setState({
        componentNodes: [
          {
            nodeId: 'node-1',
            name: 'Test Page',
            type: 'page',
            flowId: 'flow-1',
            props: {},
            api: { method: 'GET', path: '/api', params: [] },
            status: 'confirmed',
            isActive: true,
            children: [],
          },
        ],
      });
      useCanvasPreviewStore.setState({ activeNodeId: 'node-1' });

      const { getByTestId, getByText } = render(<CanvasPreviewModal />);
      
      fireEvent.click(getByText(/预览/));
      
      const activeNode = getByTestId('active-node');
      expect(activeNode).toHaveTextContent('Test Page');
    });

    it('should close modal when close button clicked', () => {
      useComponentStore.setState({
        componentNodes: [
          {
            nodeId: 'node-1',
            name: 'Test',
            type: 'page',
            flowId: 'flow-1',
            props: {},
            api: { method: 'GET', path: '/api', params: [] },
            status: 'confirmed',
            isActive: true,
            children: [],
          },
        ],
      });

      const { getByText, queryByText } = render(<CanvasPreviewModal />);
      
      fireEvent.click(getByText(/预览/));
      expect(getByText('组件预览')).toBeInTheDocument();
      
      fireEvent.click(getByText('✕'));
      expect(queryByText('组件预览')).not.toBeInTheDocument();
    });

    it('should clear activeNode when modal is closed', () => {
      useComponentStore.setState({
        componentNodes: [
          {
            nodeId: 'node-1',
            name: 'Test',
            type: 'page',
            flowId: 'flow-1',
            props: {},
            api: { method: 'GET', path: '/api', params: [] },
            status: 'confirmed',
            isActive: true,
            children: [],
          },
        ],
      });
      useCanvasPreviewStore.setState({ activeNodeId: 'node-1' });

      expect(useCanvasPreviewStore.getState().activeNodeId).toBe('node-1');

      const { getByText } = render(<CanvasPreviewModal />);
      
      fireEvent.click(getByText(/预览/));
      fireEvent.click(getByText('✕'));
      
      expect(useCanvasPreviewStore.getState().activeNodeId).toBeNull();
    });
  });
});
