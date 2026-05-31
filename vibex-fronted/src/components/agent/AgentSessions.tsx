/**
 * AgentSessions.tsx — Sprint6 U5: Agent Session Management
 * Sprint40 P001-E1: i18n — hardcoded text replaced with useTranslations('ai')()
 * Sprint44 P001-E1: session naming — double-click to rename
 * Sprint46 P001-E1: session search — searchableText filter + match highlight
 *
 * Displays session list, status badges, terminate controls, and search.
 */

'use client';

import React, { memo, useState, useCallback, useMemo } from 'react';
import { useAgentStore } from '@/stores/agentStore';
import { terminateSession } from '@/services/agent/CodingAgentService';
import type { AgentSessionStatus } from '@/services/agent/CodingAgentService';
import { useTranslations } from '@/hooks/useTranslations';
import styles from './AgentSessions.module.css';

interface SessionCardProps {
  sessionKey: string;
  name?: string;
  task: string;
  status: AgentSessionStatus;
  createdAt: number;
  isActive: boolean;
  t: (key: string) => string;
  /** S46-E1: search query for match highlighting */
  searchQuery?: string;
  /** S48-E4: tags assigned to this session */
  tags?: string[];
  /** S48-E4: whether this session is favorited */
  isFavorite?: boolean;
}

const SessionCard = memo(function SessionCard({
  sessionKey,
  name,
  task,
  status,
  createdAt,
  isActive,
  t,
  searchQuery,
  tags = [],
  isFavorite = false,
}: SessionCardProps) {
  const { setActiveSession, removeSession, updateSession, toggleFavorite, addTag, removeTag } = useAgentStore();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(name ?? task);
  /** S48-E4: tag input visibility and value */
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInputValue, setTagInputValue] = useState('');

  const statusLabel = {
    idle: t('statusIdle'),
    starting: t('statusStarting'),
    running: t('statusRunning'),
    complete: t('statusComplete'),
    error: t('statusError'),
    terminated: t('statusTerminated'),
  }[status] ?? t('statusIdle');

  const statusColor = {
    idle: 'rgba(255,255,255,0.3)',
    starting: 'rgba(234,179,8,0.7)',
    running: 'rgba(59,130,246,0.8)',
    complete: 'rgba(34,197,94,0.8)',
    error: 'rgba(248,113,113,0.8)',
    terminated: 'rgba(255,255,255,0.2)',
  }[status] ?? 'rgba(255,255,255,0.3)';

  const handleTerminate = async () => {
    await terminateSession(sessionKey);
  };

  const handleSelect = () => {
    setActiveSession(sessionKey);
  };

  /** S44-E1: double-click to rename session */
  const handleDoubleClick = useCallback(() => {
    setEditValue(name ?? task);
    setEditing(true);
  }, [name, task]);

  const handleEditSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== (name ?? task)) {
      updateSession(sessionKey, { name: trimmed });
    }
    setEditing(false);
  }, [editValue, name, task, sessionKey, updateSession]);

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleEditSave();
    if (e.key === 'Escape') setEditing(false);
  }, [handleEditSave]);

  /** S48-E4: Toggle favorite */
  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(sessionKey);
  }, [sessionKey, toggleFavorite]);

  /** S48-E4: Submit a new tag */
  const handleAddTag = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInputValue.trim()) {
      addTag(sessionKey, tagInputValue.trim());
      setTagInputValue('');
      setShowTagInput(false);
    }
    if (e.key === 'Escape') {
      setTagInputValue('');
      setShowTagInput(false);
    }
  }, [sessionKey, tagInputValue, addTag]);

  /** S48-E4: Remove a tag */
  const handleRemoveTag = useCallback((e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    removeTag(sessionKey, tag);
  }, [sessionKey, removeTag]);

  const timeAgo = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return `${diff}s ${t('timeAgoSuffix') ?? 'ago'}`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ${t('timeAgoSuffix') ?? 'ago'}`;
    return `${Math.floor(diff / 3600)}h ${t('timeAgoSuffix') ?? 'ago'}`;
  };

  /**
   * S46-E1: Highlight matched text with <mark> tags.
   * Returns an array of React nodes with match segments wrapped in <mark>.
   */
  const highlightMatch = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className={styles.searchHighlight}>{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  const displayText = (name || task) ?? t('noTitle');

  return (
    <div
      className={`${styles.sessionCard} ${isActive ? styles.sessionCardActive : ''}`}
      onClick={handleSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleSelect()}
      aria-pressed={isActive}
      data-testid="agent-session-item"
    >
      <div className={styles.sessionHeader}>
        <span
          className={styles.statusBadge}
          style={{ background: statusColor }}
          aria-label={`${t('statusLabel') ?? 'Status'}: ${statusLabel}`}
        >
          {statusLabel}
        </span>
        {/* S48-E4: Favorite star button */}
        <button
          type="button"
          className={styles.favoriteBtn}
          onClick={handleToggleFavorite}
          aria-label={isFavorite ? t('unfavorite') ?? 'Remove from favorites' : t('favorite') ?? 'Add to favorites'}
          title={isFavorite ? t('unfavorite') ?? 'Remove from favorites' : t('favorite') ?? 'Add to favorites'}
        >
          {isFavorite ? '★' : '☆'}
        </button>
        <span className={styles.timeAgo}>{timeAgo(createdAt)}</span>
      </div>
      <div className={styles.taskPreview}>
        {editing ? (
          <input
            type="text"
            className={styles.sessionNameInput}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditSave}
            onKeyDown={handleEditKeyDown}
            autoFocus
            aria-label={t('sessionNameInput') ?? 'Session name'}
          />
        ) : (
          <span
            onDoubleClick={handleDoubleClick}
            title={t('doubleClickToRename') ?? 'Double-click to rename'}
            style={{ cursor: 'text' }}
          >
            {highlightMatch(displayText, searchQuery ?? '')}
          </span>
        )}
      </div>
      {/* S48-E4: Tag chips + tag input */}
      {(tags.length > 0 || showTagInput) && (
        <div className={styles.tagRow}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tagChip}>
              {tag}
              <button
                type="button"
                className={styles.tagRemoveBtn}
                onClick={(e) => handleRemoveTag(e, tag)}
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
          {showTagInput && (
            <input
              type="text"
              className={styles.tagInput}
              value={tagInputValue}
              onChange={(e) => setTagInputValue(e.target.value)}
              onKeyDown={handleAddTag}
              onBlur={() => { setTagInputValue(''); setShowTagInput(false); }}
              placeholder={t('addTagPlaceholder') ?? 'Add tag...'}
              autoFocus
              aria-label={t('addTagPlaceholder') ?? 'Add tag'}
            />
          )}
        </div>
      )}
      <div className={styles.sessionActions} onClick={(e) => e.stopPropagation()}>
        {/* S48-E4: Tag button */}
        <button
          type="button"
          className={styles.tagAddBtn}
          onClick={() => setShowTagInput(true)}
          aria-label={t('addTag') ?? 'Add tag'}
        >
          +{t('tag') ?? 'Tag'}
        </button>
        {status === 'running' || status === 'starting' ? (
          <button
            type="button"
            className={styles.terminateBtn}
            onClick={(e) => { e.stopPropagation(); handleTerminate(); }}
            aria-label={t('terminateSession')}
          >
            {t('terminateSession')}
          </button>
        ) : (
          <button
            type="button"
            className={styles.removeBtn}
            onClick={(e) => { e.stopPropagation(); removeSession(sessionKey); }}
            aria-label={t('deleteSession')}
          >
            {t('deleteSession')}
          </button>
        )}
      </div>
    </div>
  );
});

/** S46-E1: Search input component */
const SearchInput = memo(function SearchInput({
  value,
  onChange,
  t,
}: {
  value: string;
  onChange: (v: string) => void;
  t: (key: string) => string;
}) {
  return (
    <div className={styles.searchContainer}>
      <svg
        className={styles.searchIcon}
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="text"
        className={styles.searchInput}
        placeholder={t('searchSessionsPlaceholder') ?? 'Search sessions...'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={t('searchSessionsAria') ?? 'Search sessions'}
      />
      {value && (
        <button
          type="button"
          className={styles.searchClearBtn}
          onClick={() => onChange('')}
          aria-label={t('clearSearch') ?? 'Clear search'}
        >
          ×
        </button>
      )}
    </div>
  );
});

export const AgentSessions = memo(function AgentSessions() {
  const t = useTranslations('ai')();
  const { sessions, activeSessionKey } = useAgentStore();
  const [searchQuery, setSearchQuery] = useState('');

  /** S46-E1: Filter sessions by searchableText match */
  const filteredSessions = useMemo(() => {
    let result = sessions;
    // S48-E4: sort favorites first
    result = [...result].sort((a, b) =>
      (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0)
    );
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) => s.searchableText?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [sessions, searchQuery]);

  if (sessions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🤖</div>
        <div style={{ fontSize: '13px', fontWeight: 600 }}>{t('noSessions')}</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
          {t('noSessionsHint') ?? 'Trigger AI Coding Agent from prototype or DDS canvas'}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sessionsList}>
      <div className={styles.sessionsHeader}>
        <span className={styles.sessionsTitle}>{t('sessionList')}</span>
        <span className={styles.sessionsCount}>
          {searchQuery ? `${filteredSessions.length}/${sessions.length}` : sessions.length}
        </span>
      </div>
      {/* S46-E1: Search input */}
      <SearchInput value={searchQuery} onChange={setSearchQuery} t={t} />
      {filteredSessions.length === 0 ? (
        <div className={styles.noResults}>
          {t('noSearchResults') ?? 'No sessions match your search'}
        </div>
      ) : (
        filteredSessions.map((session) => (
          <SessionCard
            key={session.sessionKey}
            sessionKey={session.sessionKey}
            name={session.name}
            task={session.task}
            status={session.status}
            createdAt={session.createdAt}
            isActive={session.sessionKey === activeSessionKey}
            t={t}
            searchQuery={searchQuery}
            tags={session.tags}
            isFavorite={session.isFavorite}
          />
        ))
      )}
    </div>
  );
});

export default AgentSessions;
