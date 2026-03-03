'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './confirm.module.css'
import { useConfirmationStore, BoundedContext } from '@/stores/confirmationStore'
import { generateBoundedContext } from '@/services/api'
import { ConfirmationSteps } from '@/components/ui/ConfirmationSteps'

export default function ConfirmPage() {
  const router = useRouter()
  const { 
    requirementText, 
    setRequirementText, 
    setBoundedContexts,
    setContextMermaidCode,
    goToNextStep,
    currentStep,
  } = useConfirmationStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!requirementText.trim()) {
      setError('请输入需求描述')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Call AI API to generate bounded contexts
      const response = await generateBoundedContext(requirementText)
      
      if (response.success && response.boundedContexts) {
        // Store the generated bounded contexts
        setBoundedContexts(response.boundedContexts)
        
        // Store the mermaid code if provided
        if (response.mermaidCode) {
          setContextMermaidCode(response.mermaidCode)
        }
        
        // Navigate to the context page
        goToNextStep()
        router.push('/confirm/context')
      } else {
        throw new Error(response.error || '生成失败')
      }
    } catch (err: unknown) {
      console.error('Failed to generate bounded contexts:', err)
      setError(err instanceof Error ? err.message : '生成失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>{currentStep === 'input' ? 'Step 1: 需求输入' : '需求确认流程'}</h1>
        <p className={styles.description}>
          描述您的产品需求，AI 将协助您完成限界上下文图、领域模型和业务流程图的设计。
        </p>

        <ConfirmationSteps currentStep={currentStep} className={styles.steps} />

        <div className={styles.inputSection}>
          <label htmlFor="requirement" className={styles.label}>
            请描述您的产品需求
          </label>
          <textarea
            id="requirement"
            className={styles.textarea}
            placeholder="例如：开发一个在线教育平台，包含用户管理、课程管理、订单管理、支付等功能..."
            value={requirementText}
            onChange={(e) => setRequirementText(e.target.value)}
            rows={8}
          />
          {error && <p className={styles.error}>{error}</p>}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.primaryButton}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '生成中...' : '开始生成'}
          </button>
        </div>
      </div>
    </div>
  )
}
