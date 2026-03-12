'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './confirm.module.css';
import {
  useConfirmationStore,
  BoundedContext,
} from '@/stores/confirmationStore';
import { useAutoSnapshot } from '@/hooks/useAutoSnapshot';
import { apiService } from '@/services/api';
import { MermaidPreview } from '@/components/ui/MermaidPreview';
const { generateBoundedContext } = apiService;
import { ConfirmationSteps } from '@/components/ui/ConfirmationSteps';
import { RequirementScore } from '@/components/ui/RequirementScore';
import { TemplateSelector } from '@/components/templates';
import { RequirementTemplate } from '@/data/templates';

export default function ConfirmPage() {
  const router = useRouter();
  
  // Enable auto-snapshot for version history
  useAutoSnapshot(true, 2000);
  
  const {
    requirementText,
    setRequirementText,
    setBoundedContexts,
    setContextMermaidCode,
    goToNextStep,
    currentStep,
    contextMermaidCode,
  } = useConfirmationStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);

  const handleTemplateSelect = (template: RequirementTemplate) => {
    // Use the template content or description
    const text = template.content || template.description;
    setRequirementText(text);
    setIsTemplateOpen(false);
  };

  const handleSubmit = async () => {
    if (!requirementText.trim()) {
      setError('请输入需求描述');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call AI API to generate bounded contexts
      const response = await generateBoundedContext(requirementText);

      if (response && response.success && response.boundedContexts) {
        // Store the generated bounded contexts
        setBoundedContexts(response.boundedContexts);

        // Store the mermaid code if provided
        if (response.mermaidCode) {
          setContextMermaidCode(response.mermaidCode);
        }

        // Navigate to the context page
        goToNextStep();
        router.push('/confirm/context');
      } else {
        throw new Error(response.error || '生成失败');
      }
    } catch (err: unknown) {
      console.error('Failed to generate bounded contexts:', err);
      setError(err instanceof Error ? err.message : '生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* 两栏布局：左边输入，右边预览 */}
      <div className={styles.mainContent}>
        {/* 左侧：输入区域 */}
        <div className={styles.leftColumn}>
          <div className={styles.card}>
            <h1 className={styles.title}>
              {currentStep === 'input' ? 'Step 1: 需求输入' : '需求确认流程'}
            </h1>
            <p className={styles.description}>
              描述您的产品需求，AI 将协助您完成限界上下文图、领域模型和业务流程图的设计。
            </p>

            <ConfirmationSteps currentStep={currentStep} className={styles.steps} />

            <div className={styles.inputSection}>
              <div className={styles.labelRow}>
                <label htmlFor="requirement" className={styles.label}>
                  请描述您的产品需求
                </label>
                <button
                  type="button"
                  className={styles.templateButton}
                  onClick={() => setIsTemplateOpen(true)}
                >
                  📋 使用模板
                </button>
              </div>
              <textarea
                id="requirement"
                className={styles.textarea}
                placeholder="例如：开发一个在线教育平台，包含用户管理、课程管理、订单管理、支付等功能..."
                value={requirementText}
                onChange={(e) => setRequirementText(e.target.value)}
                rows={8}
              />

              <RequirementScore value={requirementText} />

              {error && <p className={styles.error}>{error}</p>}
            </div>

            <div className={styles.actions}>
              <button
                className={styles.primaryButton}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? '生成中...' : '开始生成'}
              </button>
            </div>
          </div>
        </div>

        {/* 右侧：预览区域 - F3.1 实时渲染 + F3.2 Mermaid 图 */}
        <div className={styles.rightColumn}>
          <div className={styles.previewCard}>
            <h2 className={styles.previewTitle}>实时预览</h2>
            {contextMermaidCode ? (
              <div className={styles.mermaidPreview}>
                <MermaidPreview 
                  code={contextMermaidCode} 
                  diagramType="graph"
                />
              </div>
            ) : (
              <div className={styles.previewPlaceholder}>
                <p>输入需求后，实时显示 Mermaid 图表预览</p>
                <p className={styles.previewHint}>
                  输入需求描述，AI 将自动生成限界上下文图
                </p>
              </div>
            )}
          </div>
        </div>

        <TemplateSelector
          isOpen={isTemplateOpen}
          onClose={() => setIsTemplateOpen(false)}
          onSelect={handleTemplateSelect}
        />
      </div>
    </div>
  );
}
