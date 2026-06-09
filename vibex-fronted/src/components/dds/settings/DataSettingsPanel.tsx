/**
 * DataSettingsPanel.tsx — S81-E2: Settings Import/Export Panel
 *
 * Provides UI for exporting all canvas settings to a .json file and importing
 * settings from a previously exported file. Located in the SettingsModal "数据管理" tab.
 */
'use client';

import React, { useRef, useCallback } from 'react';
import { useSettingsStore } from '@/stores/dds/settingsStore';
import styles from './DataSettingsPanel.module.css';

interface DataSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
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

export function DataSettingsPanel({ onClose }: DataSettingsPanelProps) {
  const exportSettings = useSettingsStore((s) => s.exportSettings);
  const importSettings = useSettingsStore((s) => s.importSettings);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleExport = useCallback(() => {
    const json = exportSettings();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibex-settings-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus({ type: 'success', message: '✅ 设置已导出成功' });
  }, [exportSettings]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const ok = importSettings(text);
        if (ok) {
          setStatus({ type: 'success', message: '✅ 设置已导入成功' });
        } else {
          setStatus({ type: 'error', message: '❌ 导入失败：文件格式错误或版本不匹配' });
        }
      };
      reader.onerror = () => {
        setStatus({ type: 'error', message: '❌ 读取文件失败' });
      };
      reader.readAsText(file);

      // Reset input so same file can be re-selected
      e.target.value = '';
    },
    [importSettings]
  );

  return (
    <div className={styles.panel}>
      <p className={styles.description}>
        导出当前所有画布设置为 JSON 文件，或从备份文件恢复设置。
      </p>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.btn}
          onClick={handleExport}
          data-testid="settings-export-btn"
        >
          <DownloadIcon />
          导出设置
        </button>

        <button
          type="button"
          className={styles.btn}
          onClick={handleImportClick}
          data-testid="settings-import-btn"
        >
          <UploadIcon />
          导入设置
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className={styles.hiddenInput}
          onChange={handleFileChange}
          aria-label="选择设置备份文件"
          data-testid="settings-import-input"
        />
      </div>

      {status && (
        <div
          className={`${styles.status} ${status.type === 'error' ? styles.statusError : styles.statusSuccess}`}
          data-testid="settings-import-status"
          role="status"
        >
          {status.message}
        </div>
      )}
    </div>
  );
}
