/**
 * ThinkingPanel Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThinkingPanel } from './ThinkingPanel';

// Mock the UI ThinkingPanel
vi.mock('@/components/ui/ThinkingPanel', () => ({
  ThinkingPanel: ({ status, errorMessage }: { status: string; errorMessage?: string }) => (
    <div data-testid="ui-thinking-panel">
      <span data-testid="status">{status}</span>
      {errorMessage && <span data-testid="error">{errorMessage}</span>}
    </div>
  ),
}));

describe('ThinkingPanel', () => {
  it('should render the panel with idle status', () => {
    render(
      <ThinkingPanel
        thinkingMessages={[]}
        status="idle"
      />
    );

    expect(screen.getByTestId('ui-thinking-panel')).toBeInTheDocument();
    expect(screen.getByTestId('status')).toHaveTextContent('idle');
  });

  it('should render with thinking status', () => {
    render(
      <ThinkingPanel
        thinkingMessages={['Thinking...']}
        status="thinking"
      />
    );

    expect(screen.getByTestId('status')).toHaveTextContent('thinking');
  });

  it('should render with done status', () => {
    render(
      <ThinkingPanel
        thinkingMessages={['Done']}
        contexts={[{ id: '1', name: 'Test' }]}
        status="done"
      />
    );

    expect(screen.getByTestId('status')).toHaveTextContent('done');
  });

  it('should render error message when status is error', () => {
    render(
      <ThinkingPanel
        thinkingMessages={[]}
        status="error"
        errorMessage="Something went wrong"
      />
    );

    expect(screen.getByTestId('status')).toHaveTextContent('error');
    expect(screen.getByTestId('error')).toHaveTextContent('Something went wrong');
  });

  it('should render with mermaid code', () => {
    render(
      <ThinkingPanel
        thinkingMessages={[]}
        mermaidCode="graph TD; A-->B;"
        status="done"
      />
    );

    expect(screen.getByTestId('ui-thinking-panel')).toBeInTheDocument();
  });
});