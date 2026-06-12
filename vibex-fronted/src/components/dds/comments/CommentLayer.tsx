'use client';
/**
 * CommentLayer — floating comment bubbles overlay on the canvas
 * S92-E3: Renders canvas-positioned comment bubbles
 *         Integrates with commentStore for real-time updates
 */
'use client';

import React, { useMemo, useCallback } from 'react';
import { CommentBubble } from './CommentBubble';
import type { CanvasCommentBubble } from '@/types/comment';

interface CommentLayerProps {
  bubbles: CanvasCommentBubble[];
  selectedBubbleId: string | null;
  onBubbleClick: (bubbleId: string) => void;
  canvasScale?: number;
}

export const CommentLayer: React.FC<CommentLayerProps> = ({
  bubbles,
  selectedBubbleId,
  onBubbleClick,
  canvasScale = 1,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
        overflow: 'hidden',
      }}
    >
      {bubbles.map(bubble => (
        <div key={bubble.id} style={{ pointerEvents: 'all', position: 'relative' }}>
          <CommentBubble
            id={bubble.id}
            x={bubble.x}
            y={bubble.y}
            commentCount={bubble.comment_count}
            unresolvedCount={bubble.unresolved_count}
            lastActivity={bubble.last_activity}
            onClick={onBubbleClick}
            isSelected={selectedBubbleId === bubble.id}
          />
        </div>
      ))}
    </div>
  );
};

export default CommentLayer;
