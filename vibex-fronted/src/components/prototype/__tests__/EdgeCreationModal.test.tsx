/**
 * EdgeCreationModal — Component Tests
 * E1-QA: E1-U3
 *
 * Verifies:
 * - case 1: Normal flow — select source → target → confirm → onConfirm called
 * - case 2: Cancel — click cancel → onCancel called, onConfirm not called
 * - case 3: Same source/target → confirm button disabled
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EdgeCreationModal } from '../EdgeCreationModal';
import type { ProtoPage } from '@/stores/prototypeStore';

const mockPages: ProtoPage[] = [
  { id: 'page-1', name: '首页', route: '/' },
  { id: 'page-2', name: '关于我们', route: '/about' },
  { id: 'page-3', name: '联系', route: '/contact' },
];

describe('EdgeCreationModal — E1-QA', () => {
  describe('rendering', () => {
    it('renders modal when open=true', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      render(
        <EdgeCreationModal
          open={true}
          pages={mockPages}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '确定' })).toBeInTheDocument();
    });

    it('returns null when open=false', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      const { container } = render(
        <EdgeCreationModal
          open={false}
          pages={mockPages}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('shows empty state when pages < 2', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      render(
        <EdgeCreationModal
          open={true}
          pages={[{ id: 'page-1', name: '首页', route: '/' }]}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );
      expect(screen.getByText('需要至少 2 个页面才能创建连线')).toBeInTheDocument();
    });
  });

  describe('case 1: normal flow', () => {
    it('calls onConfirm with source and target page IDs when confirmed', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      render(
        <EdgeCreationModal
          open={true}
          pages={mockPages}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      // Select source page
      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: 'page-1' } });

      // Select target page
      fireEvent.change(selects[1], { target: { value: 'page-2' } });

      // Click confirm
      fireEvent.click(screen.getByRole('button', { name: '确定' }));

      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onConfirm).toHaveBeenCalledWith('page-1', 'page-2');
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('case 2: cancel', () => {
    it('calls onCancel when cancel button is clicked', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      render(
        <EdgeCreationModal
          open={true}
          pages={mockPages}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: '取消' }));

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('calls onCancel when close button is clicked', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      render(
        <EdgeCreationModal
          open={true}
          pages={mockPages}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: '关闭' }));

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('case 3: same source/target validation', () => {
    it('disables confirm button when source === target', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      render(
        <EdgeCreationModal
          open={true}
          pages={mockPages}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const selects = screen.getAllByRole('combobox');
      // Select the same page for both source and target
      fireEvent.change(selects[0], { target: { value: 'page-1' } });
      fireEvent.change(selects[1], { target: { value: 'page-1' } });

      const confirmBtn = screen.getByRole('button', { name: '确定' });
      expect(confirmBtn).toBeDisabled();
    });

    it('shows error message when source === target', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      render(
        <EdgeCreationModal
          open={true}
          pages={mockPages}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: 'page-1' } });
      fireEvent.change(selects[1], { target: { value: 'page-1' } });

      expect(screen.getByText('源页面和目标页面不能相同')).toBeInTheDocument();
    });
  });
});
