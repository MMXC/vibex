/**
 * AIPanel Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { AIPanel } from './AIPanel';
import type { AIMessage } from '../types';

describe('AIPanel', () => {
  const mockOnClose = jest.fn();
  const mockOnSendMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
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
  });

  describe('interactions', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      
      fireEvent.click(screen.getByText('✕'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should update input value on change', () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      
      const input = screen.getByPlaceholderText('向 AI 提问...');
      fireEvent.change(input, { target: { value: 'Test message' } });
      
      expect(input).toHaveValue('Test message');
    });

    it('should call onSendMessage when send button is clicked', () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      
      const input = screen.getByPlaceholderText('向 AI 提问...');
      fireEvent.change(input, { target: { value: 'Test message' } });
      
      fireEvent.click(screen.getByText('发送'));
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('should clear input after sending message', () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      
      const input = screen.getByPlaceholderText('向 AI 提问...');
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(screen.getByText('发送'));
      
      expect(input).toHaveValue('');
    });

    it('should not send message when input is empty', () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      
      fireEvent.click(screen.getByText('发送'));
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('should not send message when input is whitespace only', () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      
      const input = screen.getByPlaceholderText('向 AI 提问...');
      fireEvent.change(input, { target: { value: '   ' } });
      
      fireEvent.click(screen.getByText('发送'));
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('should send message when Enter key is pressed', () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      
      const input = screen.getByPlaceholderText('向 AI 提问...');
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('should disable send button when input is empty', () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      
      const button = screen.getByText('发送') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('should enable send button when input has content', () => {
      render(
        <AIPanel isOpen={true} onClose={mockOnClose} onSendMessage={mockOnSendMessage} />
      );
      
      const input = screen.getByPlaceholderText('向 AI 提问...');
      fireEvent.change(input, { target: { value: 'Test' } });
      
      const button = screen.getByText('发送') as HTMLButtonElement;
      expect(button.disabled).toBe(false);
    });
  });
});
