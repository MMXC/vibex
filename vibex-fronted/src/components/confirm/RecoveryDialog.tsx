'use client';

import { useState, useEffect } from 'react';
import { useConfirmationStore } from '@/stores/confirmationStore';
import styles from './RecoveryDialog.module.css';

interface RecoveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: () => void;
  onStartFresh: () => void;
}

export function RecoveryDialog({
  isOpen,
  onClose,
  onRestore,
  onStartFresh,
}: RecoveryDialogProps) {
  const [lastSaved, setLastSaved] = useState<string>('');
  const [step, setStep] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const state = useConfirmationStore.getState();
      setStep(state.currentStep);
      
      // Try to get last saved time from localStorage
      try {
        const stored = localStorage.getItem('confirmation-flow-storage');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.state?.requirementText) {
            const date = new Date(parsed.state._lastUpdated || Date.now());
            setLastSaved(date.toLocaleString('zh-CN'));
          }
        }
      } catch (e) {
        console.error('Failed to parse stored state:', e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const stepLabels: Record<string, string> = {
    input: '需求输入',
    context: '上下文分析',
    model: '领域建模',
    flow: '流程设计',
    success: '完成',
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.icon}>💾</div>
        <h2 className={styles.title}>恢复之前进度？</h2>
        
        {lastSaved && (
          <p className={styles.info}>
            检测到您之前保存的进度
            <br />
            <span className={styles.time}>最后保存: {lastSaved}</span>
          </p>
        )}
        
        {step && (
          <p className={styles.step}>
            上次停留在: <strong>{stepLabels[step] || step}</strong>
          </p>
        )}
        
        <div className={styles.actions}>
          <button 
            className={styles.restoreButton}
            onClick={onRestore}
          >
            恢复进度
          </button>
          <button 
            className={styles.freshButton}
            onClick={onStartFresh}
          >
            重新开始
          </button>
        </div>
        
        <button 
          className={styles.closeButton}
          onClick={onClose}
        >
          取消
        </button>
      </div>
    </div>
  );
}

// Hook to manage recovery dialog state
export function useRecoveryDialog() {
  const [showRecovery, setShowRecovery] = useState(false);
  const [hasStoredState, setHasStoredState] = useState(false);
  
  useEffect(() => {
    // Check if there's stored state
    try {
      const stored = localStorage.getItem('confirmation-flow-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if there's actual data to recover
        if (parsed.state?.requirementText || parsed.state?.boundedContexts?.length > 0) {
          setHasStoredState(true);
          setShowRecovery(true);
        }
      }
    } catch (e) {
      console.error('Failed to check stored state:', e);
    }
  }, []);
  
  const handleRestore = () => {
    setShowRecovery(false);
    // State will be automatically rehydrated by Zustand persist
  };
  
  const handleStartFresh = () => {
    // Clear stored state
    try {
      localStorage.removeItem('confirmation-flow-storage');
    } catch (e) {
      console.error('Failed to clear stored state:', e);
    }
    setShowRecovery(false);
    setHasStoredState(false);
  };
  
  return {
    showRecovery,
    hasStoredState,
    setShowRecovery,
    handleRestore,
    handleStartFresh,
  };
}

export default RecoveryDialog;