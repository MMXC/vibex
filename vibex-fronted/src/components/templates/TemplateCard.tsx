/**
 * Template Card
 * 
 * 模板卡片组件
 */

import React from 'react';
import type { Template } from '@/types/template';
import styles from './TemplateCard.module.css';

export interface TemplateCardProps {
  /** 模板数据 */
  template: Template;
  /** 选择回调 */
  onSelect?: (template: Template) => void;
  /** 是否选中 */
  isSelected?: boolean;
  /** 收藏切换回调 */
  onToggleFavorite?: (template: Template) => void;
  /** 自定义类名 */
  className?: string;
  /** E5: 当前选中的自定义分类ID */
  customCategoryId?: string;
  /** E5: 添加模板到自定义分类 */
  onAddToCategory?: (templateId: string, categoryId: string) => void;
  /** E5: 从自定义分类移除模板 */
  onRemoveFromCategory?: (templateId: string, categoryId: string) => void;
  /** E5: 模板→自定义分类映射 */
  templateCategories?: Record<string, string[]>;
}

export function TemplateCard({
  template,
  onSelect,
  isSelected = false,
  onToggleFavorite,
  className = '',
  customCategoryId,
  onAddToCategory,
  onRemoveFromCategory,
  templateCategories,
}: TemplateCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(template);
  };
  const handleClick = () => {
    onSelect?.(template);
  };

  // 获取难度标签样式
  const getDifficultyClass = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return styles.difficultyBeginner;
      case 'intermediate':
        return styles.difficultyIntermediate;
      case 'advanced':
        return styles.difficultyAdvanced;
      default:
        return '';
    }
  };

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ''} ${className}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* 缩略图 */}
      <div className={styles.thumbnail}>
        {template.thumbnail ? (
          <img src={template.thumbnail} alt={template.name} />
        ) : (
          <div className={styles.placeholder}>
            <span>📄</span>
          </div>
        )}
        
        {/* 推荐标记 */}
        {template.featured && (
          <span className={styles.featured}>推荐</span>
        )}
        
        {/* 收藏按钮 */}
        <button
          className={styles.favoriteBtn}
          onClick={handleFavoriteClick}
          aria-label={template.isFavorite ? '取消收藏' : '收藏'}
        >
          {template.isFavorite ? '★' : '☆'}
        </button>
        
        {/* 价格标签 */}
        <span className={`${styles.price} ${template.price === 'free' ? styles.free : styles.premium}`}>
          {template.price === 'free' ? '免费' : '付费'}
        </span>

        {/* E5: 自定义分类按钮 */}
        {customCategoryId && (
          <button
            className={styles.favoriteBtn}
            onClick={(e) => {
              e.stopPropagation();
              const cats = templateCategories?.[template.id] || [];
              if (cats.includes(customCategoryId)) {
                onRemoveFromCategory?.(template.id, customCategoryId);
              } else {
                onAddToCategory?.(template.id, customCategoryId);
              }
            }}
            aria-label={templateCategories?.[template.id]?.includes(customCategoryId) ? '从分类移除' : '添加到分类'}
          >
            {templateCategories?.[template.id]?.includes(customCategoryId) ? '📁' : '+📁'}
          </button>
        )}
      </div>

      {/* 内容 */}
      <div className={styles.content}>
        <h3 className={styles.name}>{template.name}</h3>
        <p className={styles.description}>{template.description}</p>

        {/* 标签 */}
        <div className={styles.tags}>
          {template.tags.slice(0, 3).map(tag => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>

        {/* 元信息 */}
        <div className={styles.meta}>
          <span className={styles.difficulty + ' ' + getDifficultyClass(template.difficulty)}>
            {template.difficulty === 'beginner' ? '入门' : template.difficulty === 'intermediate' ? '进阶' : '高级'}
          </span>
          <span className={styles.downloads}>
            📥 {template.downloads}
          </span>
          <span className={styles.rating}>
            ⭐ {template.rating}
          </span>
        </div>
      </div>
    </div>
  );
}

export default TemplateCard;