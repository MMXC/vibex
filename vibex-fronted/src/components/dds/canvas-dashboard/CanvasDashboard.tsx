/**
 * CanvasDashboard.tsx — Sprint55 E3: Multi-Canvas Management Dashboard
 *
 * Responsibilities:
 * - Full-page grid of canvas cards (thumbnail + name + created time)
 * - "New Canvas" → CreateCanvasDialog → navigate to new canvas
 * - Click card → navigate to /canvas?projectId=<id>
 * - Delete → <dialog> confirmation → canvasListStore.deleteCanvas
 * - Double-click name → inline <input> edit → canvasListStore.renameCanvas
 * - Uses existing canvasListStore (S47-E4) for all CRUD operations
 *
 * Sprint56 E2: 收藏画布 — Star button in cardActions, favorites-first sort
 */

'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCanvasListStore, type CanvasMeta } from '@/stores/canvasListStore';
import { CreateCanvasDialog } from './CreateCanvasDialog';
import styles from './CanvasDashboard.module.css';

type SortMode = 'updatedAt' | 'name';

export function CanvasDashboard() {
  const router = useRouter();
  const {
    isLoaded,
    loadCanvases,
    createCanvas,
    deleteCanvas,
    renameCanvas,
    getSortedCanvases,
    getFilteredCanvases,
    searchTerm,
    setSearchTerm,
    toggleFavorite,
    isFavorite,
  } = useCanvasListStore();

  const [sortMode, setSortMode] = useState<SortMode>('updatedAt');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCanvases();
  }, [loadCanvases]);

  const displayedCanvases = searchTerm ? getFilteredCanvases(sortMode) : getSortedCanvases(sortMode);

  // Navigate to canvas editor
  const handleCardClick = useCallback(
    (canvas: CanvasMeta) => {
      router.push(`/canvas?projectId=${canvas.id}`);
    },
    [router]
  );

  // Create new canvas
  const handleCreate = useCallback(async () => {
    const meta = await createCanvas();
    router.push(`/canvas?projectId=${meta.id}`);
  }, [createCanvas, router]);

  // Delete
  const handleDeleteConfirm = useCallback(async () => {
    if (!confirmDeleteId) return;
    await deleteCanvas(confirmDeleteId);
    setConfirmDeleteId(null);
  }, [confirmDeleteId, deleteCanvas]);

  // Rename start
  const handleStartRename = useCallback((canvas: CanvasMeta) => {
    setEditingId(canvas.id);
    setEditName(canvas.name);
    setTimeout(() => editInputRef.current?.select(), 0);
  }, []);

  // Rename commit
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

  if (!isLoaded) {
    return (
      <div className={styles.loading} role="status" aria-label="加载画布列表">
        <span className={styles.loadingText}>加载中…</span>
      </div>
    );
  }

  return (
    <div className={styles.root} data-testid="canvas-dashboard">
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>画布管理</h1>
          <span className={styles.count} aria-label={`共 ${displayedCanvases.length} 个画布`}>
            {displayedCanvases.length} 个画布
          </span>
        </div>
        <div className={styles.headerRight}>
          {/* Search */}
          <div className={styles.searchWrapper}>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="搜索画布…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="搜索画布"
              data-testid="canvas-dashboard-search"
            />
            {searchTerm && (
              <button
                className={styles.searchClear}
                onClick={() => setSearchTerm('')}
                title="清除搜索"
                aria-label="清除搜索"
                type="button"
              >
                ✕
              </button>
            )}
          </div>
          {/* Sort */}
          <div className={styles.sortGroup} role="group" aria-label="排序方式">
            <button
              type="button"
              className={`${styles.sortBtn}${sortMode === 'updatedAt' ? ` ${styles.sortBtnActive}` : ''}`}
              onClick={() => setSortMode('updatedAt')}
              aria-pressed={sortMode === 'updatedAt'}
            >
              最近修改
            </button>
            <button
              type="button"
              className={`${styles.sortBtn}${sortMode === 'name' ? ` ${styles.sortBtnActive}` : ''}`}
              onClick={() => setSortMode('name')}
              aria-pressed={sortMode === 'name'}
            >
              名称
            </button>
          </div>
          {/* New Canvas */}
          <button
            type="button"
            className={styles.createBtn}
            onClick={() => setIsCreateDialogOpen(true)}
            aria-label="新建画布"
            data-testid="canvas-dashboard-create-btn"
          >
            <span aria-hidden="true">+</span>
            新建画布
          </button>
        </div>
      </header>

      {/* Grid */}
      {displayedCanvases.length === 0 ? (
        <div className={styles.empty} role="status">
          {searchTerm ? (
            <p>未找到匹配「{searchTerm}」的画布</p>
          ) : (
            <>
              <p className={styles.emptyTitle}>还没有画布</p>
              <button
                type="button"
                className={styles.emptyCreateBtn}
                onClick={() => setIsCreateDialogOpen(true)}
              >
                创建第一个画布
              </button>
            </>
          )}
        </div>
      ) : (
        <ul className={styles.grid} role="list" aria-label="画布列表">
          {displayedCanvases.map((canvas) => (
            <li key={canvas.id} className={styles.card} data-testid={`canvas-card-${canvas.id}`}>
              {/* Thumbnail */}
              <button
                type="button"
                className={styles.cardThumbBtn}
                onClick={() => handleCardClick(canvas)}
                aria-label={`打开画布 ${canvas.name}`}
                title={canvas.name}
              >
                <div className={styles.cardThumb}>
                  {canvas.thumbnail ? (
                    <img
                      src={canvas.thumbnail}
                      alt={`${canvas.name} 缩略图`}
                      className={styles.cardThumbImg}
                      width={280}
                      height={160}
                    />
                  ) : (
                    <div className={styles.cardThumbPlaceholder} aria-hidden="true">
                      <span className={styles.cardThumbPlaceholderIcon}>📄</span>
                    </div>
                  )}
                </div>
              </button>

              {/* Card info */}
              <div className={styles.cardInfo}>
                {editingId === canvas.id ? (
                  <input
                    ref={editInputRef}
                    className={styles.renameInput}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleRenameCommit}
                    onKeyDown={handleRenameKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="重命名画布"
                    data-testid={`rename-input-${canvas.id}`}
                  />
                ) : (
                  <button
                    type="button"
                    className={styles.cardName}
                    onClick={() => handleCardClick(canvas)}
                    onDoubleClick={() => handleStartRename(canvas)}
                    title={canvas.name}
                    data-testid={`canvas-name-${canvas.id}`}
                  >
                    {canvas.name}
                  </button>
                )}
                <time
                  className={styles.cardDate}
                  dateTime={canvas.createdAt}
                  title={`创建于 ${new Date(canvas.createdAt).toLocaleString('zh-CN')}`}
                >
                  {formatDate(canvas.createdAt)}
                </time>
              </div>

              {/* Actions */}
              <div className={styles.cardActions}>
                {/* S56-E2: Favorite star button */}
                <button
                  type="button"
                  className={`${styles.cardFavBtn}${isFavorite(canvas.id) ? ` ${styles.cardFavBtnActive}` : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(canvas.id);
                  }}
                  title={isFavorite(canvas.id) ? '取消收藏' : '收藏'}
                  aria-label={isFavorite(canvas.id) ? `取消收藏 ${canvas.name}` : `收藏 ${canvas.name}`}
                  aria-pressed={isFavorite(canvas.id)}
                  data-testid={`fav-btn-${canvas.id}`}
                >
                  {isFavorite(canvas.id) ? '⭐' : '☆'}
                </button>
                <button
                  type="button"
                  className={styles.cardEditBtn}
                  onClick={() => handleStartRename(canvas)}
                  title="重命名"
                  aria-label={`重命名 ${canvas.name}`}
                  data-testid={`rename-btn-${canvas.id}`}
                >
                  ✏️
                </button>
                <button
                  type="button"
                  className={styles.cardDeleteBtn}
                  onClick={() => setConfirmDeleteId(canvas.id)}
                  title="删除"
                  aria-label={`删除 ${canvas.name}`}
                  data-testid={`delete-btn-${canvas.id}`}
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Create dialog */}
      <CreateCanvasDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onConfirm={handleCreate}
      />

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <div
          className={styles.dialogOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDeleteId(null);
          }}
        >
          <div className={styles.dialog}>
            <h2 id="delete-dialog-title" className={styles.dialogTitle}>
              确认删除
            </h2>
            <p className={styles.dialogBody}>
              确定要删除此画布吗？此操作不可撤销。
            </p>
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.dialogCancel}
                onClick={() => setConfirmDeleteId(null)}
              >
                取消
              </button>
              <button
                type="button"
                className={styles.dialogConfirm}
                onClick={handleDeleteConfirm}
                data-testid="confirm-delete-btn"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Helpers
// ============================================

function formatDate(isoDate: string): string {
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
