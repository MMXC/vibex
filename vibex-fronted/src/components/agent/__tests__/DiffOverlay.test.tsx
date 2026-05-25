/**
 * DiffOverlay.test.tsx — Sprint38 P003-E1: DiffOverlay component tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiffOverlay } from '@/components/agent/DiffOverlay';
import type { DiffResult } from '@/hooks/useAIAgent';

describe('DiffOverlay', () => {
  const mockResult: DiffResult = {
    added: 2,
    removed: 1,
    changes: [
      { type: 'add', line: 'const newFeature = true;', lineNumber: 10 },
      { type: 'add', line: 'export { newFeature };', lineNumber: 11 },
      { type: 'remove', line: 'const oldFeature = false;', lineNumber: 9 },
    ],
  };

  it('renders empty state when result is null', () => {
    // DiffOverlay renders with empty state when result is null
    render(<DiffOverlay result={null} onClose={vi.fn()} />);
    // Overlay renders but shows empty state
    expect(screen.getByTestId('diff-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('diff-empty')).toBeInTheDocument();
    expect(screen.getByTestId('diff-empty')).toHaveTextContent('暂无代码变更');
  });

  it('renders overlay with correct stats when result has changes', () => {
    render(<DiffOverlay result={mockResult} onClose={vi.fn()} />);

    expect(screen.getByTestId('diff-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('diff-added')).toHaveTextContent('+2 added');
    expect(screen.getByTestId('diff-removed')).toHaveTextContent('-1 removed');
  });

  it('renders added lines with correct class', () => {
    render(<DiffOverlay result={mockResult} onClose={vi.fn()} />);

    const addedLines = screen.getAllByTestId('diff-line-add');
    expect(addedLines).toHaveLength(2);
    expect(addedLines[0]).toHaveTextContent('const newFeature = true;');
  });

  it('renders removed lines with correct class', () => {
    render(<DiffOverlay result={mockResult} onClose={vi.fn()} />);

    const removedLines = screen.getAllByTestId('diff-line-remove');
    expect(removedLines).toHaveLength(1);
    expect(removedLines[0]).toHaveTextContent('const oldFeature = false;');
  });

  it('shows empty state when result has zero counts', () => {
    const emptyResult: DiffResult = { added: 0, removed: 0, changes: [] };
    render(<DiffOverlay result={emptyResult} onClose={vi.fn()} />);

    expect(screen.getByTestId('diff-empty')).toBeInTheDocument();
    expect(screen.getByTestId('diff-empty')).toHaveTextContent('暂无代码变更');
  });

  it('calls onClose when footer close button is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<DiffOverlay result={mockResult} onClose={onClose} />);

    // Click the footer close button (the last button)
    const buttons = container.querySelectorAll('button');
    const footerBtn = buttons[buttons.length - 1];
    fireEvent.click(footerBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
