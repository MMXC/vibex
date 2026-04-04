/**
 * DDD Template Selector
 * 
 * DDD 项目模板选择器组件
 * 展示项目模板的限界上下文、流程和组件预览
 */

'use client';

import React, { useState } from 'react';
import { useProjectTemplateStore, TEMPLATE_CATEGORIES } from '@/stores/projectTemplateStore';
import type { ProjectTemplate } from '@/types/project-template';
import { X, Package, GitBranch, Layers, ChevronRight } from 'lucide-react';
import styles from './project-templates.module.css';

interface DDDTemplateSelectorProps {
  isOpen?: boolean;
  onClose?: () => void;
  onCreateProject: (templateId: string, projectName: string) => Promise<{ projectId: string }>;
}

function TemplatePreviewModal({ 
  template, 
  onClose, 
  onUse 
}: { 
  template: ProjectTemplate;
  onClose: () => void;
  onUse: (template: ProjectTemplate) => void;
}) {
  const [projectName, setProjectName] = useState(template.name);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{template.name}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalContent}>
          <p className={styles.modalDescription}>{template.description}</p>

          {/* Tags */}
          <div className={styles.tags}>
            {template.tags.map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>

          {/* Bounded Contexts */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Package size={16} />
              限界上下文 ({template.contexts.length})
            </h3>
            <div className={styles.contextList}>
              {template.contexts.map((ctx, i) => (
                <div key={i} className={styles.contextItem}>
                  <div className={styles.contextHeader}>
                    <span className={styles.contextName}>{ctx.name}</span>
                    {ctx.entities && ctx.entities.length > 0 && (
                      <span className={styles.entityCount}>{ctx.entities.length} 实体</span>
                    )}
                  </div>
                  <p className={styles.contextDesc}>{ctx.description}</p>
                  {ctx.entities && ctx.entities.length > 0 && (
                    <div className={styles.entities}>
                      {ctx.entities.map(entity => (
                        <span key={entity} className={styles.entity}>{entity}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Flows */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <GitBranch size={16} />
              业务流程 ({template.flows.length})
            </h3>
            <div className={styles.flowList}>
              {template.flows.map((flow, i) => (
                <div key={i} className={styles.flowItem}>
                  <div className={styles.flowHeader}>
                    <span className={styles.flowName}>{flow.name}</span>
                    <span className={styles.flowContext}>{flow.context}</span>
                  </div>
                  <div className={styles.flowSteps}>
                    {flow.steps.map((step, j) => (
                      <React.Fragment key={j}>
                        <span className={styles.flowStep}>{step}</span>
                        {j < flow.steps.length - 1 && (
                          <ChevronRight size={12} className={styles.stepArrow} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <div className={styles.projectNameInput}>
            <label htmlFor="projectName">项目名称</label>
            <input
              id="projectName"
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="输入项目名称"
              className={styles.input}
            />
          </div>
          <div className={styles.modalActions}>
            <button className={styles.cancelBtn} onClick={onClose}>
              取消
            </button>
            <button 
              className={styles.createBtn}
              onClick={() => onUse(template)}
              disabled={!projectName.trim()}
            >
              使用此模板
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DDDTemplateSelector({ isOpen = true, onClose, onCreateProject }: DDDTemplateSelectorProps) {
  const {
    selectedCategory,
    searchQuery,
    setSelectedCategory,
    setSearchQuery,
    getFilteredTemplates,
    selectedTemplate,
    isPreviewOpen,
    openPreview,
    closePreview,
    isCreating,
  } = useProjectTemplateStore();

  const filteredTemplates = getFilteredTemplates();

  const handleUseTemplate = async (template: ProjectTemplate) => {
    try {
      const projectId = await onCreateProject(template.id, template.name);
      closePreview();
      onClose?.();
      // Navigate to the new project
      if (typeof window !== 'undefined') {
        window.location.href = `/project?id=${projectId}`;
      }
    } catch (error) {
      console.error('Failed to create project from template:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.selectorOverlay}>
      <div className={styles.selector}>
        {/* Header */}
        <div className={styles.selectorHeader}>
          <h2 className={styles.selectorTitle}>选择项目模板</h2>
          <p className={styles.selectorSubtitle}>从预设模板快速创建标准化 DDD 项目结构</p>
        </div>

        {/* Category Filter */}
        <div className={styles.categoryNav}>
          {TEMPLATE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`${styles.categoryBtn} ${selectedCategory === cat.id ? styles.categoryActive : ''}`}
              onClick={() => setSelectedCategory(cat.id as typeof selectedCategory)}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="搜索模板..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Template Grid */}
        <div className={styles.templateGrid}>
          {filteredTemplates.length === 0 ? (
            <div className={styles.emptyState}>
              <Layers size={48} />
              <p>没有找到匹配的模板</p>
            </div>
          ) : (
            filteredTemplates.map(template => (
              <div 
                key={template.id} 
                className={styles.templateCard}
                onClick={() => openPreview(template)}
              >
                <div className={styles.cardThumbnail}>
                  <div className={styles.thumbnailPlaceholder}>
                    <Package size={32} />
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{template.name}</h3>
                  <p className={styles.cardDesc}>{template.description}</p>
                  <div className={styles.cardMeta}>
                    <span className={styles.metaItem}>
                      <Package size={12} /> {template.contexts.length} 上下文
                    </span>
                    <span className={styles.metaItem}>
                      <GitBranch size={12} /> {template.flows.length} 流程
                    </span>
                  </div>
                  <div className={styles.cardTags}>
                    {template.tags.map(tag => (
                      <span key={tag} className={styles.cardTag}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && selectedTemplate && (
        <TemplatePreviewModal
          template={selectedTemplate}
          onClose={closePreview}
          onUse={handleUseTemplate}
        />
      )}
    </div>
  );
}
