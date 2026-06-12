/**
 * ExportDialog tests — S89-E5 Advanced Export Formats
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ExportDialog } from './ExportDialog';

const mockStartExport = vi.fn();
vi.mock('@/hooks/useBatchExport', () => ({
  useBatchExport: () => ({
    status: 'idle',
    progress: null,
    error: null,
    startExport: mockStartExport,
    cancelExport: vi.fn(),
  }),
}));

vi.mock('@/stores/canvasExportStore', () => ({
  useCanvasExportStore: vi.fn((selector?) => {
    const state = {
      exportScale: 1,
      setExportScale: vi.fn(),
      exportHistory: [
        { id: 'h1', format: 'PDF' as const, scale: 2, timestamp: Date.now() - 100000, canvasName: 'Test Canvas' },
      ],
      addExportHistory: vi.fn(),
      clearExportHistory: vi.fn(),
    };
    if (typeof selector === 'function') return selector(state);
    return state;
  }),
}));

vi.mock('@/stores/dds', () => ({
  useDDSCanvasStore: vi.fn((selector?) => {
    const state = {
      chapters: {
        ch1: { id: 'ch1', name: 'Chapter 1', cards: [{ id: 'card-1' }] },
      },
      selectedCardIds: [],
    };
    if (typeof selector === 'function') return selector(state);
    return state;
  }),
}));

describe('ExportDialog — S89-E5', () => {
  beforeEach(() => {
    mockStartExport.mockClear();
  });

  it('renders dialog with start export button', () => {
    render(<ExportDialog open={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('export-dialog-start')).toBeInTheDocument();
  });

  it('shows all six format options as radio buttons', () => {
    render(<ExportDialog open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('radio', { name: /PNG/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /SVG/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /PDF/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /JSON/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /PPT/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Markdown/i })).toBeInTheDocument();
  });

  it('shows scale selector when PNG format selected', () => {
    render(<ExportDialog open={true} onClose={vi.fn()} />);
    // PNG is default - scale should be visible
    expect(screen.getByRole('radio', { name: '1x' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '2x' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '3x' })).toBeInTheDocument();
  });

  it('shows history toggle button when history exists', () => {
    render(<ExportDialog open={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('export-history-toggle')).toBeInTheDocument();
  });

  it('shows history panel when history button clicked', async () => {
    const user = userEvent.setup();
    render(<ExportDialog open={true} onClose={vi.fn()} />);

    await user.click(screen.getByTestId('export-history-toggle'));

    expect(screen.getByTestId('export-history-section')).toBeInTheDocument();
  });

  it('calls startExport with JSON format when export clicked', async () => {
    const user = userEvent.setup();
    render(<ExportDialog open={true} onClose={vi.fn()} />);

    // Select JSON
    await user.click(screen.getByRole('radio', { name: /JSON/i }));
    // Click export
    await user.click(screen.getByTestId('export-dialog-start'));

    expect(mockStartExport).toHaveBeenCalled();
    const call = mockStartExport.mock.calls[0];
    expect(call[2]).toBe('json'); // format = 'json'
  });

  it('calls startExport with Markdown format', async () => {
    const user = userEvent.setup();
    render(<ExportDialog open={true} onClose={vi.fn()} />);

    await user.click(screen.getByRole('radio', { name: /Markdown/i }));
    await user.click(screen.getByTestId('export-dialog-start'));

    expect(mockStartExport.mock.calls[mockStartExport.mock.calls.length - 1][2]).toBe('markdown');
  });

  it('calls startExport with PPT format', async () => {
    const user = userEvent.setup();
    render(<ExportDialog open={true} onClose={vi.fn()} />);

    await user.click(screen.getByRole('radio', { name: /PPT/i }));
    await user.click(screen.getByTestId('export-dialog-start'));

    expect(mockStartExport.mock.calls[mockStartExport.mock.calls.length - 1][2]).toBe('ppt');
  });
});
