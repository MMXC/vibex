/**
 * IntentionBubble — Unit Tests
 * Epic 3: E3-U2 协作者意图气泡
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntentionBubble } from '../IntentionBubble';

describe('IntentionBubble', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('idle state', () => {
    it('renders nothing when intention is idle', () => {
      const { container } = render(<IntentionBubble intention="idle" />);
      expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing when intention is idle even after delay', () => {
      const { container } = render(<IntentionBubble intention="idle" showDelay={500} />);
      vi.advanceTimersByTime(10_000);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('visible state (after showDelay)', () => {
    it('shows edit intention label after delay', () => {
      render(<IntentionBubble intention="edit" showDelay={500} />);
      vi.advanceTimersByTime(500);
      expect(screen.getByTestId('intention-bubble')).toHaveTextContent('正在编辑');
    });

    it('shows drag intention label after delay', () => {
      render(<IntentionBubble intention="drag" showDelay={500} />);
      vi.advanceTimersByTime(500);
      expect(screen.getByTestId('intention-bubble')).toHaveTextContent('正在拖拽');
    });

    it('shows select intention label after delay', () => {
      render(<IntentionBubble intention="select" showDelay={500} />);
      vi.advanceTimersByTime(500);
      expect(screen.getByTestId('intention-bubble')).toHaveTextContent('正在选择');
    });

    it('has accessible role="status"', () => {
      render(<IntentionBubble intention="edit" showDelay={500} />);
      vi.advanceTimersByTime(500);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('intention change', () => {
    it('shows bubble when idle→edit transition happens', () => {
      const { rerender } = render(<IntentionBubble intention="idle" />);
      expect(screen.queryByTestId('intention-bubble')).toBeNull();

      rerender(<IntentionBubble intention="edit" showDelay={500} />);
      vi.advanceTimersByTime(500);
      expect(screen.getByTestId('intention-bubble')).toHaveTextContent('正在编辑');
    });
  });

  describe('auto-hide after hideDelay', () => {
    it('hides bubble after hideDelay expires while still non-idle', () => {
      const { container } = render(
        <IntentionBubble intention="edit" showDelay={100} hideDelay={500} />
      );
      // Show the bubble
      vi.advanceTimersByTime(100);
      expect(screen.getByTestId('intention-bubble')).toBeInTheDocument();

      // Advance past hideDelay (100 + 500 = 600 total)
      vi.advanceTimersByTime(500);
      // Bubble should have hidden class (opacity: 0) — DOM element still exists but invisible
      const bubble = container.querySelector('[data-testid="intention-bubble"]');
      // CSS Modules class: _hidden_<hash>
      expect(bubble?.className).toMatch(/hidden/);
    });
  });
});