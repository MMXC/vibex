'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../confirm.module.css'
import { useConfirmationStore } from '@/stores/confirmationStore'
import { ConfirmationSteps } from '@/components/ui/ConfirmationSteps'
import { generateDomainModel, BoundedContext } from '@/services/api'

export default function ModelPage() {
  const router = useRouter()
  const {
    selectedContextIds,
    boundedContexts,
    domainModels,
    modelMermaidCode,
    setDomainModels,
    setModelMermaidCode,
    goToNextStep,
    goToPreviousStep,
    currentStep,
    requirementText,
  } = useConfirmationStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Generate domain models via API
  useEffect(() => {
    const generateModels = async () => {
      if (selectedContextIds.length > 0 && domainModels.length === 0) {
        setLoading(true)
        setError('')
        
        try {
          // Get selected bounded contexts
          const selectedContexts = boundedContexts.filter(c => selectedContextIds.includes(c.id))
          
          // Call API to generate domain models
          const response = await generateDomainModel(selectedContexts, requirementText)
          
          if (response.success && response.domainModels) {
            setDomainModels(response.domainModels)
            if (response.mermaidCode) {
              setModelMermaidCode(response.mermaidCode)
            }
          } else {
            throw new Error(response.error || '生成失败')
          }
        } catch (err) {
          console.error('Failed to generate domain models:', err)
          // Show error to user - no mock fallback
          setError(err instanceof Error ? err.message : '生成领域模型失败')
        } finally {
          setLoading(false)
        }
      }
    }
    
    generateModels()
  }, [selectedContextIds, boundedContexts, requirementText])

  const typeLabels = {
    aggregate_root: '聚合根',
    entity: '实体',
    value_object: '值对象',
  }

  const typeColors = {
    aggregate_root: '#4ade80',
    entity: '#60a5fa',
    value_object: '#a78bfa',
  }

  const handleConfirm = () => {
    goToNextStep()
    router.push('/confirm/flow')
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Step 3: 领域模型类图确认</h1>
        <p className={styles.description}>
          基于您选择的限界上下文，AI 生成了领域模型类图。请确认。
        </p>

        {error && (
          <div className={styles.error}>
            <p>⚠️ {error}</p>
          </div>
        )}

        <ConfirmationSteps currentStep={currentStep} className={styles.steps} />

        <div className={styles.diagramSection}>
          <h3 className={styles.sectionTitle}>领域模型类图</h3>
          <div className={styles.mermaidPreview}>
            <pre className={styles.mermaidCode}>{modelMermaidCode}</pre>
          </div>
        </div>

        <div className={styles.modelList}>
          <h3 className={styles.sectionTitle}>领域模型详情</h3>
          <div className={styles.modelGrid}>
            {domainModels.map((model) => (
              <div key={model.id} className={styles.modelCard}>
                <div className={styles.modelHeader}>
                  <span
                    className={styles.modelType}
                    style={{ backgroundColor: typeColors[model.type] }}
                  >
                    {typeLabels[model.type]}
                  </span>
                </div>
                <h4 className={styles.modelName}>{model.name}</h4>
                <div className={styles.modelProps}>
                  {model.properties.map((prop, idx) => (
                    <div key={idx} className={styles.modelProp}>
                      <span className={styles.propName}>
                        {prop.name}
                        {prop.required && <span className={styles.required}>*</span>}
                      </span>
                      <span className={styles.propType}>{prop.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.secondaryButton}
            onClick={() => {
              goToPreviousStep()
              router.push('/confirm/context')
            }}
          >
            返回上一步
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
