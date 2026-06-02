/**
 * CreateCanvasDialog.tsx — Sprint55 E3: Create Canvas Dialog
 *
 * Simple dialog for naming a new canvas before creation.
 * Uses native <dialog> element for accessibility.
 * When user confirms, fires onConfirm — parent handles actual creation + navigation.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './CreateCanvasDialog.module.css';

interface CreateCanvasDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when user confirms — dialog calls this, parent navigates */
  onConfirm: () => void;
}

export function CreateCanvasDialog({ isOpen, onClose, onConfirm }: CreateCanvasDialogProps) {
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      setName('');
      dialog.showModal();
      // Focus input after show
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      dialog.close();
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setIsCreating(true);
    try {
      await onConfirm();
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClose={onClose}
      aria-labelledby="create-canvas-title"
    >
      <div className={styles.content}>
        <h2 id="create-canvas-title" className={styles.title}>
          新建画布
        </h2>
        <p className={styles.hint}>为你的新画布起个名字</p>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="例如：用户管理模块"
          maxLength={80}
          aria-label="画布名称"
          data-testid="create-canvas-name-input"
        />
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isCreating}
          >
            取消
          </button>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={isCreating}
            data-testid="create-canvas-confirm-btn"
          >
            {isCreating ? '创建中…' : '创建'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
