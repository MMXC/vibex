/**
 * NewProjectModal — 新建项目模板选择弹窗
 *
 * E4-S1: 模板选择界面（Step 1 of 2）
 * data-testid: template-select-modal, template-option (×4)
 *
 * 流程：选择模板 → 填写项目名 → 确认创建
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { useTemplates, type IndustryTemplate } from '@/hooks/useTemplates';
import { projectApi } from '@/services/api/modules/project';
import { getUserId } from '@/lib/auth-token';
import styles from './NewProjectModal.module.css';

// ==================== Types ====================

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
}

// ==================== Template Option Card ====================

const TEMPLATE_ICONS: Record<string, string> = {
  'saas-crm': '☁️',
  'mobile-app': '📱',
  'ecommerce-platform': '🛒',
  'blank': '📝',
};

function TemplateOptionCard({
  template,
  index,
  selected,
  onClick,
}: {
  template: IndustryTemplate;
  index: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`${styles.templateOption} ${selected ? styles.selected : ''}`}
      onClick={onClick}
      data-testid="template-option"
      data-template-index={index}
      type="button"
    >
      <span className={styles.templateIcon}>
        {TEMPLATE_ICONS[template.id] ?? '📄'}
      </span>
      <div className={styles.templateInfo}>
        <span className={styles.templateName}>{template.name}</span>
        <span className={styles.templateDesc}>{template.description}</span>
      </div>
      {selected && (
        <span className={styles.checkmark}>✓</span>
      )}
    </button>
  );
}

// ==================== Name Input Step ====================

function NameInputStep({
  selectedTemplate,
  projectName,
  onNameChange,
  onBack,
  onConfirm,
  isCreating,
}: {
  selectedTemplate: IndustryTemplate;
  projectName: string;
  onNameChange: (name: string) => void;
  onBack: () => void;
  onConfirm: () => void;
  isCreating: boolean;
}) {
  return (
    <div className={styles.nameStep}>
      <div className={styles.nameStepHeader}>
        <button className={styles.backBtn} onClick={onBack} type="button">
          ← 返回
        </button>
        <div className={styles.selectedTemplateBadge}>
          <span>{TEMPLATE_ICONS[selectedTemplate.id] ?? '📄'}</span>
          <span>{selectedTemplate.name}</span>
        </div>
      </div>

      <div className={styles.nameInputGroup}>
        <label className={styles.nameLabel} htmlFor="project-name-input">
          项目名称
        </label>
        <input
          id="project-name-input"
          type="text"
          className={styles.nameInput}
          value={projectName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="输入项目名称"
          maxLength={100}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && projectName.trim() && !isCreating) {
              onConfirm();
            }
          }}
        />
        <span className={styles.charCount}>
          {projectName.length}/100
        </span>
      </div>

      <div className={styles.nameActions}>
        <button
          className={styles.cancelBtn}
          onClick={onBack}
          disabled={isCreating}
          type="button"
        >
          取消
        </button>
        <button
          className={styles.confirmBtn}
          onClick={onConfirm}
          disabled={!projectName.trim() || isCreating}
          type="button"
        >
          {isCreating ? '创建中...' : '创建项目'}
        </button>
      </div>
    </div>
  );
}

// ==================== Main Modal ====================

export function NewProjectModal({ open, onClose }: NewProjectModalProps) {
  const router = useRouter();
  const { templates, isLoading, error, selectTemplate } = useTemplates();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'name'>('select');
  const [projectName, setProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // 重置状态
  const handleClose = useCallback(() => {
    setSelectedId(null);
    setStep('select');
    setProjectName('');
    setCreateError(null);
    onClose();
  }, [onClose]);

  const handleTemplateSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleNextStep = useCallback(() => {
    if (selectedId) {
      setStep('name');
    }
  }, [selectedId]);

  const handleBackToSelect = useCallback(() => {
    setStep('select');
    setProjectName('');
  }, []);

  const handleCreate = useCallback(async () => {
    if (!projectName.trim()) return;
    setIsCreating(true);
    setCreateError(null);

    try {
      const userId = getUserId() || 'anonymous';
      const project = await projectApi.createProject({
        name: projectName.trim(),
        description: selectedId && selectedId !== 'blank'
          ? `使用「${selectTemplate(selectedId)?.name ?? selectedId}」模板创建`
          : '',
        userId,
      });

      // 如果选择了模板，填充 requirement 内容（通过 URL 参数传递）
      const templateId = selectedId && selectedId !== 'blank' ? selectedId : undefined;
      handleClose();
      router.push(`/project?id=${project.id}${templateId ? `&template=${templateId}` : ''}`);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : '创建失败');
      setIsCreating(false);
    }
  }, [projectName, selectedId, selectTemplate, handleClose, router]);

  const selectedTemplate = selectedId ? selectTemplate(selectedId) : null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="选择需求模板"
      width={520}
      maskClosable={step === 'select'}
      showClose={step === 'select'}
      showConfirm={false}
      showCancel={false}
      destroyOnClose
      className={styles.modal}
    >
      <div
        className={styles.content}
        data-testid="template-select-modal"
      >
        {step === 'select' ? (
          <>
            {/* Loading state */}
            {isLoading && (
              <div className={styles.loadingState}>
                <div className={styles.spinner} />
                <span>加载模板中...</span>
              </div>
            )}

            {/* Error state */}
            {!isLoading && error && (
              <div className={styles.errorState}>
                <span>加载失败：{error}</span>
              </div>
            )}

            {/* Template options */}
            {!isLoading && !error && (
              <div className={styles.templateList}>
                {templates.map((template, index) => (
                  <TemplateOptionCard
                    key={template.id}
                    template={template}
                    index={index}
                    selected={selectedId === template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                  />
                ))}
              </div>
            )}

            {/* Action buttons */}
            {!isLoading && (
              <div className={styles.actions}>
                <button
                  className={styles.cancelBtn}
                  onClick={handleClose}
                  type="button"
                >
                  取消
                </button>
                <button
                  className={styles.nextBtn}
                  onClick={handleNextStep}
                  disabled={!selectedId}
                  type="button"
                >
                  下一步
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {selectedTemplate && (
              <NameInputStep
                selectedTemplate={selectedTemplate}
                projectName={projectName}
                onNameChange={setProjectName}
                onBack={handleBackToSelect}
                onConfirm={handleCreate}
                isCreating={isCreating}
              />
            )}

            {createError && (
              <div className={styles.createError}>
                {createError}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
