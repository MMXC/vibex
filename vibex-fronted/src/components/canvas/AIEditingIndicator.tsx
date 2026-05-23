/**
 * AIEditingIndicator.tsx — Sprint38 P002-E1
 *
 * Floating indicator showing 🤖 AI editing status.
 * Mounted in the top-right of the canvas.
 *
 * Props:
 *   isActive — whether AI is currently editing
 *   message  — optional status message (e.g. "Thinking...")
 */

'use client';

import React from 'react';

export interface AIEditingIndicatorProps {
  isActive: boolean;
  message?: string;
}

export function AIEditingIndicator({ isActive, message }: AIEditingIndicatorProps) {
  if (!isActive) return null;

  return (
    <div
      role="status"
      aria-label="AI is editing"
      style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
        borderRadius: '9999px',
        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
        fontSize: '13px',
        fontWeight: 600,
        color: '#451a03',
        pointerEvents: 'none',
        userSelect: 'none',
        animation: 'ai-indicator-pulse 2s ease-in-out infinite',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '16px', lineHeight: 1 }}>
        🤖
      </span>
      <span>
        {message ?? 'AI Editing…'}
      </span>
      <style>{`
        @keyframes ai-indicator-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(0.98); }
        }
      `}</style>
    </div>
  );
}
