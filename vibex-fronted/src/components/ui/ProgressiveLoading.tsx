/**
 * Progressive Loading Component
 * 渐进式 Loading 状态机
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './ProgressiveLoading.module.css';

export type LoadingPhase = 
  | 'idle'           // 初始状态
  | 'initializing'   // 骨架屏
  | 'processing'      // 进度条
  | 'finalizing'      // 淡入效果
  | 'complete';      // 完成

export interface ProgressiveLoadingProps {
  phase: LoadingPhase;
  progress?: number;        // 0-100
  message?: string;
  onComplete?: () => void;
}

export function ProgressiveLoading({ 
  phase, 
  progress = 0, 
  message = '加载中...',
  onComplete 
}: ProgressiveLoadingProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  // Animate progress changes
  useEffect(() => {
    if (phase === 'processing') {
      const timer = setTimeout(() => {
        setDisplayProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [phase, progress]);

  // Handle completion
  useEffect(() => {
    if (phase === 'complete' && onComplete) {
      const timer = setTimeout(onComplete, 500);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  const getPhaseLabel = () => {
    switch (phase) {
      case 'idle': return '准备中...';
      case 'initializing': return '正在初始化...';
      case 'processing': return message;
      case 'finalizing': return '即将完成...';
      case 'complete': return '完成!';
      default: return message;
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.loader} ${styles[phase]}`}>
        {/* Phase indicator */}
        <div className={styles.phaseIndicator}>
          <span className={styles.phaseDot} />
          <span className={styles.phaseText}>{getPhaseLabel()}</span>
        </div>

        {/* Progress bar */}
        {(phase === 'processing' || phase === 'finalizing') && (
          <div className={styles.progressWrapper}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${displayProgress}%` }}
              />
            </div>
            <span className={styles.percentage}>{Math.round(displayProgress)}%</span>
          </div>
        )}

        {/* Complete state */}
        {phase === 'complete' && (
          <div className={styles.complete}>
            <span className={styles.checkmark}>✓</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Demo component for testing
export function ProgressiveLoadingDemo() {
  const [phase, setPhase] = useState<LoadingPhase>('idle');

  const startLoading = useCallback(() => {
    setPhase('initializing');
    setTimeout(() => setPhase('processing'), 1000);
    setTimeout(() => setPhase('finalizing'), 3000);
    setTimeout(() => setPhase('complete'), 4000);
  }, []);

  return (
    <div>
      <button onClick={startLoading}>Start Loading Demo</button>
      <ProgressiveLoading 
        phase={phase} 
        progress={50}
        message="处理中..."
      />
    </div>
  );
}

export default ProgressiveLoading;
