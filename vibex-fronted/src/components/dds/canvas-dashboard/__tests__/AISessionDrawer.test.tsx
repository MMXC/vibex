/**
 * AISessionDrawer.test.tsx — vitest for S63-E4 AI streaming drawer
 * D4.6: AIDraftDrawer rendering + retry button
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';

// Mock globalThis.indexedDB before anything else (jsdom has no indexedDB)
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};
Object.defineProperty(globalThis, 'indexedDB', { value: mockIndexedDB });

// Fresh mock functions (stable references)
const mockRetryLastStream = vi.fn();
const mockCancelStream = vi.fn();
const mockClearStreamContent = vi.fn();

// Store proxy — function properties always return current mock references
const mockStore = {
  streamingContent: {} as Record<string, string>,
  isStreaming: {} as Record<string, boolean>,
  lastPrompt: {} as Record<string, string>,
  sessions: [] as Array<{ id: string; retryCount: number; isRetrying: boolean }>,
};

// Proxy that always returns current mock fn references for function properties
const storeProxy = new Proxy(mockStore, {
  get(target, prop) {
    if (prop === 'retryLastStream') return mockRetryLastStream;
    if (prop === 'cancelStream') return mockCancelStream;
    if (prop === 'clearStreamContent') return mockClearStreamContent;
    return target[prop as keyof typeof target];
  },
});

vi.mock('@/stores/dds/agentStore', () => ({
  useAgentStore: vi.fn((selector?: (s: typeof mockStore) => unknown) => {
    if (typeof selector === 'function') {
      return selector(storeProxy as any);
    }
    return storeProxy as any;
  }),
}));

import { AISessionDrawer } from '../AISessionDrawer';

describe('S63-E4 AISessionDrawer', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.streamingContent = {};
    mockStore.isStreaming = {};
    mockStore.lastPrompt = {};
    mockStore.sessions = [];
  });

  afterEach(() => {
    cleanup();
  });

  it('D4.6a: renders drawer when sessionId is provided', () => {
    const { container } = render(
      <AISessionDrawer sessionId="session-123" onClose={mockOnClose} />
    );
    expect(container.querySelector('[role="dialog"]')).toBeTruthy();
  });

  it('D4.6b: drawer has no open class when sessionId is null', () => {
    const { container } = render(
      <AISessionDrawer sessionId={null} onClose={mockOnClose} />
    );
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog?.className).not.toContain('open');
  });

  it('D4.6c: displays prompt text when lastPrompt is set', () => {
    mockStore.lastPrompt = { 'session-123': 'What is DDD?' };
    render(<AISessionDrawer sessionId="session-123" onClose={mockOnClose} />);
    expect(screen.getByText('What is DDD?')).toBeTruthy();
  });

  it('D4.6d: retry button is disabled when no lastPrompt', () => {
    mockStore.lastPrompt = {};
    render(<AISessionDrawer sessionId="session-123" onClose={mockOnClose} />);
    const retryBtn = screen.getByRole('button', { name: '重试' });
    expect(retryBtn).toBeDisabled();
  });

  it('D4.6e: retry button is enabled when lastPrompt exists and not streaming', () => {
    mockStore.lastPrompt = { 'session-123': 'My prompt' };
    mockStore.isStreaming = { 'session-123': false };
    render(<AISessionDrawer sessionId="session-123" onClose={mockOnClose} />);
    const retryBtn = screen.getByRole('button', { name: '重试' });
    expect(retryBtn).not.toBeDisabled();
  });

  it('D4.6f: retry button calls retryLastStream with sessionId', () => {
    mockStore.lastPrompt = { 'session-123': 'My prompt' };
    mockStore.isStreaming = { 'session-123': false };
    render(<AISessionDrawer sessionId="session-123" onClose={mockOnClose} />);
    const retryBtn = screen.getByRole('button', { name: '重试' });
    fireEvent.click(retryBtn);
    expect(mockRetryLastStream).toHaveBeenCalledTimes(1);
    expect(mockRetryLastStream).toHaveBeenCalledWith('session-123');
  });

  it('D4.6g: streaming indicator shows when isStreaming is true', () => {
    mockStore.isStreaming = { 'session-123': true };
    const { container } = render(
      <AISessionDrawer sessionId="session-123" onClose={mockOnClose} />
    );
    const dots = container.querySelectorAll('[class*="streamingDot"]');
    expect(dots.length).toBeGreaterThan(0);
  });

  it('D4.6h: cancel button appears when streaming', () => {
    mockStore.isStreaming = { 'session-123': true };
    render(<AISessionDrawer sessionId="session-123" onClose={mockOnClose} />);
    expect(screen.getByRole('button', { name: '停止生成' })).toBeTruthy();
  });

  it('D4.6i: cancel button calls cancelStream', () => {
    mockStore.isStreaming = { 'session-123': true };
    render(<AISessionDrawer sessionId="session-123" onClose={mockOnClose} />);
    const cancelBtn = screen.getByRole('button', { name: '停止生成' });
    fireEvent.click(cancelBtn);
    expect(mockCancelStream).toHaveBeenCalledTimes(1);
    expect(mockCancelStream).toHaveBeenCalledWith('session-123');
  });

  it('D4.6j: retry badge shows when retryCount > 0', () => {
    mockStore.sessions = [{ id: 'session-123', retryCount: 2, isRetrying: false }];
    const { container } = render(
      <AISessionDrawer sessionId="session-123" onClose={mockOnClose} />
    );
    expect(container.textContent).toContain('已重试 2 次');
  });

  it('D4.6k: close button calls onClose', () => {
    mockStore.isStreaming = { 'session-123': false };
    render(<AISessionDrawer sessionId="session-123" onClose={mockOnClose} />);
    const closeBtn = screen.getByRole('button', { name: '关闭' });
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('D4.6l: streaming content shows streaming text', () => {
    mockStore.streamingContent = { 'session-123': 'AI is thinking...' };
    render(<AISessionDrawer sessionId="session-123" onClose={mockOnClose} />);
    expect(screen.getByText('AI is thinking...')).toBeTruthy();
  });
});
