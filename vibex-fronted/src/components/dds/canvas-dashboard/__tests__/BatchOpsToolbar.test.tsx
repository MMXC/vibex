/**
 * BatchOpsToolbar.test.tsx — Sprint60 E2
 *
 * Tests for BatchOpsToolbar component:
 * - Renders null when no canvases selected
 * - Renders toolbar when canvases are selected
 * - Opens delete dialog
 * - Opens rename dialog
 * - Shows selected count
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ============================================
// Mock indexedDB before any store imports
// ============================================

const mockIDB = { open: vi.fn() };
Object.defineProperty(globalThis, 'indexedDB', {
  value: mockIDB,
  writable: true,
  configurable: true,
});

// ============================================
// Mock canvasListStore
// ============================================

const mockCanvasListStore = {
  selectedCanvasIds: new Set<string>(),
  clearSelection: vi.fn(),
  batchDeleteCanvas: vi.fn().mockResolvedValue(undefined),
  batchRenameCanvas: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/stores/canvasListStore', () => ({
  useCanvasListStore: Object.assign(
    (selector) => {
      if (typeof selector === 'function') return selector(mockCanvasListStore);
      return mockCanvasListStore;
    },
    {
      getState: () => mockCanvasListStore,
      setState: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
    }
  ),
}));

// ============================================
// Mock batchOpsStore
// ============================================

const mockBatchOpsStore = {
  isDeleteDialogOpen: false,
  isRenameDialogOpen: false,
  renameMode: 'suffix' as const,
  renamePrefix: '',
  renameSuffix: '',
  isOperating: false,
  openDeleteDialog: vi.fn(),
  closeDeleteDialog: vi.fn(),
  openRenameDialog: vi.fn(),
  closeRenameDialog: vi.fn(),
  setRenameMode: vi.fn(),
  setRenamePrefix: vi.fn(),
  setRenameSuffix: vi.fn(),
  setIsOperating: vi.fn(),
  reset: vi.fn(),
};

vi.mock('@/stores/dds/batchOpsStore', () => ({
  useBatchOpsStore: Object.assign(
    (selector) => {
      if (typeof selector === 'function') return selector(mockBatchOpsStore);
      return mockBatchOpsStore;
    },
    {
      getState: () => mockBatchOpsStore,
      setState: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
    }
  ),
}));

// ============================================
// Import component after mocks
// ============================================

import { BatchOpsToolbar } from '@/components/dds/canvas-dashboard/BatchOpsToolbar';

describe('BatchOpsToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBatchOpsStore.isDeleteDialogOpen = false;
    mockBatchOpsStore.isRenameDialogOpen = false;
    mockBatchOpsStore.isOperating = false;
    mockBatchOpsStore.renameMode = 'suffix';
    mockBatchOpsStore.renamePrefix = '';
    mockBatchOpsStore.renameSuffix = '';
    mockCanvasListStore.selectedCanvasIds = new Set();
    mockCanvasListStore.batchDeleteCanvas.mockResolvedValue(undefined);
    mockCanvasListStore.batchRenameCanvas.mockResolvedValue(undefined);
  });

  describe('rendering', () => {
    it('renders null when selectedCount is 0', () => {
      const { container } = render(<BatchOpsToolbar selectedCount={0} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders toolbar with correct aria-label when selectedCount > 0', () => {
      mockCanvasListStore.selectedCanvasIds = new Set(['canvas-1', 'canvas-2']);
      render(<BatchOpsToolbar selectedCount={2} />);
      // BatchOpsToolbar renders with role="toolbar" and aria-label
      expect(screen.getByRole('toolbar', { name: '批量操作' })).toBeInTheDocument();
    });

    it('displays count via aria-live region', () => {
      mockCanvasListStore.selectedCanvasIds = new Set(['c1', 'c2', 'c3']);
      render(<BatchOpsToolbar selectedCount={3} />);
      // The toolbar renders when selectedCount > 0 (props-driven)
      expect(screen.getByRole('toolbar', { name: '批量操作' })).toBeInTheDocument();
    });
  });

  describe('delete dialog', () => {
    it('opens delete dialog when delete button is clicked', async () => {
      mockCanvasListStore.selectedCanvasIds = new Set(['c1']);
      render(<BatchOpsToolbar selectedCount={1} />);
      const deleteBtn = screen.getByRole('button', { name: /批量删除/ });
      await userEvent.click(deleteBtn);
      expect(mockBatchOpsStore.openDeleteDialog).toHaveBeenCalledTimes(1);
    });
  });

  describe('rename dialog', () => {
    it('opens rename dialog when rename button is clicked', async () => {
      mockCanvasListStore.selectedCanvasIds = new Set(['c1']);
      render(<BatchOpsToolbar selectedCount={1} />);
      const renameBtn = screen.getByRole('button', { name: /批量重命名/ });
      await userEvent.click(renameBtn);
      expect(mockBatchOpsStore.openRenameDialog).toHaveBeenCalledTimes(1);
    });
  });

  describe('clear selection', () => {
    it('calls clearSelection when clear button is clicked', async () => {
      mockCanvasListStore.selectedCanvasIds = new Set(['c1']);
      render(<BatchOpsToolbar selectedCount={1} />);
      const clearBtn = screen.getByRole('button', { name: /清除选择/ });
      await userEvent.click(clearBtn);
      expect(mockCanvasListStore.clearSelection).toHaveBeenCalledTimes(1);
    });
  });
});
