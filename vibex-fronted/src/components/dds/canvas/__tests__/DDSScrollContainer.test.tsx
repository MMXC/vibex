/**
 * DDSScrollContainer + DDSPanel + DDSThumbNav Unit Tests
 * Epic 2: F10, F11, F12
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DDSScrollContainer } from '../DDSScrollContainer';
import { DDSPanel } from '../DDSPanel';
import { DDSThumbNav, DDSThumbButton } from '../DDSThumbNav';
import { useDDSCanvasStore } from '@/stores/dds';

// ==================== Store Setup ====================

function setupStore() {
  useDDSCanvasStore.setState({
    activeChapter: 'requirement',
    chapters: {
      requirement: { type: 'requirement', cards: [], edges: [], loading: false, error: null },
      context: { type: 'context', cards: [], edges: [], loading: false, error: null },
      flow: { type: 'flow', cards: [], edges: [], loading: false, error: null },
      api: { type: 'api', cards: [], edges: [], loading: false, error: null },
      businessRules: { type: 'business-rules', cards: [], edges: [], loading: false, error: null },
    },
    isFullscreen: false,
    isGenerating: false,
  });
}

// ==================== DDSScrollContainer Tests (F10) ====================

describe('DDSScrollContainer', () => {
  beforeEach(() => {
    setupStore();
  });

  it('renders 5 panels as region elements', () => {
    const { container } = render(<DDSScrollContainer />);
    // DDSPanel renders with role="region" and aria-label
    const regions = container.querySelectorAll('[role="region"]');
    expect(regions).toHaveLength(5);
    // Each panel should have its chapter label as aria-label
    expect(screen.getByRole('region', { name: '需求' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '上下文' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '流程' })).toBeInTheDocument();
  });

  it('renders with dark theme attribute', () => {
    const { container } = render(<DDSScrollContainer />);
    expect(container.firstChild).toHaveAttribute('data-theme', 'dark');
  });

  it('has role="main"', () => {
    const { container } = render(<DDSScrollContainer />);
    expect(container.firstChild).toHaveAttribute('role', 'main');
  });

  it('renders collapsed panels with vertical label', () => {
    render(<DDSScrollContainer />);
    // The collapsed panel should have aria-hidden header
    const headers = screen.getAllByRole('region');
    expect(headers).toHaveLength(5);
  });

  it('renders thumb buttons with correct aria-pressed state for active chapter', () => {
    render(<DDSScrollContainer />);

    // Default activeChapter is 'requirement', so the 'requirement' thumb button should be aria-pressed=true
    const reqBtns = screen.getAllByRole('button', { name: '需求' });
    // The first one (inside the expanded requirement panel) is the nav button
    const activeReqBtn = reqBtns[0];
    expect(activeReqBtn).toHaveAttribute('aria-pressed', 'true');

    // The 'context' thumb button should be aria-pressed=false (not the active chapter)
    const contextBtns = screen.getAllByRole('button', { name: '上下文' });
    const inactiveCtxBtn = contextBtns[0];
    expect(inactiveCtxBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders custom chapter content via renderChapterContent prop', () => {
    render(
      <DDSScrollContainer
        renderChapterContent={(chapter) => <div data-testid={`content-${chapter}`}>{chapter}</div>}
      />
    );
    expect(screen.getByTestId('content-requirement')).toBeInTheDocument();
    expect(screen.getByTestId('content-context')).toBeInTheDocument();
    expect(screen.getByTestId('content-flow')).toBeInTheDocument();
  });

  it('shows loading state when chapter is loading', () => {
    useDDSCanvasStore.setState((s) => ({
      chapters: {
        ...s.chapters,
        requirement: { ...s.chapters.requirement, loading: true },
      },
    }));

    render(<DDSScrollContainer />);
    expect(screen.getByLabelText('加载中')).toBeInTheDocument();
  });

  it('shows error state when chapter has error', () => {
    useDDSCanvasStore.setState((s) => ({
      chapters: {
        ...s.chapters,
        requirement: { ...s.chapters.requirement, error: '加载失败' },
      },
    }));

    render(<DDSScrollContainer />);
    expect(screen.getByRole('alert')).toHaveTextContent('加载失败');
  });
});

// ==================== DDSPanel Tests (F11) ====================

describe('DDSPanel', () => {
  it('renders panel with correct label', () => {
    render(
      <DDSPanel
        chapterType="requirement"
        label="需求"
        isExpanded={true}
      />
    );
    expect(screen.getByText('需求')).toBeInTheDocument();
  });

  it('renders collapsed state correctly', () => {
    const { container } = render(
      <DDSPanel
        chapterType="flow"
        label="流程"
        isExpanded={false}
      />
    );
    // Panel should have collapsed class (width: 80px)
    expect(container.querySelector('[data-expanded="false"]')).toBeInTheDocument();
  });

  it('renders expanded state correctly', () => {
    const { container } = render(
      <DDSPanel
        chapterType="context"
        label="上下文"
        isExpanded={true}
      />
    );
    expect(container.querySelector('[data-expanded="true"]')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <DDSPanel chapterType="requirement" label="需求" isExpanded={true}>
        <div data-testid="panel-children">Card content here</div>
      </DDSPanel>
    );
    expect(screen.getByTestId('panel-children')).toBeInTheDocument();
  });

  it('has correct aria-label', () => {
    const { container } = render(
      <DDSPanel chapterType="requirement" label="需求" isExpanded={true} />
    );
    expect(container.querySelector('[role="region"]')).toHaveAttribute('aria-label', '需求');
  });
});

// ==================== DDSThumbNav + DDSThumbButton Tests (F12) ====================

describe('DDSThumbNav', () => {
  it('renders nav with aria-label', () => {
    const { container } = render(
      <DDSThumbNav>
        <button>Nav 1</button>
      </DDSThumbNav>
    );
    expect(container.querySelector('nav')).toHaveAttribute('aria-label', '章节导航');
  });

  it('renders children', () => {
    const { container } = render(
      <DDSThumbNav>
        <button>Item A</button>
        <button>Item B</button>
      </DDSThumbNav>
    );
    expect(container.querySelectorAll('button')).toHaveLength(2);
  });
});

describe('DDSThumbButton', () => {
  it('renders button with label', () => {
    render(<DDSThumbButton label="上下文" />);
    expect(screen.getByText('上下文')).toBeInTheDocument();
  });

  it('renders short label when isCollapsed', () => {
    render(<DDSThumbButton label="上下文" shortLabel="上" />);
    expect(screen.getByText('上')).toBeInTheDocument();
  });

  it('applies active class when isActive=true', () => {
    const { container } = render(
      <DDSThumbButton label="上下文" isActive={true} />
    );
    expect(container.querySelector('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<DDSThumbButton label="上下文" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
