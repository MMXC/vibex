/**
 * ImportHistoryService — Unit tests
 * E2-U4: Import History
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { logImport, getImportLog, clearImportLog } from '../ImportHistoryService';

describe('ImportHistoryService', () => {
  beforeEach(() => {
    clearImportLog();
  });

  it('getImportLog returns empty array when no log', () => {
    expect(getImportLog()).toEqual([]);
  });

  it('logImport adds entry to log', () => {
    logImport({
      filename: 'test.json',
      importedAt: '2026-04-01T00:00:00.000Z',
      chapterCount: 3,
      nodeCount: 10,
    });
    const log = getImportLog();
    expect(log).toHaveLength(1);
    expect(log[0].filename).toBe('test.json');
  });

  it('logImport keeps most recent first', () => {
    logImport({ filename: 'first.json', importedAt: '2026-04-01T00:00:00.000Z', chapterCount: 1, nodeCount: 1 });
    logImport({ filename: 'second.json', importedAt: '2026-04-02T00:00:00.000Z', chapterCount: 2, nodeCount: 2 });
    const log = getImportLog();
    expect(log[0].filename).toBe('second.json');
    expect(log[1].filename).toBe('first.json');
  });

  it('logImport caps at 50 entries', () => {
    for (let i = 0; i < 55; i++) {
      logImport({ filename: `file${i}.json`, importedAt: new Date().toISOString(), chapterCount: 1, nodeCount: 1 });
    }
    expect(getImportLog()).toHaveLength(50);
  });

  it('clearImportLog removes all entries', () => {
    logImport({ filename: 'test.json', importedAt: '2026-04-01T00:00:00.000Z', chapterCount: 1, nodeCount: 1 });
    clearImportLog();
    expect(getImportLog()).toEqual([]);
  });

  it('getImportLog returns [] on corrupt localStorage', () => {
    localStorage.setItem('canvas_import_log', 'not-valid-json');
    expect(getImportLog()).toEqual([]);
    clearImportLog();
  });
});
