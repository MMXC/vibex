/**
 * ExportPanel.test.tsx — Vitest Tests
 * Sprint94 E4: Canvas Export as Code
 *
 * Tests:
 * 1. Renders panel when isOpen=true
 * 2. Does not render when isOpen=false
 * 3. Renders all 4 format tabs
 * 4. Clicking a tab calls setFormat
 * 5. Shows loading state while isLoading=true
 * 6. Shows error state when error is set
 * 7. Shows preview content when preview is available
 * 8. Copy button disabled when no preview
 * 9. Download button disabled when no preview
 * 10. Zoom controls update previewZoom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ExportPanel } from './ExportPanel';

// Declare mock functions at module scope using vi.hoisted
// This makes them available to both vi.mock factory and test code
const mockSetFormat = vi.fn();
const mockSetPreviewZoom = vi.fn();
const mockCopyToClipboard = vi.fn().mockResolvedValue(true);
const mockDownload = vi.fn();
const mockShowCopySuccess = vi.fn();

const mockUseExportPanelStore = vi.hoisted(() => vi.fn<(selector?: (s: ReturnType<typeof createDefaultState>) => unknown) => ReturnType<typeof createDefaultState>>());

// Helper to create default state
function createDefaultState(overrides = {}) {
  return {
    isOpen: true,
    format: 'react' as const,
    preview: null as { data: string; filename: string; mimeType: string; cards?: number; edges?: number } | null,
    isLoading: false,
    error: null as string | null,
    canvasId: 'canvas-001',
    previewZoom: 100,
    copySuccess: false,
    setFormat: mockSetFormat,
    setPreviewZoom: mockSetPreviewZoom,
    copyToClipboard: mockCopyToClipboard,
    download: mockDownload,
    showCopySuccess: mockShowCopySuccess,
    openPanel: vi.fn(),
    closePanel: vi.fn(),
    ...overrides,
  };
}

// Mock at module level — vi.mock is hoisted so all component imports use this
vi.mock('@/stores/exportStore', () => ({
  useExportPanelStore: mockUseExportPanelStore,
}));

vi.mock('@/hooks/canvas/useExport', () => ({
  useExport: vi.fn(() => ({
    fetchPreview: vi.fn(),
    preview: null,
    isLoading: false,
    error: null,
    copyToClipboard: mockCopyToClipboard,
    download: mockDownload,
  })),
}));

function renderWithState(overrides = {}) {
  // Update mock implementation for this render
  mockUseExportPanelStore.mockImplementation((selector?: (s: ReturnType<typeof createDefaultState>) => unknown) => {
    const state = createDefaultState(overrides);
    if (typeof selector === 'function') return selector(state);
    return state;
  });
  return render(<ExportPanel onClose={vi.fn()} />);
}

describe('ExportPanel — S94-E4', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCopyToClipboard.mockResolvedValue(true);
    mockSetFormat.mockClear();
    mockSetPreviewZoom.mockClear();
    mockDownload.mockClear();
    mockShowCopySuccess.mockClear();
  });

  it('renders panel when isOpen=true', () => {
    renderWithState({ isOpen: true });
    expect(screen.getByRole('dialog', { name: 'Canvas Export' })).toBeInTheDocument();
    expect(screen.getByText('Export as Code')).toBeInTheDocument();
  });

  it('does not render when isOpen=false', () => {
    renderWithState({ isOpen: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders all 4 format tabs', () => {
    renderWithState();
    expect(screen.getByRole('tab', { name: /React/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /SVG/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Markdown/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /JSON/i })).toBeInTheDocument();
  });

  it('clicking a tab calls setFormat with svg', async () => {
    const user = userEvent.setup();
    renderWithState();
    await user.click(screen.getByRole('tab', { name: /SVG/i }));
    expect(mockSetFormat).toHaveBeenCalledWith('svg');
  });

  it('shows loading state when isLoading=true', () => {
    renderWithState({ isLoading: true });
    expect(screen.getByText(/Generating.*preview/i)).toBeInTheDocument();
  });

  it('shows error state when error is set', () => {
    renderWithState({ error: 'Export failed: 500', isLoading: false });
    expect(screen.getByText('Export failed: 500')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows preview content when preview is available', () => {
    renderWithState({
      preview: {
        data: 'export function CanvasDiagram() { return <svg />; }',
        filename: 'canvas-001.jsx',
        mimeType: 'text/javascript',
        cards: 5,
        edges: 3,
      },
      isLoading: false,
      error: null,
    });
    expect(screen.getByText(/CanvasDiagram/)).toBeInTheDocument();
    expect(screen.getByText('5 cards · 3 edges')).toBeInTheDocument();
  });

  it('Copy and Download buttons disabled when no preview', () => {
    renderWithState({ preview: null });
    expect(screen.getByRole('button', { name: /Copy to Clipboard/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Download/i })).toBeDisabled();
  });

  it('Copy button enabled when preview is available', () => {
    renderWithState({
      preview: {
        data: 'some data',
        filename: 'test.json',
        mimeType: 'application/json',
      },
    });
    expect(screen.getByRole('button', { name: /Copy to Clipboard/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /Download/i })).not.toBeDisabled();
  });

  it('zoom controls update previewZoom', async () => {
    const user = userEvent.setup();
    renderWithState();
    const zoomInBtn = screen.getByRole('button', { name: /Zoom in/i });
    await user.click(zoomInBtn);
    expect(mockSetPreviewZoom).toHaveBeenCalledWith(125);
  });

  it('close button is present and clickable', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockUseExportPanelStore.mockImplementation((selector?: (s: ReturnType<typeof createDefaultState>) => unknown) => {
      const state = createDefaultState();
      if (typeof selector === 'function') return selector(state);
      return state;
    });
    const { unmount } = render(<ExportPanel onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /Close export panel/i }));
    expect(onClose).toHaveBeenCalled();
    unmount();
  });

  it('shows empty state when no preview and not loading', () => {
    renderWithState({ preview: null, isLoading: false, error: null });
    expect(screen.getByText('Select a format to preview')).toBeInTheDocument();
  });

  it('renders SVG preview correctly', () => {
    renderWithState({
      format: 'svg',
      preview: {
        data: '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40"/></svg>',
        filename: 'test.svg',
        mimeType: 'image/svg+xml',
        cards: 1,
        edges: 0,
      },
    });
    expect(screen.getByText('1 cards · 0 edges')).toBeInTheDocument();
  });
});
