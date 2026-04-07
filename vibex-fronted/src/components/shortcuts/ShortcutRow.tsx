/**
 * ShortcutRow - 单个快捷键行组件
 */

'use client';

import React from 'react';
import { useShortcutStore, formatKeyDisplay } from '@/stores/shortcutStore';
import { Pencil, RotateCcw } from 'lucide-react';
import styles from './shortcuts.module.css';

interface ShortcutRowProps {
  action: string;
  description: string;
  currentKey: string;
  category: string;
}

export function ShortcutRow({
  action,
  description,
  currentKey,
}: ShortcutRowProps) {
  const { startEditing, resetToDefault, editingAction } = useShortcutStore();
  const isEditing = editingAction === action;

  return (
    <div className={`${styles.row} ${isEditing ? styles.rowEditing : ''}`}>
      <span className={styles.description}>{description}</span>
      <div className={styles.actions}>
        <kbd className={styles.key}>{formatKeyDisplay(currentKey)}</kbd>
        <button
          className={styles.editBtn}
          onClick={() => startEditing(action)}
          title="编辑快捷键"
        >
          <Pencil size={14} />
        </button>
        <button
          className={styles.resetBtn}
          onClick={() => resetToDefault(action)}
          title="重置为默认"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}
