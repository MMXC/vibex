'use client';

/**
 * NodeCommentPanel — S78-E3: 内联评论侧边面板
 *
 * Displays all comment threads for the currently selected node.
 * Includes thread list, reply input, and new comment submission.
 */
import React, {
  memo,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { MentionInput } from '@/components/dds/collaboration/MentionInput';
import { CommentThread } from '@/lib/collaboration/collabSessionStore';
import styles from './NodeCommentPanel.module.css';

interface NodeCommentPanelProps {
  /** ID of the node being commented on */
  nodeId: string;
  /** Current comment threads for this node */
  threads: CommentThread[];
  /** Current user ID */
  currentUserId?: string;
  /** Current user name */
  currentUserName?: string;
  /** Whether the panel is open */
  open: boolean;
  /** Called when panel requests to close */
  onClose: () => void;
  /** Called when a new comment is submitted */
  onAddComment: (
    nodeId: string,
    text: string,
    userId: string,
    userName: string,
    mentions: string[],
  ) => void;
  /** Called when a reply is submitted */
  onAddReply: (
    nodeId: string,
    commentId: string,
    text: string,
    userId: string,
    userName: string,
    mentions: string[],
  ) => void;
  /** Called when a thread is deleted */
  onDeleteComment: (nodeId: string, commentId: string) => void;
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

interface ThreadItemProps {
  thread: CommentThread;
  nodeId: string;
  currentUserId?: string;
  onAddReply: NodeCommentPanelProps['onAddReply'];
  onDeleteComment: NodeCommentPanelProps['onDeleteComment'];
}

const ThreadItem = memo(function ThreadItem({
  thread,
  nodeId,
  currentUserId,
  onAddReply,
  onDeleteComment,
}: ThreadItemProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyMentions, setReplyMentions] = useState<string[]>([]);

  const handleSendReply = useCallback(
    (text: string, mentions: string[]) => {
      if (!text.trim()) return;
      onAddReply(nodeId, thread.commentId, text, currentUserId ?? 'local-user', currentUserId ?? '匿名用户', mentions);
      setReplyText('');
      setReplyMentions([]);
      setShowReplyInput(false);
    },
    [nodeId, thread.commentId, currentUserId, onAddReply],
  );

  const handleDelete = useCallback(() => {
    onDeleteComment(nodeId, thread.commentId);
  }, [nodeId, thread.commentId, onDeleteComment]);

  return (
    <div className={styles.thread}>
      {/* Comment header */}
      <div className={styles.commentHeader}>
        <div className={styles.commentMeta}>
          <span className={styles.avatar}>{thread.avatar ?? '👤'}</span>
          <span className={styles.userName}>{thread.userName}</span>
          <span className={styles.time}>{formatTime(thread.timestamp)}</span>
        </div>
        {thread.userId === currentUserId && (
          <button
            className={styles.deleteBtn}
            onClick={handleDelete}
            title="删除评论"
            type="button"
            aria-label="删除评论"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Comment text */}
      <p className={styles.commentText}>{thread.text}</p>

      {/* Replies */}
      {thread.replies.length > 0 && (
        <div className={styles.replies}>
          {thread.replies.map((reply) => (
            <div key={reply.replyId} className={styles.reply}>
              <div className={styles.replyHeader}>
                <span className={styles.avatar}>{reply.avatar ?? '👤'}</span>
                <span className={styles.userName}>{reply.userName}</span>
                <span className={styles.time}>{formatTime(reply.timestamp)}</span>
              </div>
              <p className={styles.replyText}>{reply.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reply input */}
      {showReplyInput ? (
        <div className={styles.replyInputWrapper}>
          <MentionInput
            currentUserId={currentUserId}
            placeholder="回复..."
            onSend={handleSendReply}
            defaultValue={replyText}
          />
          <div className={styles.replyActions}>
            <button
              className={styles.cancelBtn}
              onClick={() => setShowReplyInput(false)}
              type="button"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <button
          className={styles.replyBtn}
          onClick={() => setShowReplyInput(true)}
          type="button"
        >
          回复
        </button>
      )}
    </div>
  );
});

export const NodeCommentPanel = memo(function NodeCommentPanel({
  nodeId,
  threads,
  currentUserId,
  currentUserName,
  open,
  onClose,
  onAddComment,
  onAddReply,
  onDeleteComment,
}: NodeCommentPanelProps) {
  const [newComment, setNewComment] = useState('');
  const [newMentions, setNewMentions] = useState<string[]>([]);
  const listEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new thread added
  useEffect(() => {
    if (open && threads.length > 0) {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, threads.length]);

  const handleSendComment = useCallback(
    (text: string, mentions: string[]) => {
      if (!text.trim()) return;
      onAddComment(
        nodeId,
        text,
        currentUserId ?? 'local-user',
        currentUserName ?? '匿名用户',
        mentions,
      );
      setNewComment('');
      setNewMentions([]);
    },
    [nodeId, currentUserId, currentUserName, onAddComment],
  );

  if (!open) return null;

  return (
    <div className={styles.panel} role="complementary" aria-label="节点评论面板">
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>💬 节点评论</h3>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          type="button"
          aria-label="关闭评论面板"
        >
          ✕
        </button>
      </div>

      {/* Thread list */}
      <div className={styles.threadList}>
        {threads.length === 0 ? (
          <div className={styles.empty}>
            <p>还没有评论</p>
            <p className={styles.emptyHint}>在下方添加第一条评论</p>
          </div>
        ) : (
          threads.map((thread) => (
            <ThreadItem
              key={thread.commentId}
              thread={thread}
              nodeId={nodeId}
              currentUserId={currentUserId}
              onAddReply={onAddReply}
              onDeleteComment={onDeleteComment}
            />
          ))
        )}
        <div ref={listEndRef} />
      </div>

      {/* New comment input */}
      <div className={styles.newComment}>
        <MentionInput
          currentUserId={currentUserId}
          placeholder="添加评论...（输入 @ 提及协作者）"
          onSend={handleSendComment}
        />
      </div>
    </div>
  );
});
