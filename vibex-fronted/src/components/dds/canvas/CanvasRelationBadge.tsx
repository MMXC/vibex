'use client';

/**
 * CanvasRelationBadge — S78-E5: 画布关系追踪
 *
 * Small icon badge showing relation count for a canvas.
 * Used inside FolderTree to indicate a canvas has relations.
 */
import React, { memo, useState, useRef, useEffect } from 'react';
import styles from './CanvasRelationBadge.module.css';

interface CanvasRelationBadgeProps {
  /** Number of relations for this canvas */
  relationCount: number;
  /** Called when the badge is clicked (e.g., to open relations panel) */
  onClick?: () => void;
  className?: string;
}

export const CanvasRelationBadge = memo(function CanvasRelationBadge({
  relationCount,
  onClick,
  className = '',
}: CanvasRelationBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setShowTooltip(true), 400);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowTooltip(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (relationCount === 0) return null;

  return (
    <span
      className={`${styles.badge} ${styles.hasRelations} ${className}`}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={`${relationCount} 个关系`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      🔗
      <span style={{ fontSize: '9px', marginLeft: '1px' }}>{relationCount}</span>
      {showTooltip && onClick && (
        <span className={styles.tooltip}>查看 {relationCount} 个关系</span>
      )}
    </span>
  );
});
