/**
 * SelectionToolbar — Floating toolbar for multi-select batch operations
 *
 * E4: 多选批量操作
 *
 * Shows when 2+ cards are selected.
 * Provides: align (left/right/h-center/v-center), duplicate, delete.
 */

'use client';

import React, { memo, useCallback } from 'react';
import { useDDSCanvasStore, ddsChapterActions } from '@/stores/dds';
import { applyAlignment, type AlignmentType } from '@/hooks/dds/useAlignmentTools';
import { generateId } from '@/lib/canvas/id';
import styles from './SelectionToolbar.module.css';

interface SelectionToolbarProps {
  /** Selection box rect for overlay rendering */
  selectionBox?: { left: number; top: number; width: number; height: number } | null;
  /** Called when selection should be cleared */
  onClearSelection?: () => void;
}

/** Alignment icon SVGs */
function AlignLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="4" x2="3" y2="20" />
      <rect x="7" y="6" width="13" height="4" rx="1" />
      <rect x="7" y="14" width="9" height="4" rx="1" />
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="21" y1="4" x2="21" y2="20" />
      <rect x="4" y="6" width="13" height="4" rx="1" />
      <rect x="8" y="14" width="9" height="4" rx="1" />
    </svg>
  );
}

function AlignHCenterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="3" x2="12" y2="21" />
      <rect x="4" y="7" width="16" height="4" rx="1" />
      <rect x="5" y="14" width="14" height="4" rx="1" />
    </svg>
  );
}

function AlignVCenterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="12" x2="20" y2="12" />
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="7" width="4" height="10" rx="1" />
    </svg>
  );
}

function DuplicateIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export const SelectionToolbar = memo(function SelectionToolbar({
  selectionBox,
  onClearSelection,
}: SelectionToolbarProps) {
  const selectedCardIds = useDDSCanvasStore((s) => s.selectedCardIds);
  const chapters = useDDSCanvasStore((s) => s.chapters);
  const activeChapter = useDDSCanvasStore((s) => s.activeChapter);

  if (selectedCardIds.length < 2) return null;

  const handleAlign = useCallback((alignment: AlignmentType) => {
    const chapter = chapters[activeChapter];
    if (!chapter) return;

    const cards = chapter.cards.filter((c) => selectedCardIds.includes(c.id));
    if (cards.length < 2) return;

    const updates = applyAlignment(cards, alignment);
    updates.forEach(({ cardId, position }) => {
      ddsChapterActions.updateCard(activeChapter, cardId, { position });
    });
  }, [selectedCardIds, activeChapter, chapters]);

  const handleDuplicate = useCallback(() => {
    const chapter = chapters[activeChapter];
    if (!chapter) return;

    const OFFSET = 30;
    selectedCardIds.forEach((id) => {
      const card = chapter.cards.find((c) => c.id === id);
      if (!card) return;
      const now = new Date().toISOString();
      const newCard = {
        ...card,
        id: generateId(),
        title: (card.title ?? '') + ' (copy)',
        position: {
          x: (card.position?.x ?? 0) + OFFSET,
          y: (card.position?.y ?? 0) + OFFSET,
        },
        createdAt: now,
        updatedAt: now,
      };
      ddsChapterActions.addCard(activeChapter, newCard as Parameters<typeof ddsChapterActions.addCard>[1]);
    });
  }, [selectedCardIds, activeChapter, chapters]);

  const handleDelete = useCallback(() => {
    selectedCardIds.forEach((id) => {
      ddsChapterActions.deleteCard(activeChapter, id);
    });
  }, [selectedCardIds, activeChapter]);

  return (
    <>
      {/* Selection box overlay */}
      {selectionBox && selectionBox.width > 0 && selectionBox.height > 0 && (
        <div
          className={styles.selectionBox}
          style={{
            left: selectionBox.left,
            top: selectionBox.top,
            width: selectionBox.width,
            height: selectionBox.height,
          }}
        />
      )}

      {/* Floating toolbar */}
      <div className={styles.toolbar} role="toolbar" aria-label="多选操作">
        <span className={styles.badge}>{selectedCardIds.length}</span>

        {/* Align group */}
        <button
          className={styles.btn}
          onClick={() => handleAlign('left')}
          title="左对齐"
          aria-label="左对齐"
        >
          <AlignLeftIcon />
        </button>
        <button
          className={styles.btn}
          onClick={() => handleAlign('right')}
          title="右对齐"
          aria-label="右对齐"
        >
          <AlignRightIcon />
        </button>
        <button
          className={styles.btn}
          onClick={() => handleAlign('centerH')}
          title="水平居中"
          aria-label="水平居中"
        >
          <AlignHCenterIcon />
        </button>
        <button
          className={styles.btn}
          onClick={() => handleAlign('centerV')}
          title="垂直居中"
          aria-label="垂直居中"
        >
          <AlignVCenterIcon />
        </button>

        <div className={styles.divider} />

        {/* Duplicate */}
        <button
          className={styles.btn}
          onClick={handleDuplicate}
          title="复制选中卡片"
          aria-label="复制选中卡片"
        >
          <DuplicateIcon />
          复制
        </button>

        {/* Delete */}
        <button
          className={`${styles.btn} ${styles.btnDanger}`}
          onClick={handleDelete}
          title="删除选中卡片"
          aria-label="删除选中卡片"
        >
          <DeleteIcon />
          删除
        </button>

        <div className={styles.divider} />

        {/* Clear selection */}
        <button
          className={styles.btn}
          onClick={onClearSelection}
          title="取消选择 (Esc)"
          aria-label="取消选择"
        >
          ✕
        </button>
      </div>
    </>
  );
});
