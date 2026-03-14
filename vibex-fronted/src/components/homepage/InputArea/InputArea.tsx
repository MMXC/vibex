import React from 'react';
import { RequirementInput } from '@/components/requirement-input';
import { GitHubImport } from '@/components/github-import';
import { FigmaImport } from '@/components/figma-import';
import { PlanBuildButtons } from '@/components/plan-build';
import styles from './InputArea.module.css';
import type { InputAreaComponentProps, Step } from '@/types/homepage';

/**
 * InputArea - 输入区域组件
 * 
 * 功能：
 * - 需求输入
 * - 导入选项 (GitHub, Figma)
 * - Plan/Build 模式选择
 * - 根据步骤显示不同操作
 */
export const InputArea: React.FC<InputAreaComponentProps> = ({
  currentStep,
  requirementText,
  onRequirementChange,
  onGenerate,
  onGenerateDomainModel,
  onGenerateBusinessFlow,
  onCreateProject,
  isGenerating,
  boundedContexts,
  domainModels,
  businessFlow,
  className = '',
}) => {
  const steps: Step[] = [
    { id: 1, label: '需求输入', description: '描述你的产品需求' },
    { id: 2, label: '限界上下文', description: '分析限界上下文' },
    { id: 3, label: '领域模型', description: '构建领域模型' },
    { id: 4, label: '业务流程', description: '设计业务流程' },
    { id: 5, label: '项目创建', description: '生成项目代码' },
  ];

  const currentStepData = steps.find(s => s.id === currentStep);

  const handleImport = (text: string, setCurrentStep: (step: number) => void) => {
    onRequirementChange(text);
    // Note: setCurrentStep would be passed from parent
  };

  return (
    <div className={`${styles.inputArea} ${className}`}>
      {/* 头部 */}
      <div 
        className={styles.header}
        onDoubleClick={() => {}} // Will be connected to parent
      >
        <span className={styles.title}>📝 需求录入</span>
      </div>

      {/* 内容 */}
      <div className={styles.content}>
        <h1 className={styles.pageTitle}>
          Step {currentStep}: {currentStepData?.label}
        </h1>
        <p className={styles.pageSubtitle}>
          {currentStepData?.description || '描述你的产品需求，AI 将协助你完成完整的设计'}
        </p>

        <div className={styles.inputSection}>
          <label className={styles.inputLabel}>
            描述你的产品需求
          </label>
          
          {/* 统一需求输入组件 */}
          <RequirementInput
            initialValue={requirementText}
            onValueChange={onRequirementChange}
            onGenerate={onGenerate}
          />

          {/* GitHub 导入选项 */}
          <details className={styles.importOptions}>
            <summary className={styles.importSummary}>
              🐙 从 GitHub 导入项目
            </summary>
            <div className={styles.importContent}>
              <GitHubImport
                onImport={(text) => handleImport(text, () => {})}
              />
            </div>
          </details>

          {/* Figma 导入选项 */}
          <details className={styles.importOptions}>
            <summary className={styles.importSummary}>
              🎨 从 Figma 导入设计
            </summary>
            <div className={styles.importContent}>
              <FigmaImport
                onImport={(text) => handleImport(text, () => {})}
              />
            </div>
          </details>

          {/* Plan/Build 模式选择器 */}
          <PlanBuildButtons />
        </div>

        {/* 步骤特定的操作 */}
        <div className={styles.actions}>
          {currentStep === 1 && (
            <button 
              className={styles.generateButton}
              onClick={onGenerate}
              disabled={isGenerating || !requirementText.trim()}
            >
              {isGenerating ? '⏳ 生成中...' : '🚀 开始生成'}
            </button>
          )}

          {currentStep === 2 && boundedContexts && boundedContexts.length > 0 && (
            <button 
              className={styles.generateButton}
              onClick={onGenerateDomainModel}
              disabled={isGenerating}
            >
              {isGenerating ? '⏳ 生成中...' : '🚀 生成领域模型'}
            </button>
          )}

          {currentStep === 3 && domainModels && domainModels.length > 0 && (
            <button 
              className={styles.generateButton}
              onClick={onGenerateBusinessFlow}
              disabled={isGenerating}
            >
              {isGenerating ? '⏳ 生成中...' : '🚀 生成业务流程'}
            </button>
          )}

          {currentStep === 4 && businessFlow && (
            <button 
              className={styles.generateButton}
              onClick={onCreateProject}
              disabled={isGenerating}
            >
              {isGenerating ? '⏳ 创建中...' : '🚀 创建项目'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InputArea;