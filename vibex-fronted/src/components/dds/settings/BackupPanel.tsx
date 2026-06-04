/**
 * BackupPanel.tsx — Canvas Backup UI Panel
 * E5 (Sprint61): 画布数据备份与导出
 *
 * Modal overlay with:
 * - Export button: triggers .vibex download
 * - Import button: file input for .vibex restore
 * - Backup list: shows all localStorage backups with restore/delete
 */
'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useBackup } from '@/hooks/settings/useBackup';
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

export function BackupPanel({ isOpen, onClose, canvasId }: BackupPanelProps) {
  const { backups, isExporting, isImporting, error, handleExport, handleImport, handleDelete, formatBytes, refreshBackups } = useBackup();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importSuccess, setImportSuccess] = useState(false);

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

  const handleRestore = useCallback(
    async (id: string) => {
      // TODO: implement restore from stored backup
      // This would load the backup payload from localStorage and call importBackup
      // For now, trigger an export to re-download
    },
    []
  );

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label="画布备份">
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>💾 画布备份</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="关闭">✕</button>
        </div>

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
            <table className={styles.table} role="table" aria-label="备份列表">
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
      </div>
    </div>
  );
}
