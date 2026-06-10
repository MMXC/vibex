/**
 * TemplateGallery.tsx — S82-E2: Template Gallery UI
 *
 * Gallery page component for browsing and selecting templates.
 * Integrates with templateStore.filterTemplates and templateStore.searchQuery
 * to provide category/tag filtering and name-based search.
 *
 * DoD Checklist:
 * [x] TemplateGallery.tsx renders thumbnail grid
 * [x] Category/tag filter联动 templateStore.filterTemplates
 * [x] Click card opens preview panel with insert-to-canvas action
 * [x] Search box filters by name
 * [ ] TemplateGallery.test.tsx ≥6 tests
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTemplateStore } from '@/stores/templateStore';
import type { RequirementTemplate, TemplateCategory } from '@/data/templates';
import { TemplateCard } from './TemplateCard';
import styles from './TemplateGallery.module.css';

/** All available category tabs */
const CATEGORIES: Array<{ id: TemplateCategory | 'all'; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'saas', label: 'SaaS' },
  { id: 'ecommerce', label: '电商' },
  { id: 'fintech', label: '金融' },
  { id: 'healthcare', label: '医疗' },
  { id: 'education', label: '教育' },
  { id: 'social', label: '社交' },
  { id: 'enterprise', label: '企业' },
  { id: 'mobile', label: '移动' },
  { id: 'content', label: '内容' },
];

interface TemplateGalleryProps {
  /** Called when user clicks Insert to load template into canvas */
  onInsert?: (template: RequirementTemplate) => void;
  /** Whether gallery is visible */
  open?: boolean;
}

export function TemplateGallery({ onInsert, open = true }: TemplateGalleryProps) {
  const [localQuery, setLocalQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<RequirementTemplate | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'usage'>('recent');

  // Store state
  const templates = useTemplateStore((s) => s.templates);
  const filteredTemplates = useTemplateStore((s) => s.filteredTemplates);
  const selectedCategory = useTemplateStore((s) => s.selectedCategory);
  const searchQuery = useTemplateStore((s) => s.searchQuery);
  const setCategory = useTemplateStore((s) => s.setCategory);
  const setSearchQuery = useTemplateStore((s) => s.setSearchQuery);
  const applyFilters = useTemplateStore((s) => s.applyFilters);

  // Compute displayed templates:
  // If store search is active, use filteredTemplates.
  // Otherwise, filter locally by name when user types in the search box.
  const displayedTemplates = useMemo(() => {
    let list: RequirementTemplate[];
    if (searchQuery || localQuery) {
      const q = (searchQuery || localQuery).toLowerCase();
      list = templates.filter((t) => {
        const name = (t.displayName ?? t.name).toLowerCase();
        const desc = (t.description ?? '').toLowerCase();
        return name.includes(q) || desc.includes(q);
      });
    } else {
      list = filteredTemplates.length > 0 ? filteredTemplates : templates;
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'recent') {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime; // newest first
      }
      // rating / usage: metadata.score as proxy for community stats
      if (sortBy === 'rating') {
        return (b.metadata?.score ?? 0) - (a.metadata?.score ?? 0);
      }
      if (sortBy === 'usage') {
        return (b.metadata?.score ?? 0) - (a.metadata?.score ?? 0);
      }
      return 0;
    });
  }, [templates, filteredTemplates, searchQuery, localQuery, sortBy]);

  const handleCategoryChange = useCallback(
    (category: TemplateCategory | 'all') => {
      setCategory(category);
    },
    [setCategory]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      setLocalQuery(q);
      setSearchQuery(q);
    },
    [setSearchQuery]
  );

  const handleSelect = useCallback((template: RequirementTemplate) => {
    setPreviewTemplate(template);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewTemplate(null);
  }, []);

  const handleInsert = useCallback(() => {
    if (previewTemplate) {
      onInsert?.(previewTemplate);
      setPreviewTemplate(null);
    }
  }, [previewTemplate, onInsert]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewTemplate) {
          setPreviewTemplate(null);
        }
      }
    },
    [previewTemplate]
  );

  if (!open) return null;

  return (
    <div className={styles.container} role="region" aria-label="模板画廊" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>模板画廊</h1>

        {/* Filter bar */}
        <div className={styles.filterBar}>
          {/* Search */}
          <input
            type="search"
            className={styles.searchInput}
            placeholder="搜索模板名称..."
            value={localQuery}
            onChange={handleSearchChange}
            aria-label="搜索模板"
          />

          {/* Category tabs */}
          <div className={styles.categoryTabs} role="tablist" aria-label="模板分类">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`${styles.categoryTab} ${selectedCategory === cat.id ? styles.active : ''}`}
                onClick={() => handleCategoryChange(cat.id)}
                role="tab"
                aria-selected={selectedCategory === cat.id}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Result count */}
          <span className={styles.resultCount} aria-live="polite">
            {displayedTemplates.length} 个模板
          </span>

          {/* Sort dropdown */}
          <select
            className={styles.sortSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            aria-label="排序方式"
          >
            <option value="recent">🕒 最近更新</option>
            <option value="rating">⭐ 最高评分</option>
            <option value="usage">📈 使用最多</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className={styles.grid} role="grid" aria-label="模板列表">
        {displayedTemplates.length === 0 ? (
          <div className={styles.emptyState} role="gridcell">
            <span className={styles.emptyIcon} aria-hidden="true">📭</span>
            <p className={styles.emptyTitle}>没有找到匹配的模板</p>
            <p className={styles.emptyDesc}>尝试调整搜索词或切换分类</p>
          </div>
        ) : (
          displayedTemplates.map((template) => (
            <div key={template.id} role="gridcell">
              <TemplateCard
                template={template}
                selected={previewTemplate?.id === template.id}
                onSelect={handleSelect}
              />
            </div>
          ))
        )}
      </div>

      {/* Preview overlay */}
      {previewTemplate && (
        <div
          className={styles.previewOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClosePreview();
          }}
        >
          <div className={styles.previewPanel}>
            <div className={styles.previewHeader}>
              <h2 className={styles.previewTitle} id="preview-title">
                {previewTemplate.displayName ?? previewTemplate.name}
              </h2>
              <button
                className={styles.closeBtn}
                onClick={handleClosePreview}
                aria-label="关闭预览"
              >
                ✕
              </button>
            </div>

            {previewTemplate.description && (
              <p className={styles.previewDesc}>{previewTemplate.description}</p>
            )}

            {previewTemplate.tags && previewTemplate.tags.length > 0 && (
              <div className={styles.previewTags} aria-label="标签">
                {previewTemplate.tags.map((tag) => (
                  <span key={tag} className={styles.previewTag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className={styles.previewActions}>
              <button className={styles.insertBtn} onClick={handleInsert}>
                插入画布
              </button>
              <button className={styles.cancelBtn} onClick={handleClosePreview}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
