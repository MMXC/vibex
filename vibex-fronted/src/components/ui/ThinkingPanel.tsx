'use client'

import { useState, useEffect } from 'react'
import { DDDStreamStatus, ThinkingStep } from '@/hooks/useDDDStream'
import { BoundedContext } from '@/services/api/types/prototype/domain'
import styles from './ThinkingPanel.module.css'

// ==================== Types ====================

export interface ThinkingPanelProps {
  thinkingMessages: ThinkingStep[]
  contexts: BoundedContext[]
  mermaidCode: string
  status: DDDStreamStatus
  errorMessage: string | null
  onAbort?: () => void
  onRetry?: () => void
  onUseDefault?: () => void
}

// ==================== Step Icon ====================

function StepIcon({ step, isActive, isCompleted }: { step: string; isActive: boolean; isCompleted: boolean }) {
  if (isCompleted) {
    return <span className={styles.stepIconCompleted}>✓</span>
  }
  if (isActive) {
    return <span className={styles.stepIconActive}>●</span>
  }
  return <span className={styles.stepIconPending}>○</span>
}

// ==================== Step Label ====================

const stepLabels: Record<string, string> = {
  'analyzing': '分析需求',
  'identifying-core': '识别核心领域',
  'calling-ai': '调用 AI 分析',
}

function getStepLabel(step: string): string {
  return stepLabels[step] || step
}

// ==================== ThinkingSteps ====================

function ThinkingSteps({ steps, currentStep }: { steps: ThinkingStep[]; currentStep: number }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  
  return (
    <div className={styles.stepsContainer}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isActive = index === currentStep
        const isExpanded = expandedIndex === index
        
        return (
          <div
            key={`${step.step}-${index}`}
            className={`${styles.stepItem} ${isActive ? styles.stepActive : ''} ${isCompleted ? styles.stepCompleted : ''}`}
            onClick={() => setExpandedIndex(isExpanded ? null : index)}
          >
            <div className={styles.stepHeader}>
              <StepIcon step={step.step} isActive={isActive} isCompleted={isCompleted} />
              <span className={styles.stepLabel}>{getStepLabel(step.step)}</span>
            </div>
            {isExpanded && (
              <div className={styles.stepContent}>
                {step.message}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ==================== ContextCard ====================

function ContextCard({ context }: { context: BoundedContext }) {
  const typeLabels: Record<string, string> = {
    'core': '核心域',
    'supporting': '支撑域',
    'generic': '通用域',
    'external': '外部系统',
  }
  
  return (
    <div className={`${styles.contextCard} ${styles[`contextCard${context.type.charAt(0).toUpperCase() + context.type.slice(1)}`]}`}>
      <div className={styles.contextHeader}>
        <span className={styles.contextName}>{context.name}</span>
        <span className={`${styles.contextType} ${styles[`contextType${context.type.charAt(0).toUpperCase() + context.type.slice(1)}`]}`}>
          {typeLabels[context.type] || context.type}
        </span>
      </div>
      <div className={styles.contextDescription}>
        {context.description}
      </div>
    </div>
  )
}

// ==================== Main Component ====================

export function ThinkingPanel({
  thinkingMessages,
  contexts,
  status,
  errorMessage,
  onAbort,
  onRetry,
  onUseDefault,
}: ThinkingPanelProps) {
  const [displayedSteps, setDisplayedSteps] = useState<ThinkingStep[]>([])
  
  // F3.2: 打字机动画效果
  useEffect(() => {
    // 防御性检查：确保 thinkingMessages 是数组
    if (!thinkingMessages || !Array.isArray(thinkingMessages)) {
      return
    }
    if (thinkingMessages.length > displayedSteps.length) {
      const latestStep = thinkingMessages[thinkingMessages.length - 1]
      if (!displayedSteps.find(s => s.step === latestStep.step)) {
        setDisplayedSteps(prev => [...prev, latestStep])
      }
    }
  }, [thinkingMessages, displayedSteps])
  
  // Reset displayed steps when status changes
  useEffect(() => {
    if (status === 'idle') {
      setDisplayedSteps([])
    }
  }, [status])
  
  // Progress calculation
  const totalSteps = 3 // analyzing, identifying-core, calling-ai
  const currentStepIndex = displayedSteps.length > 0 
    ? Math.min(displayedSteps.length - 1, totalSteps - 1) 
    : -1
  const progressPercent = currentStepIndex >= 0 
    ? Math.round(((currentStepIndex + 1) / totalSteps) * 100) 
    : 0
  
  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <span className={styles.panelIcon}>🧠</span>
          AI 思考过程
          {status === 'done' && <span className={styles.doneBadge}>✓ 已完成</span>}
        </div>
        
        {/* Status Badge */}
        {status !== 'idle' && status !== 'done' && (
          <button className={styles.abortButton} onClick={onAbort}>
            停止
          </button>
        )}
        {status === 'done' && (
          <span className={styles.completedBadge}>完成</span>
        )}
      </div>
      
      {/* Progress Bar */}
      {(status === 'thinking' || status === 'done') && (
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div 
              className={`${styles.progressFill} ${status === 'done' ? styles.progressFillDone : ''}`}
              style={{ width: status === 'done' ? '100%' : `${progressPercent}%` }}
            />
          </div>
          <span className={styles.progressText}>
            {status === 'done' ? '✓ 100%' : `${progressPercent}%`}
          </span>
        </div>
      )}
      
      {/* Content */}
      <div className={styles.panelContent}>
        {/* Thinking Steps */}
        {displayedSteps.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>分析步骤</div>
            <ThinkingSteps 
              steps={displayedSteps} 
              currentStep={currentStepIndex} 
            />
          </div>
        )}
        
        {/* Context Cards */}
        {contexts && Array.isArray(contexts) && contexts.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              限界上下文 ({contexts.length})
            </div>
            <div className={styles.contextList}>
              {contexts.map(ctx => (
                <ContextCard key={ctx.id} context={ctx} />
              ))}
            </div>
          </div>
        )}
        
        {/* Status Messages */}
        {status === 'thinking' && displayedSteps.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.spinner} />
            <div>正在启动分析...</div>
          </div>
        )}
        
        {status === 'done' && contexts.length === 0 && (
          <div className={styles.emptyState}>
            分析完成，暂无结果
          </div>
        )}
        
        {/* Error State */}
        {status === 'error' && (
          <div className={styles.errorPanel}>
            <div className={styles.errorIcon}>⚠️</div>
            <div className={styles.errorMessage}>
              {errorMessage || '分析失败，请重试'}
            </div>
            <div className={styles.errorActions}>
              {onRetry && (
                <button className={styles.retryButton} onClick={onRetry}>
                  重试
                </button>
              )}
              {onUseDefault && (
                <button className={styles.defaultButton} onClick={onUseDefault}>
                  使用默认值
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Idle State */}
        {status === 'idle' && (
          <div className={styles.idleState}>
            <div className={styles.idleIcon}>💭</div>
            <div>输入需求后点击"开始分析"</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ThinkingPanel
