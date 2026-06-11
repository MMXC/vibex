/**
 * TemplateCard.tsx — S82-E2: Template Gallery UI
 *
 * Individual template card component for the gallery grid.
 * Displays template thumbnail, title, description, category, and tags.
 * Supports click-to-preview and favorite toggle.
 */
'use client';

import React, { useCallback } from 'react';
import type { RequirementTemplate, TemplateCategory } from '@/data/templates';
import { useTemplateStore } from '@/stores/templateStore';
import styles from './TemplateCard.module.css';

interface TemplateCardProps {
  /** Template data */
  template: RequirementTemplate;
  /** Whether this card is selected */
  selected?: boolean;
  /** Click handler for selection/preview */
  onSelect?: (template: RequirementTemplate) => void;
}

/** Category display labels */
const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  saas: 'SaaS',
  ecommerce: '电商',
  fintech: '金融',
  healthcare: '医疗',
  education: '教育',
  social: '社交',
  game: '游戏',
  iot: '物联网',
  enterprise: '企业服务',
  mobile: '移动应用',
  content: '内容平台',
  logistics: '物流',
  restaurant: '餐饮',
  custom: '自定义',
};

/** Category icon emojis */
const CATEGORY_ICONS: Record<TemplateCategory, string> = {
  saas: '☁️',
  ecommerce: '🛒',
  fintech: '💰',
  healthcare: '🏥',
  education: '🎓',
  social: '🌐',
  game: '🎮',
  iot: '📡',
  enterprise: '🏢',
  mobile: '📱',
  content: '📝',
  logistics: '🚚',
  restaurant: '🍽️',
  custom: '✨',
};

export function TemplateCard({ template, selected = false, onSelect }: TemplateCardProps) {
  const toggleFavorite = useTemplateStore((s) => s.toggleFavorite);
  const isFavorite = useTemplateStore((s) => s.isFavorite);

  const handleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleFavorite(template.id);
    },
    [template.id, toggleFavorite]
  );

  const handleClick = useCallback(() => {
    onSelect?.(template);
  }, [template, onSelect]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect?.(template);
      }
    },
    [template, onSelect]
  );

  const favorite = isFavorite(template.id);
  const categoryLabel = CATEGORY_LABELS[template.category] ?? template.category;
  const icon = CATEGORY_ICONS[template.category] ?? '📄';
  const tags = template.tags?.slice(0, 3) ?? [];

  // S88-E3: usage and rating from published template API
  const usageCount = (template as any).usage_count ?? 0;
  const avgRating = (template as any).avg_rating ?? 0;

  return (
    <div
      className={`${styles.card} ${selected ? styles.selected : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${template.name} — ${categoryLabel}`}
      aria-pressed={selected}
    >
      {/* Thumbnail */}
      <div className={styles.thumbnail}>
        {template.icon ? (
          <span className={styles.thumbnailImage} aria-hidden="true">
            {template.icon}
          </span>
        ) : (
          <span className={styles.thumbnailPlaceholder} aria-hidden="true">
            {icon}
          </span>
        )}
      </div>

      {/* Favorite button */}
      <button
        className={styles.favoriteBtn}
        onClick={handleFavorite}
        aria-label={favorite ? '取消收藏' : '收藏模板'}
        title={favorite ? '取消收藏' : '收藏'}
      >
        {favorite ? '❤️' : '🤍'}
      </button>

      {/* Body */}
      <div className={styles.body}>
        <h3 className={styles.title} title={template.displayName ?? template.name}>
          {template.displayName ?? template.name}
        </h3>
        {template.description && (
          <p className={styles.description}>{template.description}</p>
        )}
        {tags.length > 0 && (
          <div className={styles.tags} aria-label="标签">
            {tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer meta */}
      <div className={styles.meta}>
        <span className={styles.category}>{categoryLabel}</span>
        {usageCount > 0 && (
          <span className={styles.usageCount} aria-label={`已使用 ${usageCount} 次`}>
            已使用 {usageCount >= 1000 ? `${(usageCount / 1000).toFixed(1)}k` : usageCount} 次
          </span>
        )}
        {avgRating > 0 && (
          <span className={styles.ratingStars} aria-label={`评分 ${avgRating}`}>
            {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
          </span>
        )}
      </div>
    </div>
  );
}
