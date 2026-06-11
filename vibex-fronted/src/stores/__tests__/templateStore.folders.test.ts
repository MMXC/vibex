import { create } from 'zustand';

/**
 * templateStore.folders.test.ts — Template Folder Zustand Store tests
 * S87-E5: 模板文件夹管理
 *
 * Tests Zustand store methods:
 * 1. loadFolders — fetches folder list with templateCount
 * 2. createFolder — creates folder, adds to state
 * 3. updateFolder — updates folder name/icon
 * 4. deleteFolder — removes folder from state
 * 5. moveToFolder — moves template between folders
 * 6. getTemplatesByFolder — filters templates by folderId
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockJsonResponse = (data: unknown) => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(data),
  });
};

// ── loadFolders ───────────────────────────────────────────────────────────────

describe('loadFolders', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('loads folder list with templateCount', async () => {
    const apiData = {
      success: true,
      folders: [
        { folderId: 'f1', name: 'Work', icon: '💼', sortOrder: 0, templateCount: 3, createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
        { folderId: 'f2', name: 'Personal', icon: '🏠', sortOrder: 1, templateCount: 1, createdAt: '2026-06-02T00:00:00Z', updatedAt: '2026-06-02T00:00:00Z' },
      ],
    };
    mockJsonResponse(apiData);

    // Inline store so variable scoping is unambiguous
    const store = createTestStore({ folders: [] });
    await store.getState().loadFolders();

    const state = store.getState();
    expect(state.folders).toHaveLength(2);
    expect(state.folders[0].name).toBe('Work');
    expect(state.folders[0].templateCount).toBe(3);
  });

  it('sets empty folders when API returns empty array', async () => {
    mockJsonResponse({ success: true, folders: [] });

    const store = createTestStore({ folders: [{ folderId: 'old' } as any] });
    await store.getState().loadFolders();

    expect(store.getState().folders).toEqual([]);
  });

  it('sets foldersLoaded=true after load', async () => {
    mockJsonResponse({ success: true, folders: [] });

    const store = createTestStore({ folders: [] });
    expect(store.getState().foldersLoaded).toBe(false);
    await store.getState().loadFolders();
    expect(store.getState().foldersLoaded).toBe(true);
  });
});

// ── createFolder ─────────────────────────────────────────────────────────────

describe('createFolder', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('creates folder and adds to state', async () => {
    mockJsonResponse({
      success: true,
      folder: { folderId: 'f-new', name: 'Work', icon: '💼', sortOrder: 0, templateCount: 0, createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
    });

    const store = createTestStore({ folders: [] });
    await store.getState().createFolder('Work', '💼');

    const state = store.getState();
    expect(state.folders).toHaveLength(1);
    expect(state.folders[0].name).toBe('Work');
    expect(state.folders[0].folderId).toBe('f-new');
  });

  it('creates folder with default icon when not provided', async () => {
    mockJsonResponse({
      success: true,
      folder: { folderId: 'f-new', name: 'My Folder', icon: '📁', sortOrder: 0, templateCount: 0, createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
    });

    const store = createTestStore({ folders: [] });
    await store.getState().createFolder('My Folder');

    const state = store.getState();
    expect(state.folders[0].icon).toBe('📁');
  });
});

// ── updateFolder ─────────────────────────────────────────────────────────────

describe('updateFolder', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('updates folder name and icon', async () => {
    mockJsonResponse({
      success: true,
      folder: { folderId: 'f1', name: 'Work Updated', icon: '📂', sortOrder: 0, templateCount: 2, createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-02T00:00:00Z' },
    });

    const store = createTestStore({
      folders: [
        { folderId: 'f1', name: 'Work', icon: '💼', sortOrder: 0, templateCount: 2, createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
      ],
    });
    await store.getState().updateFolder('f1', 'Work Updated', '📂');

    const state = store.getState();
    expect(state.folders[0].name).toBe('Work Updated');
    expect(state.folders[0].icon).toBe('📂');
  });

  it('updates only the specified folder', async () => {
    mockJsonResponse({
      success: true,
      folder: { folderId: 'f1', name: 'Changed', icon: '💼', sortOrder: 0, templateCount: 0, createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
    });

    const store = createTestStore({
      folders: [
        { folderId: 'f1', name: 'Work', icon: '💼', sortOrder: 0, templateCount: 0, createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
        { folderId: 'f2', name: 'Personal', icon: '🏠', sortOrder: 1, templateCount: 0, createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
      ],
    });
    await store.getState().updateFolder('f1', 'Changed', '💼');

    const state = store.getState();
    expect(state.folders[0].name).toBe('Changed');
    expect(state.folders[1].name).toBe('Personal'); // f2 unchanged
  });
});

// ── deleteFolder ─────────────────────────────────────────────────────────────

describe('deleteFolder', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('removes folder from state', async () => {
    mockJsonResponse({ success: true });

    const store = createTestStore({
      folders: [
        { folderId: 'f1', name: 'Work', icon: '💼', sortOrder: 0, templateCount: 0, createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
        { folderId: 'f2', name: 'Personal', icon: '🏠', sortOrder: 1, templateCount: 0, createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
      ],
    });
    await store.getState().deleteFolder('f1');

    const state = store.getState();
    expect(state.folders).toHaveLength(1);
    expect(state.folders[0].folderId).toBe('f2');
  });
});

// ── moveToFolder ─────────────────────────────────────────────────────────────

describe('moveToFolder', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('moves template to specified folder', async () => {
    mockJsonResponse({ success: true, folder: { folderId: 'f1', name: 'Work', icon: '💼' } });

    const store = createTestStore({
      templates: [
        { id: 't1', name: 'Template A', folderId: null },
        { id: 't2', name: 'Template B', folderId: null },
      ],
    });
    await store.getState().moveToFolder('t1', 'f1');

    const state = store.getState();
    expect(state.templates[0].folderId).toBe('f1');
    expect(state.templates[1].folderId).toBeNull(); // unchanged
  });

  it('moves template out of folder (null)', async () => {
    mockJsonResponse({ success: true, folder: null });

    const store = createTestStore({
      templates: [
        { id: 't1', name: 'Template A', folderId: 'f1' },
      ],
    });
    await store.getState().moveToFolder('t1', null);

    const state = store.getState();
    expect(state.templates[0].folderId).toBeNull();
  });
});

// ── getTemplatesByFolder ───────────────────────────────────────────────────────

describe('getTemplatesByFolder', () => {
  it('returns templates in specified folder', () => {
    const templates = [
      { id: 't1', name: 'Template A', folderId: 'f1' },
      { id: 't2', name: 'Template B', folderId: 'f2' },
      { id: 't3', name: 'Template C', folderId: 'f1' },
      { id: 't4', name: 'Template D', folderId: null },
    ];

    const store = createTestStore({ templates: templates as any });

    expect(store.getState().getTemplatesByFolder('f1')).toHaveLength(2);
    expect(store.getState().getTemplatesByFolder(null)).toHaveLength(1);
    expect(store.getState().getTemplatesByFolder('f2')).toHaveLength(1);
    expect(store.getState().getTemplatesByFolder('nonexistent')).toHaveLength(0);
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

type TemplateFolder = {
  folderId: string;
  name: string;
  icon: string;
  sortOrder: number;
  templateCount: number;
  createdAt: string;
  updatedAt: string;
};

type TemplateItem = {
  id: string;
  name: string;
  folderId: string | null;
};

type TestStore = {
  folders: TemplateFolder[];
  foldersLoaded: boolean;
  templates: TemplateItem[];
  loadFolders: () => Promise<void>;
  createFolder: (name: string, icon?: string) => Promise<void>;
  updateFolder: (folderId: string, name: string, icon?: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  moveToFolder: (templateId: string, folderId: string | null) => Promise<void>;
  getTemplatesByFolder: (folderId: string | null) => TemplateItem[];
};

function createTestStore(init: Partial<{ folders: TemplateFolder[]; templates: TemplateItem[] }>) {
  return create((set, get) => ({
    folders: init.folders ?? [],
    foldersLoaded: false,
    templates: init.templates ?? [],

    loadFolders: async () => {
      const res = await fetch('/api/templates/folders');
      const data = await res.json();
      set({ folders: data.folders, foldersLoaded: true });
    },

    createFolder: async (name, icon) => {
      const res = await fetch('/api/templates/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, icon }),
      });
      const data = await res.json();
      set({ folders: [...get().folders, data.folder] });
    },

    updateFolder: async (folderId, name, icon) => {
      const res = await fetch(`/api/templates/folders/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, icon }),
      });
      const data = await res.json();
      set({ folders: get().folders.map(f => f.folderId === folderId ? data.folder : f) });
    },

    deleteFolder: async (folderId) => {
      await fetch(`/api/templates/folders/${folderId}`, { method: 'DELETE' });
      set({ folders: get().folders.filter(f => f.folderId !== folderId) });
    },

    moveToFolder: async (templateId, folderId) => {
      const res = await fetch(`/api/templates/${templateId}/folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
      });
      const data = await res.json();
      set({
        templates: get().templates.map(t =>
          t.id === templateId
            ? { ...t, folderId: data.folder?.folderId ?? folderId }
            : t
        ),
      });
    },

    getTemplatesByFolder: (folderId) =>
      get().templates.filter(t => t.folderId === folderId),
  }));
}
