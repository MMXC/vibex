/**
 * ConflictResolutionDialog — S70-E4: Collaboration Conflict Resolution
 *
 * Triggered when two users edit the same node within a 5-second window.
 * Presents two versions (local vs remote) and two resolution options:
 * 1. Keep my version — discard the remote changes
 * 2. Keep their version — discard local changes
 */
'use client';

import React, { memo, useCallback } from 'react';
import { usePresenceStore } from '@/lib/collaboration/presenceStore';
import type { ConflictRecord } from '@/lib/collaboration/presenceStore';

export interface CollabConflictDialogProps {
  open: boolean;
  /** Called when user resolves a conflict */
  onResolved?: () => void;
  /** Called when user dismisses the dialog */
  onClose?: () => void;
}

function ConflictItem({ conflict }: { conflict: ConflictRecord }) {
  const resolveConflict = usePresenceStore((s) => s.resolveConflict);

  const handleKeepLocal = useCallback(() => {
    resolveConflict(conflict.nodeId, 'keep-local');
  }, [conflict.nodeId, resolveConflict]);

  const handleKeepRemote = useCallback(() => {
    resolveConflict(conflict.nodeId, 'keep-remote');
  }, [conflict.nodeId, resolveConflict]);

  return (
    <div className="conflict-item" role="listitem">
      <div className="conflict-header">
        <span className="conflict-node-name">{conflict.nodeName}</span>
        <span className="conflict-node-id">{conflict.nodeId}</span>
      </div>

      <div className="conflict-versions">
        <div className="conflict-version conflict-version-local">
          <div className="version-label">
            <span className="version-badge">我的版本</span>
            <span className="version-user">{conflict.localUserName}</span>
          </div>
          <pre className="version-content">{conflict.localVersion || '(空)'}</pre>
        </div>

        <div className="conflict-version conflict-version-remote">
          <div className="version-label">
            <span className="version-badge">对方版本</span>
            <span className="version-user">{conflict.remoteUserName}</span>
          </div>
          <pre className="version-content">{conflict.remoteVersion || '(空)'}</pre>
        </div>
      </div>

      <div className="conflict-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleKeepLocal}
          aria-label="保留我的版本"
        >
          保留我的版本
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleKeepRemote}
          aria-label="保留对方版本"
        >
          保留对方版本
        </button>
      </div>
    </div>
  );
}

export const CollabConflictDialog = memo(function CollabConflictDialog({
  open,
  onResolved,
  onClose,
}: CollabConflictDialogProps) {
  const pendingConflicts = usePresenceStore((s) => s.pendingConflicts);

  if (!open) return null;

  const unresolved = pendingConflicts.filter((c) => c.resolution === 'pending');

  const handleDismiss = useCallback(() => {
    onClose?.();
  }, [onClose]);

  return (
    <div
      className="collab-conflict-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="协作冲突解决"
      data-testid="collab-conflict-dialog"
    >
      <div className="collab-conflict-backdrop" onClick={handleDismiss} />

      <div className="collab-conflict-panel">
        <div className="collab-conflict-header">
          <h2 className="collab-conflict-title">
            ⚠️ 协作冲突检测
          </h2>
          <span className="conflict-count">
            {unresolved.length} 个待解决
          </span>
          <button
            type="button"
            className="close-btn"
            onClick={handleDismiss}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <div className="collab-conflict-body" role="list">
          {unresolved.length === 0 ? (
            <div className="conflict-resolved">
              ✓ 所有冲突已解决
            </div>
          ) : (
            unresolved.map((conflict) => (
              <ConflictItem key={conflict.nodeId} conflict={conflict} />
            ))
          )}
        </div>

        <div className="collab-conflict-footer">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleDismiss}
          >
            稍后解决
          </button>
        </div>
      </div>

      <style>{`
        .collab-conflict-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .collab-conflict-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
        }
        .collab-conflict-panel {
          position: relative;
          background: var(--color-bg-secondary, #1a1a2e);
          border: 1px solid var(--color-border, #333);
          border-radius: 12px;
          width: 90%;
          max-width: 640px;
          max-height: 80vh;
          overflow-y: auto;
          padding: 24px;
        }
        .collab-conflict-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .collab-conflict-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text-primary, #fff);
          margin: 0;
        }
        .conflict-count {
          font-size: 13px;
          color: var(--color-text-secondary, #999);
          background: var(--color-bg-primary, #0f0f1a);
          padding: 2px 8px;
          border-radius: 12px;
        }
        .close-btn {
          margin-left: auto;
          background: none;
          border: none;
          color: var(--color-text-secondary, #999);
          font-size: 18px;
          cursor: pointer;
          padding: 4px 8px;
        }
        .conflict-item {
          border: 1px solid var(--color-border, #333);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .conflict-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .conflict-node-name {
          font-weight: 600;
          color: var(--color-text-primary, #fff);
        }
        .conflict-node-id {
          font-size: 12px;
          color: var(--color-text-secondary, #999);
          font-family: monospace;
        }
        .conflict-versions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        .conflict-version {
          border: 1px solid var(--color-border, #333);
          border-radius: 6px;
          padding: 12px;
        }
        .version-label {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }
        .version-badge {
          font-size: 12px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .conflict-version-local .version-badge {
          background: #3b82f6;
          color: white;
        }
        .conflict-version-remote .version-badge {
          background: #f97316;
          color: white;
        }
        .version-user {
          font-size: 12px;
          color: var(--color-text-secondary, #999);
        }
        .version-content {
          font-size: 12px;
          color: var(--color-text-primary, #fff);
          background: var(--color-bg-primary, #0f0f1a);
          border-radius: 4px;
          padding: 8px;
          margin: 0;
          overflow-x: auto;
          white-space: pre-wrap;
          max-height: 80px;
        }
        .conflict-actions {
          display: flex;
          gap: 8px;
        }
        .btn {
          flex: 1;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: opacity 0.2s;
        }
        .btn:hover { opacity: 0.85; }
        .btn-primary {
          background: #3b82f6;
          color: white;
        }
        .btn-secondary {
          background: #f97316;
          color: white;
        }
        .btn-ghost {
          background: transparent;
          color: var(--color-text-secondary, #999);
          border: 1px solid var(--color-border, #333);
        }
        .conflict-resolved {
          text-align: center;
          color: #22c55e;
          padding: 24px;
          font-size: 15px;
        }
        .collab-conflict-footer {
          border-top: 1px solid var(--color-border, #333);
          padding-top: 16px;
          display: flex;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
});
