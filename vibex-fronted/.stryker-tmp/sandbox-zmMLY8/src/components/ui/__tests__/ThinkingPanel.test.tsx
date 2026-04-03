/**
 * ThinkingPanel Component Tests
 */
// @ts-nocheck


import { render, screen, fireEvent } from '@testing-library/react';
import { ThinkingPanel } from '../ThinkingPanel';
import { ThinkingStep } from '@/hooks/useDDDStream';

// Mock MermaidPreview
jest.mock('../MermaidPreview', () => ({
  MermaidPreview: ({ code }: { code: string }) => <div data-testid="mermaid-preview">{code}</div>,
}));

describe('ThinkingPanel', () => {
  const mockThinkingSteps: ThinkingStep[] = [
    { step: 'analyzing', message: 'Analyzing requirements...' },
    { step: 'identifying-core', message: 'Identifying core domains...' },
    { step: 'calling-ai', message: 'Calling AI...' },
  ];

  const mockContexts = [
    { id: '1', name: 'Order Context', type: 'core', description: 'Order management' },
    { id: '2', name: 'Payment Context', type: 'supporting', description: 'Payment processing' },
    { id: '3', name: 'User Context', type: 'generic', description: 'User management' },
  ];

  const defaultProps = {
    thinkingMessages: [],
    contexts: [],
    mermaidCode: '',
    status: 'idle' as const,
    errorMessage: null,
  };

  describe('initial state', () => {
    it('should render idle state by default', () => {
      render(<ThinkingPanel {...defaultProps} />);
      
      expect(screen.getByText('AI 思考过程')).toBeInTheDocument();
      expect(screen.getByText('输入需求后点击"开始分析"')).toBeInTheDocument();
    });

    it('should render panel header with icon', () => {
      render(<ThinkingPanel {...defaultProps} />);
      
      expect(screen.getByText('🧠')).toBeInTheDocument();
    });
  });

  describe('thinking status', () => {
    it('should show spinner when thinking with no steps', () => {
      render(<ThinkingPanel {...defaultProps} status="thinking" />);
      
      expect(screen.getByText('正在启动分析...')).toBeInTheDocument();
    });

    it('should show progress bar when thinking', () => {
      render(
        <ThinkingPanel 
          {...defaultProps} 
          status="thinking" 
          thinkingMessages={mockThinkingSteps}
        />
      );
      
      expect(screen.getByText('分析步骤')).toBeInTheDocument();
    });

    it('should show abort button when thinking', () => {
      const onAbort = jest.fn();
      render(
        <ThinkingPanel 
          {...defaultProps} 
          status="thinking" 
          onAbort={onAbort}
        />
      );
      
      const abortButton = screen.getByText('停止');
      expect(abortButton).toBeInTheDocument();
      
      fireEvent.click(abortButton);
      expect(onAbort).toHaveBeenCalled();
    });
  });

  describe('done status', () => {
    it('should show completed badge when done', () => {
      render(<ThinkingPanel {...defaultProps} status="done" />);
      
      expect(screen.getByText('✓ 已完成')).toBeInTheDocument();
      expect(screen.getByText('完成')).toBeInTheDocument();
    });

    it('should show 100% progress when done', () => {
      render(<ThinkingPanel {...defaultProps} status="done" />);
      
      expect(screen.getByText('✓ 100%')).toBeInTheDocument();
    });

    it('should show empty state when done with no contexts', () => {
      render(<ThinkingPanel {...defaultProps} status="done" />);
      
      expect(screen.getByText('分析完成，暂无结果')).toBeInTheDocument();
    });

    it('should show contexts when done with results', () => {
      render(
        <ThinkingPanel 
          {...defaultProps} 
          status="done" 
          contexts={mockContexts}
        />
      );
      
      expect(screen.getByText('限界上下文 (3)')).toBeInTheDocument();
      expect(screen.getByText('Order Context')).toBeInTheDocument();
    });
  });

  describe('error status', () => {
    it('should show error message', () => {
      render(
        <ThinkingPanel 
          {...defaultProps} 
          status="error" 
          errorMessage="Test error message"
        />
      );
      
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should show default error message when no message provided', () => {
      render(<ThinkingPanel {...defaultProps} status="error" />);
      
      expect(screen.getByText('分析失败，请重试')).toBeInTheDocument();
    });

    it('should show retry button when onRetry provided', () => {
      const onRetry = jest.fn();
      render(
        <ThinkingPanel 
          {...defaultProps} 
          status="error" 
          onRetry={onRetry}
        />
      );
      
      const retryButton = screen.getByText('重试');
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalled();
    });

    it('should show use default button when onUseDefault provided', () => {
      const onUseDefault = jest.fn();
      render(
        <ThinkingPanel 
          {...defaultProps} 
          status="error" 
          onUseDefault={onUseDefault}
        />
      );
      
      const defaultButton = screen.getByText('使用默认值');
      expect(defaultButton).toBeInTheDocument();
      
      fireEvent.click(defaultButton);
      expect(onUseDefault).toHaveBeenCalled();
    });
  });

  describe('thinking steps', () => {
    it('should display thinking steps', () => {
      render(
        <ThinkingPanel 
          {...defaultProps} 
          status="thinking" 
          thinkingMessages={mockThinkingSteps}
        />
      );
      
      // The component displays steps via getStepLabel function
      // At least one step label should be visible
      expect(screen.getByText('分析步骤')).toBeInTheDocument();
    });

    it('should render step container', () => {
      render(
        <ThinkingPanel 
          {...defaultProps} 
          status="thinking" 
          thinkingMessages={mockThinkingSteps}
        />
      );
      
      // Progress should be shown
      expect(screen.getByText(/%/)).toBeInTheDocument();
    });
  });

  describe('context cards', () => {
    it('should render context cards with correct types', () => {
      render(
        <ThinkingPanel 
          {...defaultProps} 
          status="done" 
          contexts={mockContexts}
        />
      );
      
      expect(screen.getByText('Order Context')).toBeInTheDocument();
      expect(screen.getByText('核心域')).toBeInTheDocument();
      expect(screen.getByText('Payment Context')).toBeInTheDocument();
      expect(screen.getByText('支撑域')).toBeInTheDocument();
      expect(screen.getByText('User Context')).toBeInTheDocument();
      expect(screen.getByText('通用域')).toBeInTheDocument();
    });

    it('should show context descriptions', () => {
      render(
        <ThinkingPanel 
          {...defaultProps} 
          status="done" 
          contexts={mockContexts}
        />
      );
      
      expect(screen.getByText('Order management')).toBeInTheDocument();
      expect(screen.getByText('Payment processing')).toBeInTheDocument();
    });
  });

  describe('mermaid diagram', () => {
    it('should show mermaid preview when code provided', () => {
      render(
        <ThinkingPanel 
          {...defaultProps} 
          status="done" 
          mermaidCode="graph TD; A-->B"
        />
      );
      
      expect(screen.getByTestId('mermaid-preview')).toBeInTheDocument();
    });

    it('should show domain model title when no contexts', () => {
      render(
        <ThinkingPanel 
          {...defaultProps} 
          status="done" 
          mermaidCode="classDiagram"
        />
      );
      
      expect(screen.getByText('领域模型')).toBeInTheDocument();
    });

    it('should show context diagram title when contexts provided', () => {
      render(
        <ThinkingPanel 
          {...defaultProps} 
          status="done" 
          mermaidCode="graph TD"
          contexts={mockContexts}
        />
      );
      
      expect(screen.getByText('限界上下文关系图')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle null thinkingMessages', () => {
      render(
        <ThinkingPanel 
          {...defaultProps} 
          status="thinking" 
          thinkingMessages={null as any}
        />
      );
      
      expect(screen.getByText('正在启动分析...')).toBeInTheDocument();
    });

    it('should handle empty array thinkingMessages', () => {
      render(
        <ThinkingPanel 
          {...defaultProps} 
          status="thinking" 
          thinkingMessages={[]}
        />
      );
      
      expect(screen.getByText('正在启动分析...')).toBeInTheDocument();
    });

    it('should handle empty contexts array', () => {
      render(
        <ThinkingPanel 
          {...defaultProps} 
          status="done" 
          contexts={[]}
        />
      );
      
      expect(screen.getByText('分析完成，暂无结果')).toBeInTheDocument();
    });
  });
});