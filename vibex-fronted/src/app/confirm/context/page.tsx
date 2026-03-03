'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../confirm.module.css'
import { useConfirmationStore } from '@/stores/confirmationStore'

export default function ContextPage() {
  const router = useRouter()
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
  } = useConfirmationStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Mock data for demo
  useEffect(() => {
    if (boundedContexts.length === 0) {
      // Generate mock bounded contexts based on requirement
      setBoundedContexts([
        {
          id: 'ctx-1',
          name: '用户管理',
          description: '管理用户注册、登录、个人信息',
          type: 'core',
          relationships: []
        },
        {
          id: 'ctx-2',
          name: '课程管理',
          description: '管理课程内容、章节、课时',
          type: 'core',
          relationships: []
        },
        {
          id: 'ctx-3',
          name: '订单管理',
          description: '管理订单创建、支付、取消',
          type: 'core',
          relationships: []
        },
        {
          id: 'ctx-4',
          name: '支付',
          description: '处理支付、退款',
          type: 'supporting',
          relationships: []
        },
      ])
      setContextMermaidCode(`graph TD
  UC[用户管理]:::core
  CM[课程管理]:::core
  OM[订单管理]:::core
  PAY[支付]:::supporting
  
  OM --> PAY
  CM --> UC
  OM --> CM
  
  classDef core fill:#4ade80,stroke:#22c55e,color:#1a1a2e
  classDef supporting fill:#60a5fa,stroke:#3b82f6,color:#1a1a2e`)
    }
  }, [])

  const handleContextToggle = (id: string) => {
    if (selectedContextIds.includes(id)) {
      setSelectedContextIds(selectedContextIds.filter(i => i !== id))
    } else {
      setSelectedContextIds([...selectedContextIds, id])
    }
  }

  const handleConfirm = () => {
    if (selectedContextIds.length === 0) {
      setError('请至少选择一个核心上下文')
      return
    }
    goToNextStep()
    router.push('/confirm/model')
  }

  const typeLabels = {
    core: '核心上下文',
    supporting: '支撑上下文',
    generic: '通用上下文',
    external: '外部系统',
  }

  const typeColors = {
    core: '#4ade80',
    supporting: '#60a5fa',
    generic: '#a78bfa',
    external: '#f87171',
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Step 1: 限界上下文图确认</h1>
        <p className={styles.description}>
          基于您的需求，AI 生成了以下限界上下文。请选择您希望保留的核心上下文。
        </p>

        <div className={styles.steps}>
          <div className={`${styles.step} ${styles.completed}`}>
            <span className={styles.stepNumber}>✓</span>
            <span className={styles.stepLabel}>需求输入</span>
          </div>
          <div className={styles.stepConnector} />
          <div className={`${styles.step} ${styles.active}`}>
            <span className={styles.stepNumber}>2</span>
            <span className={styles.stepLabel}>限界上下文</span>
          </div>
          <div className={styles.stepConnector} />
          <div className={styles.step}>
            <span className={styles.stepNumber}>3</span>
            <span className={styles.stepLabel}>领域模型</span>
          </div>
          <div className={styles.stepConnector} />
          <div className={styles.step}>
            <span className={styles.stepNumber}>4</span>
            <span className={styles.stepLabel}>业务流程</span>
          </div>
        </div>

        <div className={styles.diagramSection}>
          <h3 className={styles.sectionTitle}>限界上下文图</h3>
          <div className={styles.mermaidPreview}>
            <pre className={styles.mermaidCode}>{contextMermaidCode}</pre>
          </div>
        </div>

        <div className={styles.contextList}>
          <h3 className={styles.sectionTitle}>选择核心上下文</h3>
          <div className={styles.contextGrid}>
            {boundedContexts.map((ctx) => (
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
              goToPreviousStep()
              router.push('/confirm')
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
  )
}
