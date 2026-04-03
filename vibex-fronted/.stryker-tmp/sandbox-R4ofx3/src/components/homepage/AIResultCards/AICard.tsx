/**
 * AICard - 单个 AI 结果卡片组件
 * 
 * Epic 7: AI 展示区
 * 
 * Features:
 * - Displays AI result with title, icon, content, mermaid preview, confidence
 * - Click to expand/collapse (ST-7.3: 卡片点击展开详情)
 * - Confidence indicator
 * - Mermaid code preview (collapsed)
 * - Smooth expand/collapse animation
 * 
 * States:
 * - Default: Shows summary
 * - Loading: Shows skeleton
 * - Expanded: Shows full content
 * - Selected: Highlighted border
 */
// @ts-nocheck


'use client';

import React, { useState } from 'react';
import type { AIResult } from '../hooks/useSSEStream';
import styles from './AICard.module.css';

export interface AICardProps {
  /** 卡片类型 */
  type: AIResult['type'];
  /** AI 结果数据 */
  result?: AIResult;
  /** 卡片元数据 */
  meta: {
    title: string;
    icon: string;
    description: string;
  };
  /** 是否选中 */
  isSelected?: boolean;
  /** 是否加载中 */
  isLoading?: boolean;
  /** 点击回调 */
  onClick?: () => void;
}

/** 置信度颜色 */
const CONFIDENCE_COLORS: Record<string, string> = {
  high: '#10b981',   // ≥0.8
  medium: '#f59e0b', // ≥0.6
  low: '#ef4444',    // <0.6
};

function getConfidenceLevel(confidence: number): string {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.6) return 'medium';
  return 'low';
}

export const AICard: React.FC<AICardProps> = ({
  type,
  result,
  meta,
  isSelected = false,
  isLoading = false,
  onClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasResult = Boolean(result?.content || result?.mermaidCode);
  const confidence = result?.confidence ?? 0.8;
  const confidenceLevel = getConfidenceLevel(confidence);

  const handleClick = () => {
    if (!hasResult && !isLoading) return;
    setIsExpanded(prev => !prev);
    onClick?.();
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className={styles.card}
        data-testid={`ai-card-${type}`}
        data-type={type}
        data-state="loading"
      >
        <div className={styles.skeleton}>
          <div className={styles.skeletonIcon} />
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonText} />
          <div className={styles.skeletonTextShort} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        styles.card,
        isSelected ? styles.selected : '',
        isExpanded ? styles.expanded : '',
        !hasResult ? styles.empty : '',
      ].filter(Boolean).join(' ')}
      data-testid={`ai-card-${type}`}
      data-type={type}
      data-state={isExpanded ? 'expanded' : 'collapsed'}
      data-selected={isSelected}
      onClick={handleClick}
      role="button"
      tabIndex={hasResult ? 0 : -1}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-expanded={isExpanded}
      aria-label={`${meta.title}卡片${isExpanded ? '，点击收起' : '，点击展开'}`}
    >
      {/* Card Header */}
      <div className={styles.header}>
        <span className={styles.icon}>{meta.icon}</span>
        <div className={styles.headerText}>
          <h4 className={styles.title}>{meta.title}</h4>
          {hasResult && (
            <span
              className={styles.confidence}
              style={{ color: CONFIDENCE_COLORS[confidenceLevel] }}
              title={`置信度: ${(confidence * 100).toFixed(0)}%`}
              data-testid={`card-confidence-${type}`}
            >
              {(confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>
        {/* Expand indicator */}
        {hasResult && (
          <span className={[styles.expandIcon, isExpanded ? styles.expanded : ''].filter(Boolean).join(' ')}>
            ▼
          </span>
        )}
      </div>

      {/* Card Content */}
      <div className={styles.content}>
        {hasResult ? (
          <>
            {/* Summary (always visible) */}
            <p
              className={styles.summary}
              data-testid={`card-summary-${type}`}
            >
              {result!.content?.slice(0, 120)}
              {(result!.content?.length ?? 0) > 120 && !isExpanded && '...'}
            </p>

            {/* Expanded Content (ST-7.3) */}
            {isExpanded && (
              <div
                className={styles.expandedContent}
                data-testid={`card-expanded-${type}`}
              >
                {/* Full content */}
                <div className={styles.fullContent}>
                  {result!.content}
                </div>

                {/* Mermaid code preview */}
                {result!.mermaidCode && (
                  <div className={styles.mermaidPreview}>
                    <span className={styles.mermaidLabel}>Mermaid</span>
                    <pre className={styles.mermaidCode}>
                      <code>{result!.mermaidCode}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <p className={styles.emptyText}>
            暂无数据
          </p>
        )}
      </div>
    </div>
  );
};

export default AICard;
