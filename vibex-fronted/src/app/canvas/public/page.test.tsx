/**
 * PublicCanvasDiscoveryPage.test.tsx — S95-E2: Public Canvas Portal
 *
 * Vitest tests for /canvas/public/page.tsx
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import PublicCanvasDiscoveryPage from './page';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('PublicCanvasDiscoveryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const mockListData = {
    canvases: [
      {
        canvasId: 'c1',
        slug: 'awesome-canvas',
        name: 'Awesome Canvas',
        owner: { name: 'Alice', email: 'alice@example.com' },
        publicUrl: '/public/awesome-canvas',
        nodeCount: 10,
        edgeCount: 5,
        createdAt: '2026-06-01T10:00:00Z',
        updatedAt: '2026-06-02T12:00:00Z',
      },
      {
        canvasId: 'c2',
        slug: 'another-canvas',
        name: 'Another Canvas',
        owner: { name: 'Bob', email: 'bob@example.com' },
        publicUrl: '/public/another-canvas',
        nodeCount: 3,
        edgeCount: 2,
        createdAt: '2026-06-03T08:00:00Z',
        updatedAt: '2026-06-03T09:00:00Z',
      },
    ],
    total: 2,
    page: 1,
    limit: 12,
  };

  it('renders loading state initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
    render(<PublicCanvasDiscoveryPage />);
    expect(screen.getByText('Loading public canvases…')).toBeInTheDocument();
  });

  it('renders public canvas cards when loaded', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockListData),
    });

    render(<PublicCanvasDiscoveryPage />);

    await waitFor(() => {
      expect(screen.getByText('Awesome Canvas')).toBeInTheDocument();
      expect(screen.getByText('Another Canvas')).toBeInTheDocument();
    });
  });

  it('shows total count', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockListData),
    });

    render(<PublicCanvasDiscoveryPage />);

    await waitFor(() => {
      expect(screen.getByText('2 public canvases')).toBeInTheDocument();
    });
  });

  it('renders empty state when no canvases', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ canvases: [], total: 0, page: 1, limit: 12 }),
    });

    render(<PublicCanvasDiscoveryPage />);

    await waitFor(() => {
      expect(screen.getByText('No public canvases yet.')).toBeInTheDocument();
    });
  });

  it('renders sort buttons', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockListData),
    });

    render(<PublicCanvasDiscoveryPage />);

    await waitFor(() => {
      expect(screen.getByText('Newest')).toBeInTheDocument();
      expect(screen.getByText('Popular')).toBeInTheDocument();
    });
  });

  it('renders node and edge counts per card', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockListData),
    });

    render(<PublicCanvasDiscoveryPage />);

    await waitFor(() => {
      expect(screen.getByText('10 nodes')).toBeInTheDocument();
      expect(screen.getByText('3 nodes')).toBeInTheDocument();
    });
  });

  it('renders owner name per card', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockListData),
    });

    render(<PublicCanvasDiscoveryPage />);

    await waitFor(() => {
      expect(screen.getByText('by Alice')).toBeInTheDocument();
      expect(screen.getByText('by Bob')).toBeInTheDocument();
    });
  });

  it('renders error state on fetch failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(<PublicCanvasDiscoveryPage />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });
});
