/**
 * ConflictConfirmToast.test.tsx — S83-E3: 协作者冲突确认反馈
 *
 * Tests for the ConflictConfirmToast component:
 * TC-E3-01: Toast is hidden when visible=false
 * TC-E3-02: Toast is shown when visible=true with keep-mine strategy
 * TC-E3-03: Toast is shown when visible=true with keep-theirs strategy
 * TC-E3-04: Toast is shown when visible=true with auto-merge strategy
 * TC-E3-05: Toast auto-closes after 3 seconds (default)
 * TC-E3-06: Toast shows correct strategy label
 * TC-E3-07: onDetails is called when toast is clicked
 * TC-E3-08: onDismiss is called after auto-close timeout
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ConflictConfirmToast } from '../ConflictConfirmToast';
import type { AutoResolveStrategy } from '../ConflictConfirmToast';

describe('ConflictConfirmToast — S83-E3', () => {
  const noop = () => {};

  describe('TC-E3-01: visibility conditions', () => {
    it('TC-E3-01: Toast is hidden when visible=false', () => {
      render(
        <ConflictConfirmToast
          visible={false}
          strategy="keep-mine"
          onDismiss={noop}
        />
      );
      expect(screen.queryByTestId('conflict-confirm-toast')).toBeNull();
    });

    it('TC-E3-01: Toast is hidden when strategy is null even if visible=true', () => {
      render(
        <ConflictConfirmToast
          visible={true}
          strategy={null}
          onDismiss={noop}
        />
      );
      expect(screen.queryByTestId('conflict-confirm-toast')).toBeNull();
    });
  });

  describe('TC-E3-02/03/04: strategy display', () => {
    it('TC-E3-02: Toast shows when visible=true with keep-mine strategy', () => {
      render(
        <ConflictConfirmToast
          visible={true}
          strategy="keep-mine"
          onDismiss={noop}
        />
      );
      expect(screen.getByTestId('conflict-confirm-toast')).toBeInTheDocument();
      expect(screen.getByTestId('toast-strategy-label')).toHaveTextContent('保留我的版本');
    });

    it('TC-E3-03: Toast shows when visible=true with keep-theirs strategy', () => {
      render(
        <ConflictConfirmToast
          visible={true}
          strategy="keep-theirs"
          onDismiss={noop}
        />
      );
      expect(screen.getByTestId('conflict-confirm-toast')).toBeInTheDocument();
      expect(screen.getByTestId('toast-strategy-label')).toHaveTextContent('保留对方版本');
    });

    it('TC-E3-04: Toast shows when visible=true with auto-merge strategy', () => {
      render(
        <ConflictConfirmToast
          visible={true}
          strategy="auto-merge"
          onDismiss={noop}
        />
      );
      expect(screen.getByTestId('conflict-confirm-toast')).toBeInTheDocument();
      expect(screen.getByTestId('toast-strategy-label')).toHaveTextContent('自动合并');
    });
  });

  describe('TC-E3-05: auto-close behavior', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('TC-E3-05: Toast auto-closes after 3000ms (default)', () => {
      const onDismiss = vi.fn();
      render(
        <ConflictConfirmToast
          visible={true}
          strategy="auto-merge"
          onDismiss={onDismiss}
        />
      );

      expect(screen.getByTestId('conflict-confirm-toast')).toBeInTheDocument();
      expect(onDismiss).not.toHaveBeenCalled();

      // Advance 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('TC-E3-05: Toast respects custom autoCloseMs', () => {
      const onDismiss = vi.fn();
      render(
        <ConflictConfirmToast
          visible={true}
          strategy="keep-mine"
          onDismiss={onDismiss}
          autoCloseMs={1000}
        />
      );

      act(() => { vi.advanceTimersByTime(999); });
      expect(onDismiss).not.toHaveBeenCalled();

      act(() => { vi.advanceTimersByTime(1); });
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('TC-E3-05: Auto-close timer is cleared when visible becomes false', () => {
      const onDismiss = vi.fn();
      const { rerender } = render(
        <ConflictConfirmToast
          visible={true}
          strategy="keep-mine"
          onDismiss={onDismiss}
        />
      );

      act(() => { vi.advanceTimersByTime(1500); });

      // Hide toast before auto-close fires
      rerender(
        <ConflictConfirmToast
          visible={false}
          strategy={null}
          onDismiss={onDismiss}
        />
      );

      // Advance remaining time
      act(() => { vi.advanceTimersByTime(1500); });

      // onDismiss should NOT be called since visible was already false
      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  describe('TC-E3-06/07: interaction', () => {
    it('TC-E3-06: Toast displays the correct strategy label for each strategy', () => {
      const strategies: Array<{ strategy: AutoResolveStrategy; expectedLabel: string }> = [
        { strategy: 'auto-merge', expectedLabel: '自动合并' },
        { strategy: 'keep-mine', expectedLabel: '保留我的版本' },
        { strategy: 'keep-theirs', expectedLabel: '保留对方版本' },
      ];

      for (const { strategy, expectedLabel } of strategies) {
        const { unmount } = render(
          <ConflictConfirmToast
            visible={true}
            strategy={strategy}
            onDismiss={noop}
          />
        );
        expect(screen.getByTestId('toast-strategy-label')).toHaveTextContent(expectedLabel);
        unmount();
      }
    });

    it('TC-E3-07: onDetails is called when toast is clicked', () => {
      const onDetails = vi.fn();
      render(
        <ConflictConfirmToast
          visible={true}
          strategy="auto-merge"
          onDetails={onDetails}
          onDismiss={noop}
        />
      );

      fireEvent.click(screen.getByTestId('conflict-confirm-toast'));
      expect(onDetails).toHaveBeenCalledTimes(1);
    });
  });

  describe('TC-E3-08: dismiss callback', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('TC-E3-08: onDismiss is called after auto-close timeout', () => {
      const onDismiss = vi.fn();
      render(
        <ConflictConfirmToast
          visible={true}
          strategy="keep-theirs"
          onDismiss={onDismiss}
          autoCloseMs={3000}
        />
      );

      act(() => { vi.advanceTimersByTime(3000); });
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });
});
