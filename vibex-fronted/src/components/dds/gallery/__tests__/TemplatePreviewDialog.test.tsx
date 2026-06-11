/**
 * TemplatePreviewDialog.test.tsx — S88-E3: Template Marketplace Enhancement
 *
 * Unit tests for TemplatePreviewDialog component.
 * Verifies: dialog render, usage count, rating display, tags, insert action, close.
 *
 * DoD: TemplatePreviewDialog.test.tsx — 8 vitest
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import React from 'react';
import { TemplatePreviewDialog } from '../TemplatePreviewDialog';
import type { RequirementTemplate } from '@/data/templates';

const mockTemplate: RequirementTemplate = {
  id: 'tpl-preview',
  name: 'Ecommerce SaaS',
  displayName: '电商 SaaS 模板',
  description: '完整的电商解决方案，含商品、订单、支付模块',
  category: 'ecommerce',
  tags: ['saas', 'ecommerce'],
  icon: '🛒',
  scenes: [],
  metadata: {
    complexity: 'medium',
    estimatedTime: '2 weeks',
    techStack: ['React', 'Node.js'],
    tags: ['saas', 'ecommerce'],
  },
};

describe('TemplatePreviewDialog', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    render(<TemplatePreviewDialog isOpen={false} template={null} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders dialog when open with template details', () => {
    render(<TemplatePreviewDialog isOpen={true} template={mockTemplate} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('电商 SaaS 模板')).toBeInTheDocument();
    expect(screen.getByText('完整的电商解决方案，含商品、订单、支付模块')).toBeInTheDocument();
  });

  it('displays usage count', () => {
    const templateWithUsage = {
      ...mockTemplate,
      usage_count: 1234,
      avg_rating: 4.2,
    } as any;
    render(<TemplatePreviewDialog isOpen={true} template={templateWithUsage} onClose={vi.fn()} />);
    expect(screen.getByText(/已使用 1,234 次/)).toBeInTheDocument();
  });

  it('displays star rating', () => {
    const templateWithRating = {
      ...mockTemplate,
      avg_rating: 4.5,
    } as any;
    render(<TemplatePreviewDialog isOpen={true} template={templateWithRating} onClose={vi.fn()} />);
    expect(screen.getByText(/★/)).toBeInTheDocument();
    expect(screen.getByText(/\(4\.5\)/)).toBeInTheDocument();
  });

  it('displays tags', () => {
    render(<TemplatePreviewDialog isOpen={true} template={mockTemplate} onClose={vi.fn()} />);
    expect(screen.getByText('saas')).toBeInTheDocument();
    expect(screen.getByText('ecommerce')).toBeInTheDocument();
  });

  it('calls onInsert when "Use this template" is clicked', async () => {
    const onInsert = vi.fn();
    const onClose = vi.fn();
    render(<TemplatePreviewDialog isOpen={true} template={mockTemplate} onInsert={onInsert} onClose={onClose} />);
    const btn = screen.getByRole('button', { name: /使用此模板/ });
    fireEvent.click(btn);
    expect(onInsert).toHaveBeenCalledWith(mockTemplate);
  });

  it('closes on cancel button click', () => {
    const onClose = vi.fn();
    render(<TemplatePreviewDialog isOpen={true} template={mockTemplate} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on close button click', () => {
    const onClose = vi.fn();
    render(<TemplatePreviewDialog isOpen={true} template={mockTemplate} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: '关闭' }));
    expect(onClose).toHaveBeenCalled();
  });
});
