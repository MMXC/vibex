/**
 * AIPanel Tests
 * E3-S3.3: AIPanel 核心交互实现
 * AC1-AC8: 发送功能、关闭功能、交互细节
 */
// @ts-nocheck


import { render, screen, fireEvent, act } from '@testing-library/react';
import { AIPanel } from './AIPanel';
import type { AIMessage } from '../types';

describe('AIPanel', () => {
  const mockOnClose = jest.fn();
  const mockOnSendMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSendMessage.mockImplementation(() => Promise.resolve());
  });

  describe('rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <AIPanel isOpen={false} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      expect(screen.getByText('AI 助手')).toBeInTheDocument();
    });

    it('should render empty state when no messages', () => {
      render(
        <AIPanel isOpen={true} messages={[]} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      expect(screen.getByText('暂无消息')).toBeInTheDocument();
    });

    it('should render messages when provided', () => {
      const messages: AIMessage[] = [
        { id: '1', role: 'user', content: 'Hello AI' },
        { id: '2', role: 'assistant', content: 'Hello User' },
      ];
      
      render(
        <AIPanel isOpen={true} messages={messages} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      
      expect(screen.getByText('Hello AI')).toBeInTheDocument();
      expect(screen.getByText('Hello User')).toBeInTheDocument();
    });

    it('should have role="dialog"', () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('AC1: 空输入验证', () => {
    it('should not call onSendMessage when input is empty', () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      fireEvent.click(screen.getByTestId('ai-send-btn'));
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('should not call onSendMessage when input is whitespace only', () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      fireEvent.change(screen.getByTestId('ai-input'), { target: { value: '   ' } });
      fireEvent.click(screen.getByTestId('ai-send-btn'));
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('send button should be disabled when input is empty', () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      expect(screen.getByTestId('ai-send-btn')).toBeDisabled();
    });

    it('send button should be enabled when input has content', () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      fireEvent.change(screen.getByTestId('ai-input'), { target: { value: 'Test' } });
      expect(screen.getByTestId('ai-send-btn')).not.toBeDisabled();
    });
  });

  describe('AC2: 有效输入发送', () => {
    it('should call onSendMessage when send button is clicked', async () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      fireEvent.change(screen.getByTestId('ai-input'), { target: { value: 'Test message' } });
      await act(async () => {
        fireEvent.click(screen.getByTestId('ai-send-btn'));
      });
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('should clear input after successful send', async () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      const input = screen.getByTestId('ai-input');
      fireEvent.change(input, { target: { value: 'Test message' } });
      await act(async () => {
        fireEvent.click(screen.getByTestId('ai-send-btn'));
      });
      expect(input).toHaveValue('');
    });
  });

  describe('AC3: 发送中禁用', () => {
    it('should disable send button during sending', async () => {
      mockOnSendMessage.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      const input = screen.getByTestId('ai-input');
      fireEvent.change(input, { target: { value: 'Test' } });

      const sendBtn = screen.getByTestId('ai-send-btn');
      
      await act(async () => {
        fireEvent.click(sendBtn);
      });

      // Button should show loading state during send
      expect(sendBtn).toHaveTextContent('⏳');
    });

    it('should disable input during sending', async () => {
      mockOnSendMessage.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      const input = screen.getByTestId('ai-input');
      fireEvent.change(input, { target: { value: 'Test' } });
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('ai-send-btn'));
      });

      expect(input).toBeDisabled();
    });
  });

  describe('AC4: 发送失败 + 重试', () => {
    it('should show error banner when send fails', async () => {
      mockOnSendMessage.mockRejectedValue(new Error('Network error'));
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      fireEvent.change(screen.getByTestId('ai-input'), { target: { value: 'Test' } });
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('ai-send-btn'));
      });

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('should show retry button on error', async () => {
      mockOnSendMessage.mockRejectedValue(new Error('Failed'));
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      fireEvent.change(screen.getByTestId('ai-input'), { target: { value: 'Test' } });
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('ai-send-btn'));
      });

      expect(screen.getByText('重试')).toBeInTheDocument();
    });

    it('should dismiss error banner', async () => {
      mockOnSendMessage.mockRejectedValue(new Error('Failed'));
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      fireEvent.change(screen.getByTestId('ai-input'), { target: { value: 'Test' } });
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('ai-send-btn'));
      });

      fireEvent.click(screen.getByLabelText('关闭错误'));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should retry on retry button click', async () => {
      mockOnSendMessage
        .mockRejectedValueOnce(new Error('Failed'))
        .mockImplementation(() => Promise.resolve());
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      fireEvent.change(screen.getByTestId('ai-input'), { target: { value: 'Test' } });
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('ai-send-btn'));
      });

      await act(async () => {
        fireEvent.click(screen.getByText('重试'));
      });

      expect(mockOnSendMessage).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('AC5: Esc 键关闭', () => {
    it('should close panel on Escape key', () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not close if input has content (show confirm instead)', () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      fireEvent.change(screen.getByTestId('ai-input'), { target: { value: 'unsaved content' } });
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(mockOnClose).not.toHaveBeenCalled();
      expect(screen.getByText('有未发送的内容，确定要关闭吗？')).toBeInTheDocument();
    });
  });

  describe('AC6: 关闭确认弹窗', () => {
    it('should show confirm dialog when closing with unsent content', () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      fireEvent.change(screen.getByTestId('ai-input'), { target: { value: 'unsaved' } });
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.getByText('有未发送的内容，确定要关闭吗？')).toBeInTheDocument();
    });

    it('should close panel when confirm "确定关闭" is clicked', async () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      fireEvent.change(screen.getByTestId('ai-input'), { target: { value: 'unsaved' } });
      fireEvent.keyDown(window, { key: 'Escape' });
      await act(async () => {
        fireEvent.click(screen.getByText('确定关闭'));
      });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should cancel close when "取消" is clicked', async () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      fireEvent.change(screen.getByTestId('ai-input'), { target: { value: 'unsaved' } });
      fireEvent.keyDown(window, { key: 'Escape' });
      await act(async () => {
        fireEvent.click(screen.getByText('取消'));
      });
      expect(mockOnClose).not.toHaveBeenCalled();
      expect(screen.queryByText('有未发送的内容，确定要关闭吗？')).not.toBeInTheDocument();
    });

    it('should clear input after confirm close', async () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      fireEvent.change(screen.getByTestId('ai-input'), { target: { value: 'unsaved' } });
      fireEvent.keyDown(window, { key: 'Escape' });
      await act(async () => {
        fireEvent.click(screen.getByText('确定关闭'));
      });
      expect(screen.getByTestId('ai-input')).toHaveValue('');
    });
  });

  describe('AC7: 响应过长滚动', () => {
    it('should render long messages correctly', () => {
      const longContent = 'A'.repeat(1000);
      const messages: AIMessage[] = [
        { id: '1', role: 'assistant', content: longContent },
      ];
      render(
        <AIPanel isOpen={true} messages={messages} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      expect(screen.getByText(longContent)).toBeInTheDocument();
    });
  });

  describe('AC8: Ctrl+Enter 发送', () => {
    it('should send message on Ctrl+Enter', async () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      const input = screen.getByTestId('ai-input');
      fireEvent.change(input, { target: { value: 'Ctrl+Enter test' } });
      fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true });
      await act(async () => {
        // Wait for state update
      });
      expect(mockOnSendMessage).toHaveBeenCalledWith('Ctrl+Enter test');
    });

    it('should send message on Cmd+Enter (Mac)', async () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      const input = screen.getByTestId('ai-input');
      fireEvent.change(input, { target: { value: 'Mac test' } });
      fireEvent.keyDown(input, { key: 'Enter', metaKey: true });
      expect(mockOnSendMessage).toHaveBeenCalledWith('Mac test');
    });

    it('should not send on plain Enter (no newline needed for input)', () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      const input = screen.getByTestId('ai-input');
      fireEvent.change(input, { target: { value: 'Plain Enter' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('close button', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      fireEvent.click(screen.getByLabelText('关闭 AI 助手'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should show confirm when close button clicked with unsent content', () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      fireEvent.change(screen.getByTestId('ai-input'), { target: { value: 'unsaved' } });
      fireEvent.click(screen.getByLabelText('关闭 AI 助手'));
      expect(screen.getByText('有未发送的内容，确定要关闭吗？')).toBeInTheDocument();
    });
  });
});
