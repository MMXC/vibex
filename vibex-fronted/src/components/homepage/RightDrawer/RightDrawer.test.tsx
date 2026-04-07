/**
 * RightDrawer Tests
 * 
 * Epic 5: SSE 流式 + AI展示区
 * Test IDs: ST-5.1, ST-5.2, ST-5.3
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { RightDrawer } from './RightDrawer';
import type { SSEStatus } from '../hooks/useSSEStream';

describe('RightDrawer', () => {
  const defaultProps = {
    isOpen: true,
    streamingText: '',
    sseStatus: 'idle' as SSEStatus,
    reconnectCount: 0,
    errorMessage: null,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========== ST-5.1: SSE 连接状态显示 ==========
  describe('ST-5.1: SSE 连接状态显示', () => {
    it('should render when isOpen is true', () => {
      render(<RightDrawer {...defaultProps} />);
      expect(screen.getByTestId('right-drawer')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<RightDrawer {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('right-drawer')).not.toBeInTheDocument();
    });

    it('should display SSE status dot with correct color for each status', () => {
      const statuses: SSEStatus[] = ['idle', 'connecting', 'connected', 'reconnecting', 'error', 'failed'];
      
      for (const status of statuses) {
        const { unmount } = render(
          <RightDrawer {...defaultProps} sseStatus={status} />
        );
        
        const dot = screen.getByTestId('sse-status-dot');
        expect(dot).toBeInTheDocument();
        expect(dot).toHaveAttribute('data-testid', 'sse-status-dot');
        
        unmount();
      }
    });

    it('should show status text for connected state', () => {
      render(<RightDrawer {...defaultProps} sseStatus="connected" />);
      expect(screen.getByTestId('sse-status-text')).toHaveTextContent('已连接');
    });

    it('should show reconnect count when reconnecting', () => {
      render(<RightDrawer {...defaultProps} sseStatus="reconnecting" reconnectCount={2} />);
      expect(screen.getByText(/\(重试 2\/3\)/)).toBeInTheDocument();
    });

    it('should render with correct data attributes', () => {
      render(<RightDrawer {...defaultProps} sseStatus="connecting" reconnectCount={1} />);
      
      const drawer = screen.getByTestId('right-drawer');
      expect(drawer).toHaveAttribute('data-sse-status', 'connecting');
      expect(drawer).toHaveAttribute('data-reconnect-count', '1');
    });
  });

  // ========== ST-5.2: 流式文本显示 ==========
  describe('ST-5.2: 流式文本显示', () => {
    it('should show streaming text when provided', () => {
      render(
        <RightDrawer
          {...defaultProps}
          streamingText="Analyzing requirements..."
        />
      );
      expect(screen.getByTestId('streaming-text')).toBeInTheDocument();
    });

    it('should show empty state when no streaming text', () => {
      render(<RightDrawer {...defaultProps} streamingText="" />);
      expect(screen.getByTestId('empty-streaming')).toBeInTheDocument();
      expect(screen.getByText(/AI 思考过程将显示在这里/)).toBeInTheDocument();
    });

    it('should render streaming content area', () => {
      render(
        <RightDrawer
          {...defaultProps}
          streamingText="First chunk. Second chunk."
        />
      );
      expect(screen.getByTestId('streaming-content')).toBeInTheDocument();
    });
  });

  // ========== ST-5.3: 错误消息显示 ==========
  describe('ST-5.3: 错误消息显示', () => {
    it('should show error message when provided', () => {
      render(
        <RightDrawer
          {...defaultProps}
          errorMessage="SSE 连接失败"
        />
      );
      expect(screen.getByTestId('sse-error-message')).toHaveTextContent('SSE 连接失败');
    });

    it('should not show error div when errorMessage is null', () => {
      render(<RightDrawer {...defaultProps} errorMessage={null} />);
      expect(screen.queryByTestId('sse-error-message')).not.toBeInTheDocument();
    });
  });

  // ========== Interactions ==========
  describe('Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      render(<RightDrawer {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('right-drawer-close'));
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should display header with title', () => {
      render(<RightDrawer {...defaultProps} />);
      expect(screen.getByText('AI 思考过程')).toBeInTheDocument();
    });

    it('should have aria-label on close button', () => {
      render(<RightDrawer {...defaultProps} />);
      expect(screen.getByLabelText('关闭右侧抽屉')).toBeInTheDocument();
    });
  });

  // ========== Status Bar ==========
  describe('Status Bar', () => {
    it('should render status bar', () => {
      render(<RightDrawer {...defaultProps} sseStatus="connecting" />);
      expect(screen.getByTestId('sse-status-bar')).toBeInTheDocument();
    });

    it('should show idle status text', () => {
      render(<RightDrawer {...defaultProps} sseStatus="idle" />);
      expect(screen.getByText('等待连接')).toBeInTheDocument();
    });

    it('should show error status text', () => {
      render(<RightDrawer {...defaultProps} sseStatus="error" />);
      expect(screen.getByText('连接错误')).toBeInTheDocument();
    });

    it('should show failed status text', () => {
      render(<RightDrawer {...defaultProps} sseStatus="failed" />);
      expect(screen.getByText('连接失败')).toBeInTheDocument();
    });
  });
});
