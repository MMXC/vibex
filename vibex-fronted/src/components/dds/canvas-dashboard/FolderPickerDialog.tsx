'use client';

/**
 * FolderPickerDialog.tsx — S63-E5 DoD: D5.4
 *
 * A dialog that displays the folder tree and allows the user to pick
 * a destination folder for batch-moving canvases.
 * Used by BatchOpsToolbar "移动到" button.
 */

import { useCallback, useState } from 'react';
import { useCanvasFolderStore } from '@/stores/dds/canvasFolderStore';
import styles from './FolderPickerDialog.module.css';

interface FolderPickerDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Title shown at top of dialog */
  title?: string;
  /** Callback when user confirms a folder selection */
  onConfirm: (folderId: string | null) => void;
  /** Callback when user cancels */
  onCancel: () => void;
}

/** Flat folder item for radio-button display */
interface FlatFolder {
  id: string | null; // null = root
  name: string;
  depth: number;
}

function buildFlatList(
  folders: ReturnType<typeof useCanvasFolderStore.getState>['folders'],
  parentId: string | null,
  depth: number
): FlatFolder[] {
  const siblings = folders
    .filter((f) => f.parentId === parentId)
    .sort((a, b) => a.order - b.order);
  const result: FlatFolder[] = [];
  for (const f of siblings) {
    result.push({ id: f.id, name: f.name, depth });
    result.push(...buildFlatList(folders, f.id, depth + 1));
  }
  return result;
}

export function FolderPickerDialog({
  open,
  title = '移动到文件夹',
  onConfirm,
  onCancel,
}: FolderPickerDialogProps) {
  const { folders, getRootFolders } = useCanvasFolderStore();

  const flatFolders: FlatFolder[] = [
    { id: null, name: '根目录（无文件夹）', depth: 0 },
    ...buildFlatList(folders, null, 0),
  ];

  // Select root by default
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleConfirm = useCallback(() => {
    onConfirm(selectedId);
  }, [selectedId, onConfirm]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') handleConfirm();
    },
    [onCancel, handleConfirm]
  );

  if (!open) return null;

  return (
    <div
      className={styles['overlay']}
      role="dialog"
      aria-modal="true"
      aria-labelledby="folder-picker-title"
      onKeyDown={handleKeyDown}
    >
      <div className={styles['dialog']}>
        <h2 id="folder-picker-title" className={styles['title']}>
          {title}
        </h2>

        <div className={styles['folder-list']} role="radiogroup" aria-label="选择目标文件夹">
          {flatFolders.map((folder) => (
            <label
              key={folder.id ?? '__root__'}
              className={styles['folder-item']}
              style={{ paddingLeft: `${8 + folder.depth * 16}px` }}
            >
              <input
                type="radio"
                name="folder-picker"
                value={folder.id ?? ''}
                checked={selectedId === folder.id}
                onChange={() => setSelectedId(folder.id)}
                className={styles['radio']}
                aria-label={folder.name}
              />
              <span className={styles['folder-icon']} aria-hidden="true">
                {folder.id === null ? '🏠' : '📁'}
              </span>
              <span className={styles['folder-name']}>{folder.name}</span>
            </label>
          ))}
          {flatFolders.length === 1 && (
            <p className={styles['empty']}>暂无文件夹</p>
          )}
        </div>

        <div className={styles['actions']}>
          <button className={styles['btn-cancel']} onClick={onCancel}>
            取消
          </button>
          <button
            className={styles['btn-confirm']}
            onClick={handleConfirm}
            disabled={selectedId === undefined}
          >
            移动到这里
          </button>
        </div>
      </div>
    </div>
  );
}
