/**
 * DDSCanvasPage Integration Tests
 * Epic 5: F24
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DDSCanvasPage } from '../DDSCanvasPage';

// ==================== Isolated module mock (hoisted by vi.mock) ====================
// Use vi.hoisted so the mock functions are available when vi.mock runs

const { mockGetChapters, mockGetCards } = vi.hoisted(() => ({
  mockGetChapters: vi.fn(),
  mockGetCards: vi.fn(),
}));

vi.mock('@/hooks/dds/useDDSAPI', () => ({
  createDDSAPI: vi.fn(() => ({
    getChapters: mockGetChapters,
    getCards: mockGetCards,
  })),
}));

vi.mock('@/components/dds/toolbar', () => ({
  DDSToolbar: vi.fn(({ onAIGenerate }: { onAIGenerate?: () => void }) => (
    <header data-testid="dds-toolbar" onClick={onAIGenerate}>
      DDS Toolbar
    </header>
  )),
}));

vi.mock('@/components/dds/canvas', () => ({
  DDSScrollContainer: vi.fn(({
    className,
    renderChapterContent,
  }: {
    className?: string;
    renderChapterContent?: (chapter: string, data: object) => React.ReactNode;
  }) => (
    <div data-testid="dds-scroll-container" className={className}>
      {renderChapterContent
        ? renderChapterContent('requirement', {
            type: 'requirement',
            cards: [],
            edges: [],
            loading: false,
            error: null,
          })
        : null}
    </div>
  )),
}));

vi.mock('@/components/dds/ai-draft', () => ({
  AIDraftDrawer: vi.fn(() => <aside data-testid="ai-draft-drawer">AIDraftDrawer</aside>),
}));

vi.mock('@/components/dds/DDSFlow', () => ({
  DDSFlow: vi.fn(() => <div data-testid="dds-flow">DDSFlow</div>),
}));

// ==================== Tests ====================

describe('DDSCanvasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetChapters.mockResolvedValue({ success: true, data: [] });
    mockGetCards.mockResolvedValue({ success: true, data: [] });
  });

  // ---- Test 1: projectId → renders key elements ----

  it('renders toolbar, scroll container, and drawer when projectId is provided', async () => {
    render(<DDSCanvasPage projectId="proj-123" />);

    expect(screen.getByTestId('dds-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('dds-scroll-container')).toBeInTheDocument();
    expect(screen.getByTestId('ai-draft-drawer')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId('dds-loading-bar')).not.toBeInTheDocument();
    });
  });

  it('renders with data-testid="dds-canvas-page"', async () => {
    render(<DDSCanvasPage projectId="proj-123" />);
    await waitFor(() => {
      expect(screen.getByTestId('dds-canvas-page')).toBeInTheDocument();
    });
  });

  // ---- Test 2: Loading state ----

  it('shows loading bar during data fetch', () => {
    render(<DDSCanvasPage projectId="proj-123" />);
    expect(screen.getByTestId('dds-loading-bar')).toBeInTheDocument();
  });

  it('hides loading bar after data loads successfully', async () => {
    render(<DDSCanvasPage projectId="proj-123" />);
    await waitFor(() => {
      expect(screen.queryByTestId('dds-loading-bar')).not.toBeInTheDocument();
    });
  });

  // ---- Test 3: Error state ----

  it('shows error state when projectId is empty', () => {
    render(<DDSCanvasPage projectId="" />);
    expect(screen.getByTestId('dds-error-state')).toBeInTheDocument();
    expect(screen.getByTestId('dds-error-state')).toHaveTextContent('未提供项目 ID');
  });

  it('shows error state when API call fails', async () => {
    mockGetChapters.mockResolvedValue({
      success: false,
      error: { code: 'NOT_FOUND', message: '项目不存在' },
    });

    render(<DDSCanvasPage projectId="proj-404" />);

    await waitFor(() => {
      expect(screen.getByTestId('dds-error-state')).toBeInTheDocument();
    });

    expect(screen.getByTestId('dds-error-state')).toHaveTextContent('项目不存在');
  });

  it('shows retry button in error state and retries successfully', async () => {
    mockGetChapters.mockRejectedValue(new Error('Network error'));

    render(<DDSCanvasPage projectId="proj-err" />);

    await waitFor(() => {
      expect(screen.getByTestId('dds-error-state')).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: '重试' });
    expect(retryButton).toBeInTheDocument();

    mockGetChapters.mockResolvedValue({ success: true, data: [] });
    await userEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.queryByTestId('dds-error-state')).not.toBeInTheDocument();
    });
  });

  // ---- Test 4: No console.error ----

  it('does not produce console.error on successful load', async () => {
    const warnSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<DDSCanvasPage projectId="proj-123" />);
    await waitFor(() => {
      expect(screen.queryByTestId('dds-loading-bar')).not.toBeInTheDocument();
    });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('does not produce console.error on error state', async () => {
    const warnSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetChapters.mockRejectedValue(new Error('fail'));
    render(<DDSCanvasPage projectId="proj-err" />);
    await waitFor(() => {
      expect(screen.getByTestId('dds-error-state')).toBeInTheDocument();
    });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  // ---- Test 5: Cleanup on unmount ----

  it('aborts pending request on unmount', () => {
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort');
    const { unmount } = render(<DDSCanvasPage projectId="proj-123" />);
    unmount();
    expect(abortSpy).toHaveBeenCalled();
    abortSpy.mockRestore();
  });

  // ---- Test 6: Calls getChapters with projectId ----

  it('calls getChapters with the provided projectId', async () => {
    render(<DDSCanvasPage projectId="proj-abc" />);
    await waitFor(() => {
      expect(screen.queryByTestId('dds-loading-bar')).not.toBeInTheDocument();
    });
    expect(mockGetChapters).toHaveBeenCalledWith('proj-abc');
  });

  // ---- Test 7: Calls onAIGenerate when toolbar AI button is clicked ----

  it('calls onAIGenerate when toolbar AI button is clicked', async () => {
    const onAIGenerate = vi.fn();
    render(<DDSCanvasPage projectId="proj-123" onAIGenerate={onAIGenerate} />);
    await waitFor(() => {
      expect(screen.queryByTestId('dds-loading-bar')).not.toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('dds-toolbar'));
    expect(onAIGenerate).toHaveBeenCalledTimes(1);
  });
});
