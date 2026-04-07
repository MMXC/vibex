'use client';

import React, { useState, useEffect } from 'react';
import { useTemplateStore } from '@/data/templates/store';
import { TEMPLATE_CATEGORIES, TEMPLATE_SCENES } from '@/data/templates/types';
import type { TemplateCategory, TemplateScene, RequirementTemplate } from '@/data/templates/types';
import styles from './TemplateSelector.module.css';

interface TemplateSelectorProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSelect?: (template: RequirementTemplate) => void;
}

export function TemplateSelector({ isOpen = true, onClose, onSelect }: TemplateSelectorProps) {
  const {
    templates,
    currentTemplate,
    selectedCategory,
    selectedScene,
    searchQuery,
    loadTemplates,
    setCurrentTemplate,
    setSelectedCategory,
    setSelectedScene,
    setSearchQuery,
    getFilteredTemplates,
  } = useTemplateStore();

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const filteredTemplates = getFilteredTemplates();

  const handleTemplateClick = (template: RequirementTemplate) => {
    setCurrentTemplate(template.id);
    onSelect?.(template);
  };

  const handleClose = () => {
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>选择需求模板</h2>
          <button className={styles.closeButton} onClick={handleClose}>×</button>
        </div>

      {/* 搜索栏 */}
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="搜索模板..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* 筛选器 */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>行业:</label>
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory || null)}
            className={styles.filterSelect}
          >
            <option value="">全部</option>
            {TEMPLATE_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>场景:</label>
          <select
            value={selectedScene || ''}
            onChange={(e) => setSelectedScene(e.target.value as TemplateScene || null)}
            className={styles.filterSelect}
          >
            <option value="">全部</option>
            {TEMPLATE_SCENES.map((scene) => (
              <option key={scene.id} value={scene.id}>
                {scene.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 模板列表 */}
      <div className={styles.templateList}>
        {filteredTemplates.length === 0 ? (
          <div className={styles.empty}>没有找到匹配的模板</div>
        ) : (
          filteredTemplates.map((template) => {
            const category = TEMPLATE_CATEGORIES.find(c => c.id === template.category);
            return (
              <div
                key={template.id}
                className={`${styles.templateCard} ${currentTemplate?.id === template.id ? styles.selected : ''}`}
                onClick={() => handleTemplateClick(template)}
              >
                <div className={styles.templateHeader}>
                  <span className={styles.categoryIcon}>{category?.icon || '📄'}</span>
                  <h3 className={styles.templateName}>{template.name}</h3>
                </div>
                <p className={styles.templateDesc}>{template.description}</p>
                <div className={styles.templateTags}>
                  {template.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 已选模板详情 */}
      {currentTemplate && (
        <div className={styles.detailPanel}>
          <h3 className={styles.detailTitle}>{currentTemplate.name}</h3>
          <p className={styles.detailDesc}>{currentTemplate.description}</p>
          <div className={styles.itemCount}>
            包含 {currentTemplate.items?.length || 0} 个需求项
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

export default TemplateSelector;
