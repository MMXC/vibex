/**
 * MergeHistoryPanel.test.tsx — S82-E1
 * Tests for MergeHistoryPanel — renders branch merge history timeline.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MergeHistoryPanel } from '../MergeHistoryPanel';
import type { MergeHistoryEntry } from '@/stores/dds/canvasHistoryStore';

const now = Date.now();
const oneDay = 24 * 60 * 60 * 1000;

const mockMergeHistory: MergeHistoryEntry[] = [
  {
    id: 'merge-1',
    canvasId: 'canvas-1',
    sourceBranch: 'feature-a',
    targetBranch: 'main',
    timestamp: now - oneDay,
    mergedBy: 'alice',
    mergedNodeIds: ['node-1', 'node-2', 'node-3'],
    conflictCount: 1,
    authorIds: ['alice', 'bob'],
  },
  {
    id: 'merge-2',
    canvasId: 'canvas-1',
    sourceBranch: 'feature-b',
    targetBranch: 'feature-a',
    timestamp: now - 2 * oneDay,
    mergedBy: 'bob',
    conflictCount: 0,
    authorIds: ['bob'],
  },
];

// Mock canvasHistoryStore
const mockGetMergeHistory = vi.fn();
const mockMergeHistory$ = mockMergeHistory;

const mockStoreState = {
  mergeHistory: mockMergeHistory$,
  getMergeHistory: mockGetMergeHistory,
};

vi.mock('@/stores/dds/canvasHistoryStore', () => ({
  useCanvasHistoryStore: (selector?: (s: typeof mockStoreState) => unknown) => {
    if (selector) return selector(mockStoreState as any);
    return mockStoreState;
  },
}));

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
const mockAnchor = { click: vi.fn(), href: '', download: '' };
beforeEach(() => {
  URL.createObjectURL = mockCreateObjectURL;
  URL.revokeObjectURL = mockRevokeObjectURL;
  // Spy on createElement — only mock <a> tags, keep everything else real
  const origCreateElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') return mockAnchor as unknown as HTMLAnchorElement;
    return origCreateElement(tag);
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('MergeHistoryPanel', () => {
  const renderPanel = (overrideHistory?: MergeHistoryEntry[]) => {
    const history = overrideHistory ?? mockMergeHistory;
    (mockStoreState as any).mergeHistory = history;
    return render(
      <MergeHistoryPanel open={true} canvasId="canvas-1" onClose={vi.fn()} />
    );
  };

  it('renders empty state when no merge history', () => {
    renderPanel([]);
    expect(screen.getByText('暂无合并记录')).toBeInTheDocument();
    expect(screen.getByText(/合并分支后会自动显示/)).toBeInTheDocument();
  });

  it('renders panel header with title', () => {
    renderPanel();
    expect(screen.getByRole('heading', { name: '合并历史' })).toBeInTheDocument();
  });

  it('renders merge entries with branch names', () => {
    renderPanel();
    expect(screen.getAllByText('feature-a').length).toBeGreaterThan(0);
    expect(screen.getAllByText('feature-b').length).toBeGreaterThan(0);
    expect(screen.getAllByText('→').length).toBeGreaterThan(0);
  });

  it('renders user name when mergedBy is present', () => {
    renderPanel();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
  });

  it('renders conflict badge when conflictCount > 0', () => {
    renderPanel();
    // First entry has conflictCount: 1
    expect(screen.getByText(/⚠️ 1/)).toBeInTheDocument();
    // Second entry has conflictCount: 0 — no badge expected
  });

  it('does not render conflict badge when conflictCount is 0', () => {
    const entriesNoConflict: MergeHistoryEntry[] = [
      {
        id: 'merge-3',
        canvasId: 'canvas-1',
        sourceBranch: 'x',
        targetBranch: 'main',
        timestamp: now,
        mergedBy: 'alice',
        conflictCount: 0,
      },
    ];
    renderPanel(entriesNoConflict);
    expect(screen.queryByText(/⚠️/)).not.toBeInTheDocument();
  });

  it('expands entry on click to show detail', () => {
    renderPanel();
    const firstEntry = screen.getAllByText('feature-a')[0].closest('[class*="merge-history-item"]')!;
    const dot = firstEntry.querySelector('[aria-expanded]') as HTMLElement;
    expect(dot).not.toBeNull();
    fireEvent.click(dot!);
    expect(screen.getByText(/节点统计/)).toBeInTheDocument();
  });

  it('collapses expanded entry on second click', () => {
    renderPanel();
    const firstEntry = screen.getAllByText('feature-a')[0].closest('[class*="merge-history-item"]')!;
    const dot = firstEntry.querySelector('[aria-expanded]') as HTMLElement;
    fireEvent.click(dot!);
    expect(screen.getByText(/节点统计/)).toBeInTheDocument();
    fireEvent.click(dot!);
    // Detail should be hidden
    expect(screen.queryByText(/3 个节点/)).not.toBeInTheDocument();
  });

  it('expands entry on Enter keypress (keyboard accessibility)', () => {
    renderPanel();
    const firstEntry = screen.getAllByText('feature-a')[0].closest('[class*="merge-history-item"]')!;
    const dot = firstEntry.querySelector('[aria-expanded]') as HTMLElement;
    fireEvent.keyDown(dot!, { key: 'Enter' });
    expect(screen.getByText(/节点统计/)).toBeInTheDocument();
  });

  it('renders close button and calls onClose', () => {
    const onClose = vi.fn();
    render(<MergeHistoryPanel open={true} canvasId="canvas-1" onClose={onClose} />);
    const closeBtn = screen.getByRole('button', { name: '关闭' });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders export button when history is non-empty', () => {
    renderPanel();
    const exportBtn = screen.getByRole('button', { name: '导出 Markdown' });
    expect(exportBtn).toBeInTheDocument();
  });

  it('does not render export button when history is empty', () => {
    renderPanel([]);
    expect(screen.queryByRole('button', { name: '导出 Markdown' })).not.toBeInTheDocument();
  });

  it('calls getMergeHistory on mount when open', () => {
    mockGetMergeHistory.mockClear();
    render(<MergeHistoryPanel open={true} canvasId="canvas-1" onClose={vi.fn()} />);
    expect(mockGetMergeHistory).toHaveBeenCalledWith('canvas-1');
  });

  it('renders contributor avatars from authorIds', () => {
    renderPanel();
    // Click to expand first entry — avatars are inside expanded detail
    const firstEntry = screen.getAllByText('feature-a')[0].closest('[class*="merge-history-item"]')!;
    const dot = firstEntry.querySelector('[aria-expanded]') as HTMLElement;
    fireEvent.click(dot!);
    // alice and bob are authorIds for the first entry
    const avatars = screen.getAllByRole('img');
    expect(avatars.length).toBeGreaterThanOrEqual(2);
  });

  it('returns null when open is false', () => {
    const { container } = render(
      <MergeHistoryPanel open={false} canvasId="canvas-1" onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });
});
