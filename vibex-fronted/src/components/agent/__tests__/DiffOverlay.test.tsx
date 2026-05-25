/**
 * DiffOverlay.test.tsx — Sprint38 P003-E2: DiffOverlay Approve/Reject + Error tests
 *
 * Extends P003-E1 tests with:
 * - Approve/Reject button rendering and interaction
 * - Error banner display
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

  describe('P003-E1: Core diff rendering', () => {
    it('renders empty state when result is null', () => {
      render(<DiffOverlay result={null} onClose={vi.fn()} />);
      expect(screen.getByTestId('diff-overlay')).toBeInTheDocument();
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
      render(<DiffOverlay result={mockResult} onClose={onClose} />);
      fireEvent.click(screen.getByTestId('diff-close-btn'));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('P003-E2: Approve/Reject buttons', () => {
    it('renders Approve and Reject buttons when result has content', () => {
      render(<DiffOverlay result={mockResult} onClose={vi.fn()} onApprove={vi.fn()} onReject={vi.fn()} />);
      expect(screen.getByTestId('diff-approve-btn')).toBeInTheDocument();
      expect(screen.getByTestId('diff-reject-btn')).toBeInTheDocument();
    });

    it('calls onApprove when Approve button is clicked', () => {
      const onApprove = vi.fn();
      const onReject = vi.fn();
      render(<DiffOverlay result={mockResult} onClose={vi.fn()} onApprove={onApprove} onReject={onReject} />);
      fireEvent.click(screen.getByTestId('diff-approve-btn'));
      expect(onApprove).toHaveBeenCalledTimes(1);
    });

    it('calls onReject when Reject button is clicked', () => {
      const onApprove = vi.fn();
      const onReject = vi.fn();
      render(<DiffOverlay result={mockResult} onClose={vi.fn()} onApprove={onApprove} onReject={onReject} />);
      fireEvent.click(screen.getByTestId('diff-reject-btn'));
      expect(onReject).toHaveBeenCalledTimes(1);
    });

    it('hides Approve/Reject buttons when result is null (empty state)', () => {
      render(<DiffOverlay result={null} onClose={vi.fn()} onApprove={vi.fn()} onReject={vi.fn()} />);
      expect(screen.queryByTestId('diff-approve-btn')).not.toBeInTheDocument();
      expect(screen.queryByTestId('diff-reject-btn')).not.toBeInTheDocument();
    });

    it('hides Approve/Reject buttons when result has no content', () => {
      const emptyResult: DiffResult = { added: 0, removed: 0, changes: [] };
      render(<DiffOverlay result={emptyResult} onClose={vi.fn()} onApprove={vi.fn()} onReject={vi.fn()} />);
      expect(screen.queryByTestId('diff-approve-btn')).not.toBeInTheDocument();
      expect(screen.queryByTestId('diff-reject-btn')).not.toBeInTheDocument();
    });
  });

  describe('P003-E2: Error banner', () => {
    it('renders error banner when error prop is non-null', () => {
      const errorMsg = 'AI agent failed: connection timeout';
      render(<DiffOverlay result={mockResult} error={errorMsg} onClose={vi.fn()} />);
      expect(screen.getByTestId('diff-error')).toBeInTheDocument();
      expect(screen.getByTestId('diff-error')).toHaveTextContent('AI agent failed: connection timeout');
    });

    it('does not render error banner when error prop is null', () => {
      render(<DiffOverlay result={mockResult} error={null} onClose={vi.fn()} />);
      expect(screen.queryByTestId('diff-error')).not.toBeInTheDocument();
    });

    it('does not render error banner when error prop is undefined', () => {
      render(<DiffOverlay result={mockResult} onClose={vi.fn()} />);
      expect(screen.queryByTestId('diff-error')).not.toBeInTheDocument();
    });

    it('renders error banner with long message that gets truncated', () => {
      const longError = 'AI agent failed: ' + 'x'.repeat(200);
      render(<DiffOverlay result={mockResult} error={longError} onClose={vi.fn()} />);
      expect(screen.getByTestId('diff-error')).toBeInTheDocument();
      expect(screen.getByTestId('diff-error')).toHaveTextContent(longError);
    });

    it('error banner is visible even when result has no content', () => {
      const errorMsg = 'AI agent failed';
      render(<DiffOverlay result={null} error={errorMsg} onClose={vi.fn()} />);
      expect(screen.getByTestId('diff-error')).toHaveTextContent('AI agent failed');
    });
  });
});
