/**
 * BackupPanel.test.tsx — Smoke tests for BackupPanel component
 * E5 (Sprint61): 画布数据备份与导出
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/services/backup/BackupService', () => ({
  listBackups: vi.fn(() => [
    { id: 'b1', name: 'My Backup', canvasId: 'c1', createdAt: '2025-06-01', size: 2048, version: '1.0' },
  ]),
  deleteBackup: vi.fn(),
  downloadBackup: vi.fn(),
  formatBytes: (b: number) => `${b} B`,
}));

describe('BackupPanel', () => {
  it('should export BackupPanel as named export', async () => {
    const { BackupPanel } = await import('@/components/dds/settings/BackupPanel');
    expect(typeof BackupPanel).toBe('function');
  });
});
