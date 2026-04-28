import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ConflictBubble } from '../ConflictBubble';

describe('ConflictBubble', () => {
  describe('DISCONNECTED state', () => {
    it('shows "Offline — changes queued" message', () => {
      render(<ConflictBubble state="DISCONNECTED" />);
      expect(screen.getByTestId('bubble-message')).toHaveTextContent('Offline — changes queued');
    });

    it('has data-state=DISCONNECTED', () => {
      render(<ConflictBubble state="DISCONNECTED" />);
      expect(screen.getByTestId('conflict-bubble')).toHaveAttribute('data-state', 'DISCONNECTED');
    });
  });

  describe('RECONNECTING state', () => {
    it('shows "Reconnecting..." message', () => {
      render(<ConflictBubble state="RECONNECTING" />);
      expect(screen.getByTestId('bubble-message')).toHaveTextContent('Reconnecting...');
    });

    it('has data-state=RECONNECTING', () => {
      render(<ConflictBubble state="RECONNECTING" />);
      expect(screen.getByTestId('conflict-bubble')).toHaveAttribute('data-state', 'RECONNECTING');
    });
  });

  describe('CONNECTED state', () => {
    it('shows "Synced" message and auto-dismisses after 2s', async () => {
      vi.useFakeTimers();
      render(<ConflictBubble state="CONNECTED" />);
      expect(screen.getByTestId('bubble-message')).toHaveTextContent('Synced');
      await vi.advanceTimersByTime(2500);
      vi.useRealTimers();
    });
  });

  describe('dismiss behavior', () => {
    it('calls onDismiss when dismiss button is clicked', () => {
      const onDismiss = vi.fn();
      render(<ConflictBubble state="DISCONNECTED" onDismiss={onDismiss} />);
      fireEvent.click(screen.getByTestId('bubble-dismiss'));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });
});