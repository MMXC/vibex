'use client';

/**
 * CommentPanel — Sprint49 E5 + S88-E2: 协作评论系统
 *
 * 右侧边栏评论面板。
 * 列出当前画布所有评论，支持添加、回复、标记已解决。
 *
 * S88-E2 增强：
 * - 筛选栏（全部/未解决/已解决/@我）
 * - 虚拟滚动（>20条评论时启用）
 * - @mention 高亮显示
 */

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useCommentStore } from '@/stores/dds/commentStore';
import type { Comment, CommentFilter } from '@/stores/dds/commentStore';
import { parseMentions } from '@/lib/canvas/parseMentions';
import { useMentionsStore } from '@/stores/dds/mentionsStore';
import { useMentionCompletion, getMentionQueryAtCursor } from '@/hooks/useMentionCompletion';
import { useVirtualizer } from '@tanstack/react-virtual';
import styles from './CommentPanel.module.css';

interface CommentPanelProps {
  open: boolean;
  onClose: () => void;
  /** 当前选中的节点 ID（用于新评论自动关联） */
  activeNodeId?: string;
  /** 当前用户 ID（用于 @我 筛选） */
  currentUserId?: string;
}

const VIRTUAL_SCROLL_THRESHOLD = 20;

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** S88-E2: 将 @mention 文本转换为高亮 JSX */
function HighlightMentions({ text }: { text: string }) {
  const mentions = parseMentions(text);
  if (mentions.length === 0) {
    return <>{text}</>;
  }

  const MENTION_REGEX = /@([\w\u4e00-\u9fa5]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = MENTION_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const username = match[1];
    parts.push(
      <a
        key={`mention-${match.index}`}
        href={`/profile/${encodeURIComponent(username)}`}
        className={styles.mentionLink}
        onClick={e => e.stopPropagation()}
      >
        @{username}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

function CommentItem({
  comment,
  onResolve,
  onUnresolve,
  onDelete,
}: {
  comment: Comment;
  onResolve: (id: string) => void;
  onUnresolve: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={`${styles.commentItem} ${comment.resolved ? styles.resolved : ''}`}
      data-comment-id={comment.commentId}
    >
      <div className={styles.commentHeader}>
        <span className={styles.author}>{comment.author}</span>
        <span className={styles.timestamp}>{formatTime(comment.timestamp)}</span>
        <button
          className={styles.deleteBtn}
          onClick={() => onDelete(comment.commentId)}
          title="删除评论"
          aria-label="删除评论"
        >
          ×
        </button>
      </div>
      {/* S88-E2: @mention highlighted text */}
      <p className={styles.commentText}>
        <HighlightMentions text={comment.text} />
      </p>
      <div className={styles.commentActions}>
        {comment.resolved ? (
          <button
            className={styles.actionBtn}
            onClick={() => onUnresolve(comment.commentId)}
          >
            重新打开
          </button>
        ) : (
          <button
            className={`${styles.actionBtn} ${styles.resolveBtn}`}
            onClick={() => onResolve(comment.commentId)}
          >
            标记已解决
          </button>
        )}
      </div>
    </div>
  );
}

export function CommentPanel({ open, onClose, activeNodeId, currentUserId }: CommentPanelProps) {
  const [newText, setNewText] = useState('');
  const [targetNodeId, setTargetNodeId] = useState(activeNodeId ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const comments = useCommentStore(s => s.comments);
  const filterStatus = useCommentStore(s => s.filterStatus);
  const setFilterStatus = useCommentStore(s => s.setFilterStatus);
  const getFilteredComments = useCommentStore(s => s.getFilteredComments);
  const addComment = useCommentStore(s => s.addComment);
  const resolveComment = useCommentStore(s => s.resolveComment);
  const unresolveComment = useCommentStore(s => s.unresolveComment);
  const deleteComment = useCommentStore(s => s.deleteComment);
  const addMention = useMentionsStore(s => s.addMention);

  const mention = useMentionCompletion();

  // S88-E2: Filtered + sorted comments
  const filteredComments = useMemo(() => {
    const filtered = filterStatus === 'all'
      ? comments
      : getFilteredComments(currentUserId);

    // Group unresolved first, then resolved, sort by timestamp desc
    return [...filtered].sort((a, b) => {
      if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
      return b.timestamp - a.timestamp;
    });
  }, [comments, filterStatus, getFilteredComments, currentUserId]);

  const unresolvedCount = comments.filter(c => !c.resolved).length;

  // S88-E2: Virtual scrolling for large lists
  const useVirtual = filteredComments.length > VIRTUAL_SCROLL_THRESHOLD;
  const virtualizer = useVirtualizer({
    count: filteredComments.length,
    getScrollElement: () => listContainerRef.current,
    estimateSize: () => 120, // estimated row height
    enabled: useVirtual,
  });

  const handleAddComment = useCallback(() => {
    if (!newText.trim()) return;
    const nodeId = targetNodeId.trim() || `node-${Date.now()}`;

    const mentionedUsers = parseMentions(newText);
    addComment(nodeId, newText.trim());

    mentionedUsers.forEach(username => {
      addMention({
        commentId: `mention-${Date.now()}-${username}`,
        fromUser: 'current-user',
        toUser: username,
        commentText: newText.trim(),
        projectId: 'current-project',
        nodeId,
        timestamp: Date.now(),
      });
    });

    setNewText('');
    setTargetNodeId('');
    mention.close();
  }, [newText, targetNodeId, addComment, addMention, mention]);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewText(e.target.value);
    mention.handleTextChange(e);
  }, [mention]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (mention.isOpen) {
        mention.handleKeyDown(e);
        return;
      }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleAddComment();
      }
    },
    [handleAddComment, mention]
  );

  if (!open) return null;

  const FILTER_OPTIONS: { key: CommentFilter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'unresolved', label: '未解决' },
    { key: 'resolved', label: '已解决' },
    { key: 'mentioned', label: '@我' },
  ];

  return (
    <div className={styles.panel} role="complementary" aria-label="评论面板">
      <div className={styles.header}>
        <h2 className={styles.title}>
          评论
          {unresolvedCount > 0 && (
            <span className={styles.badge}>{unresolvedCount}</span>
          )}
        </h2>
        <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">
          ×
        </button>
      </div>

      {/* S88-E2: Filter bar */}
      <div className={styles.filterBar} role="tablist" aria-label="评论筛选">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.key}
            role="tab"
            aria-selected={filterStatus === opt.key}
            className={`${styles.filterTab} ${filterStatus === opt.key ? styles.filterTabActive : ''}`}
            onClick={() => setFilterStatus(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Add comment form */}
      <div className={styles.addForm}>
        <input
          className={styles.nodeInput}
          type="text"
          placeholder="节点 ID（可选）"
          value={targetNodeId}
          onChange={e => setTargetNodeId(e.target.value)}
          aria-label="关联节点 ID"
        />
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder="添加评论… (Cmd+Enter 发送，输入 @ 触发补全)"
          value={newText}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          rows={3}
          aria-label="评论内容"
        />
        {mention.isOpen && mention.suggestions.length > 0 && (
          <div className={styles.mentionDropdown} role="listbox" aria-label="@提及补全">
            {mention.suggestions.map((s, i) => (
              <button
                key={s.username}
                role="option"
                aria-selected={i === mention.selectedIndex}
                className={`${styles.mentionOption} ${i === mention.selectedIndex ? styles.selected : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  mention.insertMention(s.username);
                }}
              >
                <span className={styles.mentionUsername}>@{s.username}</span>
                <span className={styles.mentionDisplay}>{s.displayName}</span>
              </button>
            ))}
          </div>
        )}
        <button
          className={styles.submitBtn}
          onClick={handleAddComment}
          disabled={!newText.trim()}
        >
          发送
        </button>
      </div>

      {/* Comment list — regular or virtual scrolling */}
      <div className={styles.list} ref={listContainerRef}>
        {filteredComments.length === 0 ? (
          <p className={styles.empty}>暂无评论</p>
        ) : useVirtual ? (
          // S88-E2: Virtual scrolling for large lists
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map(virtualRow => {
              const comment = filteredComments[virtualRow.index];
              return (
                <div
                  key={comment.commentId}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <CommentItem
                    comment={comment}
                    onResolve={resolveComment}
                    onUnresolve={unresolveComment}
                    onDelete={deleteComment}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          // Regular rendering for small lists
          filteredComments.map(comment => (
            <CommentItem
              key={comment.commentId}
              comment={comment}
              onResolve={resolveComment}
              onUnresolve={unresolveComment}
              onDelete={deleteComment}
            />
          ))
        )}
      </div>
    </div>
  );
}
