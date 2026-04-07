/**
 * Generation Progress Component
 * 展示生成进度
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import styles from './GenerationProgress.module.css';

export type ProgressStatus = 'idle' | 'generating' | 'completed' | 'error';

export interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
}

export interface GenerationProgressProps {
  steps: GenerationStep[];
  currentStepId?: string;
  status?: ProgressStatus;
  onComplete?: () => void;
}

export function GenerationProgress({
  steps,
  currentStepId,
  status = 'idle',
  onComplete,
}: GenerationProgressProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Animate progress
  useEffect(() => {
    if (status === 'generating') {
      const currentStep = steps.find(s => s.id === currentStepId);
      const targetProgress = currentStep?.progress || 0;
      
      const timer = setInterval(() => {
        setAnimatedProgress(prev => {
          if (prev >= targetProgress) {
            clearInterval(timer);
            return targetProgress;
          }
          return prev + 5;
        });
      }, 100);
      
      return () => clearInterval(timer);
    } else if (status === 'completed') {
      setAnimatedProgress(100);
    }
  }, [status, currentStepId, steps]);

  // Auto-complete callback
  useEffect(() => {
    if (status === 'completed') {
      onComplete?.();
    }
  }, [status, onComplete]);

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const progressPercent = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>
          {status === 'completed' ? '✅ 生成完成' : status === 'error' ? '❌ 生成失败' : '🔄 正在生成...'}
        </span>
        <span className={styles.percentage}>{Math.round(progressPercent)}%</span>
      </div>

      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill} 
          style={{ width: `${status === 'completed' ? 100 : animatedProgress}%` }}
        />
      </div>

      <ul className={styles.stepList}>
        {steps.map(step => (
          <li 
            key={step.id} 
            className={`${styles.step} ${step.status === 'processing' ? styles.processing : ''} ${step.status === 'completed' ? styles.completed : ''} ${step.status === 'error' ? styles.error : ''}`}
          >
            <span className={styles.stepIcon}>
              {step.status === 'completed' ? '✓' : step.status === 'processing' ? '⟳' : step.status === 'error' ? '✗' : '○'}
            </span>
            <span className={styles.stepLabel}>{step.label}</span>
            {step.status === 'processing' && step.progress !== undefined && (
              <span className={styles.stepProgress}>{step.progress}%</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GenerationProgress;
