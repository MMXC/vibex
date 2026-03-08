/**
 * TemplateSelector - 模板选择器主组件
 * 
 * 提供模板选择弹窗，支持搜索、分类筛选、模板预览和选择
 */

import { useState, useMemo } from 'react';
import { 
  RequirementTemplate, 
  TemplateCategory,
  getTemplateGroups,
  filterTemplates 
} from '@/data/templates';
import { TemplateCard } from './TemplateCard';
import { TemplateDetail } from './TemplateDetail';
import { TemplateSearch } from './TemplateSearch';
import { TemplateCategories } from './TemplateCategories';
import styles from './TemplateSelector.module.css';

export interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: RequirementTemplate) => void;
  initialCategory?: TemplateCategory | 'all';
}

export function TemplateSelector({ 
  isOpen, 
  onClose, 
  onSelect,
  initialCategory = 'all'
}: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<RequirementTemplate | null>(null);
  
  // 过滤模板 - 使用 useMemo 缓存，支持 < 100ms 搜索响应
  const filteredTemplates = useMemo(() => {
    return filterTemplates(selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery]);
  
  // 分类选项（带数量）
  const categories = useMemo(() => {
    const groups = getTemplateGroups();
    const { templates } = require('@/data/templates');
    const allCount = templates.length;
    
    return [
      { value: 'all' as const, label: '全部', count: allCount },
      ...groups.map((g: { category: TemplateCategory; label: string; templates: RequirementTemplate[] }) => ({
        value: g.category,
        label: g.label,
        count: g.templates.length,
      })),
    ];
  }, []);
  
  // 处理模板选择
  const handleSelect = (template: RequirementTemplate) => {
    onSelect(template);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className={styles.header}>
          <h2 className={styles.title}>选择需求模板</h2>
          <button 
            className={styles.closeBtn} 
            onClick={onClose}
            aria-label="关闭"
          >
            ×
          </button>
        </header>
        
        <div className={styles.toolbar}>
          <TemplateSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="搜索模板..."
          />
          <TemplateCategories
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>
        
        <div className={styles.grid}>
          {filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onClick={() => handleSelect(template)}
              onPreview={() => setPreviewTemplate(template)}
            />
          ))}
          
          {filteredTemplates.length === 0 && (
            <div className={styles.empty}>
              未找到匹配的模板
            </div>
          )}
        </div>
        
        {previewTemplate && (
          <TemplateDetail
            template={previewTemplate}
            onApply={() => handleSelect(previewTemplate)}
            onClose={() => setPreviewTemplate(null)}
          />
        )}
      </div>
    </div>
  );
}

export default TemplateSelector;
