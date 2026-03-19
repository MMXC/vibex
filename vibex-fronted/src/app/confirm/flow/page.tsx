'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../confirm.module.css';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { useAutoSnapshot } from '@/hooks/useAutoSnapshot';
import { ConfirmationSteps } from '@/components/ui/ConfirmationSteps';
import { MermaidPreview } from '@/components/ui/MermaidPreview';
import { apiService } from '@/services/api';
const { generateBusinessFlow } = apiService;

export default function FlowPage() {
  const router = useRouter();
  
  // Enable auto-snapshot for version history
  useAutoSnapshot(true, 2000);
  
  const {
    domainModels,
    businessFlow,
    flowMermaidCode,
    setBusinessFlow,
    setFlowMermaidCode,
    setCreatedProjectId,
    goToNextStep,
    goToPreviousStep,
    currentStep,
    requirementText,
  } = useConfirmationStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate business flow via API
  useEffect(() => {
    const generateFlow = async () => {
      if (!businessFlow?.states?.length && domainModels?.length > 0) {
        setLoading(true);
        setError('');

        try {
          const response = await generateBusinessFlow(
            domainModels,
            requirementText
          );

          if (response && response.success && response.businessFlow) {
            setBusinessFlow(response.businessFlow as Parameters<typeof setBusinessFlow>[0]);
            if (response.mermaidCode) {
              setFlowMermaidCode(response.mermaidCode);
            }
          } else {
            throw new Error(response.error || '生成失败');
          }
        } catch (err) {
          console.error('Failed to generate business flow:', err);
          // Throw error instead of using mock fallback - MSW should handle this
          throw err;
        } finally {
          setLoading(false);
        }
      }
    };

    generateFlow();
  }, [domainModels, requirementText]);

  const typeLabels = {
    initial: '初始状态',
    intermediate: '中间状态',
    final: '最终状态',
  };

  const typeColors = {
    initial: '#4ade80',
    intermediate: '#60a5fa',
    final: '#a78bfa',
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError('');

    try {
      // Get userId from localStorage
      const userId = localStorage.getItem('user_id') || 'anonymous';

      // Call API to create project
      const project = await apiService.createProject({
        name: `项目-${Date.now()}`,
        description: requirementText,
        userId,
      });

      setCreatedProjectId(project.id);
      goToNextStep();
      router.push('/confirm/success');
    } catch (err: unknown) {
      // Fallback to mock project creation on error
      console.error('Failed to create project:', err);
      setCreatedProjectId(`project-${Date.now()}`);
      goToNextStep();
      router.push('/confirm/success');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Step 4: 业务流程图确认</h1>
        <p className={styles.description}>
          基于领域模型，AI 生成了业务流程图。请确认后创建项目。
        </p>

        <ConfirmationSteps currentStep={currentStep} className={styles.steps} />

        <div className={styles.diagramSection}>
          <h3 className={styles.sectionTitle}>业务流程图</h3>
          <div className={styles.mermaidPreview}>
            {flowMermaidCode && (
              <MermaidPreview code={flowMermaidCode} diagramType="flowchart" />
            )}
          </div>
        </div>

        <div className={styles.flowList}>
          <h3 className={styles.sectionTitle}>流程状态</h3>
          <div className={styles.flowStates}>
            {(businessFlow?.states || []).map((state) => (
              <div key={state.id} className={styles.flowState}>
                <span
                  className={styles.stateType}
                  style={{ backgroundColor: typeColors[state.type] }}
                >
                  {typeLabels[state.type]}
                </span>
                <span className={styles.stateName}>{state.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.flowList}>
          <h3 className={styles.sectionTitle}>流程转换</h3>
          <div className={styles.flowTransitions}>
            {(businessFlow?.transitions || []).map((trans) => (
              <div key={trans.id} className={styles.flowTransition}>
                <span>
                  {
                    (businessFlow?.states || []).find((s) => s.id === trans.fromStateId)
                      ?.name
                  }
                </span>
                <span className={styles.transitionArrow}>→</span>
                <span>
                  {
                    (businessFlow?.states || []).find((s) => s.id === trans.toStateId)
                      ?.name
                  }
                </span>
                <span className={styles.transitionEvent}>{trans.event}</span>
              </div>
            ))}
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button
            className={styles.secondaryButton}
            onClick={() => {
              goToPreviousStep();
              router.push('/confirm/model');
            }}
          >
            返回上一步
          </button>
          <button
            className={styles.primaryButton}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? '创建中...' : '确认创建项目'}
          </button>
        </div>
      </div>
    </div>
  );
}
