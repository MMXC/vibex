/**
 * PublicCanvasPage.test.tsx — S95-E2: Public Canvas Portal
 *
 * Vitest tests for /public/[slug]/page.tsx
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PublicCanvasPage from './page';

vi.mock('next/navigation', () => ({
  useParams: vi.fn(() => ({ slug: 'test-canvas-slug' })),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('PublicCanvasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const mockCanvasData = {
    canvas: {
      id: 'canvas-001',
      name: 'Test Canvas',
      nodes: [
        { id: 'n1', type: 'dds-node', label: 'Node 1' },
        { id: 'n2', type: 'dds-node', label: 'Node 2' },
      ],
      edges: [{ id: 'e1' }, { id: 'e2' }],
      owner: { userId: 'user-001', name: 'Alice', email: 'alice@example.com' },
      createdAt: '2026-06-01T10:00:00Z',
      updatedAt: '2026-06-02T12:00:00Z',
    },
    is_public: true,
  };

  it('renders loading state initially', () => {
    let resolveFetch: (value: Response) => void;
    mockFetch.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    render(<PublicCanvasPage params={Promise.resolve({ slug: 'test-slug' })} />);

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders canvas data when loaded', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCanvasData),
    });

    render(<PublicCanvasPage params={Promise.resolve({ slug: 'test-slug' })} />);

    await waitFor(() => {
      expect(screen.getByText('Test Canvas')).toBeInTheDocument();
    });

    expect(screen.getByText('PUBLIC')).toBeInTheDocument();
    expect(screen.getByText('by Alice')).toBeInTheDocument();
  });

  it('renders nodes as cards', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCanvasData),
    });

    render(<PublicCanvasPage params={Promise.resolve({ slug: 'test-slug' })} />);

    await waitFor(() => {
      expect(screen.getByText('Node 1')).toBeInTheDocument();
      expect(screen.getByText('Node 2')).toBeInTheDocument();
    });

    expect(screen.getByText('2 nodes · 2 edges')).toBeInTheDocument();
  });

  it('renders error state on 404', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
    });

    render(<PublicCanvasPage params={Promise.resolve({ slug: 'nonexistent' })} />);

    await waitFor(() => {
      expect(screen.getByText('Canvas Not Available')).toBeInTheDocument();
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });
  });

  it('renders error state on fetch failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(<PublicCanvasPage params={Promise.resolve({ slug: 'test-slug' })} />);

    await waitFor(() => {
      expect(screen.getByText('Canvas Not Available')).toBeInTheDocument();
    });
  });

  it('renders empty state when no nodes', async () => {
    const emptyCanvas = {
      ...mockCanvasData,
      canvas: { ...mockCanvasData.canvas, nodes: [], edges: [] },
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(emptyCanvas),
    });

    render(<PublicCanvasPage params={Promise.resolve({ slug: 'test-slug' })} />);

    await waitFor(() => {
      expect(screen.getByText('Test Canvas')).toBeInTheDocument();
    });

    expect(screen.getByText(/no nodes/i)).toBeInTheDocument();
    expect(screen.getByText('0 nodes · 0 edges')).toBeInTheDocument();
  });

  it('has link to open in VibeX', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCanvasData),
    });

    render(<PublicCanvasPage params={Promise.resolve({ slug: 'test-slug' })} />);

    await waitFor(() => {
      expect(screen.getByText('Open in VibeX')).toBeInTheDocument();
    });
  });

  it('shows read-only notice at bottom', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCanvasData),
    });

    render(<PublicCanvasPage params={Promise.resolve({ slug: 'test-slug' })} />);

    await waitFor(() => {
      expect(screen.getByText(/read-only/i)).toBeInTheDocument();
    });
  });
});
