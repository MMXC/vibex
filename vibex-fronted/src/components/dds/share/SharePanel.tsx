/**
 * SharePanel.tsx — S94-E2: Advanced Canvas Sharing
 *
 * A comprehensive share panel component supporting:
 * - Share tab: role selection (owner/editor/viewer/commenter), expiration time,
 *   password protection, embed code with copy button
 * - Webhooks tab: add URL + event selection
 *
 * data-testid="share-panel"
 */
'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useShare } from '@/hooks/canvas/useShare';
import { useShareStore, ShareRole, ShareLink, WebhookEvent } from '@/stores/shareStore';
import styles from './SharePanel.module.css';

const ROLES: { value: ShareRole; label: string }[] = [
  { value: 'viewer', label: 'Viewer — 只查看' },
  { value: 'commenter', label: 'Commenter — 可评论' },
  { value: 'editor', label: 'Editor — 可编辑' },
  { value: 'owner', label: 'Owner — 所有者' },
];

const EXPIRY_OPTIONS = [
  { value: 1, label: '1 小时' },
  { value: 24, label: '24 小时' },
  { value: 168, label: '7 天' },
  { value: 720, label: '30 天' },
  { value: 0, label: '永不过期' },
];

const WEBHOOK_EVENTS: { value: WebhookEvent; label: string }[] = [
  { value: 'share.created', label: 'Share Created' },
  { value: 'share.accessed', label: 'Share Accessed' },
  { value: 'share.expired', label: 'Share Expired' },
  { value: 'share.revoked', label: 'Share Revoked' },
  { value: 'canvas.updated', label: 'Canvas Updated' },
  { value: 'canvas.deleted', label: 'Canvas Deleted' },
  { value: 'canvas.exported', label: 'Canvas Exported' },
  { value: 'comment.created', label: 'Comment Created' },
  { value: 'comment.updated', label: 'Comment Updated' },
];

interface SharePanelProps {
  canvasId: string;
  canvasName?: string;
  onClose?: () => void;
}

function formatExpiry(isoDate: string | null): string {
  if (!isoDate) return '永不过期';
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  if (diffMs < 0) return '已过期';
  const diffDays = Math.ceil(diffMs / (1000 * 3600 * 24));
  if (diffDays === 1) return '明天过期';
  if (diffDays < 30) return `${diffDays} 天后过期`;
  return date.toLocaleDateString('zh-CN');
}

function buildEmbedCode(embedUrl: string): string {
  return `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0"></iframe>`;
}

export function SharePanel({ canvasId, canvasName, onClose }: SharePanelProps) {
  const store = useShareStore();
  const { createShareLink, listShareLinks, revokeShareLink, listWebhooks, addWebhook } = useShare(canvasId);

  // Only render when panel is open
  if (!store.isOpen) return null;

  // Load share links on mount
  useEffect(() => {
    void listShareLinks();
  }, [listShareLinks]);

  // Copied state for embed code copy button
  const [embedCopied, setEmbedCopied] = useState(false);
  const [linkCopiedId, setLinkCopiedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [addWebhookLoading, setAddWebhookLoading] = useState(false);

  const copyEmbed = useCallback(async (embedUrl: string) => {
    try {
      await navigator.clipboard.writeText(buildEmbedCode(embedUrl));
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, []);

  const copyLink = useCallback(async (link: ShareLink) => {
    try {
      await navigator.clipboard.writeText(link.shareUrl);
      setLinkCopiedId(link.id);
      setTimeout(() => setLinkCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  }, []);

  const handleCreateShare = useCallback(async () => {
    setCreating(true);
    try {
      await createShareLink({
        role: store.selectedRole,
        expiresInHours: store.expiresInHours,
        password: store.sharePassword || undefined,
        allowComments: store.allowComments,
        allowDownload: store.allowDownload,
      });
      // Reset form
      store.setSharePassword('');
    } finally {
      setCreating(false);
    }
  }, [createShareLink, store]);

  const handleRevoke = useCallback(async (token: string) => {
    try {
      await revokeShareLink(token);
    } catch {
      // error is set in store
    }
  }, [revokeShareLink]);

  const handleAddWebhook = useCallback(async () => {
    if (!store.webhookUrl || store.webhookEvents.length === 0) return;
    setAddWebhookLoading(true);
    try {
      await addWebhook({ url: store.webhookUrl, events: store.webhookEvents });
      store.setWebhookUrl('');
      store.setWebhookEvents([]);
    } finally {
      setAddWebhookLoading(false);
    }
  }, [addWebhook, store]);

  const toggleWebhookEvent = useCallback((event: WebhookEvent) => {
    const current = store.webhookEvents;
    if (current.includes(event)) {
      store.setWebhookEvents(current.filter((e) => e !== event));
    } else {
      store.setWebhookEvents([...current, event]);
    }
  }, [store]);

  // Build the active share's embed URL for the copy button
  const activeLink = store.shareLinks[0];
  const activeEmbedUrl = activeLink?.embedUrl ?? '';
  const embedCode = useMemo(() => buildEmbedCode(activeEmbedUrl), [activeEmbedUrl]);

  return (
    <div className={styles.panel} data-testid="share-panel" role="dialog" aria-label="分享与设置">
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>分享与设置</h2>
          {canvasName && <p className={styles.subtitle}>{canvasName}</p>}
        </div>
        <button
          className={styles.closeBtn}
          onClick={() => { store.closePanel(); onClose?.(); }}
          aria-label="关闭"
          data-testid="close-share-panel"
          type="button"
        >
          ✕
        </button>
      </div>

      {/* Tab bar */}
      <div className={styles.tabBar} role="tablist">
        <button
          className={`${styles.tab} ${store.activeTab === 'share' ? styles.tabActive : ''}`}
          onClick={() => store.setActiveTab('share')}
          role="tab"
          aria-selected={store.activeTab === 'share'}
          data-testid="tab-share"
          type="button"
        >
          分享链接
        </button>
        <button
          className={`${styles.tab} ${store.activeTab === 'webhooks' ? styles.tabActive : ''}`}
          onClick={() => {
            store.setActiveTab('webhooks');
            void listWebhooks();
          }}
          role="tab"
          aria-selected={store.activeTab === 'webhooks'}
          data-testid="tab-webhooks"
          type="button"
        >
          Webhooks
        </button>
      </div>

      {/* Error banner */}
      {store.error && (
        <div className={styles.errorBanner} data-testid="share-error">
          {store.error}
        </div>
      )}

      {/* Share Tab */}
      {store.activeTab === 'share' && (
        <div className={styles.tabContent} role="tabpanel" data-testid="share-tab">
          {/* Role selection */}
          <div className={styles.section}>
            <label className={styles.label}>访问权限</label>
            <div className={styles.roleGrid}>
              {ROLES.map((r) => (
                <label key={r.value} className={styles.roleOption}>
                  <input
                    type="radio"
                    name="share-role"
                    value={r.value}
                    checked={store.selectedRole === r.value}
                    onChange={() => store.setSelectedRole(r.value)}
                    className={styles.radioInput}
                  />
                  <span className={styles.roleLabel}>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Expiration */}
          <div className={styles.section}>
            <label className={styles.label} htmlFor="expiry-select">链接有效期</label>
            <select
              id="expiry-select"
              className={styles.select}
              value={store.expiresInHours}
              onChange={(e) => store.setExpiresInHours(Number(e.target.value))}
              data-testid="expiry-select"
            >
              {EXPIRY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Password */}
          <div className={styles.section}>
            <label className={styles.label} htmlFor="share-password">密码保护（可选）</label>
            <input
              id="share-password"
              type="password"
              className={styles.input}
              placeholder="留空则不设置密码"
              value={store.sharePassword}
              onChange={(e) => store.setSharePassword(e.target.value)}
              data-testid="share-password-input"
              autoComplete="new-password"
            />
          </div>

          {/* Toggles */}
          <div className={styles.section}>
            <label className={styles.toggleRow}>
              <input
                type="checkbox"
                checked={store.allowComments}
                onChange={(e) => store.setAllowComments(e.target.checked)}
                className={styles.checkbox}
              />
              <span>允许评论</span>
            </label>
            <label className={styles.toggleRow}>
              <input
                type="checkbox"
                checked={store.allowDownload}
                onChange={(e) => store.setAllowDownload(e.target.checked)}
                className={styles.checkbox}
              />
              <span>允许下载</span>
            </label>
          </div>

          {/* Create button */}
          <button
            className={styles.primaryBtn}
            onClick={handleCreateShare}
            disabled={creating || store.isLoading}
            data-testid="create-share-btn"
            type="button"
          >
            {creating || store.isLoading ? '生成中...' : '生成分享链接'}
          </button>

          {/* Active share link */}
          {activeLink && (
            <div className={styles.activeShare} data-testid="active-share">
              <div className={styles.shareLinkRow}>
                <div className={styles.shareLinkInfo}>
                  <span className={styles.shareRoleBadge}>{activeLink.role}</span>
                  <span className={styles.shareExpiry}>{formatExpiry(activeLink.expiresAt)}</span>
                  {activeLink.hasPassword && <span className={styles.passwordBadge}>🔒</span>}
                </div>
                <button
                  className={styles.copyBtn}
                  onClick={() => copyLink(activeLink)}
                  data-testid="copy-share-link"
                  type="button"
                >
                  {linkCopiedId === activeLink.id ? '已复制!' : '复制链接'}
                </button>
              </div>

              {/* Embed code */}
              <div className={styles.embedSection}>
                <label className={styles.label}>嵌入代码</label>
                <div className={styles.embedCodeRow}>
                  <pre className={styles.embedCode} data-testid="embed-code">
                    {embedCode}
                  </pre>
                  <button
                    className={styles.copyBtn}
                    onClick={() => copyEmbed(activeLink.embedUrl)}
                    data-testid="copy-embed-btn"
                    type="button"
                  >
                    {embedCopied ? '已复制!' : '复制代码'}
                  </button>
                </div>
              </div>

              {/* Revoke */}
              <button
                className={styles.dangerBtn}
                onClick={() => handleRevoke(activeLink.token)}
                data-testid="revoke-share-btn"
                type="button"
              >
                撤销此链接
              </button>
            </div>
          )}

          {/* All share links list */}
          {store.shareLinks.length > 1 && (
            <div className={styles.allLinks} data-testid="all-share-links">
              <h3 className={styles.allLinksTitle}>其他链接</h3>
              {store.shareLinks.slice(1).map((link) => (
                <div key={link.id} className={styles.linkItem}>
                  <div className={styles.linkItemInfo}>
                    <span className={styles.shareRoleBadge}>{link.role}</span>
                    <span className={styles.shareExpiry}>{formatExpiry(link.expiresAt)}</span>
                    {link.hasPassword && <span>🔒</span>}
                    {link.viewCount > 0 && <span className={styles.viewCount}>{link.viewCount} 次访问</span>}
                  </div>
                  <button
                    className={styles.copyBtn}
                    onClick={() => copyLink(link)}
                    type="button"
                  >
                    复制
                  </button>
                  <button
                    className={styles.dangerBtnSmall}
                    onClick={() => handleRevoke(link.token)}
                    type="button"
                    aria-label="撤销"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Webhooks Tab */}
      {store.activeTab === 'webhooks' && (
        <div className={styles.tabContent} role="tabpanel" data-testid="webhooks-tab">
          {/* Add webhook form */}
          <div className={styles.section}>
            <label className={styles.label} htmlFor="webhook-url">Webhook URL</label>
            <input
              id="webhook-url"
              type="url"
              className={styles.input}
              placeholder="https://your-server.com/webhook"
              value={store.webhookUrl}
              onChange={(e) => store.setWebhookUrl(e.target.value)}
              data-testid="webhook-url-input"
            />
          </div>

          {/* Event selection */}
          <div className={styles.section}>
            <label className={styles.label}>触发事件</label>
            <div className={styles.eventGrid}>
              {WEBHOOK_EVENTS.map((e) => (
                <label key={e.value} className={styles.eventOption}>
                  <input
                    type="checkbox"
                    checked={store.webhookEvents.includes(e.value)}
                    onChange={() => toggleWebhookEvent(e.value)}
                    className={styles.checkbox}
                  />
                  <span>{e.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            className={styles.primaryBtn}
            onClick={handleAddWebhook}
            disabled={addWebhookLoading || store.isLoadingWebhooks || !store.webhookUrl || store.webhookEvents.length === 0}
            data-testid="add-webhook-btn"
            type="button"
          >
            {addWebhookLoading || store.isLoadingWebhooks ? '添加中...' : '添加 Webhook'}
          </button>

          {/* Existing webhooks */}
          {store.webhooks.length > 0 && (
            <div className={styles.webhookList} data-testid="webhook-list">
              <h3 className={styles.allLinksTitle}>已配置的 Webhooks</h3>
              {store.webhooks.map((wh) => (
                <div key={wh.id} className={styles.webhookItem}>
                  <div className={styles.webhookInfo}>
                    <span className={styles.webhookUrl}>{wh.url}</span>
                    <div className={styles.webhookEvents}>
                      {wh.events.map((ev) => (
                        <span key={ev} className={styles.eventTag}>{ev}</span>
                      ))}
                    </div>
                  </div>
                  <span className={styles.webhookStatus}>
                    {wh.isActive ? '🟢 活跃' : '🔴 停用'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
