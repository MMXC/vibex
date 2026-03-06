'use client'

import { useState, useEffect, useRef } from 'react'
import { validateRequirement, ValidationResult } from '@/lib/validator/requirementValidator'
import styles from './RequirementScore.module.css'

interface RequirementScoreProps {
  value: string
  onScoreChange?: (result: ValidationResult) => void
}

export function RequirementScore({ value, onScoreChange }: RequirementScoreProps) {
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (!value.trim()) {
      setResult(null)
      return
    }

    setIsAnalyzing(true)
    debounceTimer.current = setTimeout(async () => {
      const validationResult = await validateRequirement(value)
      setResult(validationResult)
      onScoreChange?.(validationResult)
      setIsAnalyzing(false)
    }, 500)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [value, onScoreChange])

  if (!result && !isAnalyzing) {
    return null
  }

  const getLevelColor = (level: ValidationResult['level']) => {
    switch (level) {
      case 'excellent': return 'var(--color-success)'
      case 'high': return 'var(--color-primary)'
      case 'medium': return 'var(--color-warning)'
      case 'low': return 'var(--color-error)'
    }
  }

  const getLevelLabel = (level: ValidationResult['level']) => {
    switch (level) {
      case 'excellent': return '优秀'
      case 'high': return '良好'
      case 'medium': return '一般'
      case 'low': return '需改进'
    }
  }

  return (
    <div className={styles.container}>
      {/* Score Ring */}
      <div className={styles.scoreSection}>
        <div 
          className={styles.scoreRing}
          style={{ 
            '--score': result?.score || 0,
            '--color': getLevelColor(result?.level || 'low'),
          } as React.CSSProperties}
        >
          <span className={styles.scoreValue}>
            {isAnalyzing ? '...' : result?.score || 0}
          </span>
          <span className={styles.scoreLabel}>
            {isAnalyzing ? '分析中' : getLevelLabel(result?.level || 'low')}
          </span>
        </div>
      </div>

      {/* Keywords */}
      {result && result.keywords.length > 0 && (
        <div className={styles.keywordsSection}>
          <span className={styles.sectionLabel}>关键词:</span>
          <div className={styles.keywords}>
            {result.keywords.slice(0, 6).map((kw, idx) => (
              <span 
                key={idx} 
                className={styles.keyword}
                data-category={kw.category}
              >
                {kw.word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Issues */}
      {result && result.issues.length > 0 && (
        <div className={styles.issuesSection}>
          {result.issues.map((issue, idx) => (
            <div key={idx} className={styles.issue} data-type={issue.type}>
              <span className={styles.issueIcon}>
                {issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️'}
              </span>
              <span>{issue.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {result && result.suggestions.length > 0 && (
        <div className={styles.suggestionsSection}>
          <span className={styles.sectionLabel}>建议:</span>
          <ul className={styles.suggestions}>
            {result.suggestions.map((suggestion, idx) => (
              <li key={idx}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
