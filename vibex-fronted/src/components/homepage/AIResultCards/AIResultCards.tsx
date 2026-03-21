/**
 * AIResultCards - AI 结果三列卡片展示区
 * 
 * Epic 7: AI 展示区
 * 
 * Features:
 * - Three-column card layout (Context, Model, Flow)
 * - Cards are clickable to expand details
 * - Synced with PreviewArea (R-4: 卡片内容与预览区同步)
 * - Shows content, mermaid preview, and confidence
 * 
 * Layout: 3 columns (architecture.md: "AI[AIResultCards 三列卡片]")
 * Card types: Context Card, Model Card, Flow Card
 * 
 * Red lines:
 * - R-4: 卡片内容与预览区同步
 */

'use client';

import React from 'react';
import type { AIResult } from '../hooks/useSSEStream';
import { AICard } from './AICard';
import styles from './AIResultCards.module.css';

export interface AIResultCardsProps {
  /** AI 结果列表 */
  results?: AIResult[];
  /** 限界上下文结果 */
  contextResult?: AIResult;
  /** 领域模型结果 */
  modelResult?: AIResult;
  /** 业务流程结果 */
  flowResult?: AIResult;
  /** 卡片点击回调 */
  onCardClick?: (type: AIResult['type']) => void;
  /** 当前选中的卡片类型 */
  selectedType?: AIResult['type'] | null;
  /** 是否加载中 */
  isLoading?: boolean;
  /** 自定义类名 */
  className?: string;
}

/** 卡片元数据 */
const CARD_META: Record<AIResult['type'], { title: string; icon: string; description: string }> = {
  context: {
    title: '限界上下文',
    icon: '🔵',
    description: '定义系统边界和核心领域',
  },
  model: {
    title: '领域模型',
    icon: '🟡',
    description: '实体、聚合根和值对象',
  },
  flow: {
    title: '业务流程',
    icon: '🟢',
    description: '业务活动和流程步骤',
  },
  components: {
    title: 'UI 组件',
    icon: '🟣',
    description: '页面结构和组件关系',
  },
};

export const AIResultCards: React.FC<AIResultCardsProps> = ({
  results = [],
  contextResult,
  modelResult,
  flowResult,
  onCardClick,
  selectedType,
  isLoading = false,
  className,
}) => {
  // Build results array from individual props (R-4: 同步)
  const activeResults: AIResult[] = results.length > 0
    ? results
    : [contextResult, modelResult, flowResult].filter(Boolean) as AIResult[];

  // If no results, show placeholder cards
  const showPlaceholders = activeResults.length === 0 && !isLoading;

  return (
    <div
      className={[styles.container, className].filter(Boolean).join(' ')}
      data-testid="ai-result-cards"
      data-card-count={activeResults.length}
      data-is-loading={isLoading}
    >
      {/* Section Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>AI 分析结果</h3>
        {isLoading && (
          <span className={styles.loadingBadge} data-testid="cards-loading-badge">
            分析中...
          </span>
        )}
      </div>

      {/* Cards Grid - Three Columns (ST-7.1: 三列卡片布局) */}
      <div
        className={styles.cardsGrid}
        data-testid="cards-grid"
        data-columns={activeResults.length > 0 ? Math.min(activeResults.length, 3) : 3}
      >
        {/* Context Card */}
        <AICard
          type="context"
          result={results.find(r => r.type === 'context') || contextResult}
          meta={CARD_META.context}
          isSelected={selectedType === 'context'}
          isLoading={isLoading}
          onClick={() => onCardClick?.('context')}
        />

        {/* Model Card */}
        <AICard
          type="model"
          result={results.find(r => r.type === 'model') || modelResult}
          meta={CARD_META.model}
          isSelected={selectedType === 'model'}
          isLoading={isLoading}
          onClick={() => onCardClick?.('model')}
        />

        {/* Flow Card */}
        <AICard
          type="flow"
          result={results.find(r => r.type === 'flow') || flowResult}
          meta={CARD_META.flow}
          isSelected={selectedType === 'flow'}
          isLoading={isLoading}
          onClick={() => onCardClick?.('flow')}
        />
      </div>

      {/* Placeholder State */}
      {showPlaceholders && (
        <div className={styles.placeholder} data-testid="cards-placeholder">
          <span className={styles.placeholderIcon}>📊</span>
          <p>输入需求后，AI 分析结果将显示在这里</p>
        </div>
      )}
    </div>
  );
};

export default AIResultCards;
