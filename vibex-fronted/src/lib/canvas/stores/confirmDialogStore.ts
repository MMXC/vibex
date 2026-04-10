/**
 * confirmDialogStore.ts
 * Zustand store for managing reusable confirmation dialogs.
 * Used before destructive operations (clear, delete all, reset).
 */

import { create } from 'zustand';

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean; // if true, confirm button is red/danger
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ConfirmDialogActions {
  open: (options: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
  }) => void;
  close: () => void;
  confirm: () => void;
  cancel: () => void;
}

type ConfirmDialogStore = ConfirmDialogState & ConfirmDialogActions;

const initialState: ConfirmDialogState = {
  isOpen: false,
  title: '',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  destructive: false,
  onConfirm: undefined,
  onCancel: undefined,
};

export const useConfirmDialogStore = create<ConfirmDialogStore>((set, get) => ({
  ...initialState,

  open: ({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive = false, onConfirm, onCancel }) => {
    set({
      isOpen: true,
      title,
      message,
      confirmLabel,
      cancelLabel,
      destructive,
      onConfirm,
      onCancel,
    });
  },

  close: () => {
    const { onCancel } = get();
    set(initialState);
    onCancel?.();
  },

  confirm: () => {
    const { onConfirm } = get();
    set(initialState);
    onConfirm?.();
  },

  cancel: () => {
    const { onCancel } = get();
    set(initialState);
    onCancel?.();
  },
}));
