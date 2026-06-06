/**
 * TemplateMarketplacePanel.tsx — Template Marketplace Discovery Panel
 * Sprint70 E2: 模板市场发现与浏览
 *
 * Displays a marketplace panel for discovering community templates:
 * - Featured/hot templates (by usage count)
 * - Tag cloud for filtering
 * - Search box
 * - Template cards with usage count + tags + author
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTemplateStore } from '@/stores/templateStore';
import styles from './TemplateMarketplacePanel.module.css';

interface TemplateMarketplacePanelProps {
  /** Called when user selects a template */
  onTemplateSelect: (templateId: string) => void;
  /** Called when user closes */
  onClose?: () => void;
}

// Predefined popular marketplace tags
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
  ecommerce: '#10b981',
  social: '#ec4899',
  education: '#8b5cf6',
  fintech: '#f59e0b',
  healthcare: '#ef4444',
  content: '#06b6d4',
  game: '#14b8a6',
  iot: '#6366f1',
  enterprise: '#64748b',
  mobile: '#f97316',
  flowchart: '#3b82f6',
  mindmap: '#8b5cf6',
  uml: '#f59e0b',
  other: '#6b7280',
};

export function TemplateMarketplacePanel({ onTemplateSelect, onClose }: TemplateMarketplacePanelProps) {
  const templateStore = useTemplateStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [applying, setApplying] = useState<string | null>(null);

  // Featured/hot templates by usage count
  const featuredTemplates = useMemo(() => templateStore.featuredTemplates(8), [templateStore]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery && selectedTags.length === 0) {
      return templateStore.getMarketplaceTemplates();
    }
    return templateStore.searchMarketplace(searchQuery, selectedTags.length > 0 ? selectedTags : undefined);
  }, [templateStore, searchQuery, selectedTags]);

  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleTemplateApply = useCallback(async (templateId: string) => {
    setApplying(templateId);
    try {
      onTemplateSelect(templateId);
    } finally {
      setApplying(null);
    }
  }, [onTemplateSelect]);

  const usageCount = templateStore.stats.usageCount;

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>🛒 发现模板市场</h3>
        {onClose && (
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="关闭">
            ✕
          </button>
        )}
      </div>

      {/* Search */}
      <div className={styles.searchRow}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="搜索市场模板..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="搜索市场模板"
          role="searchbox"
        />
      </div>

      {/* Tag cloud */}
      <div className={styles.tagCloud} role="group" aria-label="标签筛选">
        {MARKETPLACE_TAGS.map(({ label, value, color }) => {
          const active = selectedTags.includes(value);
          return (
            <button
              key={value}
              type="button"
              className={`${styles.tagChip} ${active ? styles.tagChipActive : ''}`}
              style={active ? { backgroundColor: `${color}22`, color, borderColor: color } : {}}
              onClick={() => handleTagToggle(value)}
              aria-pressed={active}
            >
              {label}
            </button>
          );
        })}
        {selectedTags.length > 0 && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={() => setSelectedTags([])}
          >
            清除
          </button>
        )}
      </div>

      {/* Featured templates */}
      {!searchQuery && selectedTags.length === 0 && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>🔥 热门模板</h4>
          <div className={styles.featuredGrid} data-testid="featured-templates">
            {featuredTemplates.map((t) => (
              <TemplateMarketplaceCard
                key={t.id}
                template={t}
                usageCount={usageCount[t.id]}
                isApplying={applying === t.id}
                onApply={handleTemplateApply}
              />
            ))}
          </div>
        </section>
      )}

      {/* Search results */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>
          {searchQuery || selectedTags.length > 0
            ? `搜索结果 (${searchResults.length})`
            : '所有模板'}
        </h4>
        {searchResults.length === 0 ? (
          <p className={styles.empty}>没有找到匹配的模板</p>
        ) : (
          <div className={styles.grid}>
            {searchResults.map((t) => (
              <TemplateMarketplaceCard
                key={t.id}
                template={t}
                usageCount={usageCount[t.id]}
                isApplying={applying === t.id}
                onApply={handleTemplateApply}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ---- E2: Marketplace template card with usage count + tags + author ----
interface MarketplaceCardProps {
  template: {
    id: string;
    name: string;
    displayName?: string;
    description: string;
    category?: string;
    icon?: string;
    tags?: string[];
    metadata?: { tags?: string[] };
    content?: string;
  };
  usageCount?: number;
  isApplying: boolean;
  onApply: (id: string) => void;
}

function TemplateMarketplaceCard({ template, usageCount, isApplying, onApply }: MarketplaceCardProps) {
  const templateTags: string[] = template.metadata?.tags ?? template.tags ?? [];
  const displayName = template.displayName ?? template.name;
  const author = 'VibeX 社区'; // Simulated author for marketplace

  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => onApply(template.id)}
      disabled={isApplying}
      data-testid="template-card"
      aria-label={`应用模板: ${displayName}`}
    >
      <span className={styles.cardIcon}>{template.icon ?? '📋'}</span>
      <div className={styles.cardMeta}>
        <span className={styles.cardName}>{displayName}</span>
        <span className={styles.cardDesc}>{template.description}</span>
      </div>
      <div className={styles.cardFooter}>
        {usageCount !== undefined && usageCount > 0 && (
          <span className={styles.usageBadge} title="使用次数">
            🔥 {usageCount} 次使用
          </span>
        )}
        {author && (
          <span className={styles.authorBadge} title="作者">
            👤 {author}
          </span>
        )}
        {templateTags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className={styles.tagBadge}
            style={{
              backgroundColor: `${TAG_COLORS[tag] ?? '#6b7280'}22`,
              color: TAG_COLORS[tag] ?? '#6b7280',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}
