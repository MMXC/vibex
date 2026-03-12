'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './confirm.module.css';
import {
  useConfirmationStore,
  BoundedContext,
} from '@/stores/confirmationStore';
import { useAutoSnapshot } from '@/hooks/useAutoSnapshot';
import { useDDDStream } from '@/hooks/useDDDStream';
import { apiService } from '@/services/api';
import { MermaidPreview } from '@/components/ui/MermaidPreview';
import { ThinkingPanel } from '@/components/ui/ThinkingPanel';
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
  
  // SSE 流式 Hook
  const {
    thinkingMessages,
    contexts,
    mermaidCode: streamMermaidCode,
    status,
    errorMessage,
    generateContexts,
    abort,
    reset,
  } = useDDDStream();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);

  const handleTemplateSelect = (template: RequirementTemplate) => {
    // Use the template content or description
    const text = template.content || template.description;
    setRequirementText(text);
    setIsTemplateOpen(false);
  };

  // 流式生成
  const handleStreamGenerate = () => {
    if (!requirementText.trim()) {
      setError('请输入需求描述');
      return;
    }
    setError('');
    generateContexts(requirementText);
  };

  // 完成时同步到 store
  useEffect(() => {
    if (status === 'done' && contexts.length > 0) {
      setBoundedContexts(contexts);
      setContextMermaidCode(streamMermaidCode || '');
    }
  }, [status, contexts, streamMermaidCode, setBoundedContexts, setContextMermaidCode]);

  // 使用默认值 (fallback 到传统 API)
  const handleUseDefault = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await generateBoundedContext(requirementText);
      if (response && response.success && response.boundedContexts) {
        setBoundedContexts(response.boundedContexts);
        setContextMermaidCode(response.mermaidCode || '');
        goToNextStep();
        router.push('/confirm/context');
      } else {
        throw new Error(response.error || '生成失败');
      }
    } catch (err: unknown) {
      console.error('Failed to use default:', err);
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setLoading(false);
    }
  };

  // 继续下一步
  const handleContinue = () => {
    goToNextStep();
    router.push('/confirm/context');
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

  // F2.3: Get mermaid code based on current step for preview
  const getPreviewMermaidCode = () => {
    const state = useConfirmationStore.getState();
    switch (currentStep) {
      case 'context':
        return state.contextMermaidCode;
      case 'model':
        return state.modelMermaidCode;
      case 'flow':
        return state.flowMermaidCode;
      default:
        return state.contextMermaidCode;
    }
  };

  const previewMermaidCode = getPreviewMermaidCode();

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
              {status === 'idle' && (
                <button
                  className={styles.primaryButton}
                  onClick={handleStreamGenerate}
                  disabled={!requirementText.trim()}
                >
                  开始生成
                </button>
              )}
              
              {status === 'thinking' && (
                <button
                  className={styles.secondaryButton}
                  onClick={abort}
                >
                  停止
                </button>
              )}
              
              {status === 'done' && contexts.length > 0 && (
                <button
                  className={styles.primaryButton}
                  onClick={handleContinue}
                >
                  继续下一步
                </button>
              )}
              
              {status === 'error' && (
                <>
                  <button
                    className={styles.primaryButton}
                    onClick={handleStreamGenerate}
                  >
                    重试
                  </button>
                  <button
                    className={styles.secondaryButton}
                    onClick={handleUseDefault}
                  >
                    使用默认值
                  </button>
                </>
              )}
              
              {status === 'idle' && (
                <button
                  className={styles.secondaryButton}
                  onClick={handleUseDefault}
                  disabled={!requirementText.trim()}
                >
                  快速生成
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：AI 思考过程面板 */}
        <div className={styles.rightColumn}>
          <ThinkingPanel
            thinkingMessages={thinkingMessages}
            contexts={contexts}
            mermaidCode={streamMermaidCode}
            status={status}
            errorMessage={errorMessage || error}
            onAbort={abort}
            onRetry={handleStreamGenerate}
            onUseDefault={handleUseDefault}
          />
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
