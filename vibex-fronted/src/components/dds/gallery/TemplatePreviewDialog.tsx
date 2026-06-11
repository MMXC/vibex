/**
 * TemplatePreviewDialog.tsx — S88-E3: Template Marketplace Enhancement
 *
 * Modal dialog for previewing a template before inserting it into canvas.
 * Displays: thumbnail, name, description, usage count, rating, tags.
 * Provides "Use this template" action button.
 *
 * DoD Checklist:
 * [x] TemplatePreviewDialog renders dialog with template details
 * [x] Displays usage count: "已使用 N 次"
 * [x] Displays star rating: "★★★★☆ (4.2)"
 * [x] Shows tags as chips
 * [x] "Use this template" button calls onInsert
 * [x] Close button / Escape key closes dialog
 * [x] TemplatePreviewDialog.test.tsx — 8 vitest
 */
'use client';

import React, { memo, useCallback, useEffect } from 'react';
import type { RequirementTemplate } from '@/data/templates';
import styles from './TemplatePreviewDialog.module.css';

interface TemplatePreviewDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Template to preview */
  template: RequirementTemplate | null;
  /** Called when user confirms "use this template" */
  onInsert?: (template: RequirementTemplate) => void;
  /** Called when dialog closes */
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
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

/** Render star rating string */
function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <span className={styles.stars} aria-label={`评分 ${rating}`}>
      {'★'.repeat(full)}
      {half === 1 ? '½' : ''}
      {'☆'.repeat(empty)}
      <span className={styles.ratingNum}> ({rating.toFixed(1)})</span>
    </span>
  );
}

export const TemplatePreviewDialog = memo<TemplatePreviewDialogProps>(
  ({ isOpen, template, onInsert, onClose }) => {
    // Close on Escape key
    useEffect(() => {
      if (!isOpen) return;
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    const handleInsert = useCallback(() => {
      if (template) onInsert?.(template);
    }, [template, onInsert]);

    if (!isOpen || !template) return null;

    const usageCount = (template as any).usage_count ?? (template as any).usageCount ?? 0;
    const avgRating = (template as any).avg_rating ?? (template as any).avgRating ?? 0;
    const tags = template.metadata?.tags ?? template.tags ?? [];
    const categoryLabel = CATEGORY_LABELS[template.category] ?? template.category;

    return (
      <div
        className={styles.overlay}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={`${template.displayName ?? template.name} 预览`}
      >
        <div
          className={styles.dialog}
          onClick={(e) => e.stopPropagation()}
          role="document"
        >
          {/* Header */}
          <div className={styles.header}>
            <h2 className={styles.title}>{template.displayName ?? template.name}</h2>
            <button
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="关闭"
              title="关闭"
            >
              ✕
            </button>
          </div>

          {/* Thumbnail */}
          <div className={styles.thumbnail}>
            {template.icon ? (
              <span className={styles.thumbnailIcon} aria-hidden="true">
                {template.icon}
              </span>
            ) : (
              <span className={styles.thumbnailPlaceholder} aria-hidden="true">
                📋
              </span>
            )}
          </div>

          {/* Body */}
          <div className={styles.body}>
            <p className={styles.description}>{template.description}</p>

            {/* Meta row */}
            <div className={styles.meta}>
              <span className={styles.category}>{categoryLabel}</span>
              <span className={styles.usage}>
                已使用 {typeof usageCount === 'number' ? usageCount.toLocaleString() : usageCount} 次
              </span>
              {avgRating > 0 && (
                <span className={styles.rating}>
                  <StarRating rating={avgRating} />
                </span>
              )}
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className={styles.tags} aria-label="模板标签">
                {tags.map((tag: string) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <button className={styles.cancelBtn} onClick={onClose}>
              取消
            </button>
            <button className={styles.insertBtn} onClick={handleInsert}>
              使用此模板
            </button>
          </div>
        </div>
      </div>
    );
  }
);

TemplatePreviewDialog.displayName = 'TemplatePreviewDialog';
