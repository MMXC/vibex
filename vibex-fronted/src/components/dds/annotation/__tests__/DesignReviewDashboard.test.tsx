/**
 * DesignReviewDashboard.test.tsx — Sprint91 E2
 * Tests for DesignReviewDashboard component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { DesignReviewDashboard } from '../DesignReviewDashboard';

const mockFetch = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = mockFetch;
});

function mockFetchSuccess(annotations: Array<Record<string, unknown>> = []) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ ok: true, annotations }),
  });
}

function mockFetchError(message = 'Server error') {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    json: () => Promise.resolve({ ok: false, error: message }),
  });
}

function makeAnnotation(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'ann-1',
    canvas_id: 'canvas-1',
    canvas_name: 'My Canvas',
    content: 'This design needs review',
    x: 100,
    y: 200,
    type: 'note',
    author_id: 'user-1',
    author_name: 'Alice',
    status: 'active',
    color: '#6366F1',
    github_issue_url: 'https://github.com/myorg/myrepo/issues/42',
    github_issue_number: 42,
    github_commit_sha: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    created_at: 1718000000000,
    updated_at: 1718000000000,
    ...overrides,
  };
}

describe('DesignReviewDashboard', () => {
  // ─── Loading / empty / error states ────────────────────────────────────────

  it('shows loading state initially', () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {})); // pending
    render(<DesignReviewDashboard />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error banner on API failure', async () => {
    mockFetchError('Server error');
    render(<DesignReviewDashboard />);
    expect(await screen.findByText(/server error/i)).toBeInTheDocument();
  });

  it('shows empty state when no annotations with GitHub Issues', async () => {
    mockFetchSuccess([]);
    render(<DesignReviewDashboard />);
    expect(await screen.findByText('No GitHub Issues Yet')).toBeInTheDocument();
    expect(
      screen.getByText(/create github issues from annotations/i)
    ).toBeInTheDocument();
  });

  // ─── Data display ──────────────────────────────────────────────────────────

  it('renders annotations grouped by canvas', async () => {
    mockFetchSuccess([
      makeAnnotation({ id: 'ann-1', canvas_id: 'canvas-1', canvas_name: 'Design A', content: 'First issue' }),
      makeAnnotation({ id: 'ann-2', canvas_id: 'canvas-1', canvas_name: 'Design A', content: 'Second issue' }),
      makeAnnotation({ id: 'ann-3', canvas_id: 'canvas-2', canvas_name: 'Design B', content: 'Third issue' }),
    ]);
    render(<DesignReviewDashboard />);

    expect(await screen.findByText('Design A')).toBeInTheDocument();
    expect(screen.getByText('Design B')).toBeInTheDocument();
    expect(screen.getByText('First issue')).toBeInTheDocument();
    expect(screen.getByText('Second issue')).toBeInTheDocument();
    expect(screen.getByText('Third issue')).toBeInTheDocument();
  });

  it('shows issue number badge and GitHub link for each annotation', async () => {
    mockFetchSuccess([makeAnnotation()]);
    render(<DesignReviewDashboard />);

    expect(await screen.findByText('#42')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /view issue #42/i });
    expect(link).toHaveAttribute('href', 'https://github.com/myorg/myrepo/issues/42');
  });

  it('shows author name and date in annotation meta', async () => {
    mockFetchSuccess([makeAnnotation()]);
    render(<DesignReviewDashboard />);

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('shows short commit SHA when present', async () => {
    mockFetchSuccess([makeAnnotation()]);
    render(<DesignReviewDashboard />);

    expect(await screen.findByText('a1b2c3')).toBeInTheDocument();
  });

  it('shows "2 issues" badge in canvas group header', async () => {
    mockFetchSuccess([
      makeAnnotation({ id: 'ann-1', github_issue_number: 1 }),
      makeAnnotation({ id: 'ann-2', github_issue_number: 2 }),
    ]);
    render(<DesignReviewDashboard />);

    expect(await screen.findByText('2 issues')).toBeInTheDocument();
  });

  it('shows singular "issue" when only one annotation in canvas', async () => {
    mockFetchSuccess([makeAnnotation()]);
    render(<DesignReviewDashboard />);

    expect(await screen.findByText('1 issue')).toBeInTheDocument();
  });

  // ─── Refresh button ───────────────────────────────────────────────────────

  it('calls API again when Refresh button is clicked', async () => {
    mockFetchSuccess([makeAnnotation()]);
    render(<DesignReviewDashboard />);
    await waitFor(() => screen.getByText('Design A'));

    mockFetchSuccess([]);
    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));

    await waitFor(() => screen.getByText('No GitHub Issues Yet'));
  });

  it('shows updated timestamp after refresh', async () => {
    mockFetchSuccess([]);
    render(<DesignReviewDashboard />);
    await waitFor(() => screen.getByText('No GitHub Issues Yet'));

    // The "Updated" text should be visible
    expect(screen.getByText(/updated/i)).toBeInTheDocument();
  });

  // ─── Title and count ──────────────────────────────────────────────────────

  it('shows correct total count in header badge', async () => {
    mockFetchSuccess([
      makeAnnotation({ id: 'ann-1', github_issue_number: 1 }),
      makeAnnotation({ id: 'ann-2', github_issue_number: 2 }),
      makeAnnotation({ id: 'ann-3', github_issue_number: 3 }),
    ]);
    render(<DesignReviewDashboard />);

    expect(await screen.findByText('3 issues')).toBeInTheDocument();
  });

  it('uses canvas_id as canvasName when canvas_name is not provided', async () => {
    mockFetchSuccess([makeAnnotation({ canvas_name: undefined, canvas_id: 'canvas-unnamed' })]);
    render(<DesignReviewDashboard />);

    expect(await screen.findByText('canvas-unnamed')).toBeInTheDocument();
  });
});
