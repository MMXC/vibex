/**
 * BatchOpsPanel.test.tsx — S72-E2: BatchOpsPanel component tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ============================================
// Mock indexedDB
// ============================================

const mockIDB = { open: vi.fn() };
Object.defineProperty(globalThis, 'indexedDB', {
  value: mockIDB,
  writable: true,
  configurable: true,
});

// ============================================
// Mock data
// ============================================

const mockTemplates = [
  { id: 'tpl-1', name: 'Template One', category: 'business' as const, tags: ['sales'], description: 'First template', thumbnail: '' },
  { id: 'tpl-2', name: 'Template Two', category: 'tech' as const, tags: [], description: 'Second template', thumbnail: '' },
];

const mockTemplateStoreState = {
  templates: mockTemplates,
};

const mockBatchOpsState = {
  isPanelOpen: false,
  selectedTemplateIds: [] as string[],
  isOperating: false,
  openPanel: vi.fn(),
  closePanel: vi.fn(),
  selectAllTemplates: vi.fn(),
  clearSelection: vi.fn(),
  toggleTemplateSelection: vi.fn(),
  deleteSelectedTemplates: vi.fn(),
  moveSelectedToFolder: vi.fn(),
  exportSelectedTemplates: vi.fn(),
  isDeleteDialogOpen: false,
  isRenameDialogOpen: false,
  renameMode: 'suffix' as const,
  renamePrefix: '',
  renameSuffix: '',
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

vi.mock('@/stores/dds/batchOpsStore', () => {
  return {
    useBatchOpsStore: Object.assign(
      vi.fn(() => mockBatchOpsState),
      { getState: () => mockBatchOpsState }
    ),
  };
});

vi.mock('@/stores/templateStore', () => ({
  useTemplateStore: vi.fn((selector?: (s: typeof mockTemplateStoreState) => unknown) => {
    if (typeof selector === 'function') {
      return selector(mockTemplateStoreState as typeof mockTemplateStoreState);
    }
    return mockTemplateStoreState as typeof mockTemplateStoreState;
  }),
}));

import { BatchOpsPanel } from '../BatchOpsPanel';

describe('BatchOpsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBatchOpsState.isPanelOpen = false;
    mockBatchOpsState.selectedTemplateIds = [];
    mockBatchOpsState.isOperating = false;
  });

  it('renders nothing when panel is closed', () => {
    mockBatchOpsState.isPanelOpen = false;
    render(<BatchOpsPanel />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders panel header when open', () => {
    mockBatchOpsState.isPanelOpen = true;
    render(<BatchOpsPanel />);
    expect(screen.getByRole('dialog', { name: '批量操作面板' })).toBeInTheDocument();
  });

  it('shows empty state when no templates selected', () => {
    mockBatchOpsState.isPanelOpen = true;
    mockBatchOpsState.selectedTemplateIds = [];
    render(<BatchOpsPanel />);
    expect(screen.getByText('未选择任何模板')).toBeInTheDocument();
    expect(screen.getByText(/从模板列表中选择模板后/)).toBeInTheDocument();
  });

  it('shows selected template count', () => {
    mockBatchOpsState.isPanelOpen = true;
    mockBatchOpsState.selectedTemplateIds = ['tpl-1', 'tpl-2'];
    render(<BatchOpsPanel />);
    expect(screen.getByText(/已选 2 个模板/)).toBeInTheDocument();
  });

  it('shows selected templates with name and id', () => {
    mockBatchOpsState.isPanelOpen = true;
    mockBatchOpsState.selectedTemplateIds = ['tpl-1'];
    render(<BatchOpsPanel />);
    expect(screen.getByText('Template One')).toBeInTheDocument();
    expect(screen.getByText('tpl-1')).toBeInTheDocument();
  });

  it('全选 button calls selectAllTemplates with all template ids', () => {
    mockBatchOpsState.isPanelOpen = true;
    mockBatchOpsState.selectedTemplateIds = [];
    render(<BatchOpsPanel />);
    fireEvent.click(screen.getByText('全选'));
    expect(mockBatchOpsState.selectAllTemplates).toHaveBeenCalledWith(['tpl-1', 'tpl-2']);
  });

  it('取消选择 button calls clearSelection', () => {
    mockBatchOpsState.isPanelOpen = true;
    mockBatchOpsState.selectedTemplateIds = ['tpl-1'];
    render(<BatchOpsPanel />);
    fireEvent.click(screen.getByText('取消选择'));
    expect(mockBatchOpsState.clearSelection).toHaveBeenCalled();
  });

  it('关闭 button calls closePanel', () => {
    mockBatchOpsState.isPanelOpen = true;
    render(<BatchOpsPanel />);
    fireEvent.click(screen.getByRole('button', { name: '关闭' }));
    expect(mockBatchOpsState.closePanel).toHaveBeenCalled();
  });

  it('批量删除 button is disabled when nothing selected', () => {
    mockBatchOpsState.isPanelOpen = true;
    mockBatchOpsState.selectedTemplateIds = [];
    render(<BatchOpsPanel />);
    const deleteBtn = screen.getByRole('button', { name: /批量删除/ });
    expect(deleteBtn).toBeDisabled();
  });

  it('批量删除 button is enabled when templates are selected', () => {
    mockBatchOpsState.isPanelOpen = true;
    mockBatchOpsState.selectedTemplateIds = ['tpl-1'];
    render(<BatchOpsPanel />);
    const deleteBtn = screen.getByRole('button', { name: /批量删除/ });
    expect(deleteBtn).not.toBeDisabled();
  });

  it('点击 template item toggles selection', () => {
    mockBatchOpsState.isPanelOpen = true;
    mockBatchOpsState.selectedTemplateIds = ['tpl-1']; // must have selected items for them to appear
    render(<BatchOpsPanel />);
    // Click on the template item by finding its container
    const items = screen.getAllByRole('option');
    expect(items.length).toBeGreaterThan(0);
    fireEvent.click(items[0]);
    expect(mockBatchOpsState.toggleTemplateSelection).toHaveBeenCalled();
  });

  it('导出 CSV button calls exportSelectedTemplates with csv', () => {
    mockBatchOpsState.isPanelOpen = true;
    mockBatchOpsState.selectedTemplateIds = ['tpl-1'];
    render(<BatchOpsPanel />);
    fireEvent.click(screen.getByRole('button', { name: '导出 CSV' }));
    expect(mockBatchOpsState.exportSelectedTemplates).toHaveBeenCalledWith('csv');
  });

  it('导出 JSON button calls exportSelectedTemplates with json', () => {
    mockBatchOpsState.isPanelOpen = true;
    mockBatchOpsState.selectedTemplateIds = ['tpl-1'];
    render(<BatchOpsPanel />);
    fireEvent.click(screen.getByRole('button', { name: '导出 JSON' }));
    expect(mockBatchOpsState.exportSelectedTemplates).toHaveBeenCalledWith('json');
  });
});
