/**
 * ConfirmDialog.test.tsx
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';
import { useConfirmDialogStore } from '@/lib/canvas/stores/confirmDialogStore';

describe('ConfirmDialog', () => {
  it('isOpen=false 时不渲染', () => {
    render(<ConfirmDialog />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('isOpen=true 时显示标题和消息', () => {
    useConfirmDialogStore.setState({
      isOpen: true,
      title: '确认删除',
      message: '确定要删除 3 个节点吗？',
      confirmLabel: '删除',
      cancelLabel: '取消',
      destructive: true,
    });

    render(<ConfirmDialog />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('确认删除')).toBeInTheDocument();
    expect(screen.getByText('确定要删除 3 个节点吗？')).toBeInTheDocument();
    expect(screen.getByText('删除')).toBeInTheDocument();
    expect(screen.getByText('取消')).toBeInTheDocument();
  });

  it('点击确认按钮调用 confirm', () => {
    const confirm = vi.fn();
    useConfirmDialogStore.setState({
      isOpen: true,
      title: 'Test',
      message: 'Test message',
      confirmLabel: 'OK',
      cancelLabel: 'Cancel',
      onConfirm: confirm,
    });

    render(<ConfirmDialog />);
    fireEvent.click(screen.getByText('OK'));

    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it('点击取消按钮调用 cancel', () => {
    const cancel = vi.fn();
    useConfirmDialogStore.setState({
      isOpen: true,
      title: 'Test',
      message: 'Test message',
      onCancel: cancel,
    });

    render(<ConfirmDialog />);
    fireEvent.click(screen.getByText('Cancel'));

    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('点击遮罩层调用 close', () => {
    const close = vi.fn();
    useConfirmDialogStore.setState({
      isOpen: true,
      title: 'Test',
      message: 'Test message',
      onCancel: close,
    });

    render(<ConfirmDialog />);
    // Click the backdrop (the outer fixed div with the onClick handler)
    // The dialog itself has role="dialog", its parentElement is the backdrop
    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.parentElement!;
    fireEvent.click(backdrop);
    expect(close).toHaveBeenCalledTimes(1);
  });
});
