/**
 * DDSToolbar Unit Tests
 * Epic 2: F13
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DDSToolbar } from '../DDSToolbar';
import { useDDSCanvasStore } from '@/stores/dds';

// ==================== Store Setup ====================

function setupStore(overrides = {}) {
  useDDSCanvasStore.setState({
    activeChapter: 'requirement',
    chapters: {
      requirement: { type: 'requirement', cards: [], edges: [], loading: false, error: null },
      context: { type: 'context', cards: [], edges: [], loading: false, error: null },
      flow: { type: 'flow', cards: [], edges: [], loading: false, error: null },
    },
    isFullscreen: false,
    isGenerating: false,
    toggleFullscreen: vi.fn(),
    ...overrides,
  });
}

// ==================== DDSToolbar Tests (F13) ====================

describe('DDSToolbar', () => {
  beforeEach(() => {
    setupStore();
  });

  it('renders toolbar with header role', () => {
    const { container } = render(<DDSToolbar />);
    expect(container.querySelector('[role="banner"]')).toBeInTheDocument();
  });

  it('renders with dark theme attribute', () => {
    const { container } = render(<DDSToolbar />);
    expect(container.firstChild).toHaveAttribute('data-theme', 'dark');
  });

  it('displays current chapter name', () => {
    render(<DDSToolbar />);
    expect(screen.getByText('需求')).toBeInTheDocument();
  });

  it('displays context chapter name when active', () => {
    useDDSCanvasStore.getState().setActiveChapter('context');
    render(<DDSToolbar />);
    expect(screen.getByText('上下文')).toBeInTheDocument();
  });

  it('displays flow chapter name when active', () => {
    useDDSCanvasStore.getState().setActiveChapter('flow');
    render(<DDSToolbar />);
    expect(screen.getByText('流程')).toBeInTheDocument();
  });

  it('renders AI Generate button with correct label', () => {
    render(<DDSToolbar />);
    expect(screen.getByRole('button', { name: /AI 生成/i })).toBeInTheDocument();
  });

  it('renders AI Generate button in loading state', () => {
    useDDSCanvasStore.setState({ isGenerating: true });
    render(<DDSToolbar />);
    expect(screen.getByRole('button', { name: /生成中/i })).toBeInTheDocument();
  });

  it('AI button is disabled when isGenerating=true', () => {
    useDDSCanvasStore.setState({ isGenerating: true });
    render(<DDSToolbar />);
    expect(screen.getByRole('button', { name: /生成中/i })).toBeDisabled();
  });

  it('AI button calls onAIGenerate when clicked', () => {
    const onAIGenerate = vi.fn();
    render(<DDSToolbar onAIGenerate={onAIGenerate} />);
    fireEvent.click(screen.getByRole('button', { name: /AI 生成/i }));
    expect(onAIGenerate).toHaveBeenCalled();
  });

  it('renders fullscreen toggle button', () => {
    render(<DDSToolbar />);
    const fsBtn = screen.getByRole('button', { name: /全屏/i });
    expect(fsBtn).toBeInTheDocument();
  });

  it('fullscreen button has correct aria-pressed state', () => {
    render(<DDSToolbar />);
    expect(screen.getByRole('button', { name: /全屏/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders chapter tab indicator — default requirement active', () => {
    render(<DDSToolbar />);
    const tabs = screen.getAllByRole('button', { name: /切换到.*章节/ });
    expect(tabs).toHaveLength(3);
    // Default active chapter is 'requirement' → its tab has aria-pressed=true
    const reqTab = tabs.find((btn) => btn.textContent === '需求');
    expect(reqTab).toHaveAttribute('aria-pressed', 'true');
    const ctxTab = tabs.find((btn) => btn.textContent === '上下文');
    expect(ctxTab).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders chapter tab indicator — switching chapter updates aria-pressed', () => {
    render(<DDSToolbar />);
    // Click '上下文' tab to switch active chapter
    const ctxTab = screen.getByRole('button', { name: '切换到上下文章节' });
    fireEvent.click(ctxTab);
    // After clicking, context tab should be active (aria-pressed=true)
    expect(ctxTab).toHaveAttribute('aria-pressed', 'true');
    // Requirement tab should no longer be active
    const reqTab = screen.getByRole('button', { name: '切换到需求章节' });
    expect(reqTab).toHaveAttribute('aria-pressed', 'false');
    // Store should reflect the change
    expect(useDDSCanvasStore.getState().activeChapter).toBe('context');
  });

  it('overrides isGenerating from prop', () => {
    render(<DDSToolbar isGenerating={true} />);
    expect(screen.getByRole('button', { name: /生成中/i })).toBeInTheDocument();
  });

  it('applies iconButtonActive class when isFullscreen=true', () => {
    useDDSCanvasStore.setState({ isFullscreen: true });
    render(<DDSToolbar />);
    // aria-label changes to '退出全屏' when fullscreen
    const fsBtn = screen.getByRole('button', { name: '退出全屏' });
    expect(fsBtn).toHaveAttribute('aria-pressed', 'true');
  });
});
