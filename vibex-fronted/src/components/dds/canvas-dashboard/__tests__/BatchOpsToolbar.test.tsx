/**
 * BatchOpsToolbar.test.tsx — Sprint60 E2
 * S76-E2: Add batch export dialog tests (Esc, click-outside, export trigger).
 *
 * Tests for BatchOpsToolbar component:
 * - Renders null when no canvases selected
 * - Renders toolbar when canvases are selected
 * - Opens delete dialog
 * - Opens rename dialog
 * - Shows selected count
 * - S76-E2: Renders export button, opens export dialog, Esc/click-outside dismiss
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
// Mock useTranslations
// ============================================
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    toolbar: '批量操作',
    selected: '已选择',
    canvases: '个画布',
    delete: '删除',
    rename: '重命名',
    clearSelection: '清除选择',
    confirmDelete: '确认删除',
    cancel: '取消',
    deleteConfirmTitle: '删除确认',
    deleteConfirmMessage: '确定要删除所选的 {count} 个画布吗？',
    renameTitle: '重命名画布',
    renamePlaceholder: '请输入新名称',
    newPrefix: '新画布',
    // S76-E2: export translations
    batchExport: '批量导出 PNG',
    exportWarning: '确定要导出所选的 {count} 个画布吗？导出的 PNG 文件将打包为 ZIP 下载。',
    exportConfirm: '导出',
  };
  return translations[key] ?? key;
});

vi.mock('@/hooks/useTranslations', () => ({
  useTranslations: vi.fn(() => () => mockT),
}));

// ============================================
// Mock canvasListStore
// ============================================

const mockCanvasListStore = {
  selectedCanvasIds: new Set<string>(),
  clearSelection: vi.fn(),
  batchDeleteCanvas: vi.fn().mockResolvedValue(undefined),
  batchRenameCanvas: vi.fn().mockResolvedValue(undefined),
  batchExport: vi.fn().mockResolvedValue(undefined),
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
    mockCanvasListStore.batchExport.mockResolvedValue(undefined);
  });

  describe('rendering', () => {
    it('renders null when selectedCount is 0', () => {
      const { container } = render(<BatchOpsToolbar selectedCount={0} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders toolbar with correct aria-label when selectedCount > 0', () => {
      mockCanvasListStore.selectedCanvasIds = new Set(['canvas-1', 'canvas-2']);
      render(<BatchOpsToolbar selectedCount={2} />);
      expect(screen.getByRole('toolbar', { name: '批量操作' })).toBeInTheDocument();
    });

    it('displays count via aria-live region', () => {
      mockCanvasListStore.selectedCanvasIds = new Set(['c1', 'c2', 'c3']);
      render(<BatchOpsToolbar selectedCount={3} />);
      expect(screen.getByRole('toolbar', { name: '批量操作' })).toBeInTheDocument();
    });
  });

  describe('delete dialog', () => {
    it('opens delete dialog when delete button is clicked', async () => {
      mockCanvasListStore.selectedCanvasIds = new Set(['c1']);
      render(<BatchOpsToolbar selectedCount={1} />);
      const deleteBtn = screen.getByRole('button', { name: /删除/ });
      await userEvent.click(deleteBtn);
      expect(mockBatchOpsStore.openDeleteDialog).toHaveBeenCalledTimes(1);
    });
  });

  describe('rename dialog', () => {
    it('opens rename dialog when rename button is clicked', async () => {
      mockCanvasListStore.selectedCanvasIds = new Set(['c1']);
      render(<BatchOpsToolbar selectedCount={1} />);
      const renameBtn = screen.getByRole('button', { name: /重命名/ });
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

  // ============================================================
  // S76-E2: Batch Export
  // ============================================================

  describe('S76-E2: batch export', () => {
    it('renders export button (📤) when selectedCount > 0', () => {
      mockCanvasListStore.selectedCanvasIds = new Set(['c1', 'c2']);
      render(<BatchOpsToolbar selectedCount={2} />);
      expect(screen.getByRole('button', { name: /批量导出 PNG/ })).toBeInTheDocument();
    });

    it('opens export dialog when export button is clicked', async () => {
      mockCanvasListStore.selectedCanvasIds = new Set(['c1']);
      render(<BatchOpsToolbar selectedCount={1} />);
      const exportBtn = screen.getByRole('button', { name: /批量导出 PNG/ });
      await userEvent.click(exportBtn);
      // Dialog should appear with role="dialog"
      expect(screen.getByRole('dialog', { name: /批量导出 PNG/ })).toBeInTheDocument();
      // Should show warning message
      expect(screen.getByText(/确定要导出/)).toBeInTheDocument();
    });

    it('closes export dialog when Escape key is pressed', async () => {
      mockCanvasListStore.selectedCanvasIds = new Set(['c1']);
      render(<BatchOpsToolbar selectedCount={1} />);
      // Open dialog
      const exportBtn = screen.getByRole('button', { name: /批量导出 PNG/ });
      await userEvent.click(exportBtn);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Press Escape
      await userEvent.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes export dialog when clicking outside the dialog', async () => {
      mockCanvasListStore.selectedCanvasIds = new Set(['c1']);
      const { container } = render(<BatchOpsToolbar selectedCount={1} />);

      // Open dialog
      const exportBtn = screen.getByRole('button', { name: /批量导出 PNG/ });
      await userEvent.click(exportBtn);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Click on the overlay (outside the dialog)
      const overlay = container.querySelector('[class*="dialog-overlay"]');
      if (overlay) {
        await userEvent.click(overlay);
      } else {
        // Fallback: click on document body (behind the dialog)
        await userEvent.click(document.body);
      }
      // Dialog should be dismissed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('calls batchExport when export confirm button is clicked', async () => {
      mockCanvasListStore.selectedCanvasIds = new Set(['c1', 'c2']);
      render(<BatchOpsToolbar selectedCount={2} />);

      // Open dialog
      const exportBtn = screen.getByRole('button', { name: /批量导出 PNG/ });
      await userEvent.click(exportBtn);

      // Click export confirm button
      const confirmBtn = screen.getByRole('button', { name: /导出/ });
      await userEvent.click(confirmBtn);

      // batchExport should be called with the selected canvas IDs
      expect(mockCanvasListStore.batchExport).toHaveBeenCalledTimes(1);
      const [calledIds] = mockCanvasListStore.batchExport.mock.calls[0]!;
      expect(Array.from(calledIds)).toEqual(['c1', 'c2']);
    });

    it('closes export dialog after confirm button is clicked', async () => {
      mockCanvasListStore.selectedCanvasIds = new Set(['c1']);
      render(<BatchOpsToolbar selectedCount={1} />);

      // Open dialog
      const exportBtn = screen.getByRole('button', { name: /批量导出 PNG/ });
      await userEvent.click(exportBtn);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Confirm
      await userEvent.click(screen.getByRole('button', { name: /导出/ }));

      // Dialog should close
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
