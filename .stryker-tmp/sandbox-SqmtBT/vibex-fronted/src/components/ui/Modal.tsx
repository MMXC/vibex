// @ts-nocheck
'use client';

import React, { useEffect, useCallback } from 'react';
import styles from './Modal.module.css';

export interface ModalProps {
  /** 是否显示 Modal */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 标题 */
  title?: React.ReactNode;
  /** Modal 内容 */
  children?: React.ReactNode;
  /** 底部操作区域 */
  footer?: React.ReactNode;
  /** 是否显示关闭按钮 */
  showClose?: boolean;
  /** Modal 宽度 */
  width?: string | number;
  /** 是否点击遮罩层关闭 */
  maskClosable?: boolean;
  /** 是否显示遮罩层 */
  mask?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 确认按钮文本 */
  okText?: string;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 确认按钮加载状态 */
  confirmLoading?: boolean;
  /** 确认回调 */
  onConfirm?: () => void;
  /** 取消回调 */
  onCancel?: () => void;
  /** 是否显示取消按钮 */
  showCancel?: boolean;
  /** 是否显示确认按钮 */
  showConfirm?: boolean;
  /** 是否在关闭时卸载内容 (用于动画) */
  destroyOnClose?: boolean;
  /** Modal 的 z-index */
  zIndex?: number;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  showClose = true,
  width = 520,
  maskClosable = true,
  mask = true,
  className = '',
  style,
  okText = '确认',
  cancelText = '取消',
  confirmLoading = false,
  onConfirm,
  onCancel,
  showCancel = true,
  showConfirm = true,
  destroyOnClose = false,
  zIndex = 1000,
}: ModalProps) {
  // 处理 ESC 键关闭
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    },
    [open, onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      // 防止背景滚动
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  // 处理遮罩层点击
  const handleMaskClick = () => {
    if (maskClosable) {
      onClose();
    }
  };

  // 处理确认
  const handleConfirm = () => {
    onConfirm?.();
  };

  // 处理取消
  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  // 如果不显示且不销毁，则返回 null
  if (!open && !destroyOnClose) return null;

  // 如果不显示且要销毁
  if (!open && destroyOnClose) return null;

  return (
    <>
      {mask && (
        <div
          className={`${styles.mask} ${open ? styles.maskVisible : styles.maskHidden}`}
          onClick={handleMaskClick}
          style={{ zIndex }}
        />
      )}
      <div
        className={`${styles.wrapper} ${open ? styles.wrapperVisible : styles.wrapperHidden}`}
        style={{ zIndex: zIndex + 1 }}
      >
        <div
          className={`${styles.modal} ${className}`}
          style={{
            width: typeof width === 'number' ? `${width}px` : width,
            ...style,
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
        >
          {/* 头部 */}
          {(title || showClose) && (
            <div className={styles.header}>
              {title && (
                <h3 id="modal-title" className={styles.title}>
                  {title}
                </h3>
              )}
              {showClose && (
                <button
                  className={styles.closeButton}
                  onClick={onClose}
                  type="button"
                  aria-label="关闭"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18 6L6 18M6 6L18 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* 内容 */}
          {children && <div className={styles.body}>{children}</div>}

          {/* 底部 */}
          {(footer || showCancel || showConfirm) && (
            <div className={styles.footer}>
              {footer || (
                <>
                  {showCancel && (
                    <button
                      className={styles.cancelButton}
                      onClick={handleCancel}
                      type="button"
                    >
                      {cancelText}
                    </button>
                  )}
                  {showConfirm && (
                    <button
                      className={styles.confirmButton}
                      onClick={handleConfirm}
                      type="button"
                      disabled={confirmLoading}
                    >
                      {confirmLoading ? (
                        <span className={styles.spinner}>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeDasharray="31.4 31.4"
                            />
                          </svg>
                        </span>
                      ) : (
                        okText
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// 简化版 confirm
export interface ConfirmModalProps {
  open: boolean;
  title?: React.ReactNode;
  content?: React.ReactNode;
  onConfirm: () => void;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
  width?: string | number;
  showCancel?: boolean;
  showConfirm?: boolean;
  maskClosable?: boolean;
}

export function ConfirmModal({
  open,
  title = '确认',
  content,
  onConfirm,
  onCancel,
  okText = '确认',
  cancelText = '取消',
  confirmLoading = false,
  width = 420,
}: ConfirmModalProps) {
  const handleCancel = () => {
    onCancel?.();
  };

  return (
    <Modal
      open={open}
      title={title}
      width={width}
      showCancel
      showConfirm
      okText={okText}
      cancelText={cancelText}
      confirmLoading={confirmLoading}
      onConfirm={onConfirm}
      onCancel={handleCancel}
      onClose={handleCancel}
      maskClosable={!confirmLoading}
    >
      {content}
    </Modal>
  );
}

// 使用 hook 创建可编程的 Modal
export interface ModalOptions {
  title?: React.ReactNode;
  content?: React.ReactNode;
  width?: string | number;
  okText?: string;
  cancelText?: string;
  showCancel?: boolean;
  showConfirm?: boolean;
  onOk?: () => void | Promise<void>;
  onCancel?: () => void;
}

export function useModal() {
  const [modalState, setModalState] = React.useState<{
    open: boolean;
    options: ModalOptions;
    resolve: ((value: boolean) => void) | null;
  }>({
    open: false,
    options: {},
    resolve: null,
  });

  const confirm = (options: ModalOptions = {}): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        open: true,
        options,
        resolve,
      });
    });
  };

  const handleConfirm = async () => {
    const { resolve, options } = modalState;
    if (options.onOk) {
      await options.onOk();
    }
    resolve?.(true);
    setModalState((prev) => ({ ...prev, open: false }));
  };

  const handleCancel = () => {
    const { resolve, options } = modalState;
    if (options.onCancel) {
      options.onCancel();
    }
    resolve?.(false);
    setModalState((prev) => ({ ...prev, open: false }));
  };

  const ModalComponent = () => (
    <ConfirmModal
      open={modalState.open}
      title={modalState.options.title}
      content={modalState.options.content}
      width={modalState.options.width || 420}
      okText={modalState.options.okText}
      cancelText={modalState.options.cancelText}
      showCancel={modalState.options.showCancel !== false}
      showConfirm={modalState.options.showConfirm !== false}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return {
    confirm,
    Modal: ModalComponent,
  };
}

export default Modal;
