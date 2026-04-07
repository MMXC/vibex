/**
 * StreamingText Tests
 * 
 * Epic 5: SSE 流式 + AI展示区
 * Test IDs: ST-5.2
 */

import { render, screen } from '@testing-library/react';
import { StreamingText } from './StreamingText';

describe('StreamingText', () => {
  describe('ST-5.2: 流式文本逐步显示', () => {
    it('should render text content', () => {
      render(<StreamingText text="Hello, World!" data-testid="streaming" />);
      expect(screen.getByTestId('streaming')).toBeInTheDocument();
      expect(screen.getByTestId('streaming')).toHaveTextContent('Hello, World!');
    });

    it('should show typing cursor when streaming', () => {
      render(<StreamingText text="Hello" isStreaming={true} data-testid="streaming" />);
      expect(screen.getByTestId('typing-cursor')).toBeInTheDocument();
    });

    it('should hide typing cursor when not streaming', () => {
      render(<StreamingText text="Hello" isStreaming={false} showCursor={false} data-testid="streaming" />);
      expect(screen.queryByTestId('typing-cursor')).not.toBeInTheDocument();
    });

    it('should render plain text', () => {
      render(
        <StreamingText
          text="First paragraph. Second paragraph."
          data-testid="streaming"
        />
      );
      expect(screen.getByTestId('streaming')).toBeInTheDocument();
    });

    it('should render mermaid code blocks', () => {
      render(
        <StreamingText
          text={"```mermaid\ngraph TD\n  A --> B\n```"}
          data-testid="streaming"
        />
      );
      
      const container = screen.getByTestId('streaming');
      const mermaidBlock = container.querySelector('[data-segment-type="mermaid"]');
      expect(mermaidBlock).toBeInTheDocument();
      expect(mermaidBlock?.textContent).toContain('graph TD');
    });

    it('should render regular code blocks', () => {
      render(
        <StreamingText
          text={"```javascript\nconst x = 1;\n```"}
          data-testid="streaming"
        />
      );
      
      const container = screen.getByTestId('streaming');
      expect(container.querySelector('[data-segment-type="code"]')).toBeInTheDocument();
    });

    it('should handle empty text', () => {
      const { container } = render(<StreamingText text="" data-testid="streaming" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('should apply streaming attribute', () => {
      render(<StreamingText text="test" isStreaming={true} data-testid="streaming" />);
      expect(screen.getByTestId('streaming')).toHaveAttribute('data-is-streaming', 'true');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <StreamingText text="test" className="custom-class" data-testid="streaming" />
      );
      expect(container.querySelector('.custom-class')).toBeTruthy();
    });

    it('should render plain text as paragraph', () => {
      render(<StreamingText text="Plain text content" data-testid="streaming" />);
      expect(screen.getByTestId('streaming')).toHaveTextContent('Plain text content');
    });
  });
});
