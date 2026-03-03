'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../confirm.module.css'
import { useConfirmationStore } from '@/stores/confirmationStore'
import { ConfirmationSteps } from '@/components/ui/ConfirmationSteps'

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
  } = useConfirmationStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Generate mock domain models based on selected contexts
  useEffect(() => {
    if (domainModels.length === 0 && selectedContextIds.length > 0) {
      const models: typeof domainModels = []
      
      selectedContextIds.forEach((ctxId, ctxIndex) => {
        const ctx = boundedContexts.find(c => c.id === ctxId)
        if (ctx) {
          // Add aggregate root
          models.push({
            id: `${ctxId}-ar`,
            name: `${ctx.name}聚合根`,
            contextId: ctxId,
            type: 'aggregate_root',
            properties: [
              { name: 'id', type: 'string', required: true, description: '唯一标识' },
              { name: 'createdAt', type: 'datetime', required: true, description: '创建时间' },
            ],
            methods: ['create()', 'update()']
          })
          
          // Add entity
          if (ctxIndex === 0) {
            models.push({
              id: `${ctxId}-entity-1`,
              name: `${ctx.name}实体`,
              contextId: ctxId,
              type: 'entity',
              properties: [
                { name: 'id', type: 'string', required: true, description: '唯一标识' },
              ],
              methods: []
            })
          }
          
          // Add value object
          models.push({
            id: `${ctxId}-vo-1`,
            name: `${ctx.name}值对象`,
            contextId: ctxId,
            type: 'value_object',
            properties: [
              { name: 'value', type: 'string', required: true, description: '值' },
            ],
            methods: []
          })
        }
      })
      
      setDomainModels(models)
      
      // Generate Mermaid code
      const classDefs = models.map(m => {
        const props = m.properties.map(p => `  ${p.name}: ${p.type}`).join('\n')
        const methods = m.methods.map(m => `  +${m}()`).join('\n')
        return `${m.name}{\n${props}\n${methods}\n}`
      }).join('\n')
      
      setModelMermaidCode(`classDiagram
${classDefs}

${models.filter(m => m.type === 'aggregate_root').map(ar => {
  const entities = models.filter(m => m.contextId === ar.contextId && m.type === 'entity')
  return entities.map(e => `${ar.name} --> ${e.name}`).join('\n')
}).join('\n')}`)
    }
  }, [selectedContextIds])

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
