/**
 * TemplateMarketplacePanel.tsx — Template Marketplace Discovery Panel
 * Sprint70 E2: 模板市场发现与浏览
 * Sprint71 E5: 模板评分与收藏增强 — 评分星标 + 收藏按钮 + 排序选择器
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTemplateStore } from '@/stores/templateStore';
import styles from './TemplateMarketplacePanel.module.css';

interface TemplateMarketplacePanelProps {
  onTemplateSelect: (templateId: string) => void;
  onClose?: () => void;
  userId?: string;
}

const MARKETPLACE_TAGS = [
  { label: '电商', value: 'ecommerce', color: '#10b981' },
  { label: '社交', value: 'social', color: '#ec4899' },
  { label: '教育', value: 'education', color: '#8b5cf6' },
  { label: '金融', value: 'fintech', color: '#f59e0b' },
  { label: '医疗', value: 'healthcare', color: '#ef4444' },
  { label: '内容', value: 'content', color: '#06b6d4' },
  { label: '游戏', value: 'game', color: '#14b8a6' },
  { label: 'IoT', value: 'iot', color: '#6366f1' },
  { label: '企业', value: 'enterprise', color: '#64748b' },
  { label: '移动', value: 'mobile', color: '#f97316' },
];

const TAG_COLORS: Record<string, string> = {
  ecommerce: '#10b981', social: '#ec4899', education: '#8b5cf6',
  fintech: '#f59e0b', healthcare: '#ef4444', content: '#06b6d4',
  game: '#14b8a6', iot: '#6366f1', enterprise: '#64748b',
  mobile: '#f97316', flowchart: '#3b82f6', mindmap: '#8b5cf6',
  uml: '#f59e0b', other: '#6b7280',
};

type SortMode = 'score' | 'usage' | 'recent';

export function TemplateMarketplacePanel({ onTemplateSelect, onClose, userId = 'user-1' }: TemplateMarketplacePanelProps) {
  const templateStore = useTemplateStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [applying, setApplying] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('score');
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const featuredTemplates = useMemo(() => templateStore.featuredTemplates(8), [templateStore]);

  const sortedTemplates = useMemo(() => {
    const all = templateStore.getMarketplaceTemplates();
    switch (sortMode) {
      case 'score':
        return [...all].sort((a, b) => {
          const statsA = templateStore.getTemplateStats(a.id);
          const statsB = templateStore.getTemplateStats(b.id);
          return statsB.avgRating - statsA.avgRating;
        });
      case 'usage':
        return templateStore.getTopRatedTemplates(20);
      case 'recent':
        return [...all].sort((a, b) => {
          const uA = templateStore.stats.usageCount[a.id] ?? 0;
          const uB = templateStore.stats.usageCount[b.id] ?? 0;
          return uB - uA;
        });
      default:
        return all;
    }
  }, [templateStore, sortMode]);

  const searchResults = useMemo(() => {
    if (!searchQuery && selectedTags.length === 0) return sortedTemplates;
    return templateStore.searchMarketplace(searchQuery, selectedTags.length > 0 ? selectedTags : undefined);
  }, [templateStore, searchQuery, selectedTags, sortedTemplates]);

  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }, []);

  const handleTemplateApply = useCallback(async (templateId: string) => {
    setApplying(templateId);
    try { onTemplateSelect(templateId); } finally { setApplying(null); }
  }, [onTemplateSelect]);

  const handleRate = useCallback((templateId: string, rating: number) => {
    templateStore.rateTemplate(templateId, rating);
  }, [templateStore]);

  const handleToggleFavorite = useCallback((templateId: string) => {
    templateStore.toggleFavorite(templateId);
  }, [templateStore]);

  const usageCount = templateStore.stats.usageCount;

  return (
    <div className={styles.panel} data-testid="marketplace-panel">
      <div className={styles.header}>
        <h3 className={styles.title}>🛒 发现模板市场</h3>
        {onClose && (
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="关闭">✕</button>
        )}
      </div>

      <div className={styles.searchRow}>
        <input type="search" className={styles.searchInput} placeholder="搜索市场模板..."
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="搜索市场模板" role="searchbox" />
      </div>

      {/* E5: Sort selector */}
      <div className={styles.sortRow} role="group" aria-label="排序方式">
        {([
          { value: 'score', label: '⭐ 评分最高' },
          { value: 'usage', label: '🔥 使用最多' },
          { value: 'recent', label: '📅 最近使用' },
        ] as { value: SortMode; label: string }[]).map(({ value, label }) => (
          <button key={value} type="button"
            className={`${styles.sortBtn} ${sortMode === value ? styles.sortBtnActive : ''}`}
            onClick={() => setSortMode(value)} aria-pressed={sortMode === value}>
            {label}
          </button>
        ))}
      </div>

      <div className={styles.tagCloud} role="group" aria-label="标签筛选">
        {MARKETPLACE_TAGS.map(({ label, value, color }) => {
          const active = selectedTags.includes(value);
          return (
            <button key={value} type="button"
              className={`${styles.tagChip} ${active ? styles.tagChipActive : ''}`}
              style={active ? { backgroundColor: `${color}22`, color, borderColor: color } : {}}
              onClick={() => handleTagToggle(value)} aria-pressed={active}>
              {label}
            </button>
          );
        })}
        {selectedTags.length > 0 && (
          <button type="button" className={styles.clearBtn} onClick={() => setSelectedTags([])}>清除</button>
        )}
      </div>

      {!searchQuery && selectedTags.length === 0 && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>🔥 热门模板</h4>
          <div className={styles.featuredGrid} data-testid="featured-templates">
            {featuredTemplates.map((t) => (
              <TemplateMarketplaceCard key={t.id} template={t} usageCount={usageCount[t.id]}
                isApplying={applying === t.id} onApply={handleTemplateApply} userId={userId}
                onRate={handleRate} onToggleFavorite={handleToggleFavorite}
                hoveredStar={hoveredStar} onHoverStar={setHoveredStar} />
            ))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>
          {searchQuery || selectedTags.length > 0 ? `搜索结果 (${searchResults.length})` : '所有模板'}
        </h4>
        {searchResults.length === 0 ? (
          <p className={styles.empty}>没有找到匹配的模板</p>
        ) : (
          <div className={styles.grid} data-testid="template-grid">
            {searchResults.map((t) => (
              <TemplateMarketplaceCard key={t.id} template={t} usageCount={usageCount[t.id]}
                isApplying={applying === t.id} onApply={handleTemplateApply} userId={userId}
                onRate={handleRate} onToggleFavorite={handleToggleFavorite}
                hoveredStar={hoveredStar} onHoverStar={setHoveredStar} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

interface MarketplaceCardProps {
  template: {
    id: string; name: string; displayName?: string; description: string;
    category?: string; icon?: string; tags?: string[];
    metadata?: { tags?: string[] }; content?: string;
  };
  usageCount?: number;
  isApplying: boolean;
  onApply: (id: string) => void;
  userId?: string;
  onRate?: (id: string, rating: number) => void;
  onToggleFavorite?: (id: string) => void;
  hoveredStar?: number | null;
  onHoverStar?: (n: number | null) => void;
}

function TemplateMarketplaceCard({
  template, usageCount, isApplying, onApply,
  userId = 'user-1', onRate, onToggleFavorite, hoveredStar, onHoverStar,
}: MarketplaceCardProps) {
  const templateTags: string[] = template.metadata?.tags ?? template.tags ?? [];
  const displayName = template.displayName ?? template.name;
  const author = 'VibeX 社区';
  const templateStore = useTemplateStore();
  const stats = templateStore.getTemplateStats(template.id);
  const avgRating = stats.avgRating;
  const ratingCount = stats.ratingCount;
  const isFavorite = templateStore.isFavorite(template.id);
  const displayRating = hoveredStar !== null ? hoveredStar : Math.round(avgRating);

  return (
    <div
      className={`${styles.card} ${isApplying ? styles.cardDisabled : ''}`}
      onClick={() => !isApplying && onApply(template.id)}
      role="button" tabIndex={0}
      data-testid="template-card"
      aria-label={`应用模板: ${displayName}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onApply(template.id); } }}
    >
      <span className={styles.cardIcon}>{template.icon ?? '📋'}</span>
      <div className={styles.cardMeta}>
        <span className={styles.cardName}>{displayName}</span>
        <span className={styles.cardDesc}>{template.description}</span>
      </div>

      {/* E5: Rating + Favorite row */}
      <div className={styles.ratingRow}>
        {onRate && (
          <div className={styles.starRow} role="img"
            aria-label={`当前评分 ${avgRating.toFixed(1)}，共 ${ratingCount} 人评分`}
            data-testid="rating-stars"
            onClick={(e) => e.stopPropagation()}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button"
                className={`${styles.starBtn} ${n <= displayRating ? styles.starFilled : styles.starEmpty}`}
                onClick={(e) => { e.stopPropagation(); onRate(template.id, n); }}
                onMouseEnter={() => onHoverStar?.(n)} onMouseLeave={() => onHoverStar?.(null)}
                aria-label={`评分 ${n} 星`}>
                {n <= displayRating ? '★' : '☆'}
              </button>
            ))}
            {ratingCount > 0 && <span className={styles.ratingCount}>({ratingCount})</span>}
          </div>
        )}
        {onToggleFavorite && (
          <button type="button"
            className={`${styles.favoriteBtn} ${isFavorite ? styles.favoriteActive : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(template.id); }}
            aria-label={isFavorite ? '取消收藏' : '添加收藏'} aria-pressed={isFavorite}
            data-testid="favorite-btn">
            {isFavorite ? '★' : '☆'}
          </button>
        )}
      </div>

      <div className={styles.cardFooter}>
        {usageCount !== undefined && usageCount > 0 && (
          <span className={styles.usageBadge} title="使用次数">🔥 {usageCount} 次使用</span>
        )}
        {author && <span className={styles.authorBadge} title="作者">👤 {author}</span>}
        {templateTags.slice(0, 3).map((tag) => (
          <span key={tag} className={styles.tagBadge}
            style={{ backgroundColor: `${TAG_COLORS[tag] ?? '#6b7280'}22`, color: TAG_COLORS[tag] ?? '#6b7280' }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
