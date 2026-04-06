/**
 * Tests for CardTreeView component (Epic 2)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CardTreeView, IS_CARD_TREE_ENABLED } from '../CardTreeView';

// Module-level mock functions for useProjectTree and useErrorHandler
const mockUseProjectTree = vi.fn();
const mockUseErrorHandler = vi.fn();

// Mock useProjectTree
vi.mock('@/hooks/useProjectTree', () => ({
  useProjectTree: mockUseProjectTree,
}));

// Mock useErrorHandler — returns controlled error state for testing
vi.mock('@/hooks/useErrorHandler', () => ({
  useErrorHandler: mockUseErrorHandler,
}));

const mockErrorHandler = (errorMsg: string | null, onError?: (err: unknown) => void) => ({
  error: errorMsg ? { code: 'E9999', type: 'UNKNOWN' as const, severity: 'low' as const, message: errorMsg, userMessage: errorMsg, retryable: false } : null,
  rawError: errorMsg ? new Error(errorMsg) : null,
  userMessage: errorMsg ?? '未知错误',
  isRetryable: false,
  retryCount: 0,
  isRetrying: false,
  handleError: onError ?? vi.fn(),
  retry: vi.fn(),
  clearError: vi.fn(),
});

// Mock CardTreeRenderer
vi.mock('@/components/visualization/CardTreeRenderer/CardTreeRenderer', () => ({
  CardTreeRenderer: () => <div data-testid="mock-cardtree-renderer">MockRenderer</div>,
}));

// Mock CSS module
vi.mock('../CardTree.module.css', () => ({
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

// Mock CardTreeSkeleton
vi.mock('../CardTreeSkeleton', () => ({
  CardTreeSkeleton: ({ 'data-testid': testId }: { 'data-testid'?: string }) => (
    <div data-testid={testId || 'cardtree-skeleton'}>Skeleton</div>
  ),
}));

// Mock CardTreeError
vi.mock('../CardTreeError', () => ({
  CardTreeError: ({ message, onRetry, 'data-testid': testId }: { message: string; onRetry?: () => void; 'data-testid'?: string }) => (
    <div data-testid={testId || 'cardtree-error'} role="alert">
      <span>⚠️</span>
      <p data-testid="error-message">{message}</p>
      {onRetry && (
        <button data-testid="retry-button" onClick={onRetry}>重试</button>
      )}
    </div>
  ),
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
    vi.clearAllMocks();
    // Provide safe default mock so initial render doesn't trigger useErrorHandler
    const useProjectTree = mockUseProjectTree;
    useProjectTree.mockReturnValue({
      data: MOCK_DATA,
      isLoading: false,
      error: null,
      isMockData: false,
      refetch: vi.fn(),
    });
    // Default: no error from useErrorHandler
    const useErrorHandler = mockUseErrorHandler;
    useErrorHandler.mockReturnValue(mockErrorHandler(null));
  });

  describe('Feature Flag', () => {
    it('should export IS_CARD_TREE_ENABLED from env', () => {
      expect(typeof IS_CARD_TREE_ENABLED).toBe('boolean');
    });

    it('should return null when feature flag is disabled (default)', () => {
      const useProjectTree = mockUseProjectTree;
      useProjectTree.mockReturnValue({
        data: MOCK_DATA,
        isLoading: false,
        error: null,
        isMockData: true,
        refetch: vi.fn(),
      });

      const { container } = render(<CardTreeView />);
      // Should not render anything when feature flag is off
      expect(container.firstChild).toBeNull();
    });

    it('should render CardTreeRenderer when forceEnabled=true', () => {
      const useProjectTree = mockUseProjectTree;
      useProjectTree.mockReturnValue({
        data: MOCK_DATA,
        isLoading: false,
        error: null,
        isMockData: false,
        refetch: vi.fn(),
      });

      render(<CardTreeView forceEnabled />);
      expect(screen.queryByTestId('mock-cardtree-renderer')).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('should show skeleton when loading', () => {
      const useProjectTree = mockUseProjectTree;
      useProjectTree.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        isMockData: false,
        refetch: vi.fn(),
      });

      render(<CardTreeView forceEnabled />);
      expect(screen.queryByTestId('cardtree-skeleton')).toBeTruthy();
    });

    it('should NOT show skeleton when not loading', () => {
      const useProjectTree = mockUseProjectTree;
      useProjectTree.mockReturnValue({
        data: MOCK_DATA,
        isLoading: false,
        error: null,
        isMockData: false,
        refetch: vi.fn(),
      });

      render(<CardTreeView forceEnabled />);
      expect(screen.queryByTestId('cardtree-skeleton')).toBeNull();
    });
  });

  describe('Error State', () => {
    it('should show error state when API fails', () => {
      const useProjectTree = mockUseProjectTree;
      const useErrorHandler = mockUseErrorHandler;
      useProjectTree.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Network error'),
        isMockData: false,
        refetch: vi.fn(),
      });
      useErrorHandler.mockReturnValue(mockErrorHandler('网络错误'));

      render(<CardTreeView forceEnabled />);
      expect(screen.queryByTestId('cardtree-error')).toBeTruthy();
      expect(screen.getByText(/网络错误/i)).toBeInTheDocument();
    });

    it('should show retry button in error state', () => {
      const useProjectTree = mockUseProjectTree;
      const useErrorHandler = mockUseErrorHandler;
      const refetch = vi.fn();
      useProjectTree.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('API Error'),
        isMockData: false,
        refetch,
      });
      // isRetryable=true → onRetry = () => retry(refetch), so retry must call its arg
      useErrorHandler.mockReturnValue({
        error: { code: 'E9999', type: 'NETWORK_ERROR' as const, severity: 'low' as const, message: '网络错误', userMessage: '网络错误', retryable: true },
        rawError: new Error('API Error'),
        userMessage: '网络错误',
        isRetryable: true,
        retryCount: 0,
        isRetrying: false,
        handleError: vi.fn(),
        retry: (fn: () => void) => fn(),
        clearError: vi.fn(),
      });

      render(<CardTreeView forceEnabled />);
      const retryBtn = screen.getByTestId('retry-button');
      expect(retryBtn).toBeTruthy();

      fireEvent.click(retryBtn);
      expect(refetch).toHaveBeenCalled();
    });

    it('should show timeout message when request times out (> 10s)', () => {
      const useProjectTree = mockUseProjectTree;
      const useErrorHandler = mockUseErrorHandler;
      useProjectTree.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('请求超时（10秒）'),
        isMockData: false,
        refetch: vi.fn(),
      });
      useErrorHandler.mockReturnValue(mockErrorHandler('请求超时'));

      render(<CardTreeView forceEnabled />);
      expect(screen.queryByTestId('cardtree-error')).toBeTruthy();
      expect(screen.getByText(/请求超时/i)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no data', () => {
      const useProjectTree = mockUseProjectTree;
      useProjectTree.mockReturnValue({
        data: { nodes: [] },
        isLoading: false,
        error: null,
        isMockData: false,
        refetch: vi.fn(),
      });

      render(<CardTreeView forceEnabled />);
      expect(screen.queryByTestId('cardtree-empty')).toBeTruthy();
      expect(screen.getByText('暂无卡片数据')).toBeInTheDocument();
    });
  });

  describe('Mock Data Indicator', () => {
    it('should show mock indicator when using mock data', () => {
      const useProjectTree = mockUseProjectTree;
      useProjectTree.mockReturnValue({
        data: MOCK_DATA,
        isLoading: false,
        error: null,
        isMockData: true,
        refetch: vi.fn(),
      });

      render(<CardTreeView forceEnabled />);
      expect(screen.queryByTestId('mock-data-indicator')).toBeTruthy();
    });

    it('should NOT show mock indicator when using real data', () => {
      const useProjectTree = mockUseProjectTree;
      useProjectTree.mockReturnValue({
        data: MOCK_DATA,
        isLoading: false,
        error: null,
        isMockData: false,
        refetch: vi.fn(),
      });

      render(<CardTreeView forceEnabled />);
      expect(screen.queryByTestId('mock-data-indicator')).toBeNull();
    });
  });

  describe('Callbacks', () => {
    it('should pass projectId to useProjectTree', () => {
      const useProjectTree = mockUseProjectTree;
      useProjectTree.mockReturnValue({
        data: MOCK_DATA,
        isLoading: false,
        error: null,
        isMockData: false,
        refetch: vi.fn(),
      });

      render(<CardTreeView projectId="proj-123" forceEnabled />);
      expect(useProjectTree).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 'proj-123' })
      );
    });

    it('should render with data-testid', () => {
      const useProjectTree = mockUseProjectTree;
      useProjectTree.mockReturnValue({
        data: MOCK_DATA,
        isLoading: false,
        error: null,
        isMockData: false,
        refetch: vi.fn(),
      });

      render(<CardTreeView forceEnabled data-testid="my-cardtree" />);
      expect(screen.queryByTestId('my-cardtree')).toBeTruthy();
    });
  });
});
