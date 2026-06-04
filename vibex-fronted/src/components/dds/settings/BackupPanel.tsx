/**
 * BackupPanel.tsx — Canvas Backup UI Panel
 * E5 (Sprint61): Local backup/export/import
 * E3 (Sprint62): Cloud backup tab — upload/restore/list via /api/backup
 *
 * Tab 1 — 本地备份: export/import + localStorage backup list
 * Tab 2 — 云端备份: cloudBackup/cloudRestore/listCloudBackups
 */
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useBackup } from '@/hooks/settings/useBackup';
import { useBackupStore } from '@/stores/dds/backupStore';
import {
  cloudBackup,
  listCloudBackups,
  cloudRestore,
  deleteCloudBackup,
  type CloudBackupRecord,
} from '@/services/backup/BackupService';
import styles from './BackupPanel.module.css';

interface BackupPanelProps {
  isOpen: boolean;
  onClose: () => void;
  canvasId?: string;
}

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
    </svg>
  );
}

type Tab = 'local' | 'cloud';

export function BackupPanel({ isOpen, onClose, canvasId }: BackupPanelProps) {
  const { backups, isExporting, isImporting, error, handleExport, handleImport, handleDelete, formatBytes, refreshBackups } = useBackup();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('local');

  // Cloud state
  const [cloudBackups, setCloudBackups] = useState<CloudBackupRecord[]>([]);
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [isCloudUploading, setIsCloudUploading] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const { taskStatus } = useBackupStore();
  const effectiveCanvasId = canvasId ?? 'default';

  // Load cloud backups when cloud tab is opened
  useEffect(() => {
    if (activeTab === 'cloud' && isOpen) {
      loadCloudBackups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isOpen]);

  const loadCloudBackups = useCallback(async () => {
    setIsCloudLoading(true);
    setCloudError(null);
    try {
      const records = await listCloudBackups(effectiveCanvasId);
      setCloudBackups(records);
    } catch (err) {
      setCloudError(err instanceof Error ? err.message : '加载云端备份失败');
    } finally {
      setIsCloudLoading(false);
    }
  }, [effectiveCanvasId]);

  const handleCloudBackup = useCallback(async () => {
    setIsCloudUploading(true);
    setCloudError(null);
    try {
      const record = await cloudBackup(effectiveCanvasId);
      setCloudBackups((prev) => [record, ...prev]);
    } catch (err) {
      setCloudError(err instanceof Error ? err.message : '云端备份失败');
    } finally {
      setIsCloudUploading(false);
    }
  }, [effectiveCanvasId]);

  const handleCloudRestore = useCallback(async (backupId: string) => {
    if (!confirm('确定从云端恢复此备份？当前画布内容将被覆盖。')) return;
    setRestoringId(backupId);
    setCloudError(null);
    try {
      await cloudRestore(effectiveCanvasId, backupId);
      setCloudBackups((prev) =>
        prev.map((b) => (b.id === backupId ? { ...b, restoredAt: new Date().toISOString() } : b))
      );
    } catch (err) {
      setCloudError(err instanceof Error ? err.message : '云端恢复失败');
    } finally {
      setRestoringId(null);
    }
  }, [effectiveCanvasId]);

  const handleCloudDelete = useCallback(async (backupId: string) => {
    if (!confirm('确定删除此云端备份？')) return;
    setCloudError(null);
    try {
      await deleteCloudBackup(effectiveCanvasId, backupId);
      setCloudBackups((prev) => prev.filter((b) => b.id !== backupId));
    } catch (err) {
      setCloudError(err instanceof Error ? err.message : '删除失败');
    }
  }, [effectiveCanvasId]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const result = await handleImport(file);
      if (result) {
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleImport]
  );

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label="画布备份">
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>💾 画布备份</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="关闭">✕</button>
        </div>

        {/* Tab switcher */}
        <div className={styles.tabs} role="tablist" aria-label="备份类型">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'local'}
            className={`${styles.tab} ${activeTab === 'local' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('local')}
          >
            本地备份
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'cloud'}
            className={`${styles.tab} ${activeTab === 'cloud' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('cloud')}
          >
            <CloudIcon /> 云端备份
          </button>
        </div>

        {/* ── Local tab ─────────────────────────────────── */}
        {activeTab === 'local' && (
          <>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.exportBtn}
                onClick={() => handleExport(canvasId)}
                disabled={isExporting}
                aria-label="导出备份"
              >
                <DownloadIcon />
                {isExporting ? '导出中...' : '导出备份'}
              </button>

              <button
                type="button"
                className={styles.importBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                aria-label="导入备份"
              >
                <UploadIcon />
                {isImporting ? '导入中...' : '导入 .vibex'}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".vibex,application/vibex"
                onChange={handleFileChange}
                className={styles.fileInput}
                aria-hidden="true"
              />
            </div>

            {error && (
              <div className={styles.errorBanner} role="alert">
                {error}
              </div>
            )}

            {importSuccess && (
              <div className={styles.successBanner} role="status">
                备份导入成功！
              </div>
            )}

            <div className={styles.body}>
              {backups.length === 0 ? (
                <div className={styles.empty}>
                  <FileIcon />
                  <p>暂无本地备份记录</p>
                  <p className={styles.emptyHint}>点击"导出备份"创建第一个备份</p>
                </div>
              ) : (
                <table className={styles.table} role="table" aria-label="本地备份列表">
                  <thead>
                    <tr>
                      <th>备份名称</th>
                      <th>画布 ID</th>
                      <th>大小</th>
                      <th>创建时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((backup) => (
                      <tr key={backup.id} className={styles.row}>
                        <td className={styles.name}>{backup.name}</td>
                        <td className={styles.id}>{backup.canvasId}</td>
                        <td className={styles.size}>{formatBytes(backup.size)}</td>
                        <td className={styles.time}>
                          {new Date(backup.createdAt).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={() => {
                              if (confirm(`确定删除备份 "${backup.name}"？`)) {
                                handleDelete(backup.id);
                              }
                            }}
                            aria-label={`删除备份 ${backup.name}`}
                          >
                            <TrashIcon />
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className={styles.footer}>
              <span className={styles.footerNote}>
                备份保存在浏览器本地存储中，可导出为 .vibex 文件进行备份
              </span>
            </div>
          </>
        )}

        {/* ── Cloud tab ─────────────────────────────────── */}
        {activeTab === 'cloud' && (
          <>
            <div className={styles.actions}>
              <button
                type="button"
                className={`${styles.exportBtn} ${styles.cloudBtn}`}
                onClick={handleCloudBackup}
                disabled={isCloudUploading || taskStatus === 'uploading'}
                aria-label="云端备份"
              >
                <CloudIcon />
                {isCloudUploading || taskStatus === 'uploading' ? '备份中...' : '云端备份'}
              </button>
              <button
                type="button"
                className={styles.importBtn}
                onClick={loadCloudBackups}
                disabled={isCloudLoading}
                aria-label="刷新云端备份列表"
              >
                {isCloudLoading ? '加载中...' : '刷新列表'}
              </button>
            </div>

            {cloudError && (
              <div className={styles.errorBanner} role="alert">
                {cloudError}
              </div>
            )}

            <div className={styles.body}>
              {isCloudLoading ? (
                <div className={styles.empty}>
                  <p>加载云端备份...</p>
                </div>
              ) : cloudBackups.length === 0 ? (
                <div className={styles.empty}>
                  <CloudIcon />
                  <p>暂无云端备份记录</p>
                  <p className={styles.emptyHint}>点击"云端备份"按钮上传当前画布</p>
                </div>
              ) : (
                <table className={styles.table} role="table" aria-label="云端备份列表">
                  <thead>
                    <tr>
                      <th>备份名称</th>
                      <th>大小</th>
                      <th>创建时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cloudBackups.map((backup) => (
                      <tr key={backup.id} className={styles.row}>
                        <td className={styles.name}>{backup.name}</td>
                        <td className={styles.size}>{formatBytes(backup.size)}</td>
                        <td className={styles.time}>
                          {new Date(backup.createdAt).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {backup.restoredAt && (
                            <span className={styles.restoredBadge}>已恢复</span>
                          )}
                        </td>
                        <td className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.restoreBtn}
                            onClick={() => handleCloudRestore(backup.id)}
                            disabled={restoringId === backup.id || taskStatus === 'restoring'}
                            aria-label={`恢复备份 ${backup.name}`}
                          >
                            <RestoreIcon />
                            {restoringId === backup.id ? '恢复中...' : '恢复'}
                          </button>
                          <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={() => handleCloudDelete(backup.id)}
                            aria-label={`删除云端备份 ${backup.name}`}
                          >
                            <TrashIcon />
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className={styles.footer}>
              <span className={styles.footerNote}>
                云端备份保存在远程服务器，可跨设备恢复
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
