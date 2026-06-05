/**
 * Template Gallery
 * 
 * 模板市场主组件 - 展示所有模板
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { templateLoader } from '@/lib/template-loader';
import type { Template, TemplateFilter } from '@/types/template';
import { useTemplateManager } from '@/hooks/useTemplateManager';
import { useTemplateStore } from '@/stores/templateStore';
import { TemplateHistoryPanel } from './TemplateHistoryPanel/TemplateHistoryPanel';
import styles from './TemplateGallery.module.css';

// 子组件
import { TemplateCard } from './TemplateCard';
import { CategoryNav } from './CategoryNav';
import { TemplateSearch } from './TemplateSearch';

export interface TemplateGalleryProps {
  /** 是否显示 */
  isOpen?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** 模板选择回调 */
  onSelect?: (template: Template) => void;
  /** 自定义类名 */
  className?: string;
}

/** 分类定义 */
const CATEGORIES = [
  { id: 'all', name: '全部', icon: '🌟' },
  { id: 'favorites', name: '收藏', icon: '★' },
  { id: 'ecommerce', name: '电商', icon: '🛒' },
  { id: 'education', name: '教育', icon: '📚' },
  { id: 'healthcare', name: '医疗', icon: '🏥' },
  { id: 'finance', name: '金融', icon: '💰' },
  { id: 'social', name: '社交', icon: '💬' },
  { id: 'enterprise', name: '企业', icon: '🏢' },
  { id: 'blog', name: '博客', icon: '📝' },
  { id: 'portfolio', name: '作品集', icon: '🖼️' },
  { id: 'booking', name: '预约', icon: '📅' },
  { id: 'saas', name: 'SaaS', icon: '💻' },
];

export function TemplateGallery({
  isOpen = true,
  onClose,
  onSelect,
  className = '',
}: TemplateGalleryProps) {
  // 状态
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  // E5: 自定义分类状态
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  // E5: 模板→自定义分类映射 (templateId → categoryId)
  const [templateCategories, setTemplateCategories] = useState<Record<string, string[]>>({});

  const customCategories = useTemplateStore(s => s.customCategories);
  const addCustomCategory = useTemplateStore(s => s.addCustomCategory);
  const removeCustomCategory = useTemplateStore(s => s.removeCustomCategory);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('vibex-template-favorites') || '[]');
      } catch { return []; }
    }
    return [];
  });
  const importRef = useRef<HTMLInputElement>(null);
  const tm = useTemplateManager();

  // 加载模板
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        
        const data = await templateLoader.loadAll();
        setTemplates(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    }
    
    if (isOpen) {
      load();
    }
  }, [isOpen]);

  // 筛选模板
  const filteredTemplates = React.useMemo(() => {
    let result = [...templates];
    
    // 按分类筛选
    if (selectedCategory === 'favorites') {
      result = result.filter(t => favoriteIds.includes(t.id));
    } else if (selectedCategory !== 'all') {
      // E5: 自定义分类过滤 — 检查模板是否属于该自定义分类
      const isCustomCat = customCategories.some(c => c.id === selectedCategory);
      if (isCustomCat) {
        result = result.filter(t => (templateCategories[t.id] || []).includes(selectedCategory));
      } else {
        result = result.filter(t => t.category === selectedCategory);
      }
    }
    
    // 按搜索词筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return result;
  }, [templates, selectedCategory, searchQuery, favoriteIds]);

  // 处理模板选择
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    onSelect?.(template);
  };
  
  // 处理收藏切换
  const handleToggleFavorite = (template: Template) => {
    const isFav = favoriteIds.includes(template.id);
    const newFavorites = isFav
      ? favoriteIds.filter(id => id !== template.id)
      : [...favoriteIds, template.id];
    setFavoriteIds(newFavorites);
    localStorage.setItem('vibex-template-favorites', JSON.stringify(newFavorites));
    // Update the template in state with new isFavorite value
    setTemplates(prev => prev.map(t => 
      t.id === template.id ? { ...t, isFavorite: !isFav } : t
    ));
  };

  // 处理分类切换
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // E5: 创建自定义分类
  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      addCustomCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowCategoryInput(false);
    }
  };

  // E5: 将模板添加到自定义分类
  const handleAddToCategory = (templateId: string, categoryId: string) => {
    setTemplateCategories(prev => {
      const existing = prev[templateId] || [];
      if (existing.includes(categoryId)) return prev;
      return { ...prev, [templateId]: [...existing, categoryId] };
    });
  };

  // E5: 从自定义分类移除模板
  const handleRemoveFromCategory = (templateId: string, categoryId: string) => {
    setTemplateCategories(prev => {
      const existing = prev[templateId] || [];
      return { ...prev, [templateId]: existing.filter(id => id !== categoryId) };
    });
  };

  // E5: 构建动态分类列表
  const allCategories = [
    ...CATEGORIES,
    ...customCategories.map(c => ({ id: c.id, name: c.name, icon: '📁' })),
  ];

  // E5: 按使用频率排序（收藏夹内频率最高优先）
  const sortedFilteredTemplates = React.useMemo(() => {
    if (selectedCategory === 'all') return filteredTemplates;
    if (selectedCategory === 'favorites') {
      return [...filteredTemplates].sort((a, b) => {
        const aUsage = useTemplateStore.getState().stats.usageCount[a.id] || 0;
        const bUsage = useTemplateStore.getState().stats.usageCount[b.id] || 0;
        return bUsage - aUsage;
      });
    }
    return filteredTemplates;
  }, [filteredTemplates, selectedCategory, customCategories]);

  const handleExport = () => {
    if (!selectedTemplate) return;
    tm.exportTemplate(selectedTemplate.id, selectedTemplate as unknown as import('@/data/templates/types').RequirementTemplate);
  };

  const handleImportClick = () => importRef.current?.click();
  const handleImportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await tm.importTemplate(file);
      alert(`模板 "${file.name}" 导入成功`);
    } catch (err) {
      alert(`导入失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      e.target.value = '';
    }
  };

  const historySnapshots = selectedTemplate ? tm.getHistory(selectedTemplate.id) : [];

  const handleRestore = (_snapshot: import('@/hooks/useTemplateManager').TemplateSnapshot) => {
    setHistoryOpen(false);
  };
  const handleDeleteSnapshot = (snapshotId: string) => {
    if (!selectedTemplate) return;
    tm.deleteSnapshot(selectedTemplate.id, snapshotId);
  };

  if (!isOpen) return null;

  return (
    <div className={`${styles.gallery} ${className}`}>
      {/* 头部 */}
      <div className={styles.header}>
        <h2 className={styles.title}>选择模板</h2>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>
      </div>

      {/* 搜索栏 */}
      <TemplateSearch
        value={searchQuery}
        onChange={handleSearch}
        placeholder="搜索模板..."
      />

      {/* E5: 自定义分类创建入口 */}
      <div style={{ padding: '4px 12px', display: 'flex', gap: '4px', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
        {showCategoryInput ? (
          <>
            <input
              autoFocus
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
              placeholder="分类名称..."
              style={{ flex: 1, padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-default)', fontSize: '12px' }}
            />
            <button onClick={handleCreateCategory} style={{ padding: '4px 8px', fontSize: '12px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✓</button>
            <button onClick={() => { setShowCategoryInput(false); setNewCategoryName(''); }} style={{ padding: '4px 8px', fontSize: '12px', background: 'var(--color-neutral)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
          </>
        ) : (
          <button
            onClick={() => setShowCategoryInput(true)}
            style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--color-primary)', background: 'none', border: '1px dashed var(--color-primary)', borderRadius: '4px', cursor: 'pointer', opacity: 0.7 }}
          >
            + 新建分类
          </button>
        )}
      </div>

      {/* 分类导航 */}
      <CategoryNav
        categories={allCategories}
        selected={selectedCategory}
        onSelect={handleCategoryChange}
      />

      {/* 内容区 */}
      <div className={styles.content}>
        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>加载中...</span>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <span>⚠️ {error}</span>
            <button onClick={() => window.location.reload()}>重试</button>
          </div>
        )}

        {!loading && !error && filteredTemplates.length === 0 && (
          <div className={styles.empty}>
            <span>没有找到匹配的模板</span>
          </div>
        )}

        {!loading && !error && sortedFilteredTemplates.length > 0 && (
          <div className={styles.grid}>
            {sortedFilteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={{ ...template, isFavorite: favoriteIds.includes(template.id) }}
                onSelect={handleTemplateSelect}
                onToggleFavorite={handleToggleFavorite}
                isSelected={selectedTemplate?.id === template.id}
                // E5: 自定义分类 — 当前选中的自定义分类
                customCategoryId={customCategories.some(c => c.id === selectedCategory) ? selectedCategory : undefined}
                onAddToCategory={handleAddToCategory}
                onRemoveFromCategory={handleRemoveFromCategory}
                templateCategories={templateCategories}
              />
            ))}
          </div>
        )}
      </div>

      {/* 统计 */}
      <div className={styles.footer}>
        <span>
          共 {filteredTemplates.length} 个模板
          {selectedCategory !== 'all' && ` (${CATEGORIES.find(c => c.id === selectedCategory)?.name})`}
        </span>
      </div>

      {/* E5-U1/U2: Template actions bar — only when a template is selected */}
      {selectedTemplate && (
        <div className={styles.actionBar}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleExport}
            data-testid="template-export-btn"
          >
            导出
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleImportClick}
            data-testid="template-import-btn"
          >
            导入
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => setHistoryOpen(true)}
            data-testid="template-history-btn"
          >
            历史 ({historySnapshots.length})
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportChange}
            data-testid="template-import-input"
          />
        </div>
      )}

      {/* E5-U2: Template History Panel */}
      {historyOpen && selectedTemplate && (
        <div className={styles.historyOverlay}>
          <TemplateHistoryPanel
            templateId={selectedTemplate.id}
            history={historySnapshots}
            onRestore={handleRestore}
            onDelete={handleDeleteSnapshot}
            onClose={() => setHistoryOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

export default TemplateGallery;