/**
 * VersionPreview.test.tsx — Sprint93 E1: Canvas Version History
 *
 * Tests:
 * 1. Renders nothing when no previewVersionId is set
 * 2. Shows version metadata and snapshot preview when open
 * 3. Shows "当前版本" badge for latest version
 * 4. Calls onRestore when restore button is clicked
 * 5. Calls setPreviewVersion(null) when close is clicked
 * 6. Closes on Escape key
 * 7. Parses snapshotData JSON and shows node/edge counts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { VersionPreview } from '../VersionPreview';
import { useVersionStore } from '@/stores/versionStore';

const CANVAS_ID = 'canvas-001';

const mockRestoreVersion = vi.fn();
const mockSetPreviewVersion = vi.fn();

vi.mock('@/stores/versionStore', () => ({
  useVersionStore: vi.fn(() => ({
    previewVersionId: 'v1',
    versionsByCanvas: {
      [CANVAS_ID]: [
        {
          id: 'v2',
          canvasId: CANVAS_ID,
          versionNumber: 2,
          snapshotData: JSON.stringify({ nodes: [{ id: 'n1' }, { id: 'n2' }], edges: [{ id: 'e1' }] }),
          description: 'Second version',
          createdBy: 'user-001',
          createdAt: 1718300000,
        },
        {
          id: 'v1',
          canvasId: CANVAS_ID,
          versionNumber: 1,
          snapshotData: JSON.stringify({ nodes: [{ id: 'n1' }], edges: [] }),
          description: 'First version',
          createdBy: 'user-001',
          createdAt: 1718200000,
        },
      ],
    },
    isLoading: false,
    restoreVersion: mockRestoreVersion,
    setPreviewVersion: mockSetPreviewVersion,
  })),
}));

describe('VersionPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useVersionStore as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      previewVersionId: 'v1',
      versionsByCanvas: {
        [CANVAS_ID]: [
          {
            id: 'v2',
            canvasId: CANVAS_ID,
            versionNumber: 2,
            snapshotData: JSON.stringify({ nodes: [{ id: 'n1' }, { id: 'n2' }], edges: [{ id: 'e1' }] }),
            description: 'Second version',
            createdBy: 'user-001',
            createdAt: 1718300000,
          },
          {
            id: 'v1',
            canvasId: CANVAS_ID,
            versionNumber: 1,
            snapshotData: JSON.stringify({ nodes: [{ id: 'n1' }], edges: [] }),
            description: 'First version',
            createdBy: 'user-001',
            createdAt: 1718200000,
          },
        ],
      },
      isLoading: false,
      restoreVersion: mockRestoreVersion,
      setPreviewVersion: mockSetPreviewVersion,
    }));
  });

  it('renders nothing when no previewVersionId is set', () => {
    (useVersionStore as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      previewVersionId: null,
      versionsByCanvas: {},
      isLoading: false,
      restoreVersion: mockRestoreVersion,
      setPreviewVersion: mockSetPreviewVersion,
    }));
    render(<VersionPreview canvasId={CANVAS_ID} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog with version number and description', () => {
    render(<VersionPreview canvasId={CANVAS_ID} />);
    expect(screen.getByText('版本 v1')).toBeInTheDocument();
    expect(screen.getByText('First version')).toBeInTheDocument();
  });

  it('shows "当前版本" badge for latest version', () => {
    (useVersionStore as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      previewVersionId: 'v2',
      versionsByCanvas: {
        [CANVAS_ID]: [
          {
            id: 'v2',
            canvasId: CANVAS_ID,
            versionNumber: 2,
            snapshotData: '{}',
            description: 'Latest',
            createdBy: 'user-001',
            createdAt: 1718300000,
          },
        ],
      },
      isLoading: false,
      restoreVersion: mockRestoreVersion,
      setPreviewVersion: mockSetPreviewVersion,
    }));
    render(<VersionPreview canvasId={CANVAS_ID} />);
    expect(screen.getByText('当前版本')).toBeInTheDocument();
  });

  it('shows node and edge counts from snapshotData', () => {
    render(<VersionPreview canvasId={CANVAS_ID} />);
    // v1 has 1 node, 0 edges
    expect(screen.getByText('1', { selector: 'div' })).toBeInTheDocument();
  });

  it('does not show restore button for latest version', () => {
    (useVersionStore as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      previewVersionId: 'v2',
      versionsByCanvas: {
        [CANVAS_ID]: [
          {
            id: 'v2',
            canvasId: CANVAS_ID,
            versionNumber: 2,
            snapshotData: '{}',
            description: 'Latest',
            createdBy: 'user-001',
            createdAt: 1718300000,
          },
        ],
      },
      isLoading: false,
      restoreVersion: mockRestoreVersion,
      setPreviewVersion: mockSetPreviewVersion,
    }));
    render(<VersionPreview canvasId={CANVAS_ID} />);
    expect(screen.queryByRole('button', { name: /恢复此版本/ })).not.toBeInTheDocument();
  });

  it('shows restore button for non-latest version', () => {
    render(<VersionPreview canvasId={CANVAS_ID} />);
    expect(screen.getByRole('button', { name: /恢复此版本/ })).toBeInTheDocument();
  });

  it('calls onRestore and restoreVersion when restore is clicked', async () => {
    const onRestore = vi.fn();
    render(<VersionPreview canvasId={CANVAS_ID} onRestore={onRestore} />);
    fireEvent.click(screen.getByRole('button', { name: /恢复此版本/ }));
    expect(onRestore).toHaveBeenCalledTimes(1);
    expect(mockRestoreVersion).toHaveBeenCalledWith('v1');
  });

  it('calls setPreviewVersion(null) when close is clicked', () => {
    render(<VersionPreview canvasId={CANVAS_ID} />);
    fireEvent.click(screen.getByRole('button', { name: '关闭预览' }));
    expect(mockSetPreviewVersion).toHaveBeenCalledWith(null);
  });

  it('closes on Escape key', () => {
    render(<VersionPreview canvasId={CANVAS_ID} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockSetPreviewVersion).toHaveBeenCalledWith(null);
  });

  it('shows "只读预览" badge', () => {
    render(<VersionPreview canvasId={CANVAS_ID} />);
    expect(screen.getByText('只读预览')).toBeInTheDocument();
  });

  it('shows footer with createdBy info', () => {
    render(<VersionPreview canvasId={CANVAS_ID} />);
    expect(screen.getByText(/by user-001/)).toBeInTheDocument();
  });
});
