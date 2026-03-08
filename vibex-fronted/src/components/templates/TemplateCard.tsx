/**
 * TemplateCard - 模板卡片组件
 * 
 * 显示单个模板的基本信息
 */

import { RequirementTemplate, TemplateCardProps } from '@/data/templates';
import { useTemplateStore } from '@/stores/templateStore';
import styles from './TemplateSelector.module.css';

export function TemplateCard({ 
  template, 
  selected = false,
  onClick, 
  onPreview 
}: TemplateCardProps) {
  const { getTemplateStats } = useTemplateStore();
  const stats = getTemplateStats(template.id);
  
  const complexityColors = {
    simple: '#4CAF50',
    medium: '#FF9800',
    complex: '#F44336',
  };
  
  const complexityLabels = {
    simple: '简单',
    medium: '中等',
    complex: '复杂',
  };
  
  return (
    <div 
      className={`${styles.card} ${selected ? styles.cardSelected : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      <div className={styles.cardHeader}>
        <span className={styles.cardIcon}>{template.icon}</span>
        <span 
          className={styles.cardComplexity}
          style={{ backgroundColor: complexityColors[template.metadata.complexity] }}
        >
          {complexityLabels[template.metadata.complexity]}
        </span>
      </div>
      
      <h3 className={styles.cardTitle}>{template.displayName}</h3>
      
      <p className={styles.cardDesc}>
        {template.description.length > 60 
          ? template.description.slice(0, 60) + '...' 
          : template.description}
      </p>
      
      <div className={styles.cardTags}>
        {template.metadata.tags.slice(0, 3).map(tag => (
          <span key={tag} className={styles.cardTag}>
            {tag}
          </span>
        ))}
        {template.metadata.tags.length > 3 && (
          <span className={styles.cardTagMore}>
            +{template.metadata.tags.length - 3}
          </span>
        )}
      </div>
      
      {/* 统计信息 */}
      <div className={styles.statsCompact}>
        {stats.usageCount > 0 && (
          <span className={styles.usageCount}>
            👁 {stats.usageCount}
          </span>
        )}
        {stats.ratingCount > 0 && (
          <span className={styles.ratingCompact}>
            ⭐ {stats.avgRating.toFixed(1)}
          </span>
        )}
      </div>
      
      <div className={styles.cardFooter}>
        <span className={styles.cardMeta}>
          {template.entities.length} 个实体 · {template.features.length} 个功能
        </span>
        {onPreview && (
          <button 
            className={styles.previewBtn}
            onClick={e => {
              e.stopPropagation();
              onPreview();
            }}
          >
            预览
          </button>
        )}
      </div>
    </div>
  );
}

export default TemplateCard;
