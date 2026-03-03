'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../confirm.module.css'
import { useConfirmationStore } from '@/stores/confirmationStore'
import { ConfirmationSteps } from '@/components/ui/ConfirmationSteps'

export default function FlowPage() {
  const router = useRouter()
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
  } = useConfirmationStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Generate mock business flow based on domain models
  useEffect(() => {
    if (!businessFlow.states.length && domainModels.length > 0) {
      const states = [
        { id: 'state-1', name: '初始', type: 'initial' as const, description: '开始' },
        { id: 'state-2', name: '处理中', type: 'intermediate' as const, description: '处理中' },
        { id: 'state-3', name: '完成', type: 'final' as const, description: '完成' },
      ]
      
      const transitions = [
        { id: 'trans-1', fromStateId: 'state-1', toStateId: 'state-2', event: '开始处理' },
        { id: 'trans-2', fromStateId: 'state-2', toStateId: 'state-3', event: '处理完成' },
      ]
      
      setBusinessFlow({
        id: 'flow-1',
        name: '业务流程',
        states,
        transitions,
      })
      
      setFlowMermaidCode(`stateDiagram-v2
  [*] --> 初始
  初始 --> 处理中: 开始处理
  处理中 --> 完成: 处理完成
  完成 --> [*]`)
    }
  }, [domainModels])

  const typeLabels = {
    initial: '初始状态',
    intermediate: '中间状态',
    final: '最终状态',
  }

  const typeColors = {
    initial: '#4ade80',
    intermediate: '#60a5fa',
    final: '#a78bfa',
  }

  const handleConfirm = async () => {
    setLoading(true)
    setError('')

    try {
      // Create project
      // TODO: Call API to create project
      
      // For demo, just simulate project creation
      setCreatedProjectId(`project-${Date.now()}`)
      goToNextStep()
      router.push('/confirm/success')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '创建失败，请重试')
    } finally {
      setLoading(false)
    }
  }

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
            <pre className={styles.mermaidCode}>{flowMermaidCode}</pre>
          </div>
        </div>

        <div className={styles.flowList}>
          <h3 className={styles.sectionTitle}>流程状态</h3>
          <div className={styles.flowStates}>
            {businessFlow.states.map((state) => (
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
            {businessFlow.transitions.map((trans) => (
              <div key={trans.id} className={styles.flowTransition}>
                <span>{businessFlow.states.find(s => s.id === trans.fromStateId)?.name}</span>
                <span className={styles.transitionArrow}>→</span>
                <span>{businessFlow.states.find(s => s.id === trans.toStateId)?.name}</span>
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
              goToPreviousStep()
              router.push('/confirm/model')
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
  )
}
