/**
 * canvasFolderStore.test.ts — Vitest tests for canvasFolderStore
 * E2 DoD: D2.6 — ≥20 tests covering CRUD + move + delete confirmation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCanvasFolderStore } from '../canvasFolderStore';

// ─── Mock generateId ───────────────────────────────────────────────────────────
// Mock the id generator so we get predictable IDs
let _idCounter = 0;
vi.mock('@/lib/canvas/id', () => ({
  generateId: vi.fn((prefix: string) => {
    _idCounter++;
    return `${prefix}-${_idCounter}`;
  }),
}));

// ─── Store reset helper ────────────────────────────────────────────────────────
function resetStore() {
  useCanvasFolderStore.setState({
    folders: [],
    canvasFolderMap: {},
    pendingDeleteFolderId: null,
  });
  _idCounter = 0;
}

beforeEach(() => {
  resetStore();
});

// ─── D2.1: CRUD ───────────────────────────────────────────────────────────────

describe('canvasFolderStore — D2.1 CRUD', () => {
  it('createFolder creates a root folder', () => {
    const state = useCanvasFolderStore.getState();
    const id = state.createFolder('My Folder');
    expect(id).toBe('folder-1');
    const s2 = useCanvasFolderStore.getState();
    expect(s2.folders).toHaveLength(1);
    expect(s2.folders[0].name).toBe('My Folder');
    expect(s2.folders[0].parentId).toBeNull();
  });

  it('createFolder trims whitespace from name', () => {
    useCanvasFolderStore.getState().createFolder('  Spaces  ');
    expect(useCanvasFolderStore.getState().folders[0].name).toBe('Spaces');
  });

  it('createFolder creates a child folder', () => {
    const state = useCanvasFolderStore.getState();
    const parentId = state.createFolder('Parent');
    const childId = state.createFolder('Child', parentId);
    const s2 = useCanvasFolderStore.getState();
    expect(s2.folders).toHaveLength(2);
    expect(s2.folders[1].id).toBe('folder-2');
    expect(s2.folders[1].parentId).toBe(parentId);
  });

  it('renameFolder updates folder name', () => {
    const state = useCanvasFolderStore.getState();
    const id = state.createFolder('Old Name');
    useCanvasFolderStore.getState().renameFolder(id, 'New Name');
    expect(useCanvasFolderStore.getState().folders[0].name).toBe('New Name');
  });

  it('renameFolder trims whitespace', () => {
    const state = useCanvasFolderStore.getState();
    const id = state.createFolder('Name');
    useCanvasFolderStore.getState().renameFolder(id, '  Trimmed  ');
    expect(useCanvasFolderStore.getState().folders[0].name).toBe('Trimmed');
  });

  it('renameFolder ignores empty name', () => {
    const state = useCanvasFolderStore.getState();
    const id = state.createFolder('Name');
    useCanvasFolderStore.getState().renameFolder(id, '');
    expect(useCanvasFolderStore.getState().folders[0].name).toBe('Name');
    useCanvasFolderStore.getState().renameFolder(id, '   ');
    expect(useCanvasFolderStore.getState().folders[0].name).toBe('Name');
  });

  it('deleteFolder removes the folder', () => {
    const state = useCanvasFolderStore.getState();
    const id = state.createFolder('To Delete');
    useCanvasFolderStore.getState().deleteFolder(id);
    expect(useCanvasFolderStore.getState().folders).toHaveLength(0);
  });

  it('deleteFolder removes child folders recursively', () => {
    const state = useCanvasFolderStore.getState();
    const parentId = state.createFolder('Parent');
    state.createFolder('Child', parentId);
    state.createFolder('Grandchild', 'folder-2');
    useCanvasFolderStore.getState().deleteFolder(parentId);
    expect(useCanvasFolderStore.getState().folders).toHaveLength(0);
  });

  it('getFolderById returns correct folder', () => {
    const state = useCanvasFolderStore.getState();
    const id = state.createFolder('Find Me');
    expect(useCanvasFolderStore.getState().getFolderById(id)?.name).toBe('Find Me');
    expect(useCanvasFolderStore.getState().getFolderById('nonexistent')).toBeUndefined();
  });

  it('getRootFolders returns only root-level folders', () => {
    const state = useCanvasFolderStore.getState();
    const parentId = state.createFolder('Parent');
    state.createFolder('Child', parentId);
    state.createFolder('Root Folder');
    const roots = useCanvasFolderStore.getState().getRootFolders();
    expect(roots).toHaveLength(2);
    expect(roots.every((f) => f.parentId === null)).toBe(true);
  });

  it('getChildFolders returns only children of given parent', () => {
    const state = useCanvasFolderStore.getState();
    const parentId = state.createFolder('Parent');
    state.createFolder('Child1', parentId);
    state.createFolder('Child2', parentId);
    state.createFolder('Orphan');
    const children = useCanvasFolderStore.getState().getChildFolders(parentId);
    expect(children).toHaveLength(2);
    expect(children.every((f) => f.parentId === parentId)).toBe(true);
  });

  it('isFolderNameTaken returns true for duplicate name at same level', () => {
    const state = useCanvasFolderStore.getState();
    state.createFolder('Duplicate');
    const s = useCanvasFolderStore.getState();
    expect(s.isFolderNameTaken('Duplicate')).toBe(true);
    expect(s.isFolderNameTaken('Different')).toBe(false);
  });

  it('isFolderNameTaken ignores same folder when excludeId given', () => {
    const state = useCanvasFolderStore.getState();
    const id = state.createFolder('Name');
    expect(useCanvasFolderStore.getState().isFolderNameTaken('Name', null, id)).toBe(false);
  });

  it('isFolderNameTaken checks parent scope', () => {
    const state = useCanvasFolderStore.getState();
    const parentId = state.createFolder('Parent');
    state.createFolder('Same Name', parentId);
    const s = useCanvasFolderStore.getState();
    expect(s.isFolderNameTaken('Same Name', parentId)).toBe(true);
    expect(s.isFolderNameTaken('Same Name', null)).toBe(false);
  });
});

// ─── D2.2: Move ───────────────────────────────────────────────────────────────

describe('canvasFolderStore — D2.2 Move', () => {
  it('moveCanvasToFolder maps canvas to folder', () => {
    const state = useCanvasFolderStore.getState();
    const folderId = state.createFolder('Folder');
    state.moveCanvasToFolder('canvas-1', folderId);
    const s2 = useCanvasFolderStore.getState();
    expect(s2.canvasFolderMap['canvas-1']).toBe(folderId);
  });

  it('moveCanvasToFolder to null moves canvas to root', () => {
    const state = useCanvasFolderStore.getState();
    const folderId = state.createFolder('Folder');
    state.moveCanvasToFolder('canvas-1', folderId);
    useCanvasFolderStore.getState().moveCanvasToFolder('canvas-1', null);
    expect(useCanvasFolderStore.getState().canvasFolderMap['canvas-1']).toBeNull();
  });

  it('batchMoveToFolder moves multiple canvases at once', () => {
    const state = useCanvasFolderStore.getState();
    const folderId = state.createFolder('Folder');
    state.batchMoveToFolder(['canvas-1', 'canvas-2', 'canvas-3'], folderId);
    const s2 = useCanvasFolderStore.getState();
    expect(s2.canvasFolderMap['canvas-1']).toBe(folderId);
    expect(s2.canvasFolderMap['canvas-2']).toBe(folderId);
    expect(s2.canvasFolderMap['canvas-3']).toBe(folderId);
  });

  it('batchMoveToFolder to null resets all to root', () => {
    const state = useCanvasFolderStore.getState();
    const folderId = state.createFolder('Folder');
    state.batchMoveToFolder(['canvas-1', 'canvas-2'], folderId);
    useCanvasFolderStore.getState().batchMoveToFolder(['canvas-1', 'canvas-2'], null);
    const s2 = useCanvasFolderStore.getState();
    expect(s2.canvasFolderMap['canvas-1']).toBeNull();
    expect(s2.canvasFolderMap['canvas-2']).toBeNull();
  });

  it('getCanvasesInFolder returns canvases in a folder', () => {
    const state = useCanvasFolderStore.getState();
    const folderId = state.createFolder('Folder');
    state.moveCanvasToFolder('canvas-1', folderId);
    state.moveCanvasToFolder('canvas-2', folderId);
    state.moveCanvasToFolder('canvas-3', null);
    const inFolder = useCanvasFolderStore.getState().getCanvasesInFolder(folderId);
    expect(inFolder).toContain('canvas-1');
    expect(inFolder).toContain('canvas-2');
    expect(inFolder).not.toContain('canvas-3');
  });

  it('getCanvasesInFolder returns root canvases when folderId is null', () => {
    const state = useCanvasFolderStore.getState();
    const folderId = state.createFolder('Folder');
    state.moveCanvasToFolder('canvas-1', folderId);
    state.moveCanvasToFolder('canvas-2', null);
    const rootCanvases = useCanvasFolderStore.getState().getCanvasesInFolder(null);
    expect(rootCanvases).toContain('canvas-2');
    expect(rootCanvases).not.toContain('canvas-1');
  });
});

// ─── D2.5: Delete Confirmation ────────────────────────────────────────────────

describe('canvasFolderStore — D2.5 Delete Confirmation', () => {
  it('deleteFolder moves canvases back to root', () => {
    const state = useCanvasFolderStore.getState();
    const folderId = state.createFolder('Folder');
    state.moveCanvasToFolder('canvas-1', folderId);
    state.moveCanvasToFolder('canvas-2', folderId);
    const result = useCanvasFolderStore.getState().deleteFolder(folderId);
    expect(result?.orphanedCanvases).toContain('canvas-1');
    expect(result?.orphanedCanvases).toContain('canvas-2');
    const s2 = useCanvasFolderStore.getState();
    expect(s2.canvasFolderMap['canvas-1']).toBeNull();
    expect(s2.canvasFolderMap['canvas-2']).toBeNull();
  });

  it('setPendingDeleteFolder sets pendingDeleteFolderId', () => {
    const state = useCanvasFolderStore.getState();
    const folderId = state.createFolder('Folder');
    state.setPendingDeleteFolder(folderId);
    expect(useCanvasFolderStore.getState().pendingDeleteFolderId).toBe(folderId);
  });

  it('setPendingDeleteFolder null clears pending', () => {
    const state = useCanvasFolderStore.getState();
    state.setPendingDeleteFolder('some-id');
    useCanvasFolderStore.getState().setPendingDeleteFolder(null);
    expect(useCanvasFolderStore.getState().pendingDeleteFolderId).toBeNull();
  });

  it('deleteFolder returns null when folder does not exist', () => {
    const result = useCanvasFolderStore.getState().deleteFolder('nonexistent');
    expect(result).toBeNull();
  });

  it('deleteFolder with no canvases returns empty orphaned list', () => {
    const state = useCanvasFolderStore.getState();
    const folderId = state.createFolder('Empty Folder');
    const result = useCanvasFolderStore.getState().deleteFolder(folderId);
    expect(result?.orphanedCanvases).toHaveLength(0);
  });

  it('deleteFolder clears pendingDeleteFolderId', () => {
    const state = useCanvasFolderStore.getState();
    const folderId = state.createFolder('Folder');
    state.setPendingDeleteFolder(folderId);
    useCanvasFolderStore.getState().deleteFolder(folderId);
    expect(useCanvasFolderStore.getState().pendingDeleteFolderId).toBeNull();
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('canvasFolderStore — Edge Cases', () => {
  it('handles move to same folder (no-op)', () => {
    const state = useCanvasFolderStore.getState();
    const folderId = state.createFolder('Folder');
    state.moveCanvasToFolder('canvas-1', folderId);
    useCanvasFolderStore.getState().moveCanvasToFolder('canvas-1', folderId);
    expect(useCanvasFolderStore.getState().canvasFolderMap['canvas-1']).toBe(folderId);
  });

  it('getRootFolders returns empty array when no folders', () => {
    expect(useCanvasFolderStore.getState().getRootFolders()).toHaveLength(0);
  });

  it('getChildFolders returns empty array for empty parent', () => {
    useCanvasFolderStore.getState().createFolder('Parent');
    expect(useCanvasFolderStore.getState().getChildFolders('folder-1')).toHaveLength(0);
  });

  it('batchMoveToFolder with empty array is safe', () => {
    useCanvasFolderStore.getState().batchMoveToFolder([], 'folder-1');
    expect(Object.keys(useCanvasFolderStore.getState().canvasFolderMap).length).toBe(0);
  });
});
