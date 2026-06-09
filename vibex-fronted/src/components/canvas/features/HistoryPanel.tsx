'use client';

/**
 * HistoryPanel — Undo/Redo History Sidebar + E1: Snapshots Tab + S83-E1: Timeline Tab
 * P004-E4: History Panel for selective undo/redo
 * E1 (Sprint58): 画布版本分支管理 — Snapshots tab for named canvas versions
 * S83-E1: 画布版本历史时间轴 — Timeline tab with zoom controls
 *
 * Displays:
 * - History tab: command snapshots from canvasHistoryStore (Undo/Redo)
 * - Snapshots tab: named canvas version snapshots (E1)
 * - Timeline tab: zoomable timeline view of snapshots (S83-E1)
 *
 *遵守约束:
 * - 无 any 类型
 * - 无 canvasLogger.default.debug
 */

import React, { useState, useCallback } from 'react';
import { useCanvasHistoryStore } from '@/stores/dds/canvasHistoryStore';
import { VersionTimeline } from '@/components/dds/history/VersionTimeline';
import type { Snapshot } from '@/stores/dds/canvasHistoryStore';
import styles from './HistoryPanel.module.css';

type Tab = 'history' | 'snapshots' | 'timeline';

interface HistoryPanelProps {
  /** Whether the panel is visible */
  open: boolean;
  /** Close callback */
  onClose: () => void;
  /** Current canvas ID for snapshot operations (passed from parent) */
  canvasId?: string;
  /** Callback to restore a snapshot — provides { nodes, edges } data */
  onRestoreSnapshot?: (data: { nodes: unknown[]; edges: unknown[] }) => void;
  /** Callback to get current canvas data for saving a snapshot */
  getCurrentCanvasData?: () => { nodes: unknown[]; edges: unknown[] };
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function formatDescription(desc: string | undefined, index: number): string {
  if (desc) return desc;
  return `操作 ${index + 1}`;
}

export function HistoryPanel({ open, onClose, canvasId = 'default-canvas', onRestoreSnapshot, getCurrentCanvasData }: HistoryPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('history');
  const [saveDialogName, setSaveDialogName] = useState('');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedTimelineSnapId, setSelectedTimelineSnapId] = useState<string | null>(null);

  const past = useCanvasHistoryStore((s) => s.past);
  const future = useCanvasHistoryStore((s) => s.future);
  const selectiveUndo = useCanvasHistoryStore((s) => s.selectiveUndo);
  const canUndo = useCanvasHistoryStore((s) => s.canUndo);
  const canRedo = useCanvasHistoryStore((s) => s.canRedo);
  const redo = useCanvasHistoryStore((s) => s.redo);
  const snapshots = useCanvasHistoryStore((s) => s.snapshots);
  const restoringSnapshotId = useCanvasHistoryStore((s) => s.restoringSnapshotId);
  const saveSnapshot = useCanvasHistoryStore((s) => s.saveSnapshot);
  const loadSnapshot = useCanvasHistoryStore((s) => s.loadSnapshot);
  const deleteSnapshot = useCanvasHistoryStore((s) => s.deleteSnapshot);
  const setRestoringSnapshotId = useCanvasHistoryStore((s) => s.setRestoringSnapshotId);
  const listSnapshots = useCanvasHistoryStore((s) => s.listSnapshots);

  const total = past.length + future.length;
  const currentIndex = past.length - 1;

  const handleSelect = useCallback(
    (targetIndex: number) => {
      if (targetIndex === currentIndex) {
        onClose();
        return;
      }
      if (targetIndex < past.length) {
        selectiveUndo(targetIndex);
      } else {
        const redoCount = targetIndex - (past.length - 1);
        for (let i = 0; i < redoCount; i++) {
          redo();
        }
      }
      onClose();
    },
    [currentIndex, past.length, selectiveUndo, redo, onClose]
  );

  // ==================== E1: Snapshot Actions ====================

  const handleOpenSaveDialog = useCallback(() => {
    setSaveDialogName('');
    setIsSaveDialogOpen(true);
  }, []);

  const handleCloseSaveDialog = useCallback(() => {
    setIsSaveDialogOpen(false);
    setSaveDialogName('');
  }, []);

  const handleSaveSnapshot = useCallback(async () => {
    const name = saveDialogName.trim() || `版本 ${snapshots.length + 1}`;
    if (!getCurrentCanvasData) {
      await saveSnapshot(canvasId, name, { nodes: [], edges: [] });
    } else {
      const data = getCurrentCanvasData();
      await saveSnapshot(canvasId, name, data);
    }
    setIsSaveDialogOpen(false);
    setSaveDialogName('');
  }, [saveDialogName, snapshots.length, canvasId, saveSnapshot, getCurrentCanvasData]);

  const handleRestoreSnapshot = useCallback(
    async (snapshotId: string) => {
      setRestoringSnapshotId(snapshotId);
      try {
        const data = await loadSnapshot(canvasId, snapshotId);
        if (data && onRestoreSnapshot) {
          onRestoreSnapshot(data);
        }
      } finally {
        setRestoringSnapshotId(null);
      }
      onClose();
    },
    [canvasId, loadSnapshot, onRestoreSnapshot, setRestoringSnapshotId, onClose]
  );

  const handleDeleteSnapshot = useCallback(
    async (snapshotId: string) => {
      await deleteSnapshot(canvasId, snapshotId);
      setDeleteConfirmId(null);
    },
    [canvasId, deleteSnapshot]
  );

  // ==================== S83-E1: Timeline Actions ====================

  const handleTimelineSelect = useCallback(
    (snap: Snapshot) => {
      setSelectedTimelineSnapId(snap.id);
      handleRestoreSnapshot(snap.id);
    },
    [handleRestoreSnapshot]
  );

  const handleTimelineStar = useCallback(
    (snap: Snapshot) => {
      onStar(snap);
    },
    [onStar]
  );

  const handleTimelineCompare = useCallback(
    (snap: Snapshot) => {
      // Emit a custom event for branch diff
      window.dispatchEvent(
        new CustomEvent('dds:branch-compare', {
          detail: { snapshotId: snap.id, branchName: snap.branchName },
        })
      );
    },
    []
  );

  const handleTimelineRestore = useCallback(
    (snap: Snapshot) => {
      handleRestoreSnapshot(snap.id);
    },
    [handleRestoreSnapshot]
  );

  const handleTimelineDelete = useCallback(
    (snap: Snapshot) => {
      handleDeleteSnapshot(snap.id);
    },
    [handleDeleteSnapshot]
  );

  if (!open) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      <aside className={styles.panel} role="dialog" aria-label="历史记录面板">
        <header className={styles.header}>
          <h2 className={styles.title}>历史记录</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </header>

        {/* Tab switcher */}
        <div className={styles.tabs} role="tablist">
          <button
            className={`${styles.tab} ${activeTab === 'history' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('history')}
            role="tab"
            aria-selected={activeTab === 'history'}
          >
            历史记录
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'snapshots' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('snapshots')}
            role="tab"
            aria-selected={activeTab === 'snapshots'}
          >
            画布版本
            {snapshots.length > 0 && (
              <span className={styles.badge}>{snapshots.length}</span>
            )}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'timeline' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('timeline')}
            role="tab"
            aria-selected={activeTab === 'timeline'}
          >
            时间轴
            {snapshots.length > 0 && (
              <span className={styles.badge}>{snapshots.length}</span>
            )}
          </button>
        </div>

        <div className={styles.body}>
          {activeTab === 'history' && (
            <>
              {past.length === 0 && future.length === 0 ? (
                <div className={styles.empty}>暂无历史记录</div>
              ) : (
                <ol className={styles.list} aria-label="历史记录列表">
                  {past.map((cmd, i) => (
                    <li key={cmd.id} className={styles.item}>
                      <button
                        className={styles.itemBtn}
                        onClick={() => handleSelect(i)}
                        aria-label={`回退到: ${formatDescription(cmd.description, i)}`}
                        disabled={i === currentIndex}
                      >
                        <span className={styles.timestamp}>{formatTimestamp(cmd.timestamp)}</span>
                        <span className={styles.desc}>{formatDescription(cmd.description, i)}</span>
                        {i === currentIndex && <span className={styles.currentBadge}>当前</span>}
                      </button>
                    </li>
                  ))}

                  {past.length > 0 && future.length > 0 && (
                    <li className={styles.dividerItem}>
                      <span className={styles.dividerLabel}>— 已撤销 —</span>
                    </li>
                  )}

                  {future.map((cmd, i) => {
                    const targetIndex = past.length + i;
                    return (
                      <li key={cmd.id} className={`${styles.item} ${styles.futureItem}`}>
                        <button
                          className={`${styles.itemBtn} ${styles.itemBtnFuture}`}
                          onClick={() => handleSelect(targetIndex)}
                          aria-label={`重做到: ${formatDescription(cmd.description, past.length + i)}`}
                        >
                          <span className={styles.timestamp}>{formatTimestamp(cmd.timestamp)}</span>
                          <span className={styles.desc}>{formatDescription(cmd.description, past.length + i)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </>
          )}

          {activeTab === 'snapshots' && (
            <>
              <div className={styles.snapshotActions}>
                <button
                  className={styles.saveSnapshotBtn}
                  onClick={handleOpenSaveDialog}
                  aria-label="保存当前画布版本"
                >
                  💾 保存版本
                </button>
              </div>

              {isSaveDialogOpen && (
                <div className={styles.saveDialog}>
                  <div className={styles.saveDialogOverlay} onClick={handleCloseSaveDialog} aria-hidden="true" />
                  <div className={styles.saveDialogContent}>
                    <h3 className={styles.saveDialogTitle}>保存画布版本</h3>
                    <input
                      type="text"
                      className={styles.saveDialogInput}
                      placeholder={`版本 ${snapshots.length + 1}`}
                      value={saveDialogName}
                      onChange={(e) => setSaveDialogName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveSnapshot();
                        if (e.key === 'Escape') handleCloseSaveDialog();
                      }}
                      autoFocus
                      aria-label="版本名称"
                    />
                    <div className={styles.saveDialogBtns}>
                      <button className={styles.cancelBtn} onClick={handleCloseSaveDialog}>
                        取消
                      </button>
                      <button className={styles.confirmBtn} onClick={handleSaveSnapshot}>
                        保存
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {snapshots.length === 0 ? (
                <div className={styles.empty}>
                  <div>暂无保存的版本</div>
                  <div className={styles.emptyHint}>点击上方「💾 保存版本」保存当前画布状态</div>
                </div>
              ) : (
                <ol className={styles.list} aria-label="画布版本列表">
                  {snapshots.map((snapshot, i) => (
                    <li key={snapshot.id} className={styles.item}>
                      <div className={styles.snapshotItem}>
                        <div className={styles.snapshotInfo}>
                          <span className={styles.snapshotName}>{snapshot.name}</span>
                          <span className={styles.snapshotDate}>
                            {formatDate(snapshot.timestamp)} {formatTimestamp(snapshot.timestamp)}
                          </span>
                        </div>
                        <div className={styles.snapshotBtns}>
                          <button
                            className={styles.restoreBtn}
                            onClick={() => handleRestoreSnapshot(snapshot.id)}
                            disabled={restoringSnapshotId === snapshot.id}
                            aria-label={`恢复版本: ${snapshot.name}`}
                          >
                            {restoringSnapshotId === snapshot.id ? '⏳' : '↩️'}
                          </button>
                          {deleteConfirmId === snapshot.id ? (
                            <>
                              <button
                                className={styles.confirmDeleteBtn}
                                onClick={() => handleDeleteSnapshot(snapshot.id)}
                                aria-label="确认删除"
                              >
                                ✓
                              </button>
                              <button
                                className={styles.cancelDeleteBtn}
                                onClick={() => setDeleteConfirmId(null)}
                                aria-label="取消删除"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <button
                              className={styles.deleteBtn}
                              onClick={() => setDeleteConfirmId(snapshot.id)}
                              aria-label={`删除版本: ${snapshot.name}`}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}

          {activeTab === 'timeline' && (
            <div className={styles.timelineTab}>
              <VersionTimeline
                snapshots={snapshots}
                selectedId={selectedTimelineSnapId}
                onSelect={handleTimelineSelect}
                onStar={handleTimelineStar}
                onCompare={handleTimelineCompare}
                onRestore={handleTimelineRestore}
                onDelete={handleTimelineDelete}
              />
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <div className={styles.hint}>
            {activeTab === 'history' ? '点击记录可跳转至任意历史位置' :
             activeTab === 'snapshots' ? '点击 ↩️ 恢复版本，当前画布将被替换' :
             '使用时间轴缩放和分支筛选来浏览历史版本'}
          </div>
        </footer>
      </aside>
    </>
  );
}
