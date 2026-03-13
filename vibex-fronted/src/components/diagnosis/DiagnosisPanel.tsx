/**
 * DiagnosisPanel Component
 * Main panel for displaying requirement diagnosis results
 * @module components/diagnosis/DiagnosisPanel
 */

import React from 'react'
import { DiagnosisResult } from '@/services/api/diagnosis'
import ScoreDisplay from './ScoreDisplay'
import RadarChart from './RadarChart'
import SuggestionList from './SuggestionList'

interface DiagnosisPanelProps {
  diagnosis: DiagnosisResult | null
  isLoading?: boolean
  error?: string | null
  onAnalyze?: (text: string) => void
  onOptimize?: () => void
}

const DiagnosisPanel: React.FC<DiagnosisPanelProps> = ({
  diagnosis,
  isLoading = false,
  error = null,
  onAnalyze,
  onOptimize,
}) => {
  if (isLoading) {
    return (
      <div className="diagnosis-panel diagnosis-panel--loading">
        <div className="diagnosis-panel__spinner">
          <div className="spinner"></div>
          <p>正在分析需求...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="diagnosis-panel diagnosis-panel--error">
        <div className="diagnosis-panel__error">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          {onAnalyze && (
            <button onClick={() => onAnalyze('')} className="btn-retry">
              重试
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!diagnosis) {
    return (
      <div className="diagnosis-panel diagnosis-panel--empty">
        <div className="diagnosis-panel__empty">
          <span className="empty-icon">📋</span>
          <p>输入需求文本以获取诊断分析</p>
        </div>
      </div>
    )
  }

  return (
    <div className="diagnosis-panel">
      {/* Score Header */}
      <div className="diagnosis-panel__header">
        <ScoreDisplay
          overallScore={diagnosis.overallScore}
          grade={diagnosis.grade}
        />
      </div>

      {/* Radar Chart */}
      <div className="diagnosis-panel__chart">
        <RadarChart scores={diagnosis.scores} />
      </div>

      {/* Suggestions */}
      <div className="diagnosis-panel__suggestions">
        <SuggestionList
          suggestions={diagnosis.suggestions}
          missingInfo={diagnosis.missingInfo}
          onOptimize={onOptimize}
        />
      </div>

      {/* Identified Domains */}
      {diagnosis.identifiedDomains.length > 0 && (
        <div className="diagnosis-panel__domains">
          <h4>已识别的业务领域</h4>
          <div className="domain-tags">
            {diagnosis.identifiedDomains.map((domain, idx) => (
              <span key={idx} className="domain-tag">
                {domain.name}
                <span className="confidence">
                  {Math.round(domain.confidence * 100)}%
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Similar Cases */}
      {diagnosis.similarCases.length > 0 && (
        <div className="diagnosis-panel__cases">
          <h4>相似案例</h4>
          <div className="case-list">
            {diagnosis.similarCases.map((c, idx) => (
              <div key={idx} className="case-item">
                <span className="case-name">{c.name}</span>
                <span className="case-industry">{c.industry}</span>
                <span className="case-similarity">
                  相似度: {Math.round(c.similarity * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DiagnosisPanel
