'use client';

/**
 * @deprecated This page is deprecated since 2026-03-21.
 * All functionality has been migrated to the homepage step flow at /.
 * @see docs/vibex-page-structure-consolidation/IMPLEMENTATION_PLAN.md
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../confirm.module.css';
import { useConfirmationStore, type DomainModel } from '@/stores/confirmationStore';
import { useAutoSnapshot } from '@/hooks/useAutoSnapshot';
import { useModelPageGuard, safeFilterContexts } from '@/hooks/useModelPageGuard';
import { ConfirmationSteps } from '@/components/ui/ConfirmationSteps';
import { MermaidPreview } from '@/components/ui/MermaidPreview';
import { apiService, BoundedContext } from '@/services/api';
const { generateDomainModel } = apiService;

export default function ModelPage() {
  const router = useRouter();
  
  // F1: 防御性检查 - 使用 useModelPageGuard
  const { 
    canProceed, 
    checkAndProceed, 
    redirectIfInvalid,
    hasError,
    errorMessage,
    isLoading,
    boundedContexts: safeBoundedContexts,
    selectedContextIds: safeSelectedContextIds,
  } = useModelPageGuard();
  
  // Enable auto-snapshot for version history
  useAutoSnapshot(true, 2000);
  
  const {
    selectedContextIds,
    boundedContexts,
    domainModels,
    modelMermaidCode,
    setDomainModels,
    setModelMermaidCode,
    goToNextStep,
    goToPreviousStep,
    currentStep,
    requirementText,
  } = useConfirmationStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // F1: 防御性检查 - 在组件加载时检查数据有效性
  useEffect(() => {
    if (!isLoading && !checkAndProceed()) {
      redirectIfInvalid();
    }
  }, [isLoading, checkAndProceed, redirectIfInvalid]);
  
  // Generate domain models via API
  useEffect(() => {
    const generateModels = async () => {
      // F2: 使用可选链和安全访问
      const selectedIds = safeSelectedContextIds ?? [];
      const contexts = safeBoundedContexts ?? [];
      
      if (selectedIds?.length > 0 && domainModels?.length === 0) {
        setLoading(true);
        setError('');

        try {
          // F2: 使用可选链操作符安全过滤
          const selectedContexts = safeFilterContexts(contexts, (c: BoundedContext) =>
            selectedIds.includes(c.id)
          );

          // Call API to generate domain models
          const response = await generateDomainModel(
            selectedContexts,
            requirementText
          );

          // F3: API 响应处理 - 处理 domainModels = null 情况，视为空数组
          const domainModels = response?.domainModels ?? null;
          
          if (response && response.success) {
            // Transform API response to DomainModel type
            const transformedModels: DomainModel[] = Array.isArray(domainModels)
              ? domainModels.map((model: any) => ({
                  id: String(model.id),
                  name: String(model.name),
                  contextId: selectedContexts[0]?.id || '',
                  type: (model.type as DomainModel['type']) || 'entity',
                  properties: (model.properties || []).map((attr: any) => ({
                    name: String(attr.name),
                    type: String(attr.type),
                    required: attr.required ?? false,
                    description: '',
                  })),
                  methods: [],
                }))
              : [];
            setDomainModels(transformedModels);
            if (response.mermaidCode) {
              setModelMermaidCode(response.mermaidCode);
            }
          } else {
            throw new Error(response.error || '生成失败');
          }
        } catch (err) {
          console.error('Failed to generate domain models:', err);
          // Show error to user - no mock fallback
          setError(err instanceof Error ? err.message : '生成领域模型失败');
        } finally {
          setLoading(false);
        }
      }
    };

    generateModels();
  }, [safeSelectedContextIds, safeBoundedContexts, requirementText, domainModels]);

  const typeLabels = {
    aggregate_root: '聚合根',
    entity: '实体',
    value_object: '值对象',
  };

  const typeColors = {
    aggregate_root: '#4ade80',
    entity: '#60a5fa',
    value_object: '#a78bfa',
  };

  const handleConfirm = () => {
    goToNextStep();
    router.push('/confirm/flow');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Step 3: 领域模型类图确认</h1>
        <p className={styles.description}>
          基于您选择的限界上下文，AI 生成了领域模型类图。请确认。
        </p>

        {error && (
          <div className={styles.error}>
            <p>⚠️ {error}</p>
          </div>
        )}

        {/* F3: 加载状态提示 */}
        {loading && (
          <div className={styles.loading}>
            <p>⏳ 正在生成领域模型...</p>
          </div>
        )}

        {/* F1: 错误状态 - Guard 检查失败 */}
        {!loading && !error && hasError && (
          <div className={styles.emptyState}>
            <p>⚠️ {errorMessage || '请先选择限界上下文'}</p>
            <button 
              className={styles.primaryButton}
              onClick={() => router.push('/confirm/context')}
            >
              返回选择限界上下文
            </button>
          </div>
        )}

        {/* F2: 空状态 UI - domainModels 为空数组时显示友好提示 */}
        {!loading && !error && !hasError && (domainModels ?? []).length === 0 && (
          <div className={styles.emptyState}>
            <p>暂无领域模型数据</p>
            <p className={styles.emptyHint}>请确认已正确选择限界上下文，或返回上一步重新生成</p>
            <button 
              className={styles.primaryButton}
              onClick={() => router.push('/confirm/context')}
            >
              返回选择限界上下文
            </button>
          </div>
        )}

        <ConfirmationSteps currentStep={currentStep} className={styles.steps} />

        <div className={styles.diagramSection}>
          <h3 className={styles.sectionTitle}>领域模型类图</h3>
          <div className={styles.mermaidPreview}>
            {modelMermaidCode && (
              <MermaidPreview code={modelMermaidCode} diagramType="classDiagram" />
            )}
          </div>
        </div>

        <div className={styles.modelList}>
          <h3 className={styles.sectionTitle}>领域模型详情</h3>
          <div className={styles.modelGrid}>
            {(domainModels ?? []).map((model) => (
              <div key={model.id} className={styles.modelCard}>
                <div className={styles.modelHeader}>
                  <span
                    className={styles.modelType}
                    style={{ backgroundColor: typeColors[model.type] }}
                  >
                    {typeLabels[model.type]}
                  </span>
                </div>
                <h4 className={styles.modelName}>{model.name}</h4>
                <div className={styles.modelProps}>
                  {(model.properties || []).map((prop, idx) => (
                    <div key={idx} className={styles.modelProp}>
                      <span className={styles.propName}>
                        {prop.name}
                        {prop.required && (
                          <span className={styles.required}>*</span>
                        )}
                      </span>
                      <span className={styles.propType}>{prop.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.secondaryButton}
            onClick={() => {
              goToPreviousStep();
              router.push('/confirm/context');
            }}
          >
            返回上一步
          </button>
          <button
            className={styles.primaryButton}
            onClick={handleConfirm}
            disabled={loading}
          >
            确认继续
          </button>
        </div>
      </div>
    </div>
  );
}
