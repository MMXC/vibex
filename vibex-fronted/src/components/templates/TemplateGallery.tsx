/**
 * Template Gallery
 * 
 * 模板市场主组件 - 展示所有模板
 */

'use client';

import React, { useState, useEffect } from 'react';
import { templateLoader } from '@/lib/template-loader';
import type { Template, TemplateFilter } from '@/types/template';
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
    if (selectedCategory !== 'all') {
      result = result.filter(t => t.category === selectedCategory);
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
  }, [templates, selectedCategory, searchQuery]);

  // 处理模板选择
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    onSelect?.(template);
  };

  // 处理分类切换
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
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

      {/* 分类导航 */}
      <CategoryNav
        categories={CATEGORIES}
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

        {!loading && !error && filteredTemplates.length > 0 && (
          <div className={styles.grid}>
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={handleTemplateSelect}
                isSelected={selectedTemplate?.id === template.id}
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
    </div>
  );
}

export default TemplateGallery;