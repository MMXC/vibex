/**
 * confirmDialogStore.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useConfirmDialogStore } from './confirmDialogStore';

describe('useConfirmDialogStore', () => {
  beforeEach(() => {
    useConfirmDialogStore.setState({
      isOpen: false,
      title: '',
      message: '',
      confirmLabel: 'Confirm',
      cancelLabel: 'Cancel',
      destructive: false,
      onConfirm: undefined,
      onCancel: undefined,
    });
  });

  it('初始状态 isOpen 为 false', () => {
    const state = useConfirmDialogStore.getState();
    expect(state.isOpen).toBe(false);
  });

  it('open 设置 isOpen=true 和正确的内容', () => {
    const onConfirm = vi.fn();
    useConfirmDialogStore.getState().open({
      title: '确认删除',
      message: '确定要删除吗？',
      confirmLabel: '删除',
      cancelLabel: '取消',
      destructive: true,
      onConfirm,
    });

    const state = useConfirmDialogStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.title).toBe('确认删除');
    expect(state.message).toBe('确定要删除吗？');
    expect(state.confirmLabel).toBe('删除');
    expect(state.destructive).toBe(true);
    expect(state.onConfirm).toBe(onConfirm);
  });

  it('confirm 调用 onConfirm 并重置状态', () => {
    const onConfirm = vi.fn();
    useConfirmDialogStore.getState().open({
      title: 'Test',
      message: 'Test message',
      onConfirm,
    });
    useConfirmDialogStore.getState().confirm();

    expect(onConfirm).toHaveBeenCalledTimes(1);
    const state = useConfirmDialogStore.getState();
    expect(state.isOpen).toBe(false);
  });

  it('close 重置状态', () => {
    useConfirmDialogStore.getState().open({
      title: 'Test',
      message: 'Test message',
    });
    useConfirmDialogStore.getState().close();

    const state = useConfirmDialogStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.title).toBe('');
  });

  it('cancel 调用 onCancel 并重置状态', () => {
    const onCancel = vi.fn();
    useConfirmDialogStore.getState().open({
      title: 'Test',
      message: 'Test message',
      onCancel,
    });
    useConfirmDialogStore.getState().cancel();

    expect(onCancel).toHaveBeenCalledTimes(1);
    const state = useConfirmDialogStore.getState();
    expect(state.isOpen).toBe(false);
  });

  it('默认 confirmLabel 为 Confirm', () => {
    useConfirmDialogStore.getState().open({
      title: 'Test',
      message: 'Test message',
    });
    const state = useConfirmDialogStore.getState();
    expect(state.confirmLabel).toBe('Confirm');
    expect(state.cancelLabel).toBe('Cancel');
    expect(state.destructive).toBe(false);
  });
});
