/**
 * BackupService.test.ts — Unit tests for E5 Canvas Backup
 * E5 (Sprint61): 画布数据备份与导出
 *
 * Uses vi.hoisted() to share mock refs between vi.mock factory and test body.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  exportBackup,
  downloadBackup,
  listBackups,
  deleteBackup,
  getBackup,
  formatBytes,
  VIBEX_MIME_TYPE,
  BACKUP_VERSION,
} from '../BackupService';

// Mock localStorage
const store: Record<string, string> = {};
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
  },
  writable: true, configurable: true,
});

// Mock indexedDB for canvasHistoryStore
Object.defineProperty(globalThis, 'indexedDB', {
  value: { open: () => ({ result: { transaction: () => ({ objectStore: () => ({}) }) } }) },
  writable: true, configurable: true,
});

// Mock document for downloadBackup
const mockClick = vi.fn();
Object.defineProperty(globalThis.document, 'createElement', {
  value: vi.fn(() => ({ href: '', download: '', click: mockClick, style: {} })),
  writable: true,
});
Object.defineProperty(globalThis.document, 'body', {
  value: { appendChild: vi.fn(), removeChild: vi.fn() },
  writable: true,
});
(globalThis as Record<string, unknown>).URL = {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
};

// vi.hoisted: create refs BEFORE any vi.mock calls
// getState refs are defined here so they can be set in beforeEach
const { getStateRef, historyGetStateRef } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getStateRef: { current: () => Record<string, unknown> } = { current: () => ({}) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const historyGetStateRef: { current: () => Record<string, unknown> } = { current: () => ({}) };
  return { getStateRef, historyGetStateRef };
});

vi.mock('@/stores/dds', () => ({
  useDDSCanvasStore: { getState: () => getStateRef.current() },
}));

vi.mock('@/stores/dds/canvasHistoryStore', () => ({
  useCanvasHistoryStore: { getState: () => historyGetStateRef.current() },
}));

const mockCanvasState = {
  activeCanvasId: 'test-canvas',
  chapters: {
    requirement: { type: 'requirement' as const, cards: [{ id: 'c1', data: {} }], edges: [], loading: false, error: null },
    context: { type: 'context' as const, cards: [], edges: [], loading: false, error: null },
    flow: { type: 'flow' as const, cards: [], edges: [], loading: false, error: null },
    api: { type: 'api' as const, cards: [], edges: [], loading: false, error: null },
    'business-rules': { type: 'business-rules' as const, cards: [], edges: [], loading: false, error: null },
  },
  activeChapter: 'requirement' as const,
  setChapterData: vi.fn(),
  setActiveChapter: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  store['vibex-backup-index'] = '[]';
  mockClick.mockClear();
  getStateRef.current = () => mockCanvasState;
  historyGetStateRef.current = () => ({ snapshots: [] });
});

describe('BackupService', () => {
  describe('VIBEX_MIME_TYPE', () => {
    it('should have correct MIME type', () => {
      expect(VIBEX_MIME_TYPE).toBe('application/vibex');
    });
  });

  describe('BACKUP_VERSION', () => {
    it('should have version 1.0', () => {
      expect(BACKUP_VERSION).toBe('1.0');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(512)).toBe('512 B');
      expect(formatBytes(1024)).toBe('1.0 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1048576)).toBe('1.0 MB');
      expect(formatBytes(10485760)).toBe('10.0 MB');
    });
  });

  describe('exportBackup', () => {
    it('should return a Blob with application/vibex MIME type', async () => {
      const blob = await exportBackup('test-canvas');
      expect(blob.type).toBe('application/vibex');
    });

    it('should contain valid JSON payload', async () => {
      const blob = await exportBackup('test-canvas');
      const text = await blob.text();
      const payload = JSON.parse(text);
      expect(payload.version).toBe('1.0');
      expect(payload.canvasId).toBe('test-canvas');
      expect(payload.chapters).toBeDefined();
      expect(payload.metadata).toBeDefined();
      expect(payload.metadata.nodeCount).toBeGreaterThanOrEqual(0);
      expect(payload.metadata.exportedBy).toBe('BackupService');
    });

    it('should register backup in localStorage index', async () => {
      await exportBackup('test-canvas', 'My Backup');
      const raw = store['vibex-backup-index'];
      const index = JSON.parse(raw);
      expect(index).toHaveLength(1);
      expect(index[0].canvasId).toBe('test-canvas');
      expect(index[0].name).toBe('My Backup');
    });

    it('should prepend newest backup to index', async () => {
      store['vibex-backup-index'] = JSON.stringify([
        { id: 'old-1', name: 'Old', canvasId: 'c', createdAt: '2025-01-01', size: 100, version: '1.0' },
      ]);
      await exportBackup('test-canvas', 'New Backup');
      const index = JSON.parse(store['vibex-backup-index']);
      expect(index[0].name).toBe('New Backup');
      expect(index).toHaveLength(2);
    });
  });

  describe('downloadBackup', () => {
    it('should create and click a download link', async () => {
      await downloadBackup('test-canvas');
      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('listBackups', () => {
    it('should return empty array when no backups exist', () => {
      delete store['vibex-backup-index'];
      expect(listBackups()).toEqual([]);
    });

    it('should return parsed backup records', () => {
      const records = [{ id: 'b1', name: 'Backup 1', canvasId: 'c', createdAt: '2025-01-01', size: 1024, version: '1.0' }];
      store['vibex-backup-index'] = JSON.stringify(records);
      expect(listBackups()).toEqual(records);
    });
  });

  describe('deleteBackup', () => {
    it('should remove backup by id', () => {
      store['vibex-backup-index'] = JSON.stringify([
        { id: 'b1', name: 'Keep', canvasId: 'c', createdAt: '2025-01-01', size: 100, version: '1.0' },
        { id: 'b2', name: 'Delete', canvasId: 'c', createdAt: '2025-01-02', size: 200, version: '1.0' },
      ]);
      deleteBackup('b2');
      const index = JSON.parse(store['vibex-backup-index']);
      expect(index).toHaveLength(1);
      expect(index[0].id).toBe('b1');
    });
  });

  describe('getBackup', () => {
    it('should return backup by id', () => {
      const record = { id: 'b1', name: 'Test', canvasId: 'c', createdAt: '2025-01-01', size: 100, version: '1.0' };
      store['vibex-backup-index'] = JSON.stringify([record]);
      expect(getBackup('b1')).toEqual(record);
    });

    it('should return null for non-existent id', () => {
      store['vibex-backup-index'] = JSON.stringify([]);
      expect(getBackup('non-existent')).toBeNull();
    });
  });
});
