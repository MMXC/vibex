/**
 * BackupService — Canvas data backup and restore
 *
 * E5 (Sprint61): 画布数据备份与导出
 * - exportBackup(canvasId): Serialize canvas state → .vibex Blob (application/vibex)
 * - importBackup(file): Parse .vibex blob → restore to DDSCanvasStore
 * - listBackups(): Return localStorage backup records
 * - deleteBackup(id): Delete a backup record
 *
 * Backup format (.vibex):
 * { version: "1.0", canvasId, name, createdAt, chapters: {...}, metadata: {...} }
 */

import type { ChapterType, ChapterData } from '@/types/dds';

// ==================== Types ====================

export interface BackupRecord {
  id: string;
  name: string;
  canvasId: string;
  createdAt: string; // ISO timestamp
  size: number; // bytes
  version: string;
}

export interface BackupPayload {
  version: string;
  canvasId: string;
  name: string;
  createdAt: string;
  chapters: Record<ChapterType, ChapterData>;
  activeChapter: ChapterType;
  metadata: {
    nodeCount: number;
    edgeCount: number;
    exportedBy: 'BackupService';
  };
}

// ==================== Constants ====================

const BACKUP_KEY_PREFIX = 'vibex-backup-';
const BACKUP_INDEX_KEY = 'vibex-backup-index';

/** MIME type for .vibex backup files */
export const VIBEX_MIME_TYPE = 'application/vibex';

/** Current backup file format version */
export const BACKUP_VERSION = '1.0';

// ==================== Helper ====================

function generateId(): string {
  return `backup-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function countNodesEdges(chapters: Record<ChapterType, ChapterData>): { nodes: number; edges: number } {
  let nodes = 0;
  let edges = 0;
  for (const chapter of Object.values(chapters)) {
    nodes += (chapter.cards ?? []).length;
    edges += (chapter.edges ?? []).length;
  }
  return { nodes, edges };
}

// ==================== Dynamic imports (avoid circular deps) ====================

async function getCanvasState(canvasId: string): Promise<BackupPayload> {
  const { useDDSCanvasStore } = await import('@/stores/dds');
  const { useCanvasHistoryStore } = await import('@/stores/dds/canvasHistoryStore');

  const state = useDDSCanvasStore.getState();
  const historyState = useCanvasHistoryStore.getState();

  // Get the active canvas id (default to provided or state's activeCanvasId)
  const activeId = canvasId || state.activeCanvasId || 'default';

  // Clone chapters data (deep copy to avoid reference issues)
  const chapters: Record<ChapterType, ChapterData> = {} as Record<ChapterType, ChapterData>;
  for (const [key, chapter] of Object.entries(state.chapters)) {
    chapters[key as ChapterType] = {
      ...chapter,
      cards: chapter.cards ? chapter.cards.map(c => ({ ...c })) : [],
      edges: chapter.edges ? chapter.edges.map(e => ({ ...e })) : [],
    };
  }

  const { nodes, edges } = countNodesEdges(chapters);

  return {
    version: BACKUP_VERSION,
    canvasId: activeId,
    name: `画布备份 ${new Date().toLocaleString('zh-CN')}`,
    createdAt: new Date().toISOString(),
    chapters,
    activeChapter: state.activeChapter,
    metadata: {
      nodeCount: nodes,
      edgeCount: edges,
      exportedBy: 'BackupService',
    },
  };
}

// ==================== Backup Index (localStorage) ====================

function readIndex(): BackupRecord[] {
  try {
    const raw = localStorage.getItem(BACKUP_INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeIndex(records: BackupRecord[]): void {
  localStorage.setItem(BACKUP_INDEX_KEY, JSON.stringify(records));
}

// ==================== Public API ====================

/**
 * Export canvas state as a .vibex Blob (application/vibex)
 * Also registers the backup in localStorage index.
 */
export async function exportBackup(canvasId: string, name?: string): Promise<Blob> {
  const payload = await getCanvasState(canvasId);
  if (name) payload.name = name;

  const json = JSON.stringify(payload);
  const blob = new Blob([json], { type: VIBEX_MIME_TYPE });

  // Register in localStorage index
  const record: BackupRecord = {
    id: generateId(),
    name: payload.name,
    canvasId: payload.canvasId,
    createdAt: payload.createdAt,
    size: blob.size,
    version: payload.version,
  };

  const index = readIndex();
  index.unshift(record); // newest first
  writeIndex(index);

  return blob;
}

/**
 * Download backup as a .vibex file (triggers browser download)
 */
export async function downloadBackup(canvasId: string, name?: string): Promise<void> {
  const blob = await exportBackup(canvasId, name);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-${Date.now()}.vibex`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import a .vibex backup file and restore canvas state.
 * Returns the parsed BackupPayload for confirmation UI.
 */
export async function importBackup(file: File): Promise<BackupPayload> {
  const text = await file.text();
  const payload: BackupPayload = JSON.parse(text);

  if (!payload.version || !payload.chapters) {
    throw new Error('无效的 .vibex 备份文件格式');
  }

  // Dynamically import the store setter to restore state
  const { useDDSCanvasStore } = await import('@/stores/dds');

  const state = useDDSCanvasStore.getState();

  // Restore chapters
  for (const [key, chapter] of Object.entries(payload.chapters)) {
    const chapterType = key as ChapterType;
    // Merge: replace cards/edges but preserve loading/error state
    state.setChapterData(chapterType, {
      ...chapter,
      cards: chapter.cards ?? [],
      edges: chapter.edges ?? [],
      loading: false,
      error: null,
    });
  }

  // Restore active chapter if valid
  if (payload.activeChapter && payload.chapters[payload.activeChapter]) {
    state.setActiveChapter(payload.activeChapter);
  }

  return payload;
}

/**
 * List all backup records from localStorage index.
 */
export function listBackups(): BackupRecord[] {
  return readIndex();
}

/**
 * Delete a backup record by id.
 */
export function deleteBackup(id: string): void {
  const index = readIndex();
  const filtered = index.filter(r => r.id !== id);
  writeIndex(filtered);
}

/**
 * Get a backup record by id.
 */
export function getBackup(id: string): BackupRecord | null {
  const index = readIndex();
  return index.find(r => r.id === id) ?? null;
}

/**
 * Format bytes to human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ==================== Cloud Backup (S62-E3) ====================

export interface CloudBackupRecord {
  id: string;
  canvasId: string;
  name: string;
  createdAt: string;
  size: number;
  version: string;
  restoredAt?: string;
}

/**
 * Upload canvas state to cloud backup.
 * POST /api/backup — sends BackupPayload to backend.
 */
export async function cloudBackup(canvasId: string, name?: string): Promise<CloudBackupRecord> {
  const payload = await getCanvasState(canvasId);
  if (name) payload.name = name;

  const res = await fetch('/api/backup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`云端备份失败: ${res.status}`);
  }

  const result = await res.json() as CloudBackupRecord;
  return result;
}

/**
 * List cloud backups for a canvas.
 * GET /api/backup?canvasId=xxx
 */
export async function listCloudBackups(canvasId: string): Promise<CloudBackupRecord[]> {
  const res = await fetch(`/api/backup?canvasId=${encodeURIComponent(canvasId)}`, {
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`获取云端备份列表失败: ${res.status}`);
  }

  const data = await res.json() as { backups?: CloudBackupRecord[] };
  return data.backups ?? [];
}

/**
 * Restore canvas state from a cloud backup.
 * POST /api/backup/[canvasId] with action=restore
 */
export async function cloudRestore(canvasId: string, backupId: string): Promise<void> {
  const res = await fetch(`/api/backup/${encodeURIComponent(canvasId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'restore', backupId }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`云端恢复失败: ${res.status}`);
  }

  const data = await res.json() as { payload: BackupPayload };

  // Restore into canvas store
  const { useDDSCanvasStore } = await import('@/stores/dds');
  const state = useDDSCanvasStore.getState();

  for (const [key, chapter] of Object.entries(data.payload.chapters)) {
    const chapterType = key as ChapterType;
    state.setChapterData(chapterType, {
      ...chapter,
      cards: chapter.cards ?? [],
      edges: chapter.edges ?? [],
      loading: false,
      error: null,
    });
  }

  if (data.payload.activeChapter && data.payload.chapters[data.payload.activeChapter]) {
    state.setActiveChapter(data.payload.activeChapter);
  }
}

/**
 * Delete a cloud backup.
 * DELETE /api/backup/[canvasId]?backupId=xxx
 */
export async function deleteCloudBackup(canvasId: string, backupId: string): Promise<void> {
  const res = await fetch(
    `/api/backup/${encodeURIComponent(canvasId)}?backupId=${encodeURIComponent(backupId)}`,
    { method: 'DELETE', signal: AbortSignal.timeout(8000) }
  );

  if (!res.ok) {
    throw new Error(`删除云端备份失败: ${res.status}`);
  }
}
