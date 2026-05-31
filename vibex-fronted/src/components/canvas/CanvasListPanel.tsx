'use client';

/**
 * CanvasListPanel.tsx — Sprint47 E4: Canvas List Sidebar UI
 *
 * 侧边栏画布列表 UI：
 * - 显示所有画布缩略图 + 名称
 * - 新建画布按钮
 * - 删除画布 + 确认 dialog
 * - 双击重命名
 * - 按名称/修改时间排序
 */

import { useState, useCallback, useRef } from 'react';
import { useCanvasList } from '@/hooks/useCanvasList';
import type { CanvasMeta } from '@/stores/canvasListStore';

interface CanvasListPanelProps {
  /** Callback when user selects a canvas to open */
  onOpenCanvas?: (canvasId: string) => void;
  /** Whether the panel is collapsed */
  collapsed?: boolean;
}

type SortMode = 'updatedAt' | 'name';

export function CanvasListPanel({ onOpenCanvas, collapsed = false }: CanvasListPanelProps) {
  const {
    canvases,
    isLoaded,
    createCanvas,
    deleteCanvas,
    renameCanvas,
    getSortedCanvases,
  } = useCanvasList();

  const [sortMode, setSortMode] = useState<SortMode>('updatedAt');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const sortedCanvases = getSortedCanvases(sortMode);

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

  if (collapsed) {
    return (
      <div className="canvas-list-panel canvas-list-panel--collapsed" aria-label="画布列表">
        <button
          className="canvas-list-panel__toggle"
          onClick={() => {/* toggle collapsed */}}
          title="展开画布列表"
        >
          ☰
        </button>
      </div>
    );
  }

  return (
    <aside className="canvas-list-panel" aria-label="画布列表">
      {/* Header */}
      <div className="canvas-list-panel__header">
        <h2 className="canvas-list-panel__title">画布列表</h2>
        <button
          className="canvas-list-panel__create-btn"
          onClick={handleCreate}
          title="新建画布"
        >
          + 新建
        </button>
      </div>

      {/* Sort controls */}
      <div className="canvas-list-panel__sort">
        <button
          className={`sort-btn${sortMode === 'updatedAt' ? ' sort-btn--active' : ''}`}
          onClick={() => setSortMode('updatedAt')}
          title="按修改时间排序"
        >
          最近修改
        </button>
        <button
          className={`sort-btn${sortMode === 'name' ? ' sort-btn--active' : ''}`}
          onClick={() => setSortMode('name')}
          title="按名称排序"
        >
          名称
        </button>
      </div>

      {/* Canvas list */}
      <ul className="canvas-list-panel__list" role="listbox" aria-label="画布列表">
        {!isLoaded && (
          <li className="canvas-list-panel__loading">加载中…</li>
        )}
        {isLoaded && sortedCanvases.length === 0 && (
          <li className="canvas-list-panel__empty">
            暂无画布<br />
            <button onClick={handleCreate} className="canvas-list-panel__empty-create">
              创建第一个画布
            </button>
          </li>
        )}
        {sortedCanvases.map((canvas) => (
          <li
            key={canvas.id}
            className="canvas-list-panel__item"
            role="option"
            aria-selected={false}
            onClick={() => onOpenCanvas?.(canvas.id)}
            onDoubleClick={() => handleStartRename(canvas)}
          >
            {/* Thumbnail */}
            <div className="canvas-list-panel__thumb">
              {canvas.thumbnail ? (
                <img
                  src={canvas.thumbnail}
                  alt={`${canvas.name} 缩略图`}
                  className="canvas-list-panel__thumb-img"
                  width={120}
                  height={80}
                />
              ) : (
                <div className="canvas-list-panel__thumb-placeholder" aria-hidden="true">
                  <span>📄</span>
                </div>
              )}
            </div>

            {/* Name */}
            <div className="canvas-list-panel__info">
              {editingId === canvas.id ? (
                <input
                  ref={editInputRef}
                  className="canvas-list-panel__rename-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleRenameCommit}
                  onKeyDown={handleRenameKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="重命名画布"
                />
              ) : (
                <span className="canvas-list-panel__name" title={canvas.name}>
                  {canvas.name}
                </span>
              )}
              <time
                className="canvas-list-panel__date"
                dateTime={canvas.updatedAt}
                title={`修改于 ${new Date(canvas.updatedAt).toLocaleString('zh-CN')}`}
              >
                {formatRelativeTime(canvas.updatedAt)}
              </time>
            </div>

            {/* Delete button */}
            <button
              className="canvas-list-panel__delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDeleteId(canvas.id);
              }}
              title="删除画布"
              aria-label={`删除 ${canvas.name}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {/* Delete confirmation dialog */}
      {confirmDeleteId && (
        <div className="canvas-list-panel__dialog-overlay" role="dialog" aria-modal="true">
          <div className="canvas-list-panel__dialog">
            <h3 className="canvas-list-panel__dialog-title">确认删除</h3>
            <p className="canvas-list-panel__dialog-body">
              确定要删除此画布吗？此操作不可撤销。
            </p>
            <div className="canvas-list-panel__dialog-actions">
              <button
                className="canvas-list-panel__dialog-cancel"
                onClick={() => setConfirmDeleteId(null)}
              >
                取消
              </button>
              <button
                className="canvas-list-panel__dialog-confirm"
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
