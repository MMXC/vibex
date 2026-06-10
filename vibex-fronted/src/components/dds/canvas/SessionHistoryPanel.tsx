/**
 * SessionHistoryPanel — Collaboration Session History Panel
 *
 * S85-E2: 协作会话历史记录
 *
 * Features:
 * - Displays a paginated, filterable list of collaborative operations
 * - Filter by operation type (edit/merge/comment/permission/create/delete)
 * - Filter by collaborator
 * - Keyword search in operation details
 * - Expandable rows showing full details
 * - Load-more pagination (20 items per page)
 */

'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSessionHistoryStore } from '@/stores/dds/sessionHistoryStore';
import type { SessionRecord, OperationType } from '@/stores/dds/sessionHistoryStore';
import { useCanvasPermissionsStore, selectCollaborators } from '@/stores/dds/canvasPermissionsStore';

interface SessionHistoryPanelProps {
  canvasId: string;
}

const OPERATION_LABELS: Record<OperationType, string> = {
  edit: '编辑',
  merge: '合并',
  comment: '评论',
  permission: '权限变更',
  create: '创建',
  delete: '删除',
};

const OPERATION_ICONS: Record<OperationType, string> = {
  edit: '✏️',
  merge: '🔀',
  comment: '💬',
  permission: '🔐',
  create: '➕',
  delete: '🗑️',
};

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `今天 ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays === 1) {
    return `昨天 ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays < 7) {
    return `${diffDays} 天前`;
  } else {
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }
}

function SessionRow({ session }: { session: SessionRecord }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="session-row" role="listitem">
      <button
        className="session-row-header"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        aria-label={`${OPERATION_LABELS[session.operationType]} 操作，${expanded ? '收起' : '展开'}详情`}
      >
        <div className="session-icon">{OPERATION_ICONS[session.operationType]}</div>
        <div className="session-info">
          <div className="session-meta">
            <span className="session-user">{session.userName}</span>
            <span className="session-op">{OPERATION_LABELS[session.operationType]}</span>
            {session.operationTarget && (
              <span className="session-target" title={session.operationTarget}>
                → {session.operationTarget.length > 20
                  ? session.operationTarget.slice(0, 20) + '…'
                  : session.operationTarget}
              </span>
            )}
          </div>
          <div className="session-time">{formatTime(session.createdAt)}</div>
        </div>
        <div className={`expand-chevron ${expanded ? 'expanded' : ''}`}>▶</div>
      </button>

      {expanded && (
        <div className="session-detail" role="region" aria-label="操作详情">
          {session.userAvatar && (
            <div className="detail-row">
              <span className="detail-label">头像</span>
              <img src={session.userAvatar} alt={session.userName} className="detail-avatar" />
            </div>
          )}
          <div className="detail-row">
            <span className="detail-label">操作类型</span>
            <span>{OPERATION_LABELS[session.operationType]}</span>
          </div>
          {session.operationTarget && (
            <div className="detail-row">
              <span className="detail-label">操作对象</span>
              <span>{session.operationTarget}</span>
            </div>
          )}
          {session.operationDetail && (
            <div className="detail-row">
              <span className="detail-label">详情</span>
              <span className="detail-content">{session.operationDetail}</span>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-label">时间</span>
            <span>{new Date(session.createdAt).toLocaleString('zh-CN')}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">会话 ID</span>
            <code className="detail-id">{session.id}</code>
          </div>
        </div>
      )}
    </div>
  );
}

export function SessionHistoryPanel({ canvasId }: SessionHistoryPanelProps) {
  const store = useSessionHistoryStore();
  const permissionsStore = useCanvasPermissionsStore();
  const collaborators = selectCollaborators(permissionsStore);

  const [localSearch, setLocalSearch] = useState('');
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const initialized = useRef(false);

  // Init on mount / canvasId change
  useEffect(() => {
    if (canvasId) {
      store.initCanvas(canvasId);
      initialized.current = true;
    }
    return () => {
      initialized.current = false;
    };
  }, [canvasId]);

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setLocalSearch(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      store.setFilter({ search: value });
    }, 350);
    setDebounceTimer(timer);
  }, [debounceTimer, store]);

  // Intersection observer for load-more
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !store.loadingMore && store.page < store.totalPages) {
          store.loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [store, store.page, store.totalPages, store.loadingMore]);

  const handleTypeFilter = (type: OperationType | null) => {
    store.setFilter({ operationType: type });
  };

  const handleUserFilter = (userId: string | null) => {
    store.setFilter({ userId });
  };

  return (
    <div className="session-history-panel" role="region" aria-label="会话历史">
      {/* Search */}
      <div className="sh-search-row">
        <input
          type="search"
          className="sh-search-input"
          placeholder="搜索操作内容…"
          value={localSearch}
          onChange={e => handleSearchChange(e.target.value)}
          aria-label="搜索会话历史"
        />
      </div>

      {/* Filters */}
      <div className="sh-filters" role="group" aria-label="筛选条件">
        {/* Operation type filter */}
        <div className="sh-filter-section">
          <span className="sh-filter-label">操作类型</span>
          <div className="sh-filter-chips" role="radiogroup" aria-label="操作类型">
            <button
              className={`chip ${store.filterType === null ? 'active' : ''}`}
              onClick={() => handleTypeFilter(null)}
              role="radio"
              aria-checked={store.filterType === null}
            >全部</button>
            {(Object.keys(OPERATION_LABELS) as OperationType[]).map(type => (
              <button
                key={type}
                className={`chip ${store.filterType === type ? 'active' : ''}`}
                onClick={() => handleTypeFilter(type)}
                role="radio"
                aria-checked={store.filterType === type}
              >
                {OPERATION_ICONS[type]} {OPERATION_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* User filter */}
        {collaborators.length > 0 && (
          <div className="sh-filter-section">
            <span className="sh-filter-label">协作者</span>
            <div className="sh-filter-chips" role="radiogroup" aria-label="协作者">
              <button
                className={`chip ${store.filterUserId === null ? 'active' : ''}`}
                onClick={() => handleUserFilter(null)}
                role="radio"
                aria-checked={store.filterUserId === null}
              >全部</button>
              {collaborators.map(c => (
                <button
                  key={c.userId}
                  className={`chip ${store.filterUserId === c.userId ? 'active' : ''}`}
                  onClick={() => handleUserFilter(c.userId)}
                  role="radio"
                  aria-checked={store.filterUserId === c.userId}
                >
                  {(c.displayName ?? c.email ?? c.userId).charAt(0).toUpperCase()}{' '}
                  {c.displayName ?? c.email ?? c.userId}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="sh-stats" aria-live="polite">
        <span>
          共 {store.total} 条记录
          {store.filterType && ` · ${OPERATION_LABELS[store.filterType as OperationType]}`}
          {store.filterUserId && ` · ${collaborators.find(c => c.userId === store.filterUserId)?.displayName ?? store.filterUserId}`}
          {store.searchKeyword && ` · 包含"${store.searchKeyword}"`}
        </span>
      </div>

      {/* Error */}
      {store.error && (
        <div className="sh-error" role="alert">
          <span>{store.error}</span>
          <button
            className="sh-retry-btn"
            onClick={() => store.initCanvas(canvasId)}
            aria-label="重试"
          >重试</button>
        </div>
      )}

      {/* Loading skeleton */}
      {store.loading && (
        <div className="sh-loading" aria-label="加载中…" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="sh-skeleton-row">
              <div className="sh-skeleton sh-skeleton-icon" />
              <div className="sh-skeleton-content">
                <div className="sh-skeleton sh-skeleton-meta" />
                <div className="sh-skeleton sh-skeleton-time" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Session list */}
      {!store.loading && store.sessions.length === 0 && !store.error && (
        <div className="sh-empty" role="status">
          <span>📭</span>
          <p>暂无会话历史记录</p>
          {store.filterType || store.filterUserId || store.searchKeyword ? (
            <p className="sh-empty-hint">试试调整筛选条件</p>
          ) : null}
        </div>
      )}

      {!store.loading && store.sessions.length > 0 && (
        <div className="session-list" role="list" aria-label="会话历史列表">
          {store.sessions.map(session => (
            <SessionRow key={session.id} session={session} />
          ))}
        </div>
      )}

      {/* Load-more sentinel */}
      {store.sessions.length > 0 && store.page < store.totalPages && (
        <div ref={sentinelRef} className="sh-sentinel" aria-hidden="true" />
      )}

      {/* Load more button fallback */}
      {store.sessions.length > 0 && store.page < store.totalPages && (
        <div className="sh-load-more-row">
          <button
            className="sh-load-more-btn"
            onClick={() => store.loadMore()}
            disabled={store.loadingMore}
            aria-label="加载更多"
          >
            {store.loadingMore ? '加载中…' : `加载更多 (${store.sessions.length}/${store.total})`}
          </button>
        </div>
      )}

      {/* All loaded */}
      {store.sessions.length > 0 && store.page >= store.totalPages && (
        <div className="sh-end-marker" role="status">已加载全部 {store.total} 条记录</div>
      )}
    </div>
  );
}
