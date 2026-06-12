'use client';
/**
 * CommentBubble — floating comment bubble on the canvas
 * S92-E3: Shows thread count, click opens CommentPanel
 * S92-E4: Link to template Marketplace
 */
'use client';

import React, { useCallback } from 'react';
import { MessageSquare, Check } from 'lucide-react';

interface CommentBubbleProps {
  id: string;
  x: number;
  y: number;
  commentCount: number;
  unresolvedCount: number;
  lastActivity?: number;
  onClick: (id: string) => void;
  isSelected?: boolean;
}

export const CommentBubble: React.FC<CommentBubbleProps> = ({
  id,
  x,
  y,
  commentCount,
  unresolvedCount,
  lastActivity,
  onClick,
  isSelected = false,
}) => {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick(id);
    },
    [id, onClick]
  );

  const isResolved = unresolvedCount === 0 && commentCount > 0;

  return (
    <div
      className="comment-bubble"
      onClick={handleClick}
      title={`${commentCount} comment${commentCount !== 1 ? 's' : ''}${isResolved ? ' (resolved)' : ''}`}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        zIndex: isSelected ? 200 : 100,
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: isResolved
            ? 'rgba(34, 197, 94, 0.9)'
            : unresolvedCount > 0
            ? 'rgba(59, 130, 246, 0.9)'
            : 'rgba(100, 116, 139, 0.85)',
          color: '#ffffff',
          borderRadius: 20,
          padding: '4px 10px',
          fontSize: 12,
          fontWeight: 600,
          boxShadow: isSelected
            ? '0 0 0 3px rgba(96, 165, 250, 0.8), 0 4px 12px rgba(0,0,0,0.3)'
            : '0 2px 8px rgba(0,0,0,0.25)',
          whiteSpace: 'nowrap',
          transition: 'box-shadow 0.15s ease, transform 0.15s ease',
        }}
        className="comment-bubble-inner"
      >
        {isResolved ? (
          <Check size={13} strokeWidth={2.5} />
        ) : (
          <MessageSquare size={13} />
        )}
        <span>{commentCount}</span>
      </div>

      {/* Unread indicator dot */}
      {unresolvedCount > 0 && (
        <div
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#f97316',
            border: '2px solid rgba(15,23,42,0.9)',
          }}
        />
      )}

      <style>{`
        .comment-bubble:hover .comment-bubble-inner {
          transform: scale(1.08);
          box-shadow: 0 4px 16px rgba(0,0,0,0.35);
        }
      `}</style>
    </div>
  );
};

export default CommentBubble;
