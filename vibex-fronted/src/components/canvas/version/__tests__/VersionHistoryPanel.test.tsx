/**
 * VersionHistoryPanel.test.tsx — Sprint93 E1: Canvas Version History
 *
 * Tests:
 * 1. Renders nothing when panel is closed
 * 2. Renders panel when open — shows header, actions, and empty state
 * 3. Shows loading state
 * 4. Lists versions with correct metadata
 * 5. Calls onSnapshotRequest when "创建快照" is clicked
 * 6. Calls onRestore when restore button is clicked
 * 7. Shows latest badge on newest version
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { VersionHistoryPanel } from '../VersionHistoryPanel';
import { useVersionStore } from '@/stores/versionStore';

// ============================================
// Mock the store
// ============================================

const mockFetchVersions = vi.fn();
const mockRestoreVersion = vi.fn();
const mockSetPreviewVersion = vi.fn();
const mockSetPanelOpen = vi.fn();
const mockClearError = vi.fn();

vi.mock('@/stores/versionStore', () => ({
  useVersionStore: vi.fn(() => ({
    versionsByCanvas: {},
    previewVersionId: null,
    isPanelOpen: true,
    isLoading: false,
    error: null,
    fetchVersions: mockFetchVersions,
    restoreVersion: mockRestoreVersion,
    setPreviewVersion: mockSetPreviewVersion,
    setPanelOpen: mockSetPanelOpen,
    clearError: mockClearError,
  })),
}));

// ============================================
// Helpers
// ============================================

const CANVAS_ID = 'canvas-001';

function getMockStore(overrides = {}) {
  return {
    versionsByCanvas: {},
    previewVersionId: null,
    isPanelOpen: true,
    isLoading: false,
    error: null,
    fetchVersions: mockFetchVersions,
    restoreVersion: mockRestoreVersion,
    setPreviewVersion: mockSetPreviewVersion,
    setPanelOpen: mockSetPanelOpen,
    clearError: mockClearError,
    ...overrides,
  };
}

// ============================================
// Tests
// ============================================

describe('VersionHistoryPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useVersionStore as ReturnType<typeof vi.fn>).mockImplementation(() => getMockStore());
  });

  it('renders nothing when panel is closed', () => {
    (useVersionStore as ReturnType<typeof vi.fn>).mockImplementation(() =>
      getMockStore({ isPanelOpen: false })
    );
    render(<VersionHistoryPanel canvasId={CANVAS_ID} />);
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('renders panel header and action buttons when open', () => {
    render(<VersionHistoryPanel canvasId={CANVAS_ID} />);
    expect(screen.getByText('版本历史')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '关闭版本历史' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '创建快照' })).toBeInTheDocument();
  });

  it('shows loading state when loading and no versions', () => {
    (useVersionStore as ReturnType<typeof vi.fn>).mockImplementation(() =>
      getMockStore({ isLoading: true, versionsByCanvas: {} })
    );
    render(<VersionHistoryPanel canvasId={CANVAS_ID} />);
    expect(screen.getByText('加载中…')).toBeInTheDocument();
  });

  it('shows empty state when no versions and not loading', () => {
    (useVersionStore as ReturnType<typeof vi.fn>).mockImplementation(() =>
      getMockStore({ isLoading: false, versionsByCanvas: { [CANVAS_ID]: [] } })
    );
    render(<VersionHistoryPanel canvasId={CANVAS_ID} />);
    expect(screen.getByText('暂无版本记录')).toBeInTheDocument();
  });

  it('lists versions with version number and description', () => {
    const versions = [
      {
        id: 'v2',
        canvasId: CANVAS_ID,
        versionNumber: 2,
        snapshotData: '{}',
        description: 'Second snapshot',
        createdBy: 'user-001',
        createdAt: 1718300000,
      },
      {
        id: 'v1',
        canvasId: CANVAS_ID,
        versionNumber: 1,
        snapshotData: '{}',
        description: null,
        createdBy: 'user-001',
        createdAt: 1718200000,
      },
    ];

    (useVersionStore as ReturnType<typeof vi.fn>).mockImplementation(() =>
      getMockStore({ versionsByCanvas: { [CANVAS_ID]: versions } })
    );

    render(<VersionHistoryPanel canvasId={CANVAS_ID} />);

    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.getByText('Second snapshot')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
  });

  it('marks latest version with "最新" badge', () => {
    const versions = [
      {
        id: 'v3',
        canvasId: CANVAS_ID,
        versionNumber: 3,
        snapshotData: '{}',
        description: 'Latest',
        createdBy: 'user-001',
        createdAt: 1718400000,
      },
    ];

    (useVersionStore as ReturnType<typeof vi.fn>).mockImplementation(() =>
      getMockStore({ versionsByCanvas: { [CANVAS_ID]: versions } })
    );

    render(<VersionHistoryPanel canvasId={CANVAS_ID} />);
    expect(screen.getByText('最新')).toBeInTheDocument();
  });

  it('calls onSnapshotRequest when "创建快照" is clicked', () => {
    const onSnapshotRequest = vi.fn();
    render(<VersionHistoryPanel canvasId={CANVAS_ID} onSnapshotRequest={onSnapshotRequest} />);
    fireEvent.click(screen.getByRole('button', { name: '创建快照' }));
    expect(onSnapshotRequest).toHaveBeenCalledTimes(1);
  });

  it('calls setPreviewVersion when version item is clicked', () => {
    const versions = [
      {
        id: 'v1',
        canvasId: CANVAS_ID,
        versionNumber: 1,
        snapshotData: '{}',
        description: 'Test',
        createdBy: 'user-001',
        createdAt: 1718200000,
      },
    ];

    (useVersionStore as ReturnType<typeof vi.fn>).mockImplementation(() =>
      getMockStore({ versionsByCanvas: { [CANVAS_ID]: versions } })
    );

    render(<VersionHistoryPanel canvasId={CANVAS_ID} />);
    fireEvent.click(screen.getByText('Test'));
    expect(mockSetPreviewVersion).toHaveBeenCalledWith('v1');
  });

  it('calls onRestore when restore button is clicked', async () => {
    const versions = [
      {
        id: 'v1',
        canvasId: CANVAS_ID,
        versionNumber: 1,
        snapshotData: '{}',
        description: 'Old version',
        createdBy: 'user-001',
        createdAt: 1718200000,
      },
    ];

    const onRestore = vi.fn();

    (useVersionStore as ReturnType<typeof vi.fn>).mockImplementation(() =>
      getMockStore({ versionsByCanvas: { [CANVAS_ID]: versions } })
    );

    render(<VersionHistoryPanel canvasId={CANVAS_ID} onRestore={onRestore} />);
    fireEvent.click(screen.getByRole('button', { name: '恢复到该版本' }));
    expect(onRestore).toHaveBeenCalledWith(versions[0]);
    expect(mockRestoreVersion).toHaveBeenCalledWith('v1');
  });

  it('shows error banner and dismisses on close', () => {
    (useVersionStore as ReturnType<typeof vi.fn>).mockImplementation(() =>
      getMockStore({ error: 'Failed to load versions' })
    );
    render(<VersionHistoryPanel canvasId={CANVAS_ID} />);
    expect(screen.getByText('Failed to load versions')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '关闭错误' }));
    expect(mockClearError).toHaveBeenCalledTimes(1);
  });

  it('closes panel when close button is clicked', () => {
    render(<VersionHistoryPanel canvasId={CANVAS_ID} />);
    fireEvent.click(screen.getByRole('button', { name: '关闭版本历史' }));
    expect(mockSetPanelOpen).toHaveBeenCalledWith(false);
  });
});
