/**
 * CollapsibleChat Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { CollapsibleChat } from './CollapsibleChat';

// Mock the AIChatPanel component
jest.mock('@/components/ui/AIChatPanel', () => ({
  __esModule: true,
  default: ({ messages, onSendMessage }: any) => (
    <div data-testid="chat-panel">
      <div>{messages.length} messages</div>
      <button onClick={() => onSendMessage?.('test')}>Send</button>
    </div>
  ),
}));

describe('CollapsibleChat', () => {
  const defaultProps = {
    defaultCollapsed: true,
    messages: [],
    onSendMessage: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render collapsed by default', () => {
    render(<CollapsibleChat {...defaultProps} />);
    
    expect(screen.getByText('AI 助手')).toBeInTheDocument();
  });

  it('should expand when button is clicked', () => {
    render(<CollapsibleChat {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /AI 助手/i });
    fireEvent.click(button);
    
    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
  });

  it('should collapse when button is clicked again', () => {
    render(<CollapsibleChat {...defaultProps} />);
    
    // Expand
    const button = screen.getByRole('button', { name: /AI 助手/i });
    fireEvent.click(button);
    
    // Collapse
    const closeButton = screen.getByRole('button', { name: /关闭/i });
    fireEvent.click(closeButton);
    
    expect(screen.queryByTestId('chat-panel')).not.toBeInTheDocument();
  });

  it('should start expanded when defaultCollapsed is false', () => {
    render(<CollapsibleChat {...defaultProps} defaultCollapsed={false} />);
    
    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
  });

  it('should display custom button text', () => {
    render(<CollapsibleChat {...defaultProps} buttonText="Chat with AI" />);
    
    expect(screen.getByText('Chat with AI')).toBeInTheDocument();
  });

  it('should pass messages to AIChatPanel', () => {
    const messages = [
      { id: '1', role: 'user' as const, content: 'Hello', timestamp: new Date() },
      { id: '2', role: 'assistant' as const, content: 'Hi there', timestamp: new Date() },
    ];
    
    render(<CollapsibleChat {...defaultProps} messages={messages} defaultCollapsed={false} />);
    
    expect(screen.getByText('2 messages')).toBeInTheDocument();
  });

  it('should have correct accessibility attributes', () => {
    render(<CollapsibleChat {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /AI 助手/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
