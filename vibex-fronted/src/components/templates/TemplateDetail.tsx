/**
 * TemplateDetail - 模板详情组件
 * 
 * 显示模板的完整信息，包括实体列表、功能列表等
 */

import { RequirementTemplate, TemplateDetailProps } from '@/data/templates';
import styles from './TemplateSelector.module.css';

export function TemplateDetail({ 
  template, 
  onApply, 
  onClose 
}: TemplateDetailProps) {
  const complexityLabels = {
    simple: '简单',
    medium: '中等',
    complex: '复杂',
  };
  
  const priorityLabels = {
    core: '核心功能',
    important: '重要功能',
    optional: '可选功能',
  };
  
  return (
    <div className={styles.detailOverlay} onClick={onClose}>
      <div className={styles.detailPanel} onClick={e => e.stopPropagation()}>
        <header className={styles.detailHeader}>
          <div className={styles.detailTitleRow}>
            <span className={styles.detailIcon}>{template.icon}</span>
            <div>
              <h2 className={styles.detailTitle}>{template.displayName}</h2>
              <p className={styles.detailMeta}>
                预估时间: {template.metadata?.estimatedTime} · 
                复杂度: {complexityLabels[template.metadata?.complexity ?? 'medium']}
              </p>
            </div>
          </div>
          <button className={styles.detailClose} onClick={onClose}>×</button>
        </header>
        
        <div className={styles.detailContent}>
          <section className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle}>描述</h3>
            <p className={styles.detailDesc}>{template.description}</p>
          </section>
          
          <section className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle}>技术栈</h3>
            <div className={styles.techStack}>
              {template.metadata?.techStack?.map(tech => (
                <span key={tech} className={styles.techBadge}>{tech}</span>
              ))}
            </div>
          </section>
          
          <section className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle}>实体模型 ({template.entities?.length})</h3>
            <div className={styles.entityList}>
              {template.entities?.map(entity => (
                <div key={entity.name} className={styles.entityItem}>
                  <span className={styles.entityType}>{entity.type}</span>
                  <span className={styles.entityName}>{entity.name}</span>
                  <span className={styles.entityAttrs}>
                    {entity.attributes.slice(0, 3).join(', ')}
                    {entity.attributes.length > 3 && ` +${entity.attributes.length - 3}`}
                  </span>
                </div>
              ))}
            </div>
          </section>
          
          <section className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle}>功能列表 ({template.features?.length})</h3>
            <div className={styles.featureList}>
              {template.features?.map(feature => (
                <div key={feature.name} className={styles.featureItem}>
                  <span className={`${styles.featurePriority} ${styles[feature.priority as keyof typeof styles] ?? ''}`}>
                    {priorityLabels[feature.priority as keyof typeof priorityLabels] ?? '其他功能'}
                  </span>
                  <div className={styles.featureInfo}>
                    <span className={styles.featureName}>{feature.name}</span>
                    <span className={styles.featureDesc}>{feature.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
          
          <section className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle}>标签</h3>
            <div className={styles.tagList}>
              {template.metadata?.tags.map(tag => (
                <span key={tag} className={styles.detailTag}>{tag}</span>
              ))}
            </div>
          </section>
        </div>
        
        <footer className={styles.detailFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>
            取消
          </button>
          <button className={styles.applyBtn} onClick={onApply}>
            使用此模板
          </button>
        </footer>
      </div>
    </div>
  );
}

export default TemplateDetail;
