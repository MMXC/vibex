'use client';
/**
 * CommentThread — reply list within the comment panel
 * S92-E3: Shows threaded replies with @mention highlight
 */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Check, CheckCheck, MoreHorizontal } from 'lucide-react';
import type { CanvasComment } from '@/types/comment';

interface CommentThreadProps {
  comments: CanvasComment[];
  currentUserId: string;
  onReply: (parentId: string, content: string) => void;
  onResolve: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onUpdate: (commentId: string, content: string) => void;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  comments,
  currentUserId,
  onReply,
  onResolve,
  onDelete,
  onUpdate,
}) => {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  // Focus reply input when replyingTo changes
  useEffect(() => {
    if (replyingTo && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [replyingTo]);

  const handleReplySubmit = (parentId: string) => {
    if (!replyContent.trim()) return;
    onReply(parentId, replyContent.trim());
    setReplyContent('');
    setReplyingTo(null);
  };

  const handleEditSubmit = (commentId: string) => {
    if (!editContent.trim()) return;
    onUpdate(commentId, editContent.trim());
    setEditingId(null);
    setEditContent('');
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  const highlightMentions = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) =>
      part.startsWith('@') ? (
        <span key={i} style={{ color: '#60a5fa', fontWeight: 600 }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {comments.map(comment => (
        <div key={comment.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Root comment */}
          <div
            style={{
              background: comment.author_id === currentUserId
                ? 'rgba(96, 165, 250, 0.15)'
                : 'rgba(30, 41, 59, 0.6)',
              borderRadius: 12,
              padding: '10px 14px',
              border: comment.resolved
                ? '1px solid rgba(34, 197, 94, 0.4)'
                : '1px solid rgba(71, 85, 105, 0.4)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: comment.author_avatar
                      ? `url(${comment.author_avatar})`
                      : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    backgroundSize: 'cover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {!comment.author_avatar && comment.author_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                    {comment.author_name}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{formatTime(comment.created_at)}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {comment.resolved && (
                  <span
                    style={{
                      fontSize: 11,
                      color: '#22c55e',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <CheckCheck size={13} /> Resolved
                  </span>
                )}
                {comment.author_id === currentUserId && (
                  <>
                    <button
                      onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}
                      style={iconBtnStyle}
                      title="Edit"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(comment.id)}
                      style={{ ...iconBtnStyle, color: '#f87171' }}
                      title="Delete"
                    >
                      ×
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Content */}
            {editingId === comment.id ? (
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(96, 165, 250, 0.4)',
                    borderRadius: 8,
                    color: '#e2e8f0',
                    padding: '6px 10px',
                    fontSize: 13,
                    resize: 'none',
                    outline: 'none',
                    minHeight: 60,
                    fontFamily: 'inherit',
                  }}
                  rows={2}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button
                    onClick={() => handleEditSubmit(comment.id)}
                    style={{ ...sendBtnStyle, padding: '6px 10px' }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{ ...iconBtnStyle, padding: '6px 10px', color: '#94a3b8' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                {highlightMentions(comment.content)}
              </p>
            )}

            {/* Actions */}
            {!comment.resolved && editingId !== comment.id && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  style={{ ...actionBtnStyle, color: '#60a5fa' }}
                >
                  Reply
                </button>
                <button
                  onClick={() => onResolve(comment.id)}
                  style={{ ...actionBtnStyle, color: '#22c55e' }}
                >
                  <Check size={12} /> Resolve
                </button>
              </div>
            )}
          </div>

          {/* Reply input */}
          {replyingTo === comment.id && (
            <div style={{ marginLeft: 36, display: 'flex', gap: 6, marginTop: 6 }}>
              <textarea
                ref={replyInputRef}
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                placeholder="Reply... (use @name to mention)"
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleReplySubmit(comment.id);
                  }
                }}
                style={{
                  flex: 1,
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(96, 165, 250, 0.4)',
                  borderRadius: 8,
                  color: '#e2e8f0',
                  padding: '6px 10px',
                  fontSize: 13,
                  resize: 'none',
                  outline: 'none',
                  minHeight: 48,
                  fontFamily: 'inherit',
                }}
                rows={2}
              />
              <button
                onClick={() => handleReplySubmit(comment.id)}
                style={sendBtnStyle}
                disabled={!replyContent.trim()}
              >
                <Send size={14} />
              </button>
            </div>
          )}

          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div style={{ marginLeft: 36, display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
              {comment.replies.map(reply => (
                <div
                  key={reply.id}
                  style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    borderRadius: 10,
                    padding: '8px 12px',
                    borderLeft: '2px solid rgba(96, 165, 250, 0.5)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: reply.author_avatar
                          ? `url(${reply.author_avatar})`
                          : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        backgroundSize: 'cover',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 9,
                        fontWeight: 700,
                      }}
                    >
                      {!reply.author_avatar && reply.author_name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>
                      {reply.author_name}
                    </span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{formatTime(reply.created_at)}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.4, margin: 0 }}>
                    {highlightMentions(reply.content)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const iconBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#64748b',
  cursor: 'pointer',
  padding: 4,
  borderRadius: 4,
  display: 'flex',
  alignItems: 'center',
  fontSize: 14,
  lineHeight: 1,
};

const actionBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '2px 8px',
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: 3,
  transition: 'opacity 0.15s',
};

const sendBtnStyle: React.CSSProperties = {
  background: 'rgba(96, 165, 250, 0.9)',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  padding: '6px 12px',
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  fontSize: 13,
  fontWeight: 600,
  alignSelf: 'flex-end',
};

export default CommentThread;
