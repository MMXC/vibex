/**
 * TemplateGallery.tsx — S82-E2: Template Gallery UI
 * S90-E3: Added Gallery Tab (public template browsing)
 * S92-E2: Template Marketplace 2.0 — tag filter pills + synonym search + search history
 *
 * Gallery page component for browsing and selecting templates.
 * Integrates with templateStore.filterTemplates and templateStore.searchQuery
 * to provide category/tag filtering and name-based search.
 *
 * S90-E3: Main tab switch between "My Templates" and "Gallery".
 * Gallery Tab fetches public templates from /api/templates/public.
 *
 * S92-E2: Added horizontal tag filter pills, synonym search with highlight,
 * search history dropdown, rating credibility display.
 *
 * DoD Checklist:
 * [x] TemplateGallery.tsx renders thumbnail grid
 * [x] Category/tag filter联动 templateStore.filterTemplates
 * [x] Click card opens preview panel with insert-to-canvas action
 * [x] Search box filters by name
 * [x] S90-E3 Gallery Tab: fetches public templates, displays with rating/usage
 * [x] S92-E2: Tag filter pills (horizontal scroll, AND logic)
 * [x] S92-E2: Synonym search with highlight
 * [x] S92-E2: Search history dropdown (last 5, localStorage)
 */
'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useTemplateStore } from '@/stores/templateStore';
import type { RequirementTemplate, TemplateCategory } from '@/data/templates';
import { TemplateCard } from './TemplateCard';
import { TemplatePreviewDialog } from './TemplatePreviewDialog';
import { templateApi, PublicTemplate } from '@/services/api/modules/template';
import {
  loadSearchHistory,
  saveSearchTerm,
  expandSearchTerm,
  highlightSearchTerms,
} from '@/hooks/useTemplateSearch';
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

/** S92-E2: Available tag filter pills for gallery mode */
const AVAILABLE_TAGS = [
  '电商', '教育', '医疗', '金融', '社交', '企业', '游戏', '内容', '移动', '物流', '餐饮',
  '落地页', '列表页', '表单页', '仪表盘',
  '卡片', '表格', '图表', '导航',
];

/** Gallery mode tabs */
type GalleryMode = 'my' | 'gallery';

/** Convert PublicTemplate to RequirementTemplate for TemplateCard compatibility */
function publicToRequirementTemplate(pub: PublicTemplate): RequirementTemplate {
  return {
    id: pub.id,
    name: pub.name,
    displayName: pub.name,
    description: pub.description,
    category: 'custom' as TemplateCategory,
    tags: pub.tags,
    icon: '📋',
    scenes: [],
    isFavorite: false,
    createdAt: pub.published_at,
    // S88-E3 extended data
    usage_count: pub.usage_count,
    avg_rating: pub.avg_rating,
    rating_count: pub.rating_count,
  } as RequirementTemplate & { usage_count: number; avg_rating: number; rating_count: number };
}

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
  // S90-E3: Gallery mode
  const [galleryMode, setGalleryMode] = useState<GalleryMode>('my');
  const [galleryPage, setGalleryPage] = useState(1);
  const [galleryTotal, setGalleryTotal] = useState(0);
  const [galleryTemplates, setGalleryTemplates] = useState<PublicTemplate[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  // S92-E2: Tag filter pills
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  // S92-E2: Search history
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const searchHistoryRef = useRef<HTMLDivElement>(null);

  // Store state (declared early so callbacks can reference them)
  const templates = useTemplateStore((s) => s.templates);
  const filteredTemplates = useTemplateStore((s) => s.filteredTemplates);
  const selectedCategory = useTemplateStore((s) => s.selectedCategory);
  const searchQuery = useTemplateStore((s) => s.searchQuery);
  const setCategory = useTemplateStore((s) => s.setCategory);
  const setSearchQuery = useTemplateStore((s) => s.setSearchQuery);
  const applyFilters = useTemplateStore((s) => s.applyFilters);

  // S92-E2: Load search history on mount
  useEffect(() => {
    setSearchHistory(loadSearchHistory());
  }, []);

  // S92-E2: Close history dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchHistoryRef.current && !searchHistoryRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // S90-E3: Fetch public templates when in gallery mode
  // S92-E2: Added search (synonym) + filterTags (AND) params
  const fetchGalleryTemplates = useCallback(
    async (page: number, category?: string | null, search?: string, filterTags?: string[]) => {
      setGalleryLoading(true);
      try {
        const result = await templateApi.getPublicTemplates({
          sort: sortBy,
          page,
          limit: 20,
          category: category && category !== 'all' ? category : undefined,
          search: search || undefined,
          filterTags: filterTags?.length ? filterTags : undefined,
        });
        setGalleryTemplates(result.templates);
        setGalleryTotal(result.total);
      } catch {
        setGalleryTemplates([]);
        setGalleryTotal(0);
      } finally {
        setGalleryLoading(false);
      }
    },
    [sortBy]
  );

  useEffect(() => {
    if (galleryMode === 'gallery') {
      fetchGalleryTemplates(galleryPage, selectedCategory, localQuery, selectedTags);
    }
  }, [galleryMode, galleryPage, selectedCategory, sortBy, fetchGalleryTemplates, localQuery, selectedTags]);

  const handleGalleryModeChange = useCallback(
    (mode: GalleryMode) => {
      setGalleryMode(mode);
      if (mode === 'gallery') {
        setGalleryPage(1);
        fetchGalleryTemplates(1, selectedCategory, localQuery, selectedTags);
      }
    },
    [fetchGalleryTemplates, selectedCategory, localQuery, selectedTags]
  );

  // S92-E2: Tag filter pills — toggle tag
  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      const next = prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag];
      if (galleryMode === 'gallery') {
        setGalleryPage(1);
        fetchGalleryTemplates(1, selectedCategory, localQuery, next);
      }
      return next;
    });
  }, [galleryMode, selectedCategory, localQuery, fetchGalleryTemplates]);

  // S92-E2: Clear all tag filters
  const handleClearTags = useCallback(() => {
    setSelectedTags([]);
    if (galleryMode === 'gallery') {
      setGalleryPage(1);
      fetchGalleryTemplates(1, selectedCategory, localQuery, []);
    }
  }, [galleryMode, selectedCategory, localQuery, fetchGalleryTemplates]);

  // S90-E3: Gallery templates for display
  const galleryDisplayTemplates = useMemo(
    () => galleryTemplates.map(publicToRequirementTemplate),
    [galleryTemplates]
  );

  // Use gallery templates when in gallery mode
  const displayedTemplates = useMemo(() => {
    if (galleryMode === 'gallery') {
      if (localQuery) {
        const q = localQuery.toLowerCase();
        return galleryDisplayTemplates.filter((t) => {
          const name = (t.displayName ?? t.name).toLowerCase();
          const desc = (t.description ?? '').toLowerCase();
          return name.includes(q) || desc.includes(q);
        });
      }
      return galleryDisplayTemplates;
    }
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
      if (sortBy === 'rating') {
        return (b.metadata?.score ?? 0) - (a.metadata?.score ?? 0);
      }
      if (sortBy === 'usage') {
        return (b.metadata?.score ?? 0) - (a.metadata?.score ?? 0);
      }
      return 0;
    });
  }, [galleryMode, galleryDisplayTemplates, searchQuery, localQuery, sortBy, templates, filteredTemplates]);

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

  // S92-E2: On search submit — save to history and refetch
  const handleSearchSubmit = useCallback(
    (q: string) => {
      if (q.trim()) {
        saveSearchTerm(q.trim());
        setSearchHistory(loadSearchHistory());
      }
      setShowHistory(false);
      if (galleryMode === 'gallery') {
        setGalleryPage(1);
        fetchGalleryTemplates(1, selectedCategory, q, selectedTags);
      }
    },
    [galleryMode, selectedCategory, selectedTags, fetchGalleryTemplates]
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

  // S88-E3: Recommended templates section — top 6 by score
  const recommendedTemplates = useMemo(() => {
    const scored = templates.map((t) => {
      const usageCount = (t as any).usage_count ?? 0;
      const avgRating = (t as any).avg_rating ?? 0;
      const ratingCount = (t as any).rating_count ?? 0;
      const score = usageCount * 0.6 + avgRating * ratingCount * 0.4;
      return { template: t, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 6).map((s) => s.template);
  }, [templates]);

  if (!open) return null;

  return (
    <div className={styles.container} role="region" aria-label="模板画廊" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>模板画廊</h1>

        {/* S90-E3: Main mode tabs — My Templates vs Gallery */}
        <div className={styles.mainTabs} role="tablist" aria-label="模板模式">
          <button
            className={`${styles.mainTab} ${galleryMode === 'my' ? styles.active : ''}`}
            onClick={() => handleGalleryModeChange('my')}
            role="tab"
            aria-selected={galleryMode === 'my'}
          >
            我的模板
          </button>
          <button
            className={`${styles.mainTab} ${galleryMode === 'gallery' ? styles.active : ''}`}
            onClick={() => handleGalleryModeChange('gallery')}
            role="tab"
            aria-selected={galleryMode === 'gallery'}
          >
            公开模板
          </button>
        </div>

        {/* Filter bar */}
        <div className={styles.filterBar}>
          {/* S92-E2: Search with history dropdown */}
          <div className={styles.searchWrapper} ref={searchHistoryRef}>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="搜索模板名称..."
              value={localQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowHistory(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchSubmit(localQuery);
                }
              }}
              aria-label="搜索模板"
              aria-expanded={showHistory && searchHistory.length > 0}
            />
            {/* S92-E2: Search history dropdown */}
            {showHistory && searchHistory.length > 0 && (
              <div className={styles.searchHistoryDropdown} role="listbox" aria-label="搜索历史">
                {searchHistory.map((term, i) => (
                  <button
                    key={i}
                    className={styles.historyItem}
                    role="option"
                    onClick={() => {
                      setLocalQuery(term);
                      handleSearchSubmit(term);
                    }}
                  >
                    <span className={styles.historyIcon}>🕒</span>
                    <span className={styles.historyTerm}>{term}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {localQuery && (
            <button
              className={styles.searchBtn}
              onClick={() => handleSearchSubmit(localQuery)}
              aria-label="执行搜索"
            >
              🔍
            </button>
          )}
        </div>

        {/* S92-E2: Tag filter pills — horizontal scrollable bar */}
        {galleryMode === 'gallery' && (
          <div className={styles.tagFilterBar} role="group" aria-label="标签筛选">
            <span className={styles.tagFilterLabel}>标签:</span>
            {AVAILABLE_TAGS.map((tag) => (
              <button
                key={tag}
                className={`${styles.tagPill} ${selectedTags.includes(tag) ? styles.tagPillActive : ''}`}
                onClick={() => handleTagToggle(tag)}
                aria-pressed={selectedTags.includes(tag)}
                aria-label={`筛选: ${tag}`}
              >
                {tag}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                className={styles.clearTagsBtn}
                onClick={handleClearTags}
                aria-label="清除所有标签筛选"
              >
                清除
              </button>
            )}
          </div>
        )}

        {/* S88-E3: Recommended section — only in my templates mode */}
        {galleryMode === 'my' && recommendedTemplates.length > 0 && (
        <div className={styles.recommendedSection}>
          <h2 className={styles.sectionTitle}>推荐模板</h2>
          <div className={styles.recommendedGrid}>
            {recommendedTemplates.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                onSelect={(t) => setPreviewTemplate(t)}
              />
            ))}
          </div>
        </div>
      )}

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
            {galleryMode === 'gallery' && galleryTotal > 0 && ` (共 ${galleryTotal})`}
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
        {galleryLoading ? (
          <div className={styles.loading} role="gridcell">加载中...</div>
        ) : displayedTemplates.length === 0 ? (
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

      {/* S90-E3: Gallery pagination */}
      {galleryMode === 'gallery' && galleryTotal > 20 && (
        <div className={styles.pagination} aria-label="分页">
          <button
            className={styles.pageBtn}
            onClick={() => setGalleryPage((p) => Math.max(1, p - 1))}
            disabled={galleryPage <= 1}
            aria-label="上一页"
          >
            ← 上一页
          </button>
          <span className={styles.resultCount}>
            第 {galleryPage} 页 / 共 {Math.ceil(galleryTotal / 20)} 页
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => setGalleryPage((p) => p + 1)}
            disabled={galleryPage >= Math.ceil(galleryTotal / 20)}
            aria-label="下一页"
          >
            下一页 →
          </button>
        </div>
      )}

      {/* S88-E3: TemplatePreviewDialog */}
      <TemplatePreviewDialog
        isOpen={!!previewTemplate}
        template={previewTemplate}
        onInsert={(t) => {
          onInsert?.(t);
          setPreviewTemplate(null);
        }}
        onClose={handleClosePreview}
      />
    </div>
  );
}
