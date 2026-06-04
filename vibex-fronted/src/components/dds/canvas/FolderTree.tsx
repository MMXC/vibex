'use client';

/**
 * FolderTree.tsx — Collapsible folder tree with right-click context menu
 * E2 DoD: D2.3 — integrate into CanvasListPanel, expand/collapse/right-click menu
 * S63-E5 DoD: D5.2 — Drag-sorting with @dnd-kit/sortable
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCanvasFolderStore } from '@/stores/dds/canvasFolderStore';
import { CreateFolderDialog } from './CreateFolderDialog';
import type { Folder } from '@/stores/dds/canvasFolderStore';
import styles from './FolderTree.module.css';

interface FolderTreeProps {
  /** Canvas IDs currently displayed (used to show canvas count) */
  canvasIds?: string[];
}

interface ContextMenu {
  folderId: string;
  x: number;
  y: number;
}

// ─── Sortable Folder Item ─────────────────────────────────────────────────────

interface SortableFolderItemProps {
  folder: Folder;
  expanded: Record<string, boolean>;
  canvasIds?: string[];
  onToggle: (folderId: string) => void;
  onContextMenu: (e: React.MouseEvent, folderId: string) => void;
}

function SortableFolderItem({
  folder,
  expanded,
  canvasIds = [],
  onToggle,
  onContextMenu,
}: SortableFolderItemProps) {
  const store = useCanvasFolderStore();
  const children = store.getChildFolders(folder.id);
  const canvasesInFolder = store.getCanvasesInFolder(folder.id);
  const isExpanded = expanded[folder.id] ?? false;

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id });

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={dragStyle}>
      {/* Folder row */}
      <div
        className={styles['folder-item']}
        onContextMenu={(e) => onContextMenu(e, folder.id)}
        aria-label={`文件夹 ${folder.name}`}
      >
        {/* Drag handle */}
        <button
          className={styles['folder-item__drag-handle']}
          {...attributes}
          {...listeners}
          aria-label={`拖动排序 ${folder.name}`}
          title="拖动排序"
        >
          ⋮⋮
        </button>

        {/* Expand chevron */}
        {children.length > 0 ? (
          <button
            className={`${styles['folder-item__chevron']} ${isExpanded ? styles['folder-item__chevron--open'] : ''}`}
            onClick={() => onToggle(folder.id)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? '折叠' : '展开'}
          >
            ▶
          </button>
        ) : (
          <span className={styles['folder-item__chevron-placeholder']} aria-hidden="true" />
        )}

        {/* Folder label */}
        <button
          className={styles['folder-item__label']}
          onClick={() => onToggle(folder.id)}
          aria-label={folder.name}
        >
          <span className={styles['folder-item__icon']} aria-hidden="true">📁</span>
          <span className={styles['folder-item__name']}>{folder.name}</span>
          <span className={styles['folder-item__count']}>
            {canvasesInFolder.length > 0 ? `(${canvasesInFolder.length})` : ''}
          </span>
        </button>
      </div>

      {/* Children */}
      {isExpanded && children.length > 0 && (
        <div className={styles['folder-children']}>
          {children.map((child) => (
            <SortableFolderItem
              key={child.id}
              folder={child}
              expanded={expanded}
              canvasIds={canvasIds}
              onToggle={onToggle}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main FolderTree ──────────────────────────────────────────────────────────

export function FolderTree({ canvasIds = [] }: FolderTreeProps) {
  const store = useCanvasFolderStore();

  // Expanded state: folderId → boolean
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');

  const contextMenuRef = useRef<HTMLDivElement>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Close context menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    }
    if (contextMenu) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [contextMenu]);

  const toggleExpand = useCallback((folderId: string) => {
    setExpanded((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ folderId, x: e.clientX, y: e.clientY });
  }, []);

  const handleCreateRoot = useCallback(() => {
    setCreateParentId(null);
    setCreateDialogOpen(true);
    setContextMenu(null);
  }, []);

  const handleCreateChild = useCallback((parentId: string) => {
    setCreateParentId(parentId);
    setCreateDialogOpen(true);
    setContextMenu(null);
  }, []);

  const handleRename = useCallback((folderId: string) => {
    setEditingFolderId(folderId);
    setContextMenu(null);
  }, []);

  const handleDeleteRequest = useCallback((folderId: string) => {
    setConfirmDeleteId(folderId);
    setContextMenu(null);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (confirmDeleteId) {
      store.deleteFolder(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  }, [confirmDeleteId, store]);

  const handleRenameCommit = useCallback(() => {
    if (editingFolderId && newFolderName.trim()) {
      store.renameFolder(editingFolderId, newFolderName.trim());
    }
    setEditingFolderId(null);
    setNewFolderName('');
  }, [editingFolderId, newFolderName, store]);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleRenameCommit();
      if (e.key === 'Escape') {
        setEditingFolderId(null);
        setNewFolderName('');
      }
    },
    [handleRenameCommit]
  );

  // ─── DnD handler ──────────────────────────────────────────────────────────
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      // Find the index of the over item in the root folder list
      const rootFolders = store.getRootFolders();
      const overIndex = rootFolders.findIndex((f) => f.id === overId);

      if (overIndex === -1) {
        // Over item is not a root folder — try to find it as child
        // For simplicity: if dropped on a non-root folder, insert at end of root
        store.moveFolder(activeId, null, rootFolders.length);
      } else {
        store.moveFolder(activeId, null, overIndex);
      }
    },
    [store]
  );

  const rootFolders = store.getRootFolders();
  const confirmFolder =
    confirmDeleteId != null ? store.getFolderById(confirmDeleteId) : null;

  return (
    <div className={styles['folder-tree']}>
      {/* Header */}
      <div className={styles['folder-tree__header']}>
        <span className={styles['folder-tree__title']}>文件夹</span>
        <button
          className={styles['folder-tree__add-btn']}
          onClick={handleCreateRoot}
          aria-label="新建文件夹"
          title="新建文件夹"
        >
          +
        </button>
      </div>

      {/* Folder list with DnD */}
      {rootFolders.length === 0 ? (
        <p className={styles['folder-tree__empty']}>暂无文件夹</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={rootFolders.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className={styles['folder-tree__list']} role="list">
              {rootFolders.map((folder) => (
                <SortableFolderItem
                  key={folder.id}
                  folder={folder}
                  expanded={expanded}
                  canvasIds={canvasIds}
                  onToggle={toggleExpand}
                  onContextMenu={handleContextMenu}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className={styles['context-menu']}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          role="menu"
          aria-label="文件夹操作"
        >
          <button
            className={styles['context-menu__item']}
            onClick={() => handleCreateChild(contextMenu.folderId)}
            role="menuitem"
          >
            + 新建子文件夹
          </button>
          <button
            className={styles['context-menu__item']}
            onClick={() => handleRename(contextMenu.folderId)}
            role="menuitem"
          >
            ✏️ 重命名
          </button>
          <button
            className={`${styles['context-menu__item']} ${styles['context-menu__item--danger']}`}
            onClick={() => handleDeleteRequest(contextMenu.folderId)}
            role="menuitem"
          >
            🗑️ 删除
          </button>
        </div>
      )}

      {/* Rename input overlay */}
      {editingFolderId != null && (
        <div className={styles['rename-overlay']} role="dialog" aria-label="重命名文件夹">
          <input
            className={styles['rename-input']}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onBlur={handleRenameCommit}
            onKeyDown={handleRenameKeyDown}
            autoFocus
            aria-label="新文件夹名称"
          />
        </div>
      )}

      {/* Delete confirmation */}
      {confirmFolder && (
        <div className={styles['confirm-overlay']} role="dialog" aria-modal="true">
          <div className={styles['confirm-dialog']}>
            <h3 className={styles['confirm-dialog__title']}>确认删除</h3>
            <p className={styles['confirm-dialog__body']}>
              确定要删除文件夹「{confirmFolder.name}」吗？
              {store.getCanvasesInFolder(confirmFolder.id).length > 0 && (
                <span className={styles['confirm-dialog__warning']}>
                  包含 {store.getCanvasesInFolder(confirmFolder.id).length} 个画布，将移至根目录
                </span>
              )}
            </p>
            <div className={styles['confirm-dialog__actions']}>
              <button
                className={styles['confirm-dialog__btn-cancel']}
                onClick={() => setConfirmDeleteId(null)}
              >
                取消
              </button>
              <button
                className={styles['confirm-dialog__btn-delete']}
                onClick={handleDeleteConfirm}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create folder dialog */}
      {createDialogOpen && (
        <CreateFolderDialog
          parentId={createParentId}
          onClose={() => {
            setCreateDialogOpen(false);
            setCreateParentId(null);
          }}
        />
      )}
    </div>
  );
}
