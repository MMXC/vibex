/**
 * canvasListStore.ts — Sprint47 E4: Canvas List View + Multi-canvas Management
 *
 * 职责：管理画布列表元数据（名称、创建时间、修改时间、缩略图）。
 * 持久化：IndexedDB (ddsPersistence service) + localStorage index。
 *
 * S68-E4 扩展：
 * - copyNodesBetweenCanvases: 将选中的画布元数据条目复制到目标画布（ID 重映射）
 * - batchTemplateExport: 将选中的画布元数据导出为 .vbtmpl 下载文件
 *
 * S76-E3 扩展：
 * - canvasIndex[]: Fuse.js 搜索索引（name:2, description:1, tags:1）
 * - rebuildIndex(): 从当前 canvases 重建索引
 * - indexedSearch(query): 加权多字段搜索
 */

import { create } from 'zustand';
import Fuse from 'fuse.js';
import { generateId, generatePrefixedId } from '@/lib/canvas/id';
import type { DDSCard, DDSEdge, ChapterType } from '@/types/dds';
import type { RequirementTemplate } from '@/data/templates';
import type { CanvasChapterData } from '@/lib/canvas/canvasStoreRegistry';
import { canvasStoreRegistry } from '@/lib/canvas/canvasStoreRegistry';
import { quickSave, quickLoad } from '@/services/dds/ddsPersistence';

// ============================================
// Types
// ============================================

export interface CanvasMeta {
  id: string;
  name: string;
  thumbnail: string | null; // base64 data URL
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  /** Archive timestamp — set when canvas is archived (S64-E4) */
  archivedAt?: string;
  /** Canvas description for search indexing (S76-E3) */
  description?: string;
  /** Canvas tags for search indexing (S76-E3) */
  tags?: string[];
  /** Relation IDs pointing into canvasRelations map (S78-E5) */
  relationIds?: string[];
}

// S76-E3: Indexed search entry (mirrors canvasSearchStore.CanvasIndexEntry for canvas-level search)
export interface CanvasIndexEntry {
  canvasId: string;
  name: string;
  description: string;
  tags: string[];
  updatedAt: string;
}

// S76-E3: Indexed search result
export interface IndexedSearchResult {
  canvasId: string;
  name: string;
  updatedAt: string;
  score: number;
  matchedField: 'name' | 'description' | 'tags' | 'multiple';
}

// S78-E4: Scheduled export entry
export interface ScheduledExport {
  id: string;
  /** Target canvas ID to export */
  canvasId: string;
  /** Human-readable canvas name at creation time */
  canvasName: string;
  /** Cron expression: minute hour day month weekday */
  cronExpression: string;
  /** Webhook URL to POST the ZIP to after export */
  webhookUrl: string;
  /** Whether this schedule is active */
  enabled: boolean;
  /** Last time this export ran successfully */
  lastRunAt: string | null;
  /** Last error message if last run failed */
  lastError: string | null;
  /** Number of successful runs */
  successCount: number;
  createdAt: string;
  /** Next scheduled run time (ISO string, computed from cronExpression + now) */
  nextRunAt: string | null;
}

// S79-E4: Canvas relation types (S78-E5: canvas relations tracking)
export type RelationType = 'derives_from' | 'copied_to' | 'archived_backup_of' | 'parent' | 'child' | 'related';

export interface CanvasRelation {
  id: string;
  sourceCanvasId: string;
  targetCanvasId: string;
  type: RelationType;
  label: string;
  createdAt: string;
}

export interface CanvasListState {
  /** In-memory canvas list, sorted by updatedAt descending */
  canvases: CanvasMeta[];
  /** Currently active (open) canvas id */
  activeCanvasId: string | null;
  /** Whether data has been loaded from IndexedDB */
  isLoaded: boolean;
  /** Search term for filtering canvases by name (Sprint48 E1) */
  searchTerm: string;
  /** Thumbnail cache — avoids re-generating toDataURL for same canvas (Sprint48 E1) */
  thumbnailCache: Record<string, string>;
  /** Multi-select set for batch export (Sprint48 E2) */
  selectedCanvasIds: Set<string>;
  /** Archive filter mode (S64-E4) */
  archiveFilterMode: 'all' | 'active' | 'archived';
  /** S76-E3: Fuse.js search index for canvasIndex[] + indexedSearch() */
  canvasIndex: CanvasIndexEntry[];
  /** S76-E3: Fuse.js instance for canvas index */
  canvasFuseIndex: Fuse<CanvasIndexEntry> | null;
  /** S78-E4: Scheduled export tasks keyed by id */
  scheduledExports: Record<string, ScheduledExport>;

  // Actions
  loadCanvases: () => Promise<void>;
  createCanvas: (name?: string) => Promise<CanvasMeta>;
  deleteCanvas: (id: string) => Promise<void>;
  renameCanvas: (id: string, name: string) => Promise<void>;
  setActiveCanvas: (id: string) => void;
  updateThumbnail: (id: string, thumbnail: string) => Promise<void>;
  getSortedCanvases: (sortBy: 'name' | 'updatedAt') => CanvasMeta[];
  /** Set search term for filtering (Sprint48 E1) */
  setSearchTerm: (term: string) => void;
  /** Get filtered canvases by search term, then sort (Sprint48 E1) */
  getFilteredCanvases: (sortBy: 'name' | 'updatedAt') => CanvasMeta[];
  /** Cache thumbnail for a canvas — idempotent (Sprint48 E1) */
  cacheThumbnail: (canvasId: string, thumbnail: string) => void;
  /** Get cached thumbnail — returns null if not yet cached (Sprint48 E1) */
  getCachedThumbnail: (canvasId: string) => string | null;
  /** Toggle canvas selection for batch export (Sprint48 E2) */
  toggleSelect: (canvasId: string) => void;
  /** Clear all selections (Sprint48 E2) */
  clearSelection: () => void;
  /** Batch export selected canvases as individual PDFs (Sprint48 E2) */
  exportSelectedPDF: () => Promise<void>;
  /** Paste clipboard cards to target canvas (Sprint48 E5) */
  pasteToCanvas: (canvasId: string) => void;
  /** Batch delete all selected canvases (Sprint60 E2) */
  batchDeleteCanvas: () => Promise<void>;
  /** Batch rename all selected canvases with a function (S64-E4) */
  batchRename: (canvasIds: string[], renameFn: (name: string, idx: number) => string) => Promise<void>;
  /** Archive selected canvases — sets archivedAt (S64-E4) */
  batchArchive: (canvasIds: string[]) => Promise<void>;
  /** Unarchive selected canvases — clears archivedAt (S64-E4) */
  batchUnarchive: (canvasIds: string[]) => Promise<void>;
  /** Set archive filter mode (S64-E4) */
  setArchiveFilterMode: (mode: 'all' | 'active' | 'archived') => void;
  /**
   * S68-E4: 复制选中的画布元数据条目到目标画布。
   */
  copyNodesBetweenCanvases: (srcId: string, nodeIds: string[], destId: string) => Promise<void>;
  /**
   * S68-E4: 批量导出选中的画布元数据为 .vbtmpl JSON 文件。
   */
  batchTemplateExport: (canvasIds: string[]) => Promise<void>;
  /**
   * S76-E2: 批量导出选中的画布节点为 PNG ZIP 文件。
   */
  batchExport: (canvasIds: string[], options?: {
    format?: 'png';
    scale?: number;
    backgroundColor?: string;
    onProgress?: (current: number, total: number, name: string) => void;
  }) => Promise<void>;
  /**
   * S76-E3: 从当前 canvases 重建 Fuse.js 搜索索引。
   */
  rebuildIndex: () => void;
  /**
   * S76-E3: 使用 Fuse.js 加权搜索 canvases。
   */
  indexedSearch: (query: string) => IndexedSearchResult[];
  /**
   * S78-E4: Add a new scheduled export task.
   * @returns the id of the newly created scheduled export
   */
  addScheduledExport: (canvasId: string, cronExpression: string, webhookUrl: string) => string;
  /** S78-E4: Remove a scheduled export by id */
  removeScheduledExport: (id: string) => void;
  /** S78-E4: Get a scheduled export by id */
  getScheduledExport: (id: string) => ScheduledExport | null;
  /** S78-E4: Update enabled/disabled status and last run results of a scheduled export */
  updateScheduledExportStatus: (
    id: string,
    updates: Partial<Pick<ScheduledExport, 'enabled' | 'lastRunAt' | 'lastError' | 'successCount' | 'nextRunAt'>>
  ) => void;
  // S78-E5: Canvas Relations
  canvasRelations: Record<string, CanvasRelation>;
  activeCanvasRelations: CanvasRelation[];
  addCanvasRelation: (sourceCanvasId: string, targetCanvasId: string, type: RelationType, label: string) => string;
  removeCanvasRelation: (relationId: string) => void;
  updateCanvasRelation: (relationId: string, updates: Partial<CanvasRelation>) => void;
  getCanvasRelations: (canvasId: string) => CanvasRelation[];
  /** S79-E4: BFS traversal for multi-depth relation graph (default depth=1) */
  getCanvasRelationsDepth: (canvasId: string, maxDepth?: number) => Array<CanvasRelation & { depth: number }>;
  getRelationStats: (canvasId: string) => { total: number; byType: Record<RelationType, number> };
  detectCircularRelation: (fromId: string, toId: string) => boolean;
}

// ============================================
// Constants
// ============================================

const IDB_CANVAS_LIST_KEY = 'vibex-canvas-list';
const LOCALSTORAGE_INDEX_KEY = 'vibex-canvas-index';

// S76-E3: Fuse.js weighted search options (name:2, description:1, tags:1)
const CANVAS_SEARCH_FUSE_OPTIONS: Fuse.IFuseOptions<CanvasIndexEntry> = {
  keys: [
    { name: 'name', weight: 2 },
    { name: 'description', weight: 1 },
    { name: 'tags', weight: 1 },
  ],
  threshold: 0.4,
  includeMatches: true,
  minMatchCharLength: 1,
  ignoreLocation: true,
};

// ============================================
// S78-E4: Cron expression parser + next run calculator
// ============================================

function matchCronField(field: string, value: number, max: number): boolean {
  if (field === '*') return true;
  if (field.startsWith('*/')) {
    const step = parseInt(field.slice(2), 10);
    return step > 0 && value % step === 0;
  }
  if (field.includes(',')) {
    return field.split(',').some((part) => matchCronField(part.trim(), value, max));
  }
  if (field.includes('-')) {
    const [startStr, endStr] = field.split('-');
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    return value >= start && value <= end;
  }
  return parseInt(field, 10) === value;
}

export function parseCronNextRun(cronExpression: string, from: Date = new Date()): string | null {
  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) return null;

  const [minuteField, hourField, dayField, monthField, weekdayField] = parts;
  const checkDate = new Date(from.getTime());
  checkDate.setSeconds(0, 0);

  // Parse the target minute(s) from minuteField to support "skip current hour" logic.
  // Returns null for wildcard (*), or:
  //   - 'single': single number like '30'
  //   - 'multi': */N (step) or list like '0,30' — multiple occurrences per hour
  function parseMinuteTarget(minuteF: string): { target: number | null; multi: boolean } {
    if (minuteF === '*') return { target: null, multi: true };
    if (minuteF.startsWith('*/')) return { target: parseInt(minuteF.slice(2), 10), multi: true };
    if (minuteF.includes(',')) return { target: 0, multi: true };
    if (minuteF.includes('-')) return { target: parseInt(minuteF.split('-')[0]!, 10), multi: false };
    return { target: parseInt(minuteF, 10), multi: false };
  }
  const { target: minuteTarget, multi: minuteMulti } = parseMinuteTarget(minuteField);

  for (let i = 0; i < 366 * 24 * 60; i++) {
    checkDate.setTime(from.getTime() + i * 60 * 1000);
    checkDate.setSeconds(0, 0);

    // Check if ALL fields match
    const minuteMatch = matchCronField(minuteField, checkDate.getUTCMinutes(), 59);
    const hourMatch = matchCronField(hourField, checkDate.getUTCHours(), 23);
    const dayMatch = matchCronField(dayField, checkDate.getUTCDate(), 31);
    const monthMatch = matchCronField(monthField, checkDate.getUTCMonth() + 1, 12);
    const weekdayMatch = matchCronField(weekdayField, checkDate.getUTCDay(), 6);

    if (minuteMatch && hourMatch && dayMatch && monthMatch && weekdayMatch) {
      // Option B: only skip for single-occurrence minute patterns (e.g., '30').
      // Multi-occurrence patterns (*/N, lists) can have multiple matches per hour → return first.
      if (minuteTarget !== null && !minuteMulti && i < 60) {
        if (i < minuteTarget) {
          // Target is ahead in current hour → return it (unless we're at second 0)
          if (i === 0) {
            const nowSeconds = from.getSeconds();
            if (nowSeconds > 0) return checkDate.toISOString();
            continue; // at second 0 of current minute → skip to next minute
          }
          return checkDate.toISOString();
        } else {
          // Target already passed in this hour → skip to next hour
          continue;
        }
      }
      // Wildcard minute or past the first hour window
      if (i === 0) {
        const nowSeconds = from.getSeconds();
        if (nowSeconds > 0) return checkDate.toISOString();
        continue; // at second 0 → skip to next minute
      }
      return checkDate.toISOString();
    }
  }
  return null;
}

export function isValidCronExpression(cron: string): boolean {
  return parseCronNextRun(cron) !== null;
}

// ============================================
// Persistence helpers (re-use ddsPersistence patterns)
// ============================================

function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' !== undefined && window.indexedDB != null;
}

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    localStorage.setItem('__test__', '1');
    localStorage.removeItem('__test__');
    return true;
  } catch {
    return false;
  }
}

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('vibex-canvas-list', 1);
    request.onerror = () => reject(new Error(`IndexedDB open failed: ${request.error}`));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('canvases')) {
        db.createObjectStore('canvases', { keyPath: 'id' });
      }
    };
  });
}

async function idbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(storeName: string, value: unknown): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(storeName: string, key: string): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ============================================
// Store
// ============================================

export const useCanvasListStore = create<CanvasListState>((set, get) => ({
  canvases: [],
  activeCanvasId: null,
  isLoaded: false,
  searchTerm: '',
  thumbnailCache: {},
  selectedCanvasIds: new Set(),
  archiveFilterMode: 'active', // S64-E4: default to active (non-archived) canvases
  canvasIndex: [], // S76-E3: Fuse.js canvas search index
  canvasFuseIndex: null, // S76-E3: Fuse instance
  scheduledExports: {}, // S78-E4: scheduled export tasks

  loadCanvases: async () => {
    if (!isIndexedDBAvailable()) {
      set({ isLoaded: true });
      return;
    }
    try {
      const canvases = await idbGetAll<CanvasMeta>('canvases');
      // Sort by updatedAt desc
      canvases.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      set({ canvases, isLoaded: true });
      // S76-E3: Rebuild search index after canvases are loaded
      get().rebuildIndex();
    } catch (err) {
      console.error('[canvasListStore] loadCanvases failed:', err);
      set({ isLoaded: true });
    }
  },

  createCanvas: async (name?: string) => {
    const now = new Date().toISOString();
    const id = generateId();
    const canvasName = name ?? `画布 ${new Date().toLocaleDateString('zh-CN')}`;

    const meta: CanvasMeta = {
      id,
      name: canvasName,
      thumbnail: null,
      createdAt: now,
      updatedAt: now,
    };

    await idbPut('canvases', meta);

    // Update localStorage index
    if (isLocalStorageAvailable()) {
      try {
        const raw = localStorage.getItem(LOCALSTORAGE_INDEX_KEY);
        const ids: string[] = raw ? JSON.parse(raw) : [];
        localStorage.setItem(LOCALSTORAGE_INDEX_KEY, JSON.stringify([id, ...ids]));
      } catch {
        // non-critical
      }
    }

    set((state) => ({
      canvases: [meta, ...state.canvases],
    }));
    // S76-E3: Rebuild search index after canvas creation
    get().rebuildIndex();

    return meta;
  },

  deleteCanvas: async (id: string) => {
    await idbDelete('canvases', id);

    // Update localStorage index
    if (isLocalStorageAvailable()) {
      try {
        const raw = localStorage.getItem(LOCALSTORAGE_INDEX_KEY);
        const ids: string[] = raw ? JSON.parse(raw) : [];
        localStorage.setItem(LOCALSTORAGE_INDEX_KEY, JSON.stringify(ids.filter((i) => i !== id)));
      } catch {
        // non-critical
      }
    }

    set((state) => ({
      canvases: state.canvases.filter((c) => c.id !== id),
      activeCanvasId: state.activeCanvasId === id ? null : state.activeCanvasId,
    }));
    // S76-E3: Rebuild search index after canvas deletion
    get().rebuildIndex();
  },

  renameCanvas: async (id: string, name: string) => {
    const { canvases } = get();
    const existing = canvases.find((c) => c.id === id);
    if (!existing) return;

    const updated: CanvasMeta = {
      ...existing,
      name,
      updatedAt: new Date().toISOString(),
    };

    await idbPut('canvases', updated);

    set((state) => ({
      canvases: state.canvases.map((c) => (c.id === id ? updated : c)),
    }));
    // S76-E3: Rebuild search index after canvas rename (name changed)
    get().rebuildIndex();
  },

  setActiveCanvas: (id: string) => {
    set({ activeCanvasId: id });
  },

  updateThumbnail: async (id: string, thumbnail: string) => {
    const { canvases } = get();
    const existing = canvases.find((c) => c.id === id);
    if (!existing) return;

    const updated: CanvasMeta = {
      ...existing,
      thumbnail,
      updatedAt: new Date().toISOString(),
    };

    await idbPut('canvases', updated);

    set((state) => ({
      canvases: state.canvases.map((c) => (c.id === id ? updated : c)),
    }));
  },

  getSortedCanvases: (sortBy: 'name' | 'updatedAt') => {
    const { canvases } = get();
    return [...canvases].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'zh-CN');
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  },

  setSearchTerm: (term: string) => {
    set({ searchTerm: term });
  },

  getFilteredCanvases: (sortBy: 'name' | 'updatedAt') => {
    const { canvases, searchTerm, archiveFilterMode } = get();
    const term = searchTerm.trim().toLowerCase();

    let filtered = canvases;

    // Archive filter (S64-E4)
    if (archiveFilterMode === 'active') {
      filtered = filtered.filter((c) => !c.archivedAt);
    } else if (archiveFilterMode === 'archived') {
      filtered = filtered.filter((c) => !!c.archivedAt);
    }
    // 'all': no filter

    if (term) {
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(term));
    }
    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'zh-CN');
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  },

  cacheThumbnail: (canvasId: string, thumbnail: string) => {
    set((state) => ({
      thumbnailCache: { ...state.thumbnailCache, [canvasId]: thumbnail },
    }));
  },

  getCachedThumbnail: (canvasId: string) => {
    return get().thumbnailCache[canvasId] ?? null;
  },

  toggleSelect: (canvasId: string) => {
    set((state) => {
      const next = new Set(state.selectedCanvasIds);
      if (next.has(canvasId)) {
        next.delete(canvasId);
      } else {
        next.add(canvasId);
      }
      return { selectedCanvasIds: next };
    });
  },

  clearSelection: () => {
    set({ selectedCanvasIds: new Set() });
  },

  exportSelectedPDF: async () => {
    const { selectedCanvasIds, canvases } = get();
    if (selectedCanvasIds.size === 0) return;

    // For each selected canvas, fetch its data and download as PDF
    for (const canvasId of selectedCanvasIds) {
      const meta = canvases.find((c) => c.id === canvasId);
      if (!meta) continue;

      try {
        // Fetch PDF from backend API
        const response = await fetch('/api/export/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: canvasId, name: meta.name }),
        });

        if (!response.ok) {
          console.error(`[canvasListStore] PDF export failed for ${canvasId}: ${response.statusText}`);
          continue;
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${meta.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5-]/g, '_')}-${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error(`[canvasListStore] exportSelectedPDF error for ${canvasId}:`, err);
      }
    }
  },

  pasteToCanvas: (canvasId: string) => {
    // Sprint48 E5: cross-canvas paste — look up canvas name and delegate to clipboardStore
    const meta = get().canvases.find((c) => c.id === canvasId);
    if (!meta) {
      console.warn('[canvasListStore] pasteToCanvas: canvas not found', canvasId);
      return;
    }
    const { useClipboardStore } = require('@/stores/clipboardStore');
    const count = useClipboardStore.getState().crossCanvasPaste(canvasId, meta.name);
    if (count > 0) {
      console.debug('[canvasListStore] pasteToCanvas:', count, 'cards pasted to', meta.name);
    }
  },

  // ============================================================
  // Sprint60 E2: Batch Operations → S64-E4: Enhanced Batch Rename + Archive
  // ============================================================

  batchDeleteCanvas: async () => {
    const { selectedCanvasIds, canvases } = get();
    if (selectedCanvasIds.size === 0) return;

    // Delete each selected canvas sequentially
    for (const canvasId of selectedCanvasIds) {
      await get().deleteCanvas(canvasId);
    }

    // Clear selection after deletion
    set({ selectedCanvasIds: new Set() });
  },

  /**
   * S64-E4 D4.1 + D4.3: Flexible batch rename with a user-provided function.
   * Supports sequence mode (e.g. {name}1, {name}2) and regex find-replace.
   * Duplicate name auto-dedup: append -{n} if name already exists in other selected canvases.
   */
  batchRename: async (canvasIds, renameFn) => {
    if (canvasIds.length === 0) return;
    const { canvases } = get();

    // Build rename plan with deduplication
    const newNames = new Map<string, string>();
    const usedNames = new Set<string>();

    for (let i = 0; i < canvasIds.length; i++) {
      const canvasId = canvasIds[i];
      const canvas = canvases.find((c) => c.id === canvasId);
      if (!canvas) continue;

      let newName = renameFn(canvas.name, i + 1);

      // D4.4: Duplicate name detection — auto-dedup
      let dedupIndex = 2;
      let finalName = newName;
      while (usedNames.has(finalName)) {
        finalName = `${newName}-${dedupIndex}`;
        dedupIndex++;
      }
      usedNames.add(finalName);
      newNames.set(canvasId, finalName);
    }

    // Apply renames
    for (const [canvasId, newName] of newNames) {
      await get().renameCanvas(canvasId, newName);
    }

    set({ selectedCanvasIds: new Set() });
  },

  /**
   * S64-E4 D4.2: Archive selected canvases — sets archivedAt timestamp.
   */
  batchArchive: async (canvasIds) => {
    if (canvasIds.length === 0) return;
    const { canvases } = get();
    const now = new Date().toISOString();

    set((state) => ({
      canvases: state.canvases.map((c) =>
        canvasIds.includes(c.id) ? { ...c, archivedAt: now } : c
      ),
      selectedCanvasIds: new Set(),
    }));

    // Persist to IndexedDB
    for (const canvasId of canvasIds) {
      const canvas = canvases.find((c) => c.id === canvasId);
      if (canvas) {
        await idbPut('canvases', { ...canvas, archivedAt: now });
      }
    }
  },

  /**
   * S64-E4 D4.2: Unarchive selected canvases — clears archivedAt.
   */
  batchUnarchive: async (canvasIds) => {
    if (canvasIds.length === 0) return;
    const { canvases } = get();

    set((state) => ({
      canvases: state.canvases.map((c) =>
        canvasIds.includes(c.id) ? { ...c, archivedAt: undefined } : c
      ),
      selectedCanvasIds: new Set(),
    }));

    // Persist to IndexedDB
    for (const canvasId of canvasIds) {
      const canvas = canvases.find((c) => c.id === canvasId);
      if (canvas) {
        const { archivedAt: _archivedAt, ...rest } = canvas;
        await idbPut('canvases', rest);
      }
    }
  },

  /**
   * S64-E4 D4.6: Set archive filter mode.
   */
  setArchiveFilterMode: (mode) => {
    set({ archiveFilterMode: mode });
  },

  // ============================================================
  // S68-E4: Copy between canvases + Batch template export
  // ============================================================

  /**
   * S68-E4: copyNodesBetweenCanvases
   * 复制选中的画布元数据条目到目标画布区域，ID 重映射，名称追加 " (副本)"。
   */
  copyNodesBetweenCanvases: async (srcId, nodeIds, destId) => {
    if (nodeIds.length === 0) return;
    const { canvases } = get();
    const now = new Date().toISOString();

    const copies: CanvasMeta[] = nodeIds.map((id) => {
      const original = canvases.find((c) => c.id === id);
      if (!original) return null;
      const newId = generatePrefixedId('canvas');
      return {
        ...original,
        id: newId,
        name: `${original.name} (副本)`,
        createdAt: now,
        updatedAt: now,
        archivedAt: undefined,
        thumbnail: null, // thumbnails are canvas-specific; clear for copies
      };
    }).filter((c): c is CanvasMeta => c !== null);

    if (copies.length === 0) return;

    set((state) => ({
      canvases: [...state.canvases, ...copies],
      selectedCanvasIds: new Set(),
    }));

    // Persist each copy to IndexedDB
    for (const copy of copies) {
      await idbPut('canvases', copy);
    }
    // S76-E3: Rebuild search index after canvas copies created
    get().rebuildIndex();
  },

  /**
   * S68-E4: batchTemplateExport
   * 将选中的画布元数据导出为 .vbtmpl JSON 文件并触发浏览器下载。
   */
  batchTemplateExport: async (canvasIds) => {
    if (canvasIds.length === 0) return;
    const { canvases } = get();

    const selected = canvasIds
      .map((id) => canvases.find((c) => c.id === id))
      .filter((c): c is CanvasMeta => c !== null);

    if (selected.length === 0) return;

    const payload = {
      version: '1.0' as const,
      exportedAt: new Date().toISOString(),
      exportedBy: 'VibeX',
      type: 'canvas-meta-template' as const,
      canvases: selected.map(({ id: _id, ...meta }) => meta),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibex-canvas-template-${Date.now()}.vbtmpl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * S76-E2: batchExport
   * 批量导出选中的画布节点为 PNG ZIP 文件。
   *
   * 流程：
   * 1. 保存当前活跃画布 ID（用于导出后恢复）
   * 2. 遍历每个选中画布：从 IndexedDB 加载完整数据 → 收集所有 cards
   * 3. 逐个激活画布（触发 DOM 渲染）→ html-to-image 捕获为 PNG
   * 4. 所有 PNG 打包为 ZIP → 触发浏览器下载
   * 5. 恢复原始活跃画布
   */
  batchExport: async (canvasIds, options = {}) => {
    if (canvasIds.length === 0) return;
    const {
      scale = 2,
      backgroundColor = '#0f0f1a',
      onProgress,
    } = options;

    const { zipExporter, downloadExportBlob } = await import('@/services/export/ZipExporter');

    const blob = await zipExporter.exportCanvases(canvasIds, {
      format: 'png',
      scope: 'all',
      scale,
      backgroundColor,
      onProgress,
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    downloadExportBlob(blob, `vibex-batch-export-${timestamp}.zip`);

    // 导出完成后清除选中状态
    get().clearSelection();
  },

  // ============================================================
  // S78-E4: Cron expression parser + next run calculator
  // Supports: minute hour day month weekday
  // ============================================================

  /**
   * Parse a cron field value and check if a given value matches.
   * Supports: *, specific number, *\/n (every n), n,m (list), n-m (range)
   */
  // (helpers defined above store creation)

  // ============================================================
  // S78-E4: Scheduled export actions
  // ============================================================

  addScheduledExport: (canvasId: string, cronExpression: string, webhookUrl: string) => {
    const { canvases } = get();
    const canvas = canvases.find((c) => c.id === canvasId);
    if (!canvas) throw new Error(`Canvas not found: ${canvasId}`);
    if (!isValidCronExpression(cronExpression)) throw new Error(`Invalid cron expression: ${cronExpression}`);

    const id = generateId();
    const nextRunAt = parseCronNextRun(cronExpression);

    set((state) => ({
      scheduledExports: {
        ...state.scheduledExports,
        [id]: {
          id,
          canvasId,
          canvasName: canvas.name,
          cronExpression,
          webhookUrl,
          enabled: true,
          lastRunAt: null,
          lastError: null,
          successCount: 0,
          createdAt: new Date().toISOString(),
          nextRunAt,
        },
      },
    }));

    return id;
  },

  removeScheduledExport: (id: string) => {
    set((state) => {
      const next = { ...state.scheduledExports };
      delete next[id];
      return { scheduledExports: next };
    });
  },

  getScheduledExport: (id: string) => {
    return get().scheduledExports[id] ?? null;
  },

  updateScheduledExportStatus: (id, updates) => {
    set((state) => {
      const existing = state.scheduledExports[id];
      if (!existing) return state;
      return {
        scheduledExports: {
          ...state.scheduledExports,
          [id]: { ...existing, ...updates },
        },
      };
    });
  },

  // S79-E1: Mark a scheduled export as run (updates lastRunAt, advances nextRunAt by 1h)
  markExportRun: (id: string) => {
    const existing = get().scheduledExports[id];
    if (!existing) return;
    const next = new Date();
    next.setHours(next.getHours() + 1);
    get().updateScheduledExportStatus(id, {
      lastRunAt: new Date().toISOString(),
      successCount: (existing.successCount ?? 0) + 1,
      nextRunAt: next.toISOString(),
    });
  },

  // ============================================================
  // S76-E3: Canvas indexed search (Fuse.js weighted: name:2, description:1, tags:1)
  // ============================================================

  rebuildIndex: () => {
    const { canvases } = get();
    const entries: CanvasIndexEntry[] = canvases
      .filter((c) => !c.archivedAt) // only index active canvases
      .map((c) => ({
        canvasId: c.id,
        name: c.name,
        description: c.description ?? '',
        tags: c.tags ?? [],
        updatedAt: c.updatedAt,
      }));

    const fuse = new Fuse(entries, CANVAS_SEARCH_FUSE_OPTIONS);
    set({ canvasIndex: entries, canvasFuseIndex: fuse });
  },

  indexedSearch: (query: string): IndexedSearchResult[] => {
    const { canvasFuseIndex } = get();
    if (!canvasFuseIndex || !query.trim()) return [];

    const fuseResults = canvasFuseIndex.search(query);
    return fuseResults.map((r) => {
      const matchedKeys = r.matches?.map((m) => m.key) ?? [];
      const matchedField: IndexedSearchResult['matchedField'] =
        matchedKeys.length === 1
          ? (matchedKeys[0] as 'name' | 'description' | 'tags')
          : 'multiple';

      return {
        canvasId: r.item.canvasId,
        name: r.item.name,
        updatedAt: r.item.updatedAt,
        score: r.score ?? 0,
        matchedField,
      };
    });
  },

  // ============================================================
  // ─── S78-E5: Canvas Relations ───────────────────────────────────────────────
  canvasRelations: {} as Record<string, CanvasRelation>,
  activeCanvasRelations: [] as CanvasRelation[],

  // S79-E4: BFS traversal for multi-depth relation graph.
  // Reports each relation at the depth where the *target* canvas was first discovered.
  // Relations to already-visited canvases are skipped (each canvas appears at one depth).
  getCanvasRelationsDepth: (canvasId, maxDepth = 1) => {
    const { canvases, canvasRelations } = get();
    if (!canvasId || maxDepth < 1) return [];

    // BFS: queue entries are { canvasId, depth }
    const queue: Array<{ canvasId: string; depth: number }> = [{ canvasId, depth: 0 }];
    const visited = new Set<string>([canvasId]);
    const result: Array<CanvasRelation & { depth: number }> = [];

    while (queue.length > 0) {
      const { canvasId: currentId, depth } = queue.shift()!;
      if (depth >= maxDepth) continue;

      const canvas = canvases.find((c) => c.id === currentId);
      if (!canvas) continue;

      const relIds = canvas.relationIds ?? [];
      for (const relId of relIds) {
        const rel = canvasRelations[relId];
        if (!rel) continue;

        const otherId = rel.sourceCanvasId === currentId ? rel.targetCanvasId : rel.sourceCanvasId;
        if (visited.has(otherId)) continue;

        visited.add(otherId);
        result.push({ ...rel, depth: depth + 1 });
        queue.push({ canvasId: otherId, depth: depth + 1 });
      }
    }

    return result;
  },

  addCanvasRelation: (sourceCanvasId, targetCanvasId, type, label) => {
    const { canvases, canvasRelations } = get();
    const source = canvases.find((c) => c.id === sourceCanvasId);
    const target = canvases.find((c) => c.id === targetCanvasId);
    if (!source) throw new Error('Source canvas not found');
    if (!target) throw new Error('Target canvas not found');
    if (sourceCanvasId === targetCanvasId) throw new Error('circular dependency: self-loop');
    if (get().detectCircularRelation(sourceCanvasId, targetCanvasId)) {
      throw new Error('circular dependency detected');
    }
    const id = generatePrefixedId('rel');
    const relation: CanvasRelation = {
      id,
      sourceCanvasId,
      targetCanvasId,
      type,
      createdAt: new Date().toISOString(),
      label,
    };
    set({
      canvasRelations: { ...canvasRelations, [id]: relation },
      canvases: get().canvases.map((c) => {
        if (c.id === sourceCanvasId) return { ...c, relationIds: [...(c.relationIds ?? []), id] };
        if (c.id === targetCanvasId) return { ...c, relationIds: [...(c.relationIds ?? []), id] };
        return c;
      }),
    });
    return id;
  },

  removeCanvasRelation: (relationId) => {
    set({
      canvasRelations: Object.fromEntries(
        Object.entries(get().canvasRelations).filter(([k]) => k !== relationId)
      ),
      canvases: get().canvases.map((c) => {
        if (c.relationIds?.includes(relationId)) {
          return { ...c, relationIds: c.relationIds.filter((id) => id !== relationId) };
        }
        return c;
      }),
    });
  },

  updateCanvasRelation: (relationId, updates) => {
    const existing = get().canvasRelations[relationId];
    if (!existing) return;
    set({
      canvasRelations: {
        ...get().canvasRelations,
        [relationId]: { ...existing, ...updates },
      },
    });
  },

  getCanvasRelations: (canvasId) => {
    const { canvases, canvasRelations } = get();
    const canvas = canvases.find((c) => c.id === canvasId);
    if (!canvas) return [];
    return (canvas.relationIds ?? []).map((id) => canvasRelations[id]).filter(Boolean);
  },

  getRelationStats: (canvasId) => {
    const relations = get().getCanvasRelations(canvasId);
    const byType: Record<RelationType, number> = {
      derives_from: 0, copied_to: 0, archived_backup_of: 0,
      parent: 0, child: 0, related: 0,
    };
    for (const rel of relations) byType[rel.type]++;
    return { total: relations.length, byType };
  },

  detectCircularRelation: (fromId, toId) => {
    // Check if adding a relation fromId → toId would create a cycle.
    // Returns true if there's already a path from toId → fromId
    // (i.e., adding fromId → toId would create a cycle).
    if (fromId === toId) return true;
    const visited = new Set<string>();
    const stack = [toId]; // start from target, look for source
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === fromId) return true; // found path back to source = cycle
      if (visited.has(current)) continue;
      visited.add(current);
      // Follow outgoing relations from current
      const rels = get().getCanvasRelations(current);
      for (const rel of rels) {
        if (!visited.has(rel.targetCanvasId)) stack.push(rel.targetCanvasId);
      }
    }
    return false;
  },

  $reset: () => set({
    selectedCanvasIds: new Set(),
    canvasIndex: [],
    canvasFuseIndex: null,
    scheduledExports: {},
    canvasRelations: {},
    activeCanvasRelations: [],
  }),
}));
