/**
 * useBackup.ts — Hook wrapping BackupService for React components
 * E5 (Sprint61): 画布数据备份与导出
 */
import { useCallback, useState } from 'react';
import {
  exportBackup,
  downloadBackup,
  importBackup,
  listBackups,
  deleteBackup,
  formatBytes,
  type BackupRecord,
  type BackupPayload,
} from '@/services/backup/BackupService';

export function useBackup() {
  const [backups, setBackups] = useState<BackupRecord[]>(() => listBackups());
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBackups = useCallback(() => {
    setBackups(listBackups());
  }, []);

  const handleExport = useCallback(async (canvasId?: string, name?: string) => {
    setIsExporting(true);
    setError(null);
    try {
      await downloadBackup(canvasId ?? 'default', name);
      refreshBackups();
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出失败');
    } finally {
      setIsExporting(false);
    }
  }, [refreshBackups]);

  const handleImport = useCallback(async (file: File): Promise<BackupPayload | null> => {
    setIsImporting(true);
    setError(null);
    try {
      const payload = await importBackup(file);
      refreshBackups();
      return payload;
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
      return null;
    } finally {
      setIsImporting(false);
    }
  }, [refreshBackups]);

  const handleDelete = useCallback((id: string) => {
    deleteBackup(id);
    refreshBackups();
  }, [refreshBackups]);

  return {
    backups,
    isExporting,
    isImporting,
    error,
    handleExport,
    handleImport,
    handleDelete,
    formatBytes,
    refreshBackups,
  };
}
