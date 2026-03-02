import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import { User } from '../../services/api';
import styles from './CommentThread.module.css';

// 评论类型
export type CommentType = 'bug' | 'suggestion' | 'question' | 'praise';

// 评论状态
export type CommentStatus = 'open' | 'resolved' | 'dismissed';

// 单条评论
export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author?: User;
  type: CommentType;
  status: CommentStatus;
  prototypeSnapshotId?: string;
  position?: { x: number; y: number };
  parentId?: string;
  replies?: Comment[];
  createdAt: string;
  updatedAt?: string;
}

// 评论创建参数
export interface CommentCreate {
  content: string;
  type: CommentType;
  prototypeSnapshotId?: string;
  position?: { x: number; y: number };
  parentId?: string;
}

// 组件属性
export interface CommentThreadProps {
  comments: Comment[];
  currentUser?: User;
  snapshotId?: string;
  onAddComment?: (comment: CommentCreate) => Promise<Comment>;
  onEditComment?: (commentId: string, content: string) => Promise<Comment>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  onResolveComment?: (commentId: string) => Promise<Comment>;
  onReplyComment?: (parentId: string, content: string) => Promise<Comment>;
  onLoadReplies?: (commentId: string) => Promise<Comment[]>;
  loading?: boolean;
  readOnly?: boolean;
}

// 评论类型配置
const COMMENT_TYPE_CONFIG: Record<CommentType, { label: string; emoji: string; color: string }> = {
  bug: { label: 'Bug', emoji: '🐛', color: '#dc3545' },
  suggestion: { label: '建议', emoji: '💡', color: '#ffc107' },
  question: { label: '问题', emoji: '❓', color: '#17a2b8' },
  praise: { label: '表扬', emoji: '👍', color: '#28a745' },
};

// 格式化时间
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

// 评论输入框组件
interface CommentInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
  loading?: boolean;
  autoFocus?: boolean;
}

function CommentInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder = '写下你的评论...',
  submitLabel = '发送',
  loading = false,
  autoFocus = false,
}: CommentInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (value.trim() && !loading) {
        onSubmit();
      }
    }
    if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  return (
    <div className={styles.commentInput}>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
      />
      <div className={styles.inputActions}>
        <span className={styles.hint}>Ctrl + Enter 发送</span>
        <div className={styles.actionButtons}>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              取消
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={onSubmit}
            disabled={!value.trim() || loading}
            loading={loading}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// 单条评论组件
interface CommentItemProps {
  comment: Comment;
  currentUser?: User;
  onEdit?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  onResolve?: (commentId: string) => void;
  onLoadReplies?: (commentId: string) => Promise<Comment[]>;
  onAddReply?: (parentId: string, content: string) => Promise<Comment>;
  depth?: number;
  readOnly?: boolean;
}

function CommentItem({
  comment,
  currentUser,
  onEdit,
  onDelete,
  onResolve,
  onLoadReplies,
  onAddReply,
  depth = 0,
  readOnly = false,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(depth < 2); // 默认展开前两层
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replies, setReplies] = useState<Comment[]>(comment.replies || []);
  const [repliesLoading, setRepliesLoading] = useState(false);

  const isOwner = currentUser?.id === comment.authorId;
  const typeConfig = COMMENT_TYPE_CONFIG[comment.type];

  const handleSaveEdit = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false);
      return;
    }
    try {
      await onEdit?.(comment.id);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to edit comment:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('确定要删除这条评论吗？')) {
      await onDelete?.(comment.id);
    }
  };

  const handleResolve = async () => {
    await onResolve?.(comment.id);
  };

  const handleLoadReplies = async () => {
    if (replies.length > 0 || repliesLoading) {
      setShowReplies(!showReplies);
      return;
    }
    setRepliesLoading(true);
    try {
      const loadedReplies = await onLoadReplies?.(comment.id);
      setReplies(loadedReplies || []);
      setShowReplies(true);
    } catch (error) {
      console.error('Failed to load replies:', error);
    } finally {
      setRepliesLoading(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    try {
      const newReply = await onAddReply?.(comment.id, replyContent);
      if (newReply) {
        setReplies([...replies, newReply]);
        setReplyContent('');
        setShowReplyInput(false);
      }
    } catch (error) {
      console.error('Failed to add reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${styles.commentItem} ${depth > 0 ? styles.nestedComment : ''}`}>
      <div className={styles.commentHeader}>
        <Avatar
          src={comment.author?.avatar || undefined}
          fallback={comment.author?.name || '用户'}
          size="sm"
        />
        <div className={styles.commentMeta}>
          <span className={styles.authorName}>
            {comment.author?.name || '匿名用户'}
          </span>
          <span className={styles.commentTime}>
            {formatTimeAgo(comment.createdAt)}
          </span>
        </div>
        <span
          className={styles.typeBadge}
          style={{ backgroundColor: typeConfig.color + '20', color: typeConfig.color }}
        >
          {typeConfig.emoji} {typeConfig.label}
        </span>
        {comment.status === 'resolved' && (
          <span className={styles.resolvedBadge}>✓ 已解决</span>
        )}
      </div>

      <div className={styles.commentBody}>
        {isEditing ? (
          <CommentInput
            value={editContent}
            onChange={setEditContent}
            onSubmit={handleSaveEdit}
            onCancel={() => {
              setIsEditing(false);
              setEditContent(comment.content);
            }}
            submitLabel="保存"
            autoFocus
          />
        ) : (
          <p className={styles.commentContent}>{comment.content}</p>
        )}
      </div>

      {!isEditing && (
        <div className={styles.commentActions}>
          {!readOnly && (
            <>
              <button
                className={styles.actionBtn}
                onClick={() => setShowReplyInput(!showReplyInput)}
              >
                回复
              </button>
              {comment.status !== 'resolved' && onResolve && (
                <button className={styles.actionBtn} onClick={handleResolve}>
                  标记解决
                </button>
              )}
              {isOwner && (
                <>
                  <button
                    className={styles.actionBtn}
                    onClick={() => setIsEditing(true)}
                  >
                    编辑
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    onClick={handleDelete}
                  >
                    删除
                  </button>
                </>
              )}
            </>
          )}
          {(comment.replies?.length || 0) > 0 && (
            <button
              className={styles.actionBtn}
              onClick={handleLoadReplies}
            >
              {showReplies ? '隐藏' : '查看'}回复 ({comment.replies?.length || replies.length})
            </button>
          )}
        </div>
      )}

      {showReplyInput && (
        <div className={styles.replyInputWrapper}>
          <CommentInput
            value={replyContent}
            onChange={setReplyContent}
            onSubmit={handleSubmitReply}
            onCancel={() => {
              setShowReplyInput(false);
              setReplyContent('');
            }}
            placeholder="写下你的回复..."
            submitLabel="回复"
            loading={isSubmitting}
            autoFocus
          />
        </div>
      )}

      {showReplies && replies.length > 0 && (
        <div className={styles.repliesContainer}>
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              onEdit={onEdit}
              onDelete={onDelete}
              onResolve={onResolve}
              onLoadReplies={onLoadReplies}
              onAddReply={onAddReply}
              depth={depth + 1}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 主评论组件
export function CommentThread({
  comments,
  currentUser,
  snapshotId,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onResolveComment,
  onReplyComment,
  onLoadReplies,
  loading = false,
  readOnly = false,
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState('');
  const [selectedType, setSelectedType] = useState<CommentType>('suggestion');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<CommentType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<CommentStatus | 'all'>('all');
  const [showTypeModal, setShowTypeModal] = useState(false);

  // 过滤评论
  const filteredComments = comments.filter((comment) => {
    const typeMatch = filter === 'all' || comment.type === filter;
    const statusMatch = statusFilter === 'all' || comment.status === statusFilter;
    // 只显示顶层评论
    return typeMatch && statusMatch && !comment.parentId;
  });

  // 统计
  const stats = {
    total: comments.filter(c => !c.parentId).length,
    open: comments.filter(c => !c.parentId && c.status === 'open').length,
    resolved: comments.filter(c => !c.parentId && c.status === 'resolved').length,
    bugs: comments.filter(c => !c.parentId && c.type === 'bug').length,
    suggestions: comments.filter(c => !c.parentId && c.type === 'suggestion').length,
    questions: comments.filter(c => !c.parentId && c.type === 'question').length,
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      const commentData: CommentCreate = {
        content: newComment,
        type: selectedType,
        prototypeSnapshotId: snapshotId,
      };
      
      await onAddComment?.(commentData);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string, content: string) => {
    await onEditComment?.(commentId, content);
  };

  const handleDeleteComment = async (commentId: string) => {
    await onDeleteComment?.(commentId);
  };

  const handleResolveComment = async (commentId: string) => {
    await onResolveComment?.(commentId);
  };

  const handleAddReply = async (parentId: string, content: string) => {
    return await onReplyComment?.(parentId, content) as Comment;
  };

  const handleLoadReplies = async (commentId: string) => {
    return await onLoadReplies?.(commentId) || [];
  };

  return (
    <div className={styles.commentThread}>
      {/* 头部统计 */}
      <div className={styles.threadHeader}>
        <h3 className={styles.title}>评论与反馈</h3>
        <div className={styles.stats}>
          <span className={styles.statItem}>
            <span className={styles.statValue}>{stats.total}</span> 全部
          </span>
          <span className={styles.statItem}>
            <span className={`${styles.statValue} ${styles.open}`}>{stats.open}</span> 待处理
          </span>
          <span className={styles.statItem}>
            <span className={`${styles.statValue} ${styles.resolved}`}>{stats.resolved}</span> 已解决
          </span>
        </div>
      </div>

      {/* 筛选器 */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>类型:</span>
          <select
            className={styles.filterSelect}
            value={filter}
            onChange={(e) => setFilter(e.target.value as CommentType | 'all')}
          >
            <option value="all">全部</option>
            <option value="bug">🐛 Bug ({stats.bugs})</option>
            <option value="suggestion">💡 建议 ({stats.suggestions})</option>
            <option value="question">❓ 问题 ({stats.questions})</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>状态:</span>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CommentStatus | 'all')}
          >
            <option value="all">全部</option>
            <option value="open">待处理</option>
            <option value="resolved">已解决</option>
            <option value="dismissed">已忽略</option>
          </select>
        </div>
      </div>

      {/* 新建评论 */}
      {!readOnly && (
        <div className={styles.newComment}>
          <div className={styles.newCommentHeader}>
            <Avatar
              src={currentUser?.avatar || undefined}
              fallback={currentUser?.name || '我'}
              size="sm"
            />
            <button
              className={styles.typeSelector}
              onClick={() => setShowTypeModal(true)}
              style={{
                backgroundColor: COMMENT_TYPE_CONFIG[selectedType].color + '20',
                color: COMMENT_TYPE_CONFIG[selectedType].color,
              }}
            >
              {COMMENT_TYPE_CONFIG[selectedType].emoji}{' '}
              {COMMENT_TYPE_CONFIG[selectedType].label}
              <span className={styles.chevron}>▼</span>
            </button>
          </div>
          <CommentInput
            value={newComment}
            onChange={setNewComment}
            onSubmit={handleSubmitComment}
            placeholder="添加评论或反馈..."
            submitLabel="发表评论"
            loading={isSubmitting}
          />
        </div>
      )}

      {/* 评论列表 */}
      <div className={styles.commentsList}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <span>加载中...</span>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>💬</span>
            <p>暂无评论</p>
            <p className={styles.emptyHint}>
              {filter !== 'all' || statusFilter !== 'all'
                ? '试试调整筛选条件'
                : '发表第一条评论吧'}
            </p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              onEdit={(id) => handleEditComment(id, '')}
              onDelete={handleDeleteComment}
              onResolve={handleResolveComment}
              onLoadReplies={handleLoadReplies}
              onAddReply={handleAddReply}
              readOnly={readOnly}
            />
          ))
        )}
      </div>

      {/* 类型选择弹窗 */}
      <Modal
        open={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        title="选择评论类型"
        width={360}
      >
        <div className={styles.typeModalContent}>
          {(Object.keys(COMMENT_TYPE_CONFIG) as CommentType[]).map((type) => (
            <button
              key={type}
              className={`${styles.typeOption} ${
                selectedType === type ? styles.selected : ''
              }`}
              onClick={() => {
                setSelectedType(type);
                setShowTypeModal(false);
              }}
            >
              <span className={styles.typeEmoji}>
                {COMMENT_TYPE_CONFIG[type].emoji}
              </span>
              <div className={styles.typeInfo}>
                <span className={styles.typeLabel}>
                  {COMMENT_TYPE_CONFIG[type].label}
                </span>
                <span className={styles.typeDesc}>
                  {type === 'bug' && '发现的问题或错误'}
                  {type === 'suggestion' && '改进建议'}
                  {type === 'question' && '需要澄清的问题'}
                  {type === 'praise' && '喜欢的设计或功能'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

export default CommentThread;
