/**
 * FolderTree.tsx — Collapsible folder tree with right-click context menu
 * E2 DoD: D2.3 — integrate into CanvasListPanel, expand/collapse/right-click menu
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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

  const rootFolders = store.getRootFolders();
  const confirmFolder = confirmDeleteId ? store.getFolderById(confirmDeleteId) : null;

  return (
    <div className={styles['folder-tree']}>
      {/* Header */}
      <div className={styles['folder-tree__header']}>
        <span className={styles['folder-tree__title']}>文件夹</span>
        <button
          className={styles['folder-tree__add-btn']}
          onClick={handleCreateRoot}
          title="新建文件夹"
          aria-label="新建文件夹"
        >
          +
        </button>
      </div>

      {/* Folder list */}
      <div className={styles['folder-tree__list']} role="tree" aria-label="文件夹列表">
        {rootFolders.length === 0 && (
          <div className={styles['folder-tree__empty']}>
            暂无文件夹
          </div>
        )}
        {rootFolders.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            expanded={expanded}
            onToggle={toggleExpand}
            onContextMenu={handleContextMenu}
            store={store}
            canvasIds={canvasIds}
          />
        ))}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className={styles['context-menu']}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          role="menu"
        >
          <button
            className={styles['context-menu__item']}
            role="menuitem"
            onClick={() => handleCreateChild(contextMenu.folderId)}
          >
            📁 新建子文件夹
          </button>
          <button
            className={styles['context-menu__item']}
            role="menuitem"
            onClick={() => handleRename(contextMenu.folderId)}
          >
            ✏️ 重命名
          </button>
          <button
            className={`${styles['context-menu__item']} ${styles['context-menu__item--danger']}`}
            role="menuitem"
            onClick={() => handleDeleteRequest(contextMenu.folderId)}
          >
            🗑️ 删除
          </button>
        </div>
      )}

      {/* Create folder dialog */}
      <CreateFolderDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        parentId={createParentId}
      />

      {/* Inline rename */}
      {editingFolderId && (
        <CreateFolderDialog
          isOpen={true}
          onClose={() => setEditingFolderId(null)}
          editingFolderId={editingFolderId}
        />
      )}

      {/* Delete confirmation */}
      {confirmDeleteId && confirmFolder && (
        <div className={styles['confirm-overlay']} role="dialog" aria-modal="true">
          <div className={styles['confirm-dialog']}>
            <h4 className={styles['confirm-dialog__title']}>确认删除</h4>
            <p className={styles['confirm-dialog__body']}>
              删除文件夹「{confirmFolder.name}」？
              {store.getCanvasesInFolder(confirmDeleteId).length > 0 && (
                <span className={styles['confirm-dialog__warning']}>
                  文件夹内的画布将移至根目录。
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
    </div>
  );
}

// ─── FolderItem sub-component ───────────────────────────────────────────────────

interface FolderItemProps {
  folder: Folder;
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  store: ReturnType<typeof useCanvasFolderStore>;
  canvasIds: string[];
}

function FolderItem({ folder, expanded, onToggle, onContextMenu, store, canvasIds }: FolderItemProps) {
  const isExpanded = !!expanded[folder.id];
  const children = store.getChildFolders(folder.id);
  const canvasesInFolder = store.getCanvasesInFolder(folder.id);
  const hasChildren = children.length > 0 || canvasesInFolder.length > 0;

  return (
    <div role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <div
        className={styles['folder-item']}
        onContextMenu={(e) => onContextMenu(e, folder.id)}
      >
        {/* Expand/collapse chevron */}
        <button
          className={`${styles['folder-item__chevron']} ${isExpanded ? styles['folder-item__chevron--open'] : ''}`}
          onClick={() => hasChildren && onToggle(folder.id)}
          aria-label={isExpanded ? '折叠' : '展开'}
          tabIndex={hasChildren ? 0 : -1}
        >
          {hasChildren ? (isExpanded ? '▼' : '▶') : ''}
        </button>

        {/* Folder icon + name */}
        <button
          className={styles['folder-item__label']}
          onClick={() => onToggle(folder.id)}
        >
          <span className={styles['folder-item__icon']}>📁</span>
          <span className={styles['folder-item__name']}>{folder.name}</span>
          <span className={styles['folder-item__count']}>
            {canvasesInFolder.length > 0 ? `(${canvasesInFolder.length})` : ''}
          </span>
        </button>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className={styles['folder-children']} role="group">
          {children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              expanded={expanded}
              onToggle={onToggle}
              onContextMenu={onContextMenu}
              store={store}
              canvasIds={canvasIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}
