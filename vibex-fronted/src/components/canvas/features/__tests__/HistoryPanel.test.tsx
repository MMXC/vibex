/**
 * HistoryPanel — Unit Tests
 * P004-E4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { HistoryPanel } from '../HistoryPanel';
import { useCanvasHistoryStore } from '@/stores/dds/canvasHistoryStore';

vi.mock('@/stores/dds/canvasHistoryStore', () => ({
  useCanvasHistoryStore: vi.fn(),
}));

const mockUseCanvasHistoryStore = useCanvasHistoryStore as ReturnType<typeof vi.fn>;

describe('HistoryPanel — P004-E4', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnClose.mockClear();
    mockUseCanvasHistoryStore.setState = vi.fn();
  });

  afterEach(() => {
    // Reset store state between tests
    mockUseCanvasHistoryStore.setState({ past: [], future: [], isPerforming: false });
  });

  const setup = (past: any[] = [], future: any[] = []) => {
    mockUseCanvasHistoryStore.mockImplementation((selector: any) => {
      const state = {
        // Command-based history (P004-E4 / S36)
        past,
        future,
        isPerforming: false,
        canUndo: () => past.length > 0,
        canRedo: () => future.length > 0,
        selectiveUndo: vi.fn(),
        undo: vi.fn(),
        redo: vi.fn(),
        getPosition: () => ({ current: past.length, total: past.length + future.length }),
        // Snapshot-based history (E1 / S61) — also needed by canvas/features/HistoryPanel
        snapshots: [],
        restoringSnapshotId: null,
        compareSnapshots: vi.fn(),
        updateSnapshotMetadata: vi.fn(),
        deleteSnapshot: vi.fn(),
        listSnapshots: vi.fn(),
        saveSnapshot: vi.fn(),
        loadSnapshot: vi.fn(),
        setRestoringSnapshotId: vi.fn(),
      };
      if (typeof selector === 'function') return selector(state);
      return state;
    });
  };

  describe('rendering', () => {
    it('renders nothing when open is false', () => {
      setup([], []);
      render(<HistoryPanel open={false} onClose={mockOnClose} />);
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('renders panel when open is true', () => {
      setup([], []);
      render(<HistoryPanel open={true} onClose={mockOnClose} />);
      expect(screen.getByRole('dialog', { name: '历史记录面板' })).toBeInTheDocument();
      // h2 title + tab button both say "历史记录"
      expect(screen.getAllByText('历史记录').length).toBeGreaterThanOrEqual(1);
    });

    it('shows empty state when no history', () => {
      setup([], []);
      render(<HistoryPanel open={true} onClose={mockOnClose} />);
      expect(screen.getByText('暂无历史记录')).toBeInTheDocument();
    });

    it('shows current badge on last past command', () => {
      const past = [
        { id: 'c1', execute: vi.fn(), rollback: vi.fn(), timestamp: 1000, description: '添加节点' },
        { id: 'c2', execute: vi.fn(), rollback: vi.fn(), timestamp: 2000, description: '删除节点' },
      ];
      setup(past, []);
      render(<HistoryPanel open={true} onClose={mockOnClose} />);
      // Last past command shows "当前" badge
      expect(screen.getByText('当前')).toBeInTheDocument();
    });
  });

  describe('command list', () => {
    it('renders past commands with descriptions', () => {
      const past = [
        { id: 'c1', execute: vi.fn(), rollback: vi.fn(), timestamp: 1000, description: '添加节点A' },
        { id: 'c2', execute: vi.fn(), rollback: vi.fn(), timestamp: 2000 },
      ];
      setup(past, []);
      render(<HistoryPanel open={true} onClose={mockOnClose} />);
      expect(screen.getByText('添加节点A')).toBeInTheDocument();
      // unnamed command falls back to "操作 N"
      expect(screen.getByText('操作 2')).toBeInTheDocument();
    });

    it('shows "当前" badge on the last past command', () => {
      const past = [
        { id: 'c1', execute: vi.fn(), rollback: vi.fn(), timestamp: 1000, description: '操作1' },
        { id: 'c2', execute: vi.fn(), rollback: vi.fn(), timestamp: 2000, description: '操作2' },
      ];
      setup(past, []);
      render(<HistoryPanel open={true} onClose={mockOnClose} />);
      expect(screen.getByText('当前')).toBeInTheDocument();
    });

    it('shows divider between past and future', () => {
      const past = [{ id: 'c1', execute: vi.fn(), rollback: vi.fn(), timestamp: 1000 }];
      const future = [{ id: 'c2', execute: vi.fn(), rollback: vi.fn(), timestamp: 2000 }];
      setup(past, future);
      render(<HistoryPanel open={true} onClose={mockOnClose} />);
      expect(screen.getByText('— 已撤销 —')).toBeInTheDocument();
    });
  });

  describe('close button', () => {
    it('calls onClose when close button is clicked', () => {
      setup([], []);
      render(<HistoryPanel open={true} onClose={mockOnClose} />);
      fireEvent.click(screen.getByRole('button', { name: '关闭' }));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('closes on overlay click', () => {
      setup([], []);
      render(<HistoryPanel open={true} onClose={mockOnClose} />);
      // The overlay div
      const overlay = document.querySelector('[class*="overlay"]');
      if (overlay) fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
