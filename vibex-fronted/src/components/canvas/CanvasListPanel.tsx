'use client';

/**
 * CanvasListPanel.tsx — Sprint47 E4: Canvas List Sidebar UI
 * Sprint48 E1: 添加搜索过滤功能
 *
 * 侧边栏画布列表 UI：
 * - 显示所有画布缩略图 + 名称
 * - 新建画布按钮
 * - 删除画布 + 确认 dialog
 * - 双击重命名
 * - 按名称/修改时间排序
 * - 搜索过滤（Sprint48 E1）
 */

import { useState, useCallback, useRef } from 'react';
import { useCanvasList } from '@/hooks/useCanvasList';
import { useCanvasListStore } from '@/stores/canvasListStore';
import { useClipboardStore } from '@/stores/clipboardStore';
import { useBatchOpsStore } from '@/stores/dds/batchOpsStore';
import { BatchOpsToolbar } from '@/components/dds/canvas-dashboard/BatchOpsToolbar';
import { FolderTree } from '@/components/dds/canvas/FolderTree';
import type { CanvasMeta } from '@/stores/canvasListStore';
import styles from './CanvasListPanel.module.css';

interface CanvasListPanelProps {
  /** Callback when user selects a canvas to open */
  onOpenCanvas?: (canvasId: string) => void;
  /** Whether the panel is collapsed */
  collapsed?: boolean;
}

type SortMode = 'updatedAt' | 'name';

export function CanvasListPanel({ onOpenCanvas, collapsed = false }: CanvasListPanelProps) {
  const {
    isLoaded,
    searchTerm,
    createCanvas,
    deleteCanvas,
    renameCanvas,
    getSortedCanvases,
    setSearchTerm,
    getFilteredCanvases,
  } = useCanvasList();

  const { selectedCanvasIds, toggleSelect, clearSelection, exportSelectedPDF, pasteToCanvas } = useCanvasListStore();
  const clipboardValid = useClipboardStore((s) => s.isValid());
  const clipboardCount = useClipboardStore((s) => s.entry?.cards.length ?? 0);

  const [sortMode, setSortMode] = useState<SortMode>('updatedAt');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  const sortedCanvases = getSortedCanvases(sortMode);
  const displayedCanvases = searchTerm ? getFilteredCanvases(sortMode) : sortedCanvases;
  const selectedCount = selectedCanvasIds.size;

  const handleCreate = useCallback(async () => {
    const meta = await createCanvas();
    onOpenCanvas?.(meta.id);
  }, [createCanvas, onOpenCanvas]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!confirmDeleteId) return;
    await deleteCanvas(confirmDeleteId);
    setConfirmDeleteId(null);
  }, [confirmDeleteId, deleteCanvas]);

  const handleStartRename = useCallback((canvas: CanvasMeta) => {
    setEditingId(canvas.id);
    setEditName(canvas.name);
    setTimeout(() => editInputRef.current?.select(), 0);
  }, []);

  const handleRenameCommit = useCallback(async () => {
    if (!editingId || !editName.trim()) {
      setEditingId(null);
      return;
    }
    await renameCanvas(editingId, editName.trim());
    setEditingId(null);
  }, [editingId, editName, renameCanvas]);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleRenameCommit();
      if (e.key === 'Escape') setEditingId(null);
    },
    [handleRenameCommit]
  );

  const handleExportSelected = useCallback(async () => {
    if (selectedCount === 0) return;
    setIsExporting(true);
    try {
      await exportSelectedPDF();
    } finally {
      setIsExporting(false);
      clearSelection();
    }
  }, [selectedCount, exportSelectedPDF, clearSelection]);

  const handleItemClick = useCallback(
    (canvas: CanvasMeta) => {
      // If user clicked the checkbox area, don't trigger open
      onOpenCanvas?.(canvas.id);
    },
    [onOpenCanvas]
  );

  if (collapsed) {
    return (
      <aside className={`${styles['canvas-list-panel']} ${styles['canvas-list-panel--collapsed']}`} aria-label="画布列表">
        <button
          className={styles['canvas-list-panel__toggle']}
          onClick={() => {/* toggle collapsed */}}
          title="展开画布列表"
        >
          ☰
        </button>
      </aside>
    );
  }

  return (
    <aside className={styles['canvas-list-panel']} aria-label="画布列表">
      {/* Header */}
      <div className={styles['canvas-list-panel__header']}>
        <h2 className={styles['canvas-list-panel__title']}>画布列表</h2>
        <button
          className={styles['canvas-list-panel__create-btn']}
          onClick={handleCreate}
          title="新建画布"
        >
          + 新建
        </button>
      </div>

      {/* Search input (Sprint48 E1) */}
      <div className={styles['canvas-list-panel__search']}>
        <input
          type="search"
          className={styles['canvas-list-panel__search-input']}
          placeholder="搜索画布..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="搜索画布"
        />
        {searchTerm && (
          <button
            className={styles['canvas-list-panel__search-clear']}
            onClick={() => setSearchTerm('')}
            title="清除搜索"
            aria-label="清除搜索"
          >
            ✕
          </button>
        )}
      </div>

      {/* Batch operations toolbar (Sprint60 E2) — appears when canvases are selected */}
      <BatchOpsToolbar selectedCount={selectedCount} />

      {/* Folder tree (S62 E2) */}
      <FolderTree />

      {/* Sort controls (Sprint48 E2) */}
      <div className={styles['canvas-list-panel__sort']}>
        <button
          className={`${styles['sort-btn']}${sortMode === 'updatedAt' ? ` ${styles['sort-btn--active']}` : ''}`}
          onClick={() => setSortMode('updatedAt')}
          title="按修改时间排序"
        >
          最近修改
        </button>
        <button
          className={`${styles['sort-btn']}${sortMode === 'name' ? ` ${styles['sort-btn--active']}` : ''}`}
          onClick={() => setSortMode('name')}
          title="按名称排序"
        >
          名称
        </button>
        {selectedCount > 0 && (
          <button
            className={styles['export-selected-btn']}
            onClick={handleExportSelected}
            disabled={isExporting}
            title={`导出选中的 ${selectedCount} 个画布为 PDF`}
          >
            {isExporting ? '导出中…' : `导出已选 (${selectedCount})`}
          </button>
        )}
        {selectedCount > 0 && (
          <button
            className={styles['clear-selection-btn']}
            onClick={clearSelection}
            title="清除选择"
            aria-label="清除选择"
          >
            ✕
          </button>
        )}
      </div>

      {/* Canvas list */}
      <ul className={styles['canvas-list-panel__list']} role="listbox" aria-label="画布列表">
        {!isLoaded && (
          <li className={styles['canvas-list-panel__loading']}>加载中…</li>
        )}
        {isLoaded && sortedCanvases.length === 0 && (
          <li className={styles['canvas-list-panel__empty']}>
            暂无画布<br />
            <button onClick={handleCreate} className={styles['canvas-list-panel__empty-create']}>
              创建第一个画布
            </button>
          </li>
        )}
        {isLoaded && searchTerm && displayedCanvases.length === 0 && (
          <li className={styles['canvas-list-panel__empty']}>
            未找到匹配「{searchTerm}」的画布
          </li>
        )}
        {displayedCanvases.map((canvas) => (
          <li
            key={canvas.id}
            className={`${styles['canvas-list-panel__item']}${selectedCanvasIds.has(canvas.id) ? ` ${styles['canvas-list-panel__item--selected']}` : ''}`}
            role="option"
            aria-selected={selectedCanvasIds.has(canvas.id)}
            onClick={() => handleItemClick(canvas)}
            onDoubleClick={() => handleStartRename(canvas)}
          >
            {/* Checkbox for multi-select (Sprint48 E2) */}
            <input
              type="checkbox"
              className={styles['canvas-list-panel__checkbox']}
              checked={selectedCanvasIds.has(canvas.id)}
              onChange={() => toggleSelect(canvas.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label={`选择 ${canvas.name}`}
              title="勾选以批量导出"
            />

            {/* Thumbnail */}
            <div className={styles['canvas-list-panel__thumb']}>
              {canvas.thumbnail ? (
                <img
                  src={canvas.thumbnail}
                  alt={`${canvas.name} 缩略图`}
                  className={styles['canvas-list-panel__thumb-img']}
                  width={120}
                  height={80}
                />
              ) : (
                <div className={styles['canvas-list-panel__thumb-placeholder']} aria-hidden="true">
                  <span>📄</span>
                </div>
              )}
            </div>

            {/* Name */}
            <div className={styles['canvas-list-panel__info']}>
              {editingId === canvas.id ? (
                <input
                  ref={editInputRef}
                  className={styles['canvas-list-panel__rename-input']}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleRenameCommit}
                  onKeyDown={handleRenameKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="重命名画布"
                />
              ) : (
                <span className={styles['canvas-list-panel__name']} title={canvas.name}>
                  {canvas.name}
                </span>
              )}
              <time
                className={styles['canvas-list-panel__date']}
                dateTime={canvas.updatedAt}
                title={`修改于 ${new Date(canvas.updatedAt).toLocaleString('zh-CN')}`}
              >
                {formatRelativeTime(canvas.updatedAt)}
              </time>
            </div>

            {/* Delete button */}
            <button
              className={styles['canvas-list-panel__delete-btn']}
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDeleteId(canvas.id);
              }}
              title="删除画布"
              aria-label={`删除 ${canvas.name}`}
            >
              ✕
            </button>

            {/* [S48-E5] Paste Here button — visible when clipboard has cards */}
            {clipboardValid && (
              <button
                className={styles['canvas-list-panel__paste-btn']}
                onClick={(e) => {
                  e.stopPropagation();
                  pasteToCanvas(canvas.id);
                }}
                title={`粘贴 ${clipboardCount} 个节点到 ${canvas.name}`}
                aria-label={`粘贴到 ${canvas.name}`}
              >
                📋
                <span className={styles['canvas-list-panel__paste-count']}>{clipboardCount}</span>
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Delete confirmation dialog */}
      {confirmDeleteId && (
        <div className={styles['canvas-list-panel__dialog-overlay']} role="dialog" aria-modal="true">
          <div className={styles['canvas-list-panel__dialog']}>
            <h3 className={styles['canvas-list-panel__dialog-title']}>确认删除</h3>
            <p className={styles['canvas-list-panel__dialog-body']}>
              确定要删除此画布吗？此操作不可撤销。
            </p>
            <div className={styles['canvas-list-panel__dialog-actions']}>
              <button
                className={styles['canvas-list-panel__dialog-cancel']}
                onClick={() => setConfirmDeleteId(null)}
              >
                取消
              </button>
              <button
                className={styles['canvas-list-panel__dialog-confirm']}
                onClick={handleDeleteConfirm}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

// ============================================
// Helpers
// ============================================

function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diff = now - then;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`;
  return new Date(isoDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}
