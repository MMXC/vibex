/**
 * CanvasSettingsPanel — Collaboration Management Tab
 *
 * S85-E1: 画布级权限体系
 *
 * Features:
 * - List all collaborators with their roles
 * - Add a collaborator (owner/admin only)
 * - Change a collaborator's role (owner/admin only)
 * - Remove a collaborator (owner/admin only)
 * - Generate/view share links
 */
'use client';

import React, { useState, useCallback } from 'react';
import { useCanvasPermissionsStore, selectCanManage, selectCollaborators, type CanvasRole } from '@/stores/dds/canvasPermissionsStore';
import { useTranslations } from '@/hooks/useTranslations';

interface CanvasSettingsPanelProps {
  /** Canvas ID — also passed to the store via initCanvas */
  canvasId: string;
  /** Current user ID */
  userId: string;
  onClose?: () => void;
}

const ROLE_LABELS: Record<CanvasRole, string> = {
  owner: '所有者',
  admin: '管理员',
  editor: '可编辑',
  viewer: '只读',
};

const ROLE_OPTIONS: CanvasRole[] = ['admin', 'editor', 'viewer'];

export function CanvasSettingsPanel({ canvasId, userId, onClose }: CanvasSettingsPanelProps) {
  const t = useTranslations('canvasSettings') ?? (() => ({})) as () => Record<string, string>;
  const tGeneric = useTranslations() ?? (() => ({})) as () => Record<string, string>;

  const store = useCanvasPermissionsStore();
  const canManage = selectCanManage(store);
  const collaborators = selectCollaborators(store);

  const [activeTab, setActiveTab] = useState<'collaborators' | 'share'>('collaborators');
  const [addUserId, setAddUserId] = useState('');
  const [addRole, setAddRole] = useState<CanvasRole>('editor');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<CanvasRole>('editor');
  const [copiedToken, setCopiedToken] = useState(false);

  // Initialize store on mount
  React.useEffect(() => {
    if (store.canvasId !== canvasId || store.myUserId !== userId) {
      store.initCanvas(canvasId, userId);
    }
  }, [canvasId, userId]);

  const handleAddCollaborator = useCallback(async () => {
    if (!addUserId.trim()) return;
    await store.addCollaborator(addUserId.trim(), addRole);
    setAddUserId('');
  }, [addUserId, addRole, store]);

  const handleUpdateRole = useCallback(async (targetUserId: string, newRole: CanvasRole) => {
    await store.updateCollaborator(targetUserId, newRole);
    setEditingUserId(null);
  }, [store]);

  const handleRemove = useCallback(async (targetUserId: string) => {
    if (!confirm('确定要移除该协作者吗？')) return;
    await store.removeCollaborator(targetUserId);
  }, [store]);

  const handleCopyShareUrl = useCallback(() => {
    if (store.shareLink?.shareUrl) {
      navigator.clipboard.writeText(store.shareLink.shareUrl).then(() => {
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
      });
    }
  }, [store.shareLink]);

  const handleCreateShareLink = useCallback(async (role: 'viewer' | 'editor') => {
    await store.createShareLink(role);
  }, [store]);

  return (
    <div className="canvas-settings-panel" role="dialog" aria-modal="true" aria-label="画布设置">
      <div className="panel-header">
        <h3>画布设置</h3>
        {onClose && (
          <button className="panel-close" onClick={onClose} aria-label="关闭">×</button>
        )}
      </div>

      {/* Tab bar */}
      <div className="panel-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'collaborators'}
          className={`tab-btn ${activeTab === 'collaborators' ? 'active' : ''}`}
          onClick={() => setActiveTab('collaborators')}
        >
          协作者
          <span className="tab-badge">{collaborators.length}</span>
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'share'}
          className={`tab-btn ${activeTab === 'share' ? 'active' : ''}`}
          onClick={() => setActiveTab('share')}
        >
          分享链接
        </button>
      </div>

      <div className="panel-body">
        {/* Error banner */}
        {store.error && (
          <div className="error-banner" role="alert">
            <span>{store.error}</span>
            <button onClick={store.clearError} aria-label="关闭错误">×</button>
          </div>
        )}

        {/* Loading */}
        {store.loading && <div className="loading-indicator" aria-label="加载中..." />}

        {/* === Collaborators tab === */}
        {activeTab === 'collaborators' && (
          <div className="tab-content" role="tabpanel">
            {/* Collaborator list */}
            <div className="collaborator-list" role="list">
              {collaborators.length === 0 && !store.loading && (
                <p className="empty-state">暂无协作者</p>
              )}
              {collaborators.map(collab => (
                <div key={collab.userId} className="collaborator-row" role="listitem">
                  <div className="collab-avatar">
                    {(collab.displayName ?? collab.userId).charAt(0).toUpperCase()}
                  </div>
                  <div className="collab-info">
                    <div className="collab-name">
                      {collab.displayName ?? collab.email ?? collab.userId}
                    </div>
                    <div className="collab-email">{collab.email ?? collab.userId}</div>
                  </div>

                  {/* Role badge */}
                  <div className="collab-role">
                    {editingUserId === collab.userId && canManage ? (
                      <select
                        className="role-select"
                        value={editRole}
                        onChange={e => setEditRole(e.target.value as CanvasRole)}
                        aria-label="选择角色"
                      >
                        {ROLE_OPTIONS.map(r => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`role-badge role-${collab.role}`}>
                        {ROLE_LABELS[collab.role]}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  {canManage && collab.userId !== userId && (
                    <div className="collab-actions">
                      {editingUserId === collab.userId ? (
                        <>
                          <button
                            className="action-btn confirm"
                            onClick={() => handleUpdateRole(collab.userId, editRole)}
                            aria-label="确认"
                            disabled={store.loading}
                          >✓</button>
                          <button
                            className="action-btn cancel"
                            onClick={() => setEditingUserId(null)}
                            aria-label="取消"
                          >×</button>
                        </>
                      ) : (
                        <>
                          <button
                            className="action-btn edit"
                            onClick={() => { setEditingUserId(collab.userId); setEditRole(collab.role); }}
                            aria-label="修改角色"
                          >✎</button>
                          <button
                            className="action-btn remove"
                            onClick={() => handleRemove(collab.userId)}
                            aria-label="移除协作者"
                          >🗑</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add collaborator form (owner/admin only) */}
            {canManage && (
              <div className="add-collab-form">
                <h4>添加协作者</h4>
                <div className="form-row">
                  <input
                    type="text"
                    className="collab-input"
                    placeholder="用户 ID 或邮箱"
                    value={addUserId}
                    onChange={e => setAddUserId(e.target.value)}
                    aria-label="用户 ID"
                  />
                  <select
                    className="role-select"
                    value={addRole}
                    onChange={e => setAddRole(e.target.value as CanvasRole)}
                    aria-label="角色"
                  >
                    {ROLE_OPTIONS.map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                  <button
                    className="add-btn"
                    onClick={handleAddCollaborator}
                    disabled={!addUserId.trim() || store.loading}
                  >
                    添加
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === Share link tab === */}
        {activeTab === 'share' && (
          <div className="tab-content" role="tabpanel">
            {!canManage && (
              <p className="permission-notice">
                只有所有者和管理员可以创建分享链接
              </p>
            )}

            {canManage && !store.shareLink && (
              <div className="share-link-actions">
                <p>创建分享链接，让其他人可以查看或编辑此画布</p>
                <div className="share-buttons">
                  <button
                    className="share-btn viewer"
                    onClick={() => handleCreateShareLink('viewer')}
                    disabled={store.loading}
                  >
                    只读链接
                  </button>
                  <button
                    className="share-btn editor"
                    onClick={() => handleCreateShareLink('editor')}
                    disabled={store.loading}
                  >
                    可编辑链接
                  </button>
                </div>
              </div>
            )}

            {store.shareLink && (
              <div className="share-link-display">
                <div className="share-url-row">
                  <input
                    type="text"
                    readOnly
                    className="share-url-input"
                    value={store.shareLink.shareUrl}
                    aria-label="分享链接"
                  />
                  <button
                    className="copy-btn"
                    onClick={handleCopyShareUrl}
                  >
                    {copiedToken ? '已复制' : '复制'}
                  </button>
                </div>
                <div className="share-meta">
                  <span className={`share-role-badge role-${store.shareLink.role}`}>
                    {store.shareLink.role === 'viewer' ? '只读' : '可编辑'}
                  </span>
                  <span className="share-expires">
                    有效期至：{new Date(store.shareLink.expiresAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <button
                  className="new-link-btn"
                  onClick={() => store.clearShareLink()}
                >
                  创建新链接
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
