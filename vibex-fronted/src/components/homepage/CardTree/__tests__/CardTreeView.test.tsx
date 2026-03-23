/**
 * Tests for CardTreeView component (Epic 2)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CardTreeView, IS_CARD_TREE_ENABLED } from '../CardTreeView';

// Mock useProjectTree
jest.mock('@/hooks/useProjectTree', () => ({
  useProjectTree: jest.fn(),
}));

// Mock CardTreeRenderer
jest.mock('@/components/visualization/CardTreeRenderer/CardTreeRenderer', () => ({
  CardTreeRenderer: () => <div data-testid="mock-cardtree-renderer">MockRenderer</div>,
}));

// Mock CSS module
jest.mock('../CardTree.module.css', () => ({
  wrapper: 'wrapper',
  empty: 'empty',
  emptyIcon: 'emptyIcon',
  emptyText: 'emptyText',
  emptySubtext: 'emptySubtext',
  error: 'error',
  errorIcon: 'errorIcon',
  errorText: 'errorText',
  retryButton: 'retryButton',
  mockIndicator: 'mockIndicator',
}));

const MOCK_DATA = {
  nodes: [
    {
      title: '需求录入',
      status: 'done',
      children: [
        { id: 'c1', label: '填写需求', checked: true },
        { id: 'c2', label: '提交分析', checked: false },
      ],
    },
    {
      title: '业务流程分析',
      status: 'in-progress',
      children: [
        { id: 'c3', label: '生成流程图', checked: true },
      ],
    },
  ],
  projectId: 'proj-1',
  name: '测试项目',
};

describe('CardTreeView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementation
    const { useProjectTree } = jest.requireMock('@/hooks/useProjectTree') as { useProjectTree: jest.Mock };
    useProjectTree.mockReset();
  });

  describe('Feature Flag', () => {
    it('should export IS_CARD_TREE_ENABLED from env', () => {
      expect(typeof IS_CARD_TREE_ENABLED).toBe('boolean');
    });

    it('should return null when feature flag is disabled (default)', () => {
      const { useProjectTree } = jest.requireMock('@/hooks/useProjectTree') as { useProjectTree: jest.Mock };
      useProjectTree.mockReturnValue({
        data: MOCK_DATA,
        isLoading: false,
        error: null,
        isMockData: true,
        refetch: jest.fn(),
      });

      const { container } = render(<CardTreeView />);
      // Should not render anything when feature flag is off
      expect(container.firstChild).toBeNull();
    });

    it('should render CardTreeRenderer when forceEnabled=true', () => {
      const { useProjectTree } = jest.requireMock('@/hooks/useProjectTree') as { useProjectTree: jest.Mock };
      useProjectTree.mockReturnValue({
        data: MOCK_DATA,
        isLoading: false,
        error: null,
        isMockData: false,
        refetch: jest.fn(),
      });

      render(<CardTreeView forceEnabled />);
      expect(screen.queryByTestId('mock-cardtree-renderer')).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('should show skeleton when loading', () => {
      const { useProjectTree } = jest.requireMock('@/hooks/useProjectTree') as { useProjectTree: jest.Mock };
      useProjectTree.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        isMockData: false,
        refetch: jest.fn(),
      });

      render(<CardTreeView forceEnabled />);
      expect(screen.queryByTestId('cardtree-skeleton')).toBeTruthy();
    });

    it('should NOT show skeleton when not loading', () => {
      const { useProjectTree } = jest.requireMock('@/hooks/useProjectTree') as { useProjectTree: jest.Mock };
      useProjectTree.mockReturnValue({
        data: MOCK_DATA,
        isLoading: false,
        error: null,
        isMockData: false,
        refetch: jest.fn(),
      });

      render(<CardTreeView forceEnabled />);
      expect(screen.queryByTestId('cardtree-skeleton')).toBeNull();
    });
  });

  describe('Error State', () => {
    it('should show error state when API fails', () => {
      const { useProjectTree } = jest.requireMock('@/hooks/useProjectTree') as { useProjectTree: jest.Mock };
      useProjectTree.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Network error'),
        isMockData: false,
        refetch: jest.fn(),
      });

      render(<CardTreeView forceEnabled />);
      expect(screen.queryByTestId('cardtree-error')).toBeTruthy();
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });

    it('should show retry button in error state', () => {
      const { useProjectTree } = jest.requireMock('@/hooks/useProjectTree') as { useProjectTree: jest.Mock };
      const refetch = jest.fn();
      useProjectTree.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('API Error'),
        isMockData: false,
        refetch,
      });

      render(<CardTreeView forceEnabled />);
      const retryBtn = screen.getByTestId('retry-button');
      expect(retryBtn).toBeTruthy();

      fireEvent.click(retryBtn);
      expect(refetch).toHaveBeenCalled();
    });

    it('should show timeout message when request times out (> 10s)', () => {
      const { useProjectTree } = jest.requireMock('@/hooks/useProjectTree') as { useProjectTree: jest.Mock };
      useProjectTree.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('请求超时（10秒）'),
        isMockData: false,
        refetch: jest.fn(),
      });

      render(<CardTreeView forceEnabled />);
      expect(screen.queryByTestId('cardtree-error')).toBeTruthy();
      expect(screen.getByText(/请求超时/i)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no data', () => {
      const { useProjectTree } = jest.requireMock('@/hooks/useProjectTree') as { useProjectTree: jest.Mock };
      useProjectTree.mockReturnValue({
        data: { nodes: [] },
        isLoading: false,
        error: null,
        isMockData: false,
        refetch: jest.fn(),
      });

      render(<CardTreeView forceEnabled />);
      expect(screen.queryByTestId('cardtree-empty')).toBeTruthy();
      expect(screen.getByText('暂无卡片数据')).toBeInTheDocument();
    });
  });

  describe('Mock Data Indicator', () => {
    it('should show mock indicator when using mock data', () => {
      const { useProjectTree } = jest.requireMock('@/hooks/useProjectTree') as { useProjectTree: jest.Mock };
      useProjectTree.mockReturnValue({
        data: MOCK_DATA,
        isLoading: false,
        error: null,
        isMockData: true,
        refetch: jest.fn(),
      });

      render(<CardTreeView forceEnabled />);
      expect(screen.queryByTestId('mock-data-indicator')).toBeTruthy();
    });

    it('should NOT show mock indicator when using real data', () => {
      const { useProjectTree } = jest.requireMock('@/hooks/useProjectTree') as { useProjectTree: jest.Mock };
      useProjectTree.mockReturnValue({
        data: MOCK_DATA,
        isLoading: false,
        error: null,
        isMockData: false,
        refetch: jest.fn(),
      });

      render(<CardTreeView forceEnabled />);
      expect(screen.queryByTestId('mock-data-indicator')).toBeNull();
    });
  });

  describe('Callbacks', () => {
    it('should pass projectId to useProjectTree', () => {
      const { useProjectTree } = jest.requireMock('@/hooks/useProjectTree') as { useProjectTree: jest.Mock };
      useProjectTree.mockReturnValue({
        data: MOCK_DATA,
        isLoading: false,
        error: null,
        isMockData: false,
        refetch: jest.fn(),
      });

      render(<CardTreeView projectId="proj-123" forceEnabled />);
      expect(useProjectTree).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 'proj-123' })
      );
    });

    it('should render with data-testid', () => {
      const { useProjectTree } = jest.requireMock('@/hooks/useProjectTree') as { useProjectTree: jest.Mock };
      useProjectTree.mockReturnValue({
        data: MOCK_DATA,
        isLoading: false,
        error: null,
        isMockData: false,
        refetch: jest.fn(),
      });

      render(<CardTreeView forceEnabled data-testid="my-cardtree" />);
      expect(screen.queryByTestId('my-cardtree')).toBeTruthy();
    });
  });
});
