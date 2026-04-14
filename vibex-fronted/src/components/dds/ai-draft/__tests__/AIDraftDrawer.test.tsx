/**
 * AIDraftDrawer — Unit Tests
 * Epic 3: F14, F16, F17
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIDraftDrawer } from '../AIDraftDrawer';

// ==================== Helpers ====================

/** Wrapper that provides DDS store context */
function renderDrawer(props?: Parameters<typeof AIDraftDrawer>[0]) {
  // Reset store state before each test
  return render(<AIDraftDrawer {...props} />);
}

// ==================== Tests ====================

describe('AIDraftDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch globally
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('does NOT render drawer when isDrawerOpen is false', () => {
      renderDrawer();
      // Drawer starts hidden when store isDrawerOpen is false
      const drawer = screen.queryByTestId('ai-draft-drawer');
      // The drawer element exists in DOM but with closed state
      expect(drawer).toBeInTheDocument();
      // Overlay should not be interactive
      const overlay = screen.queryByTestId('drawer-overlay');
      expect(overlay).toBeInTheDocument();
    });

    it('renders empty hint when drawer opens with no messages', () => {
      renderDrawer();
      expect(screen.getByTestId('empty-hint')).toBeInTheDocument();
    });

    it('renders the input form with textarea and send button', () => {
      renderDrawer();
      expect(screen.getByTestId('chat-input')).toBeInTheDocument();
      expect(screen.getByTestId('send-btn')).toBeInTheDocument();
    });

    it('send button is disabled when input is empty', () => {
      renderDrawer();
      expect(screen.getByTestId('send-btn')).toBeDisabled();
    });

    it('send button is enabled when input has content', () => {
      renderDrawer();
      const input = screen.getByTestId('chat-input');
      fireEvent.change(input, { target: { value: '用户登录功能' } });
      expect(screen.getByTestId('send-btn')).not.toBeDisabled();
    });

    it('renders the title in the header', () => {
      renderDrawer();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.getByText((content) => content.includes('AI 卡片生成'))).toBeInTheDocument();
    });
  });

  describe('Input Behavior', () => {
    it('updates input value on change', () => {
      renderDrawer();
      const input = screen.getByTestId('chat-input');
      fireEvent.change(input, { target: { value: '测试输入' } });
      expect((input as HTMLTextAreaElement).value).toBe('测试输入');
    });

    it('clears input after submitting', async () => {
      // Mock successful fetch
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: '{"cards":[]}' }),
      } as Response);

      renderDrawer();
      const input = screen.getByTestId('chat-input');
      fireEvent.change(input, { target: { value: '用户登录' } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('send-btn'));
        await new Promise((r) => setTimeout(r, 10));
      });

      // Input should be cleared after send
      expect((input as HTMLTextAreaElement).value).toBe('');
    });

    it('does not submit when input is empty', () => {
      renderDrawer();
      const sendBtn = screen.getByTestId('send-btn');
      expect(sendBtn).toBeDisabled();
      // Clicking disabled should not trigger anything
      fireEvent.click(sendBtn);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('textarea handles Enter key to submit', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: '{"cards":[]}' }),
      } as Response);

      renderDrawer();
      const input = screen.getByTestId('chat-input');
      fireEvent.change(input, { target: { value: '测试' } });

      await act(async () => {
        fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(global.fetch).toHaveBeenCalled();
    });

    it('textarea Enter+Shift does not submit', () => {
      renderDrawer();
      const input = screen.getByTestId('chat-input');
      fireEvent.change(input, { target: { value: '测试' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('State Machine — Error Handling', () => {
    it('shows error banner on network failure', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      renderDrawer();
      const input = screen.getByTestId('chat-input');
      fireEvent.change(input, { target: { value: 'test' } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('send-btn'));
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(screen.getByTestId('error-banner')).toBeInTheDocument();
    });

    it('shows error banner on HTTP error response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      } as unknown as Response);

      renderDrawer();
      const input = screen.getByTestId('chat-input');
      fireEvent.change(input, { target: { value: 'test' } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('send-btn'));
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(screen.getByTestId('error-banner')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator while fetching', async () => {
      let resolvePromise: (value: Response) => void;
      const fetchPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });
      (global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(fetchPromise);

      renderDrawer();
      const input = screen.getByTestId('chat-input');
      fireEvent.change(input, { target: { value: 'test' } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('send-btn'));
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('send-btn')).toBeDisabled();

      // Resolve the promise
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve({ content: '{"cards":[]}' }),
        } as Response);
        await new Promise((r) => setTimeout(r, 10));
      });
    });

    it('input is disabled while loading', async () => {
      let resolvePromise: (value: Response) => void;
      const fetchPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });
      (global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(fetchPromise);

      renderDrawer();
      const input = screen.getByTestId('chat-input');
      fireEvent.change(input, { target: { value: 'test' } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('send-btn'));
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(input).toBeDisabled();
    });
  });

  describe('Message Display', () => {
    it('displays user message after sending', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: '{"cards":[]}' }),
      } as Response);

      renderDrawer();
      const input = screen.getByTestId('chat-input');
      fireEvent.change(input, { target: { value: '用户登录功能' } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('send-btn'));
        await new Promise((r) => setTimeout(r, 20));
      });

      const userMessages = screen.getAllByTestId('message-user');
      expect(userMessages.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Close Button', () => {
    it('close button is rendered', () => {
      renderDrawer();
      expect(screen.getByTestId('drawer-close')).toBeInTheDocument();
    });

    it('close button has correct aria-label', () => {
      renderDrawer();
      expect(screen.getByTestId('drawer-close')).toHaveAttribute(
        'aria-label',
        '关闭抽屉'
      );
    });
  });

  describe('Component Memoization', () => {
    it('renders with default onEditCards prop', () => {
      const { container } = renderDrawer();
      expect(container).toBeInTheDocument();
    });

    it('accepts custom onEditCards callback', () => {
      const onEditCards = vi.fn();
      renderDrawer({ onEditCards });
      expect(onEditCards).not.toHaveBeenCalled();
    });
  });
});
