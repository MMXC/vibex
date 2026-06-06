/**
 * TemplatePreviewPanel.test.tsx — S72-E5: Template Preview Panel Tests
 *
 * Tests: panel open/close, node list rendering, node detail selection,
 * and import button triggering importTemplate.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ---- Mock data ----
const mockNodes = [
  { id: 'item-1', title: '用户登录', type: 'epic', description: '实现用户登录功能', priority: 'P0', inboundCount: 0, outboundCount: 2 },
  { id: 'item-2', title: '注册流程', type: 'feature', description: '注册新用户', priority: 'P1', inboundCount: 1, outboundCount: 1 },
  { id: 'item-3', title: '找回密码', type: 'story', description: '密码找回', priority: 'P2', inboundCount: 2, outboundCount: 0 },
];

const mockTemplate = {
  id: 'tpl-preview-1',
  name: '电商平台模板',
  description: '完整电商解决方案',
  category: 'ecommerce' as const,
  content: 'some content',
  items: [
    { id: 'item-1', templateId: 'tpl-preview-1', type: 'epic' as const, title: '用户登录', description: '实现用户登录功能', priority: 'P0' as const, acceptanceCriteria: [], dependencies: ['item-2', 'item-3'], technicalNotes: '', status: 'draft' as const },
    { id: 'item-2', templateId: 'tpl-preview-1', type: 'feature' as const, title: '注册流程', description: '注册新用户', priority: 'P1' as const, acceptanceCriteria: [], dependencies: ['item-3'], technicalNotes: '', status: 'draft' as const },
    { id: 'item-3', templateId: 'tpl-preview-1', type: 'story' as const, title: '找回密码', description: '密码找回', priority: 'P2' as const, acceptanceCriteria: [], dependencies: [], technicalNotes: '', status: 'draft' as const },
  ],
};

// ---- Store mock ----
const mockStore = {
  templates: [mockTemplate],
  getTemplateNodes: (id: string) => (id === 'tpl-preview-1' ? mockNodes : []),
  applyTemplate: vi.fn(),
  selectTemplate: vi.fn(),
};

vi.mock('@/stores/templateStore', () => ({
  useTemplateStore: vi.fn((selector?: (s: typeof mockStore) => unknown) => {
    if (selector) return selector(mockStore);
    return mockStore;
  }),
}));

import { TemplatePreviewPanel } from '../TemplatePreviewPanel';

describe('TemplatePreviewPanel — S72-E5', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    render(<TemplatePreviewPanel templateId="tpl-preview-1" open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows template name and node count when open', () => {
    render(<TemplatePreviewPanel templateId="tpl-preview-1" open={true} onClose={vi.fn()} />);
    expect(screen.getByText('电商平台模板')).toBeTruthy();
    expect(screen.getByText('3 个节点')).toBeTruthy();
  });

  it('renders all node rows', () => {
    render(<TemplatePreviewPanel templateId="tpl-preview-1" open={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('node-list').querySelectorAll('button').length).toBe(3);
    expect(screen.getByText('用户登录')).toBeTruthy();
    expect(screen.getByText('注册流程')).toBeTruthy();
    expect(screen.getByText('找回密码')).toBeTruthy();
  });

  it('shows empty state when no nodes', () => {
    render(<TemplatePreviewPanel templateId="non-existent" open={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('empty-nodes')).toBeTruthy();
  });

  it('shows node detail when a node is clicked', () => {
    render(<TemplatePreviewPanel templateId="tpl-preview-1" open={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId('node-item-1'));
    expect(screen.getByTestId('node-detail')).toBeTruthy();
    // Use getAllByText since the title also appears in the node list row
    expect(screen.getAllByText('用户登录').length).toBeGreaterThan(0);
  });

  it('shows "点击节点查看详情" when no node selected', () => {
    render(<TemplatePreviewPanel templateId="tpl-preview-1" open={true} onClose={vi.fn()} />);
    expect(screen.getByText('点击节点查看详情')).toBeTruthy();
  });

  it('import button triggers applyTemplate and calls onClose', () => {
    const handleClose = vi.fn();
    render(<TemplatePreviewPanel templateId="tpl-preview-1" open={true} onClose={handleClose} />);
    fireEvent.click(screen.getByTestId('import-btn'));
    expect(mockStore.applyTemplate).toHaveBeenCalledWith(mockTemplate);
    expect(handleClose).toHaveBeenCalled();
  });

  it('close button calls onClose', () => {
    const handleClose = vi.fn();
    render(<TemplatePreviewPanel templateId="tpl-preview-1" open={true} onClose={handleClose} />);
    fireEvent.click(screen.getByLabelText('关闭'));
    expect(handleClose).toHaveBeenCalled();
  });

  it('shows edge counts in node rows', () => {
    render(<TemplatePreviewPanel templateId="tpl-preview-1" open={true} onClose={vi.fn()} />);
    const item1Row = screen.getByTestId('node-item-1');
    expect(item1Row.textContent).toContain('←0');
    expect(item1Row.textContent).toContain('2→');
  });
});
