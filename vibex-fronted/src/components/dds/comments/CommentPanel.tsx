'use client';

/**
 * CommentPanel — Sprint49 E5: 协作评论系统
 *
 * 右侧边栏评论面板。
 * 列出当前画布所有评论，支持添加、回复、标记已解决。
 */

import React, { useState, useCallback, useRef } from 'react';
import { useCommentStore } from '@/stores/dds/commentStore';
import type { Comment } from '@/stores/dds/commentStore';
import { parseMentions } from '@/lib/canvas/parseMentions';
import { useMentionsStore } from '@/stores/dds/mentionsStore';
import { useMentionCompletion, getMentionQueryAtCursor } from '@/hooks/useMentionCompletion';
import styles from './CommentPanel.module.css';

interface CommentPanelProps {
  open: boolean;
  onClose: () => void;
  /** 当前选中的节点 ID（用于新评论自动关联） */
  activeNodeId?: string;
}

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
      <p className={styles.commentText}>{comment.text}</p>
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

export function CommentPanel({ open, onClose, activeNodeId }: CommentPanelProps) {
  const [newText, setNewText] = useState('');
  const [targetNodeId, setTargetNodeId] = useState(activeNodeId ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const comments = useCommentStore(s => s.comments);
  const addComment = useCommentStore(s => s.addComment);
  const resolveComment = useCommentStore(s => s.resolveComment);
  const unresolveComment = useCommentStore(s => s.unresolveComment);
  const deleteComment = useCommentStore(s => s.deleteComment);
  const addMention = useMentionsStore(s => s.addMention);

  const mention = useMentionCompletion();

  const handleAddComment = useCallback(() => {
    if (!newText.trim()) return;
    const nodeId = targetNodeId.trim() || `node-${Date.now()}`;

    // S51-E5: parse @mentions before saving comment
    const mentionedUsers = parseMentions(newText);
    addComment(nodeId, newText.trim());

    // S51-E5: trigger mention notifications for each @mentioned user
    mentionedUsers.forEach(username => {
      addMention({
        commentId: `mention-${Date.now()}-${username}`,
        fromUser: 'current-user', // replace with actual user from auth
        toUser: username,
        commentText: newText.trim(),
        projectId: 'current-project', // replace with actual projectId
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
      // S51-E5: 如果 mention 下拉打开，交给 hook 处理
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

  // Group unresolved first, then resolved
  const sorted = [...comments].sort((a, b) => {
    if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
    return b.timestamp - a.timestamp;
  });

  const unresolvedCount = comments.filter(c => !c.resolved).length;

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
        {/* S51-E5: @mention autocomplete dropdown */}
        {mention.isOpen && mention.suggestions.length > 0 && (
          <div className={styles.mentionDropdown} role="listbox" aria-label="@提及补全">
            {mention.suggestions.map((s, i) => (
              <button
                key={s.username}
                role="option"
                aria-selected={i === mention.selectedIndex}
                className={`${styles.mentionOption} ${i === mention.selectedIndex ? styles.selected : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent textarea blur
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

      {/* Comment list */}
      <div className={styles.list}>
        {sorted.length === 0 ? (
          <p className={styles.empty}>暂无评论</p>
        ) : (
          sorted.map(comment => (
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
