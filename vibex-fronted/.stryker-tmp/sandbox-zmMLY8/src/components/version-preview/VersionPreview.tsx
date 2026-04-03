/**
 * Version Preview Modal Component
 * 
 * Displays version details and allows preview/restore without leaving the current page.
 */
// @ts-nocheck


'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import styles from './VersionPreview.module.css';

export interface VersionInfo {
  id: string;
  version: number;
  timestamp: number;
  description?: string;
  author?: string;
  changes?: {
    addedPages: number;
    removedPages: number;
    modifiedPages: number;
    addedComponents: number;
    removedComponents: number;
    modifiedComponents: number;
  };
}

export interface VersionPreviewProps {
  /** Whether the modal is open */
  open: boolean;
  /** Version to preview */
  version: VersionInfo | null;
  /** Current version (to compare against) */
  currentVersion?: VersionInfo;
  /** Callback when close is requested */
  onClose: () => void;
  /** Callback when restore is requested */
  onRestore?: (version: VersionInfo) => void;
  /** Callback when compare is requested */
  onCompare?: (version: VersionInfo) => void;
  /** Callback when note is saved */
  onSaveNote?: (versionId: string, note: string) => void;
  /** Custom labels */
  labels?: {
    title?: string;
    version?: string;
    timestamp?: string;
    description?: string;
    author?: string;
    changes?: string;
    restore?: string;
    compare?: string;
    close?: string;
  };
}

export function VersionPreview({
  open,
  version,
  currentVersion,
  onClose,
  onRestore,
  onCompare,
  onSaveNote,
  labels,
}: VersionPreviewProps) {
  const [isRestoring, setIsRestoring] = useState(false);
  const [note, setNote] = useState(version?.description || '');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const l = {
    title: '版本预览',
    version: '版本',
    timestamp: '创建时间',
    description: '描述',
    author: '作者',
    changes: '变更内容',
    restore: '恢复此版本',
    compare: '与当前比较',
    close: '关闭',
    note: '备注',
    saveNote: '保存备注',
    ...labels,
  };

  // Update note when version changes
  React.useEffect(() => {
    setNote(version?.description || '');
  }, [version]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRestore = async () => {
    if (!version || !onRestore) return;
    
    setIsRestoring(true);
    try {
      await onRestore(version);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSaveNote = async () => {
    if (!version || !onSaveNote) return;
    
    setIsSavingNote(true);
    try {
      await onSaveNote(version.id, note);
    } finally {
      setIsSavingNote(false);
    }
  };

  const renderChanges = () => {
    if (!version?.changes) {
      return <p className={styles.noChanges}>无变更记录</p>;
    }

    const { changes } = version;
    const items = [];
    
    if (changes.addedPages > 0) {
      items.push(<span key="ap" className={styles.added}>+{changes.addedPages} 页面</span>);
    }
    if (changes.removedPages > 0) {
      items.push(<span key="rp" className={styles.removed}>-{changes.removedPages} 页面</span>);
    }
    if (changes.modifiedPages > 0) {
      items.push(<span key="mp" className={styles.modified}>~{changes.modifiedPages} 页面</span>);
    }
    if (changes.addedComponents > 0) {
      items.push(<span key="ac" className={styles.added}>+{changes.addedComponents} 组件</span>);
    }
    if (changes.removedComponents > 0) {
      items.push(<span key="rc" className={styles.removed}>-{changes.removedComponents} 组件</span>);
    }
    if (changes.modifiedComponents > 0) {
      items.push(<span key="mc" className={styles.modified}>~{changes.modifiedComponents} 组件</span>);
    }

    return items.length > 0 ? <div className={styles.changeList}>{items}</div> : <p className={styles.noChanges}>无变更记录</p>;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={l.title}
      width={600}
      showClose={true}
      footer={
        <div className={styles.footer}>
          {onCompare && (
            <button 
              className={styles.compareButton}
              onClick={() => version && onCompare(version)}
            >
              {l.compare}
            </button>
          )}
          {onRestore && (
            <button 
              className={styles.restoreButton}
              onClick={handleRestore}
              disabled={isRestoring || version?.id === currentVersion?.id}
            >
              {isRestoring ? '恢复中...' : l.restore}
            </button>
          )}
        </div>
      }
    >
      {version ? (
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.versionBadge}>
              v{version.version}
            </div>
            {version.id === currentVersion?.id && (
              <span className={styles.currentBadge}>当前版本</span>
            )}
          </div>

          <div className={styles.meta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>{l.timestamp}:</span>
              <span className={styles.metaValue}>
                {formatTimestamp(version.timestamp)}
              </span>
            </div>
            
            {version.author && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>{l.author}:</span>
                <span className={styles.metaValue}>{version.author}</span>
              </div>
            )}
          </div>

          {version.description && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>{l.description}</h4>
              <p className={styles.description}>{version.description}</p>
            </div>
          )}

          {/* Note Editor Section */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>{l.note}</h4>
            <div className={styles.noteEditor}>
              <textarea
                className={styles.noteTextarea}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="添加版本备注..."
                rows={3}
              />
              {onSaveNote && (
                <button
                  className={styles.saveNoteButton}
                  onClick={handleSaveNote}
                  disabled={isSavingNote || note === version?.description}
                >
                  {isSavingNote ? '保存中...' : l.saveNote}
                </button>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>{l.changes}</h4>
            {renderChanges()}
          </div>
        </div>
      ) : (
        <p className={styles.empty}>请选择一个版本</p>
      )}
    </Modal>
  );
}

export default VersionPreview;
