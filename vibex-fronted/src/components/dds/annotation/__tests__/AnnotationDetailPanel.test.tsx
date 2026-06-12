/**
 * AnnotationDetailPanel.test.tsx — Sprint91 E2
 * Tests for AnnotationDetailPanel component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AnnotationDetailPanel } from '../AnnotationDetailPanel';
import type { Annotation, AnnotationUpdateInput } from '../annotationStore';

// Mock the annotation store — vi.hoisted creates mockStore BEFORE vi.mock factory runs
const mockStore = vi.hoisted(() => ({
  getAnnotation: vi.fn(),
  updateAnnotation: vi.fn(),
  createAnnotation: vi.fn(),
  deleteAnnotation: vi.fn(),
  getAnnotationsForCanvas: vi.fn(),
  getAnnotationsForCanvasGroup: vi.fn(),
  getAnnotationById: vi.fn(),
  setAnnotationGithubIssue: vi.fn(),
  setAnnotationGithubCommit: vi.fn(),
  _testState: {} as any,
  subscribe: vi.fn(() => () => {}),
  getState: vi.fn(),
}));
vi.mock('../annotationStore', () => ({
  annotationStore: mockStore,
  useAnnotationStore: () => mockStore,
  getAnnotationStore: () => mockStore,
}));

const mockOnUpdate = vi.fn();

function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: 'ann-1',
    canvasId: 'canvas-1',
    content: 'This button should be more prominent',
    x: 100,
    y: 200,
    type: 'note',
    authorId: 'user-1',
    authorName: 'Test User',
    color: '#6366F1',
    status: 'active',
    createdAt: 1718000000000,
    updatedAt: 1718000000000,
    ...overrides,
  };
}

describe('AnnotationDetailPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset stubGlobal fetch between tests (vi.stubGlobal persists across tests)
    vi.stubGlobal('fetch', vi.fn());
  });

  // ─── Basic rendering ──────────────────────────────────────────────────────

  it('renders annotation content, author, and date', () => {
    const ann = makeAnnotation();
    render(<AnnotationDetailPanel annotation={ann} onClose={vi.fn()} onUpdate={mockOnUpdate} />);

    expect(screen.getByText('This button should be more prominent')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('renders type, position, and status metadata', () => {
    const ann = makeAnnotation();
    render(<AnnotationDetailPanel annotation={ann} onClose={vi.fn()} onUpdate={mockOnUpdate} />);

    expect(screen.getByText('note')).toBeInTheDocument();
    expect(screen.getByText('(100, 200)')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    const ann = makeAnnotation();
    render(<AnnotationDetailPanel annotation={ann} onClose={onClose} onUpdate={mockOnUpdate} />);

    fireEvent.click(screen.getByRole('button', { name: 'Close panel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ─── GitHub Issue section — no issue linked ───────────────────────────────

  it('shows "Create GitHub Issue" button when no issue is linked', () => {
    const ann = makeAnnotation({ githubIssueUrl: undefined, githubIssueNumber: undefined });
    render(<AnnotationDetailPanel annotation={ann} onClose={vi.fn()} onUpdate={mockOnUpdate} />);

    expect(screen.getByRole('button', { name: 'Create GitHub Issue' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., myorg')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., myrepo')).toBeInTheDocument();
  });

  it('shows error when owner/repo fields are empty on submit', async () => {
    const ann = makeAnnotation();
    render(<AnnotationDetailPanel annotation={ann} onClose={vi.fn()} onUpdate={mockOnUpdate} />);

    fireEvent.click(screen.getByRole('button', { name: 'Create GitHub Issue' }));
    // Should show error
    expect(await screen.findByText(/owner and repo are required/i)).toBeInTheDocument();
  });

  it('calls API and shows error on network failure', async () => {
    const ann = makeAnnotation();
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: () => Promise.resolve({ error: 'GITHUB_TOKEN not set' }),
    } as unknown as Response);

    render(<AnnotationDetailPanel annotation={ann} onClose={vi.fn()} onUpdate={mockOnUpdate} />);

    fireEvent.change(screen.getByPlaceholderText('e.g., myorg'), { target: { value: 'myorg' } });
    fireEvent.change(screen.getByPlaceholderText('e.g., myrepo'), { target: { value: 'myrepo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create GitHub Issue' }));

    expect(await screen.findByText(/GITHUB_TOKEN not set/i)).toBeInTheDocument();
  });

  // ─── GitHub Issue section — issue linked ─────────────────────────────────

  it('shows GitHub Issue link when issue is already linked', () => {
    const ann = makeAnnotation({
      githubIssueUrl: 'https://github.com/myorg/myrepo/issues/42',
      githubIssueNumber: 42,
    });
    render(<AnnotationDetailPanel annotation={ann} onClose={vi.fn()} onUpdate={mockOnUpdate} />);

    // Component renders: Issue #{githubIssueNumber} e.g. "Issue #42"
    expect(screen.getByText('Issue #42')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Issue #42/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create GitHub Issue' })).not.toBeInTheDocument();
  });

  // ─── Commit SHA section — no commit linked ───────────────────────────────

  it('shows "Link Commit" input when no commit is linked', () => {
    const ann = makeAnnotation({ githubCommitSha: undefined });
    render(<AnnotationDetailPanel annotation={ann} onClose={vi.fn()} onUpdate={mockOnUpdate} />);

    // Form should be visible (no GitHub commit linked yet)
    expect(screen.getByText('Linked Commit')).toBeInTheDocument();
    expect(screen.getByText('Commit SHA')).toBeInTheDocument();
    // Button should be present (check by role)
    const buttons = screen.getAllByRole('button');
    const linkBtn = buttons.find(b => b.textContent?.includes('Link'));
    expect(linkBtn).toBeDefined();
  });

  it('shows error when commit SHA field is empty on submit', async () => {
    const ann = makeAnnotation();
    render(<AnnotationDetailPanel annotation={ann} onClose={vi.fn()} onUpdate={mockOnUpdate} />);

    fireEvent.click(screen.getByRole('button', { name: 'Link Commit' }));
    expect(await screen.findByText(/commit SHA is required/i)).toBeInTheDocument();
  });

  it('shows error on commit link API failure', async () => {
    const ann = makeAnnotation();
    // Use vi.stubGlobal for jsdom 22 compatibility (fetch may not be on global)
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid commit SHA format' }),
      } as unknown as Response)
    ));

    render(<AnnotationDetailPanel annotation={ann} onClose={vi.fn()} onUpdate={mockOnUpdate} />);

    // Use label text, not placeholder (placeholder is the long SHA example)
    fireEvent.change(screen.getByLabelText('Commit SHA'), {
      target: { value: 'abc' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Link Commit' }));

    expect(await screen.findByText(/invalid commit sha format/i)).toBeInTheDocument();
  });

  // ─── Commit SHA section — commit linked ──────────────────────────────────

  it('shows commit SHA (short form) when linked', () => {
    const ann = makeAnnotation({
      githubCommitSha: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    });
    render(<AnnotationDetailPanel annotation={ann} onClose={vi.fn()} onUpdate={mockOnUpdate} />);

    // Short SHA is rendered inside <code> tag — component uses substring(0, 7)
    const shaCode = screen.getByText('a1b2c3d');
    expect(shaCode).toBeInTheDocument();
    expect(shaCode.tagName).toBe('CODE');
    expect(screen.queryByRole('button', { name: 'Link Commit' })).not.toBeInTheDocument();
  });

  // ─── Successful creation ──────────────────────────────────────────────────

  it('calls onUpdate and updates store on successful issue creation', async () => {
    const ann = makeAnnotation();
    // Use vi.stubGlobal for jsdom 22 compatibility
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, issueUrl: 'https://github.com/myorg/myrepo/issues/5', issueNumber: 5 }),
      } as unknown as Response)
    ));

    const { rerender } = render(
      <AnnotationDetailPanel annotation={ann} onClose={vi.fn()} onUpdate={mockOnUpdate} />
    );

    fireEvent.change(screen.getByPlaceholderText('e.g., myorg'), { target: { value: 'myorg' } });
    fireEvent.change(screen.getByPlaceholderText('e.g., myrepo'), { target: { value: 'myrepo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create GitHub Issue' }));

    await vi.waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('ann-1', {
        githubIssueUrl: 'https://github.com/myorg/myrepo/issues/5',
        githubIssueNumber: 5,
      });
    }, { timeout: 3000 });

    // After update, panel should re-render with linked issue
    rerender(
      <AnnotationDetailPanel
        annotation={{ ...ann, githubIssueUrl: 'https://github.com/myorg/myrepo/issues/5', githubIssueNumber: 5 }}
        onClose={vi.fn()}
        onUpdate={mockOnUpdate}
      />
    );
    expect(screen.getByText('Issue #5')).toBeInTheDocument();
  });
});
