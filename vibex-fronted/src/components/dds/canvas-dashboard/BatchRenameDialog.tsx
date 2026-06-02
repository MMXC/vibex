'use client';

import React, { useState, useMemo } from 'react';
import { useCanvasListStore } from '@/stores/canvasListStore';
import styles from './BatchRenameDialog.module.css';

interface BatchRenameDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BatchRenameDialog({ isOpen, onClose }: BatchRenameDialogProps) {
  const selectedCanvasIds = useCanvasListStore((s) => s.selectedCanvasIds);
  const canvases = useCanvasListStore((s) => s.canvases);
  const batchRename = useCanvasListStore((s) => s.batchRename);
  const clearSelection = useCanvasListStore((s) => s.clearSelection);

  const [nameTemplate, setNameTemplate] = useState('');

  if (!isOpen) return null;

  const selectedIds = Array.from(selectedCanvasIds);
  const selectedCanvases = selectedIds
    .map((id) => canvases.find((c) => c.id === id))
    .filter(Boolean) as typeof canvases;

  const previews = useMemo(() => {
    if (!nameTemplate.trim()) return [];
    return selectedCanvases.map((canvas, i) => ({
      oldName: canvas.name,
      newName: nameTemplate.replace(/\{n\}/g, String(i + 1)),
    }));
  }, [nameTemplate, selectedCanvases]);

  const handleConfirm = async () => {
    if (!nameTemplate.trim()) return;
    const ops = selectedCanvases.map((canvas, i) => ({
      id: canvas.id,
      name: nameTemplate.replace(/\{n\}/g, String(i + 1)),
    }));
    await batchRename(ops);
    clearSelection();
    setNameTemplate('');
    onClose();
  };

  const handleClose = () => {
    setNameTemplate('');
    onClose();
  };

  return (
    <div
      className={styles.dialogOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-rename-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className={styles.dialog}>
        <h2 id="batch-rename-title" className={styles.dialogTitle}>
          批量重命名 {selectedIds.length} 个画布
        </h2>

        <p className={styles.dialogBody}>
          输入名称模板，使用 <code>{'{n}'}</code> 表示序号占位符。
          例如：「画布 {'{n}'}」→ 重命名为「画布 1」「画布 2」…
        </p>

        <input
          type="text"
          className={styles.nameInput}
          value={nameTemplate}
          onChange={(e) => setNameTemplate(e.target.value)}
          placeholder="画布 {n}"
          aria-label="名称模板"
          data-testid="batch-rename-input"
          autoFocus
        />
        <p className={styles.placeholderHint}>
          {'{n}'} — 1-based 序号占位符，会替换为 1、2、3…
        </p>

        {previews.length > 0 && (
          <div className={styles.preview}>
            <p className={styles.previewTitle}>预览</p>
            <ul className={styles.previewList}>
              {previews.map((p, i) => (
                <li key={i} className={styles.previewItem}>
                  <span>{p.oldName}</span>
                  <span className={styles.previewItemArrow}>→</span>
                  <span className={styles.previewItemNew}>{p.newName}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.dialogActions}>
          <button
            type="button"
            className={styles.dialogCancel}
            onClick={handleClose}
            data-testid="batch-rename-cancel"
          >
            取消
          </button>
          <button
            type="button"
            className={styles.dialogConfirm}
            onClick={handleConfirm}
            disabled={!nameTemplate.trim()}
            data-testid="batch-rename-confirm"
          >
            确认重命名
          </button>
        </div>
      </div>
    </div>
  );
}
