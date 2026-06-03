'use client';

import React, { memo, useState } from 'react';
import type { Snapshot, SnapshotDiff } from '@/stores/dds/canvasHistoryStore';

interface SnapshotDiffDialogProps {
  baseSnapshot: Snapshot;
  compareSnapshot: Snapshot;
  diff: SnapshotDiff;
  onClose: () => void;
  onRestore: (snap: Snapshot) => void;
}

/** Single change row */
function DiffRow({ type, id, label }: { type: 'added' | 'removed' | 'modified'; id: string; label?: string }) {
  const icons: Record<string, string> = { added: '+', removed: '−', modified: '~' };
  return (
    <div className={`diff-row diff-${type}`} role="listitem">
      <span className="diff-icon" aria-hidden="true">{icons[type]}</span>
      <span className="diff-id">{id}</span>
      {label && <span className="diff-label">{label}</span>}
    </div>
  );
}

function SnapshotDiffDialog({
  baseSnapshot,
  compareSnapshot,
  diff,
  onClose,
  onRestore,
}: SnapshotDiffDialogProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'added' | 'removed' | 'modified'>('all');

  const { added, removed, modified } = diff;
  const filtered = {
    added: activeTab === 'all' || activeTab === 'added' ? added : [],
    removed: activeTab === 'all' || activeTab === 'removed' ? removed : [],
    modified: activeTab === 'all' || activeTab === 'modified' ? modified : [],
  };

  const total = added.length + removed.length + modified.length;

  return (
    <div className="diff-dialog-overlay" role="dialog" aria-modal="true" aria-label="快照对比">
      <div className="diff-dialog">
        {/* Header */}
        <div className="diff-dialog-header">
          <div className="diff-dialog-title">
            <h3>快照对比</h3>
            <span className="diff-summary">
              {baseSnapshot.name} ↔ {compareSnapshot.name}
            </span>
          </div>
          <button className="diff-close-btn" onClick={onClose} aria-label="关闭">✕</button>
        </div>

        {/* Stats bar */}
        <div className="diff-stats-bar">
          <div className="diff-stat">
            <span className="diff-stat-num added">{added.length}</span>
            <span className="diff-stat-label">新增</span>
          </div>
          <div className="diff-stat">
            <span className="diff-stat-num removed">{removed.length}</span>
            <span className="diff-stat-label">删除</span>
          </div>
          <div className="diff-stat">
            <span className="diff-stat-num modified">{modified.length}</span>
            <span className="diff-stat-label">修改</span>
          </div>
          <div className="diff-stat">
            <span className="diff-stat-num">{total}</span>
            <span className="diff-stat-label">总变更</span>
          </div>
        </div>

        {/* Filter tabs */}
        {total > 0 && (
          <div className="diff-tabs" role="tablist">
            {(['all', 'added', 'removed', 'modified'] as const).map((tab) => (
              <button
                key={tab}
                className={`diff-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
                role="tab"
                aria-selected={activeTab === tab}
              >
                {tab === 'all' ? '全部' : tab === 'added' ? '新增' : tab === 'removed' ? '删除' : '修改'}
                <span className="diff-tab-count">
                  {tab === 'all' ? total : tab === 'added' ? added.length : tab === 'removed' ? removed.length : modified.length}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Diff content */}
        <div className="diff-content" role="list">
          {filtered.added.map((item) => (
            <DiffRow key={`added-${item.id}`} type="added" id={item.id} label={item.label} />
          ))}
          {filtered.removed.map((item) => (
            <DiffRow key={`removed-${item.id}`} type="removed" id={item.id} label={item.label} />
          ))}
          {filtered.modified.map((item) => (
            <DiffRow key={`modified-${item.id}`} type="modified" id={item.id} label={item.label} />
          ))}
          {total === 0 && (
            <div className="diff-empty">两个快照完全相同</div>
          )}
        </div>

        {/* Footer actions */}
        <div className="diff-dialog-footer">
          <button className="diff-restore-btn" onClick={() => onRestore(compareSnapshot)}>
            恢复到 {compareSnapshot.name}
          </button>
          <button className="diff-cancel-btn" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}

export default memo(SnapshotDiffDialog);
