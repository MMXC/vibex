/**
 * TemplatePreviewDialog.test.tsx — Sprint54 E5: Template Preview Dialog vitest
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplatePreviewDialog } from '../TemplatePreviewDialog';

// Mock ReactFlow for MiniCanvas
vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-reactflow">{children}</div>
  ),
}));

// Mock MiniCanvas
vi.mock('../MiniCanvas', () => ({
  MiniCanvas: () => <div data-testid="mini-canvas">MiniCanvas</div>,
}));

const mockTemplate = {
  id: 'tpl-1',
  name: 'Test Template',
  description: 'A test template for unit testing',
  icon: '📋',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
  snapshot: JSON.stringify({
    contexts: [],
    flows: [{ nodes: [], edges: [] }],
    decisions: [],
  }),
  category: 'flowchart' as const,
  tags: ['test', 'demo'],
  isPreset: true,
};

describe('TemplatePreviewDialog', () => {
  it('E5.1: renders dialog when isOpen=true and template is provided', () => {
    render(
      <TemplatePreviewDialog
        isOpen={true}
        template={mockTemplate}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Template')).toBeInTheDocument();
    expect(screen.getByText('A test template for unit testing')).toBeInTheDocument();
  });

  it('E5.1: does not render when isOpen=false', () => {
    render(
      <TemplatePreviewDialog
        isOpen={false}
        template={mockTemplate}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('E5.1: does not render when template is null', () => {
    render(
      <TemplatePreviewDialog
        isOpen={true}
        template={null}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('E5.1: renders preview button with correct label', () => {
    render(
      <TemplatePreviewDialog
        isOpen={true}
        template={mockTemplate}
        onClose={vi.fn()}
      />
    );

    const applyBtn = screen.getByRole('button', { name: '应用此模板' });
    expect(applyBtn).toBeInTheDocument();
  });

  it('E5.1: calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    render(
      <TemplatePreviewDialog
        isOpen={true}
        template={mockTemplate}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('E5.1: calls onClose when X button is clicked', () => {
    const onClose = vi.fn();
    render(
      <TemplatePreviewDialog
        isOpen={true}
        template={mockTemplate}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '关闭' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('E5.1: calls onApply and onClose when apply button is clicked', () => {
    const onClose = vi.fn();
    const onApply = vi.fn();
    render(
      <TemplatePreviewDialog
        isOpen={true}
        template={mockTemplate}
        onClose={onClose}
        onApply={onApply}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '应用此模板' }));
    expect(onApply).toHaveBeenCalledWith('tpl-1');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('E5.1: renders category and tags', () => {
    render(
      <TemplatePreviewDialog
        isOpen={true}
        template={mockTemplate}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('flowchart')).toBeInTheDocument();
    expect(screen.getByText('#test')).toBeInTheDocument();
    expect(screen.getByText('#demo')).toBeInTheDocument();
  });

  it('E5.1: renders MiniCanvas for valid snapshot', () => {
    render(
      <TemplatePreviewDialog
        isOpen={true}
        template={mockTemplate}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('mini-canvas')).toBeInTheDocument();
  });

  it('E5.1: shows placeholder for invalid snapshot', () => {
    const badTemplate = { ...mockTemplate, snapshot: 'not valid json' };
    render(
      <TemplatePreviewDialog
        isOpen={true}
        template={badTemplate}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('预览不可用')).toBeInTheDocument();
  });
});
