'use client';
/**
 * CommentPanel — right-side panel for canvas comment threads
 * S92-E3: Replace/replace/extend the existing NodeCommentPanel
 *         with canvas-level comment threads + @mention support
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Send, MessageSquare, ChevronDown } from 'lucide-react';
import { CommentThread } from './CommentThread';
import type { CanvasComment, CanvasCommentBubble } from '@/types/comment';

interface CommentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  canvasId: string;
  currentUserId: string;
  currentUserName: string;
  bubbles: CanvasCommentBubble[];
  selectedBubbleId: string | null;
  onResolveComment: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  onUpdateComment: (commentId: string, content: string) => void;
  onNewComment: (x: number, y: number, content: string) => void;
}

export const CommentPanel: React.FC<CommentPanelProps> = ({
  isOpen,
  onClose,
  canvasId,
  currentUserId,
  currentUserName,
  bubbles,
  selectedBubbleId,
  onResolveComment,
  onDeleteComment,
  onUpdateComment,
  onNewComment,
}) => {
  const [comments, setComments] = useState<CanvasComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [isAddingBubble, setIsAddingBubble] = useState(false);
  const [newBubbleX, setNewBubbleX] = useState(100);
  const [newBubbleY, setNewBubbleY] = useState(100);

  const selectedBubble = bubbles.find(b => b.id === selectedBubbleId);

  // Fetch comments for selected bubble
  useEffect(() => {
    if (!selectedBubbleId || !isOpen) {
      setComments([]);
      return;
    }

    setLoading(true);
    fetch(`/api/canvas/${canvasId}/comments?bubbleId=${selectedBubbleId}`)
      .then(r => r.json())
      .then(data => {
        setComments(data.comments || []);
      })
      .catch(() => {
        setComments([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedBubbleId, canvasId, isOpen]);

  const handleReply = useCallback(
    async (parentId: string, content: string) => {
      try {
        const res = await fetch(`/api/canvas/${canvasId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            canvas_id: canvasId,
            parent_id: parentId,
            author_id: currentUserId,
            author_name: currentUserName,
            content,
            x: selectedBubble?.x ?? 0,
            y: selectedBubble?.y ?? 0,
            mentions: [],
          }),
        });
        const data = await res.json();
        if (data.comment) {
          setComments(prev => [...prev, data.comment]);
        }
      } catch (e) {
        console.error('Failed to reply', e);
      }
    },
    [canvasId, currentUserId, currentUserName, selectedBubble]
  );

  const handleNewComment = useCallback(() => {
    if (!newContent.trim()) return;
    onNewComment(newBubbleX, newBubbleY, newContent.trim());
    setNewContent('');
    setIsAddingBubble(false);
  }, [newContent, newBubbleX, newBubbleY, onNewComment]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 64,
        right: 0,
        bottom: 0,
        width: 380,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        borderLeft: '1px solid rgba(71, 85, 105, 0.4)',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(71, 85, 105, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MessageSquare size={18} color="#60a5fa" />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>
            {selectedBubble ? 'Comment Thread' : 'Comments'}
          </span>
          {selectedBubble && (
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {comments.length} comment{comments.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: 6,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
        {loading ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>Loading...</div>
        ) : selectedBubble ? (
          <CommentThread
            comments={comments}
            currentUserId={currentUserId}
            onReply={handleReply}
            onResolve={onResolveComment}
            onDelete={onDeleteComment}
            onUpdate={onUpdateComment}
          />
        ) : (
          <div style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>
            <MessageSquare size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ fontSize: 13 }}>Select a comment bubble on the canvas to view its thread.</p>
            <p style={{ fontSize: 12, marginTop: 8, color: '#475569' }}>
              Click on a bubble to open its thread, or add a new comment.
            </p>
          </div>
        )}
      </div>

      {/* New comment form */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(71, 85, 105, 0.3)',
        }}
      >
        {isAddingBubble ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                placeholder="X"
                value={newBubbleX}
                onChange={e => setNewBubbleX(Number(e.target.value))}
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="Y"
                value={newBubbleY}
                onChange={e => setNewBubbleY(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Add a comment... (use @name to mention)"
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleNewComment();
                }
              }}
              style={{
                ...inputStyle,
                resize: 'none',
                minHeight: 72,
                fontFamily: 'inherit',
              }}
              rows={3}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleNewComment}
                style={{
                  ...sendBtnStyle,
                  opacity: newContent.trim() ? 1 : 0.5,
                }}
                disabled={!newContent.trim()}
              >
                <Send size={14} /> Post
              </button>
              <button
                onClick={() => setIsAddingBubble(false)}
                style={{ ...cancelBtnStyle }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingBubble(true)}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'rgba(96, 165, 250, 0.15)',
              border: '1px dashed rgba(96, 165, 250, 0.5)',
              borderRadius: 10,
              color: '#60a5fa',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            + Add Comment Bubble
          </button>
        )}
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(15, 23, 42, 0.8)',
  border: '1px solid rgba(96, 165, 250, 0.3)',
  borderRadius: 8,
  color: '#e2e8f0',
  padding: '8px 12px',
  fontSize: 13,
  outline: 'none',
};

const sendBtnStyle: React.CSSProperties = {
  background: 'rgba(96, 165, 250, 0.9)',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  padding: '8px 16px',
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 13,
  fontWeight: 600,
};

const cancelBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(71, 85, 105, 0.5)',
  color: '#94a3b8',
  cursor: 'pointer',
  padding: '8px 16px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
};

export default CommentPanel;
