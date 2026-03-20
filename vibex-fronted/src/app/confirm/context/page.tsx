'use client';

/**
 * @deprecated This page is deprecated since 2026-03-21.
 * All functionality has been migrated to the homepage step flow at /.
 * @see docs/vibex-page-structure-consolidation/IMPLEMENTATION_PLAN.md
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../confirm.module.css';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { ConfirmationSteps } from '@/components/ui/ConfirmationSteps';
import { MermaidPreview } from '@/components/ui/MermaidPreview';

export default function ContextPage() {
  const router = useRouter();
  const {
    requirementText,
    boundedContexts,
    selectedContextIds,
    contextMermaidCode,
    setBoundedContexts,
    setSelectedContextIds,
    setContextMermaidCode,
    goToNextStep,
    goToPreviousStep,
    currentStep,
  } = useConfirmationStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper function to generate Mermaid code
  const generateMermaidCode = useCallback(
    (contexts: typeof boundedContexts) => {
      const lines = ['graph TD'];

      contexts.forEach((ctx) => {
        const nodeDef =
          ctx.type === 'core'
            ? `${ctx.id}[${ctx.name}]`
            : ctx.type === 'supporting'
              ? `${ctx.id}(${ctx.name})`
              : `${ctx.id}{${ctx.name}}`;
        lines.push(`  ${nodeDef}`);
      });

      lines.push('');
      lines.push('  classDef core fill:#4ade80,stroke:#22c55e,color:#1a1a2e');
      lines.push(
        '  classDef supporting fill:#60a5fa,stroke:#3b82f6,color:#1a1a2e'
      );
      lines.push('');
      lines.push(
        '  class ' +
          contexts
            .filter((c) => c.type === 'core')
            .map((c) => c.id)
            .join(',') +
          ' core'
      );
      lines.push(
        '  class ' +
          contexts
            .filter((c) => c.type === 'supporting')
            .map((c) => c.id)
            .join(',') +
          ' supporting'
      );

      return lines.join('\n');
    },
    []
  );

  // Auto-generate mermaid code when bounded contexts change
  useEffect(() => {
    if (boundedContexts.length > 0 && !contextMermaidCode) {
      const code = generateMermaidCode(boundedContexts);
      setContextMermaidCode(code);
    }
  }, [
    boundedContexts,
    contextMermaidCode,
    setContextMermaidCode,
    generateMermaidCode,
  ]);

  // Empty state handling: redirect to /confirm if no bounded contexts
  useEffect(() => {
    if (boundedContexts.length === 0 && !loading) {
      // Show alert and redirect
      alert('请先输入需求描述，AI 将为您生成限界上下文图');
      router.push('/confirm');
    }
  }, [boundedContexts, loading, router]);

  const handleContextToggle = (id: string) => {
    if (selectedContextIds.includes(id)) {
      setSelectedContextIds(selectedContextIds.filter((i) => i !== id));
    } else {
      setSelectedContextIds([...selectedContextIds, id]);
    }
  };

  const handleConfirm = () => {
    if (selectedContextIds.length === 0) {
      setError('请至少选择一个核心上下文');
      return;
    }
    goToNextStep();
    router.push('/confirm/model');
  };

  const typeLabels = {
    core: '核心上下文',
    supporting: '支撑上下文',
    generic: '通用上下文',
    external: '外部系统',
  };

  const typeColors = {
    core: '#4ade80',
    supporting: '#60a5fa',
    generic: '#a78bfa',
    external: '#f87171',
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Step 2: 限界上下文图确认</h1>
        <p className={styles.description}>
          基于您的需求，AI 生成了以下限界上下文。请选择您希望保留的核心上下文。
        </p>

        <ConfirmationSteps currentStep={currentStep} className={styles.steps} />

        <div className={styles.diagramSection}>
          <h3 className={styles.sectionTitle}>限界上下文图</h3>
          <div className={styles.mermaidPreview}>
            {contextMermaidCode && (
              <MermaidPreview code={contextMermaidCode} diagramType="flowchart" />
            )}
          </div>
        </div>

        <div className={styles.contextList}>
          <h3 className={styles.sectionTitle}>选择核心上下文</h3>
          <div className={styles.contextGrid}>
            {(boundedContexts ?? []).map((ctx) => (
              <div
                key={ctx.id}
                className={`${styles.contextCard} ${selectedContextIds.includes(ctx.id) ? styles.selected : ''}`}
                onClick={() => handleContextToggle(ctx.id)}
              >
                <div className={styles.contextHeader}>
                  <input
                    type="checkbox"
                    checked={selectedContextIds.includes(ctx.id)}
                    onChange={() => handleContextToggle(ctx.id)}
                  />
                  <span
                    className={styles.contextType}
                    style={{ backgroundColor: typeColors[ctx.type] }}
                  >
                    {typeLabels[ctx.type]}
                  </span>
                </div>
                <h4 className={styles.contextName}>{ctx.name}</h4>
                <p className={styles.contextDesc}>{ctx.description}</p>
              </div>
            ))}
          </div>
          {error && <p className={styles.error}>{error}</p>}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.secondaryButton}
            onClick={() => {
              goToPreviousStep();
              router.push('/confirm');
            }}
          >
            返回修改
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
