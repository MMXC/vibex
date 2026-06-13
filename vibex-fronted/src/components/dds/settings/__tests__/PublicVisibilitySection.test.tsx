/**
 * PublicVisibilitySection.test.tsx — S95-E2: Public Canvas Portal
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PublicVisibilitySection } from '../PublicVisibilitySection';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  configurable: true,
});

const makeMockVisibility = (overrides: Partial<{ is_public: boolean; slug: string | null; public_url: string | null }> = {}) => ({
  is_public: false,
  slug: null,
  public_url: null,
  ...overrides,
});

describe('PublicVisibilitySection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // never resolves
    render(<PublicVisibilitySection canvasId="canvas-1" />);
    expect(screen.getByText('Loading visibility settings…')).toBeInTheDocument();
  });

  it('renders private canvas state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makeMockVisibility()),
    });
    render(<PublicVisibilitySection canvasId="canvas-1" />);
    await waitFor(() => {
      expect(screen.queryByText('Loading visibility settings…')).not.toBeInTheDocument();
    });
    expect(screen.getByText(/make this canvas publicly accessible/i)).toBeInTheDocument();
  });

  it('renders public canvas state with URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makeMockVisibility({ is_public: true, slug: 'my-canvas', public_url: '/public/my-canvas' })),
    });
    render(<PublicVisibilitySection canvasId="canvas-1" />);
    await waitFor(() => {
      expect(screen.queryByText('Loading visibility settings…')).not.toBeInTheDocument();
    });
    expect(screen.getByText(/this canvas is publicly accessible/i)).toBeInTheDocument();
    const copyBtn = screen.getByRole('button', { name: 'Copy URL' });
    expect(copyBtn).toBeInTheDocument();
  });

  it('shows slug input for public canvas', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makeMockVisibility({ is_public: true, slug: 'my-canvas' })),
    });
    render(<PublicVisibilitySection canvasId="canvas-1" />);
    await waitFor(() => {
      expect(screen.queryByText('Loading visibility settings…')).not.toBeInTheDocument();
    });
    expect(screen.getByLabelText(/custom url slug/i)).toBeInTheDocument();
  });

  it('toggles public/private on button click', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeMockVisibility()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeMockVisibility({ is_public: true, slug: 'my-canvas', public_url: '/public/my-canvas' })),
      });
    render(<PublicVisibilitySection canvasId="canvas-1" />);
    await waitFor(() => {
      expect(screen.queryByText('Loading visibility settings…')).not.toBeInTheDocument();
    });

    // Click "Make Public"
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByText(/this canvas is publicly accessible/i)).toBeInTheDocument();
    });
  });

  it('shows error on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Canvas not found' }),
    });
    render(<PublicVisibilitySection canvasId="canvas-1" />);
    await waitFor(() => {
      expect(screen.getByText('Canvas not found')).toBeInTheDocument();
    });
  });

  it('copies URL on copy button click', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makeMockVisibility({ is_public: true, slug: 'my-canvas', public_url: '/public/my-canvas' })),
    });
    render(<PublicVisibilitySection canvasId="canvas-1" />);
    await waitFor(() => {
      expect(screen.queryByText('Loading visibility settings…')).not.toBeInTheDocument();
    });
    const copyBtn = screen.getByRole('button', { name: 'Copy URL' });
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});
