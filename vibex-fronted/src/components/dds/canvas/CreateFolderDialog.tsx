/**
 * CreateFolderDialog.tsx — Folder creation dialog with validation
 * E2 DoD: D2.4 — Chinese name support + empty/duplicate validation
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useCanvasFolderStore } from '@/stores/dds/canvasFolderStore';
import styles from './CreateFolderDialog.module.css';

interface CreateFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  parentId?: string | null;
  /** Optional: editing an existing folder */
  editingFolderId?: string | null;
}

export function CreateFolderDialog({
  isOpen,
  onClose,
  parentId = null,
  editingFolderId = null,
}: CreateFolderDialogProps) {
  const isEditing = !!editingFolderId;
  const store = useCanvasFolderStore();

  const existingFolder = isEditing ? store.getFolderById(editingFolderId!) : null;

  const [name, setName] = useState(existingFolder?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(existingFolder?.name ?? '');
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, existingFolder]);

  const validate = useCallback(
    (value: string): string | null => {
      const trimmed = value.trim();
      if (!trimmed) return '文件夹名称不能为空';
      if (store.isFolderNameTaken(trimmed, parentId, editingFolderId ?? undefined)) {
        return '该文件夹名称已存在';
      }
      if (trimmed.length > 50) return '文件夹名称不能超过 50 个字符';
      return null;
    },
    [store, parentId, editingFolderId]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const err = validate(name);
      if (err) {
        setError(err);
        return;
      }
      if (isEditing) {
        store.renameFolder(editingFolderId!, name.trim());
      } else {
        store.createFolder(name.trim(), parentId);
      }
      onClose();
    },
    [name, validate, isEditing, editingFolderId, store, parentId, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className={styles['dialog-overlay']}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? '编辑文件夹' : '新建文件夹'}
    >
      <div className={styles['dialog']}>
        <div className={styles['dialog__header']}>
          <h3 className={styles['dialog__title']}>
            {isEditing ? '编辑文件夹' : '新建文件夹'}
          </h3>
          <button
            className={styles['dialog__close']}
            onClick={onClose}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles['dialog__form']}>
          <div className={styles['dialog__field']}>
            <label className={styles['dialog__label']} htmlFor="folder-name">
              文件夹名称
            </label>
            <input
              id="folder-name"
              ref={inputRef}
              type="text"
              className={`${styles['dialog__input']} ${error ? styles['dialog__input--error'] : ''}`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="输入文件夹名称..."
              maxLength={50}
              aria-describedby={error ? 'folder-name-error' : undefined}
            />
            {error && (
              <span id="folder-name-error" className={styles['dialog__error']} role="alert">
                {error}
              </span>
            )}
          </div>

          <div className={styles['dialog__actions']}>
            <button type="button" className={styles['dialog__btn-cancel']} onClick={onClose}>
              取消
            </button>
            <button type="submit" className={styles['dialog__btn-confirm']}>
              {isEditing ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
