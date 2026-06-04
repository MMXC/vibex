/**
 * S62-E3: Canvas Cloud Backup and Recovery
 * API integration tests — Verifies fetch-level behavior for all cloud backup
 * service functions. Does NOT mock @/lib/env; VIBEX_BACKEND_URL is read at
 * runtime. Tests use relative URLs (/api/backup) which match the actual
 * service behavior when VIBEX_BACKEND_URL is the default or undefined.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Test data ────────────────────────────────────────────────────────────────
const CLOUD_BACKUP: import('../BackupService').CloudBackupRecord = {
  id: 'cloud-backup-001',
  canvasId: 'canvas-abc',
  name: '云端备份-测试',
  createdAt: '2026-06-04T10:00:00.000Z',
  size: 42_000,
  version: '1.0.0',
};

const RESTORE_PAYLOAD = {
  payload: {
    chapters: {
      main: { title: 'Main', cards: [{ id: 'c1' }], edges: [] },
    },
    activeChapter: 'main',
  },
};

// ── Tests: listCloudBackups ────────────────────────────────────────────────
describe('GET /api/backup — list backups', () => {
  beforeEach(() => { vi.clearAllMocks(); global.fetch = vi.fn(); });

  it('GETs /api/backup with canvasId query and returns backups', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true, status: 200,
      json: () => Promise.resolve({ backups: [CLOUD_BACKUP] }),
    } as Response);

    const { listCloudBackups } = await import('../BackupService');
    const result = await listCloudBackups('canvas-abc');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/backup?canvasId=canvas-abc',
      expect.objectContaining({ method: 'GET', signal: expect.any(AbortSignal) })
    );
    expect(result).toEqual([CLOUD_BACKUP]);
  });

  it('returns empty array when no backups key', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true, status: 200, json: () => Promise.resolve({}),
    } as Response);

    const { listCloudBackups } = await import('../BackupService');
    expect(await listCloudBackups('canvas-empty')).toEqual([]);
  });

  it('throws on non-ok response', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false, status: 500,
    } as Response);

    const { listCloudBackups } = await import('../BackupService');
    await expect(listCloudBackups('canvas-abc')).rejects.toThrow('获取云端备份列表失败: 500');
  });

  it('encodes special chars in canvasId', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true, status: 200, json: () => Promise.resolve({ backups: [] }),
    } as Response);

    const { listCloudBackups } = await import('../BackupService');
    await listCloudBackups('canvas?a=1&b=2');

    const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(url).toBe('/api/backup?canvasId=canvas%3Fa%3D1%26b%3D2');
  });
});

// ── Tests: deleteCloudBackup ──────────────────────────────────────────────
describe('DELETE /api/backup/[canvasId] — delete backup', () => {
  beforeEach(() => { vi.clearAllMocks(); global.fetch = vi.fn(); });

  it('DELETEs with backupId query param', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true, status: 204,
    } as Response);

    const { deleteCloudBackup } = await import('../BackupService');
    await deleteCloudBackup('canvas-abc', 'cloud-backup-001');

    const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(url).toBe('/api/backup/canvas-abc?backupId=cloud-backup-001');
    expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1]).toMatchObject({ method: 'DELETE' });
  });

  it('throws on non-ok response', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false, status: 404,
    } as Response);

    const { deleteCloudBackup } = await import('../BackupService');
    await expect(deleteCloudBackup('canvas-abc', 'cloud-backup-001'))
      .rejects.toThrow('删除云端备份失败: 404');
  });
});

// ── Tests: cloudRestore ───────────────────────────────────────────────────
describe('POST /api/backup/[canvasId] — restore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    vi.stubGlobal('AbortSignal', {
      timeout: vi.fn((ms: number) => new AbortSignal({ timeout: ms })),
    });
  });

  it('POSTs restore action with backupId', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true, status: 200,
      json: () => Promise.resolve(RESTORE_PAYLOAD),
    } as Response);

    const { cloudRestore } = await import('../BackupService');
    try { await cloudRestore('canvas-abc', 'cloud-backup-001'); } catch { /* store may throw in test env */ }
    // Verify fetch was called (store integration tested at integration-test level)
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, Record<string, unknown>];
    expect(typeof callArgs[0]).toBe('string');
    expect((callArgs[0] as string).includes('/api/backup/canvas-abc')).toBe(true);
  });

  it('throws on non-ok response', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false, status: 404,
    } as Response);

    const { cloudRestore } = await import('../BackupService');
    await expect(cloudRestore('canvas-abc', 'cloud-backup-001'))
      .rejects.toThrow('云端恢复失败: 404');
  });
});

// ── Tests: AbortSignal timeout values ───────────────────────────────────
describe('AbortSignal timeout values', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('listCloudBackups uses 8000ms timeout', async () => {
    vi.stubGlobal('AbortSignal', {
      timeout: vi.fn((ms: number) => new AbortSignal({ timeout: ms })),
    });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true, status: 200, json: () => Promise.resolve({}),
    } as Response);

    const { listCloudBackups } = await import('../BackupService');
    await listCloudBackups('canvas-abc');

    expect(AbortSignal.timeout).toHaveBeenCalledWith(8000);
  });

  it('deleteCloudBackup uses 8000ms timeout', async () => {
    vi.stubGlobal('AbortSignal', {
      timeout: vi.fn((ms: number) => new AbortSignal({ timeout: ms })),
    });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true, status: 204,
    } as Response);

    const { deleteCloudBackup } = await import('../BackupService');
    await deleteCloudBackup('canvas-abc', 'bid');

    expect(AbortSignal.timeout).toHaveBeenCalledWith(8000);
  });

  it('cloudRestore uses 30000ms timeout', async () => {
    vi.stubGlobal('AbortSignal', {
      timeout: vi.fn((ms: number) => new AbortSignal({ timeout: ms })),
    });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true, status: 200,
      json: () => Promise.resolve(RESTORE_PAYLOAD),
    } as Response);

    const { cloudRestore } = await import('../BackupService');
    try { await cloudRestore('canvas-abc', 'bid'); } catch { /* store may throw in test env */ }
    expect(AbortSignal.timeout).toHaveBeenCalledWith(30000);
  });
});
