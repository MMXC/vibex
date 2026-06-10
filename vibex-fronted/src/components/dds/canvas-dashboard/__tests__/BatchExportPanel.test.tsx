/**
 * BatchExportPanel.test.tsx — S83-E5: Batch Canvas Export ZIP Panel Tests
 *
 * Tests for BatchExportPanel component:
 * - Renders null when open=false
 * - Renders panel when open=true
 * - Auto-starts export on open
 * - Shows per-canvas progress rows
 * - Shows overall progress bar
 * - Cancel button calls cancelExport
 * - Close button calls onClose when done
 * - Escape key closes panel when idle/done/cancelled/error
 * - Click outside closes panel when idle/done/cancelled/error
 * - Shows correct status banners (running/done/cancelled/error)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Shared mutable state for all mock hook calls — allows per-test state customization
const mockHookState = {
  status: 'idle' as const,
  progress: null as ReturnType<typeof React.useState<unknown>>[0],
  downloadUrl: null as string | null,
  error: null as string | null,
  startExport: vi.fn().mockResolvedValue(undefined),
  cancelExport: vi.fn().mockImplementation(() => {}),
  reset: vi.fn().mockImplementation(() => {}),
};

vi.mock('@/hooks/useBatchCanvasExport', () => ({
  useBatchCanvasExport: () => mockHookState,
}));

import { BatchExportPanel } from '../BatchExportPanel';

describe('BatchExportPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state to defaults
    mockHookState.status = 'idle';
    mockHookState.progress = null;
    mockHookState.downloadUrl = null;
    mockHookState.error = null;
    mockHookState.startExport = vi.fn().mockResolvedValue(undefined);
    mockHookState.cancelExport = vi.fn().mockImplementation(() => {});
    mockHookState.reset = vi.fn().mockImplementation(() => {});
  });

  it('renders null when open=false', () => {
    const { container } = render(
      <BatchExportPanel open={false} canvasIds={['c1']} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders panel when open=true', () => {
    render(
      <BatchExportPanel open={true} canvasIds={['c1']} onClose={vi.fn()} />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('📦 批量导出画布');
  });

  it('auto-starts export when panel opens', async () => {
    render(
      <BatchExportPanel open={true} canvasIds={['canvas-1', 'canvas-2']} onClose={vi.fn()} />
    );
    expect(mockHookState.startExport).toHaveBeenCalledWith(
      ['canvas-1', 'canvas-2'],
      expect.objectContaining({ format: 'png' })
    );
  });

  it('does not auto-start export when open=false', () => {
    render(
      <BatchExportPanel open={false} canvasIds={['c1']} onClose={vi.fn()} />
    );
    expect(mockHookState.startExport).not.toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked (done state)', () => {
    mockHookState.status = 'done';
    mockHookState.progress = {
      current: 2,
      total: 2,
      currentCanvasName: 'Canvas 1',
      canvases: [
        { canvasId: 'c1', canvasName: 'Canvas 1', status: 'done', nodeProgress: null, error: null },
        { canvasId: 'c2', canvasName: 'Canvas 2', status: 'done', nodeProgress: null, error: null },
      ],
    };
    mockHookState.downloadUrl = 'blob:http://example.com/test';

    const onClose = vi.fn();
    render(
      <BatchExportPanel open={true} canvasIds={['c1']} onClose={onClose} />
    );

    const closeBtn = screen.getByRole('button', { name: '关闭' });
    userEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls cancelExport when cancel button is clicked (running state)', () => {
    mockHookState.status = 'running';
    mockHookState.progress = {
      current: 1,
      total: 2,
      currentCanvasName: 'Canvas 1',
      canvases: [
        { canvasId: 'c1', canvasName: 'Canvas 1', status: 'exporting', nodeProgress: { current: 1, total: 3, nodeName: 'Card 1' }, error: null },
        { canvasId: 'c2', canvasName: 'Canvas 2', status: 'pending', nodeProgress: null, error: null },
      ],
    };

    render(
      <BatchExportPanel open={true} canvasIds={['c1', 'c2']} onClose={vi.fn()} />
    );

    const cancelBtn = screen.getByRole('button', { name: '取消导出' });
    userEvent.click(cancelBtn);
    expect(mockHookState.cancelExport).toHaveBeenCalledTimes(1);
  });

  it('shows overall progress bar when running', () => {
    mockHookState.status = 'running';
    mockHookState.progress = {
      current: 1,
      total: 3,
      currentCanvasName: 'Canvas 1',
      canvases: [
        { canvasId: 'c1', canvasName: 'Canvas 1', status: 'exporting', nodeProgress: { current: 1, total: 5, nodeName: 'Card 1' }, error: null },
      ],
    };

    render(
      <BatchExportPanel open={true} canvasIds={['c1']} onClose={vi.fn()} />
    );

    expect(screen.getByText('整体进度 — 1/3 个画布')).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar')).toHaveLength(2); // overall + per-canvas
  });

  it('shows per-canvas status rows when progress is available', () => {
    mockHookState.status = 'running';
    mockHookState.progress = {
      current: 1,
      total: 2,
      currentCanvasName: 'Canvas 1',
      canvases: [
        { canvasId: 'c1', canvasName: 'My First Canvas', status: 'done', nodeProgress: null, error: null },
        { canvasId: 'c2', canvasName: 'My Second Canvas', status: 'exporting', nodeProgress: { current: 2, total: 4, nodeName: 'Card A' }, error: null },
      ],
    };

    render(
      <BatchExportPanel open={true} canvasIds={['c1', 'c2']} onClose={vi.fn()} />
    );

    expect(screen.getByText('My First Canvas')).toBeInTheDocument();
    expect(screen.getByText('My Second Canvas')).toBeInTheDocument();
  });

  it('shows success banner when done', () => {
    mockHookState.status = 'done';
    mockHookState.progress = {
      current: 2,
      total: 2,
      currentCanvasName: '',
      canvases: [],
    };
    mockHookState.downloadUrl = 'blob:http://example.com/test';

    render(
      <BatchExportPanel open={true} canvasIds={['c1']} onClose={vi.fn()} />
    );

    expect(screen.getByText(/导出完成/)).toBeInTheDocument();
  });

  it('shows error banner when error', () => {
    mockHookState.status = 'error';
    mockHookState.error = 'Canvas not found in IndexedDB';

    render(
      <BatchExportPanel open={true} canvasIds={['c1']} onClose={vi.fn()} />
    );

    expect(screen.getByText(/Canvas not found in IndexedDB/)).toBeInTheDocument();
  });

  it('shows cancelled banner when cancelled', () => {
    mockHookState.status = 'cancelled';

    render(
      <BatchExportPanel open={true} canvasIds={['c1']} onClose={vi.fn()} />
    );

    expect(screen.getByText(/导出已取消/)).toBeInTheDocument();
  });

  it('Escape key calls onClose when status is done', () => {
    mockHookState.status = 'done';
    mockHookState.progress = {
      current: 1,
      total: 1,
      currentCanvasName: '',
      canvases: [],
    };
    mockHookState.downloadUrl = 'blob:http://example.com/test';

    const onClose = vi.fn();
    render(
      <BatchExportPanel open={true} canvasIds={['c1']} onClose={onClose} />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape key does NOT call onClose when status is running', () => {
    mockHookState.status = 'running';
    mockHookState.progress = {
      current: 1,
      total: 2,
      currentCanvasName: 'C1',
      canvases: [],
    };

    const onClose = vi.fn();
    render(
      <BatchExportPanel open={true} canvasIds={['c1']} onClose={onClose} />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('click outside panel calls onClose when status is done', () => {
    mockHookState.status = 'done';
    mockHookState.progress = {
      current: 1,
      total: 1,
      currentCanvasName: '',
      canvases: [],
    };
    mockHookState.downloadUrl = 'blob:http://example.com/test';

    const onClose = vi.fn();
    const { container } = render(
      <BatchExportPanel open={true} canvasIds={['c1']} onClose={onClose} />
    );

    // Click on the overlay (the panel-overlay div)
    const overlay = container.firstChild as HTMLElement;
    if (overlay) {
      userEvent.click(overlay);
    }
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
