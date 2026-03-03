'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './confirm.module.css'
import { useConfirmationStore } from '@/stores/confirmationStore'

export default function ConfirmPage() {
  const router = useRouter()
  const { requirementText, setRequirementText, goToNextStep } = useConfirmationStore()
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
      // TODO: Call AI API to generate bounded context
      // For now, just navigate to next step
      goToNextStep()
      router.push('/confirm/context')
    } catch (err: any) {
      setError(err.message || '生成失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>需求确认流程</h1>
        <p className={styles.description}>
          描述您的产品需求，AI 将协助您完成限界上下文图、领域模型和业务流程图的设计。
        </p>

        <div className={styles.steps}>
          <div className={`${styles.step} ${styles.active}`}>
            <span className={styles.stepNumber}>1</span>
            <span className={styles.stepLabel}>需求输入</span>
          </div>
          <div className={styles.stepConnector} />
          <div className={styles.step}>
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
