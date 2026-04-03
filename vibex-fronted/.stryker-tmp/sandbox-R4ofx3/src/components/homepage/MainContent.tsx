/**
 * Main Content Component
 * 
 * Three-column layout: Step Navigation | Preview | Input Panel
 */
// @ts-nocheck


'use client';

import React from 'react';
import { StepNavigator, Step } from './StepNavigator';
import { MermaidPreview } from '@/components/ui/MermaidPreview';
import styles from './MainContent.module.css';

export interface MainContentProps {
  /** Current active step (1-5) */
  currentStep: number;
  /** Step click handler */
  onStepClick?: (stepId: number) => void;
  /** Steps configuration */
  steps?: Step[];
  /** Mermaid code to preview */
  mermaidCode?: string;
  /** Diagram type */
  diagramType?: 'graph' | 'classDiagram' | 'stateDiagram' | 'flowchart';
  /** Input panel content */
  input?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Layout mode: 'horizontal' (default) or 'vertical' */
  layout?: 'horizontal' | 'vertical';
}

const DEFAULT_STEPS: Step[] = [
  { id: 1, label: '需求输入', description: '描述您的需求' },
  { id: 2, label: '限界上下文', description: '定义系统边界' },
  { id: 3, label: '领域模型', description: '设计领域实体' },
  { id: 4, label: '业务流程', description: '绘制业务流程' },
  { id: 5, label: '项目创建', description: '生成项目代码' },
];

export function MainContent({
  currentStep,
  onStepClick,
  steps = DEFAULT_STEPS,
  mermaidCode,
  diagramType = 'graph',
  input,
  loading = false,
  layout = 'horizontal',
}: MainContentProps) {
  const completedSteps = steps
    .filter(s => s.id < currentStep)
    .map(s => s.id);

  const containerClass = layout === 'vertical' 
    ? styles.splitContainerVertical 
    : styles.container;

  return (
    <main className={containerClass}>
      {layout === 'horizontal' && (
        /* Left Column: Step Navigation (15%) */
        <aside className={styles.sidebar}>
          <StepNavigator
            steps={steps}
            currentStep={currentStep}
            onStepClick={onStepClick}
            completedSteps={completedSteps}
          />
        </aside>
      )}

      {/* Center Column: Preview Panel (60%) */}
      <section className={layout === 'vertical' ? styles.previewArea : styles.preview}>
        <div className={styles.previewHeader}>
          <h2>实时预览</h2>
          {loading && <span className={styles.loadingBadge}>加载中...</span>}
        </div>
        <div className={styles.previewContent}>
          {mermaidCode ? (
            <MermaidPreview 
              code={mermaidCode} 
              diagramType={diagramType}
              height="100%"
            />
          ) : (
            <div className={styles.placeholder}>
              <p>在此处显示实时预览</p>
            </div>
          )}
        </div>
      </section>

      {/* Right Column: Input Panel (25% or 40%) */}
      <aside className={layout === 'vertical' ? styles.inputArea : styles.inputPanel}>
        <div className={styles.inputHeader}>
          <h2>输入</h2>
        </div>
        <div className={styles.inputContent}>
          {input || (
            <div className={styles.placeholder}>
              <p>在此处输入需求</p>
            </div>
          )}
        </div>
      </aside>
    </main>
  );
}

export default MainContent;
