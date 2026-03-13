/**
 * SuggestionList Component
 * Displays improvement suggestions and missing info
 * @module components/diagnosis/SuggestionList
 */

import React from 'react'
import { Suggestion, MissingInfo } from '@/services/api/diagnosis'

interface SuggestionListProps {
  suggestions: Suggestion[]
  missingInfo: MissingInfo[]
  onOptimize?: () => void
}

const SuggestionList: React.FC<SuggestionListProps> = ({
  suggestions,
  missingInfo,
  onOptimize,
}) => {
  return (
    <div className="suggestion-list">
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="suggestion-section">
          <h4>改进建议</h4>
          <ul className="suggestions">
            {suggestions.map((suggestion, idx) => (
              <li key={idx} className={`suggestion-item suggestion-item--${suggestion.type}`}>
                <span className="suggestion-type">
                  {suggestion.type === 'add' && '➕'}
                  {suggestion.type === 'modify' && '✏️'}
                  {suggestion.type === 'clarify' && '💡'}
                </span>
                <div className="suggestion-content">
                  <span className="suggestion-target">{suggestion.target}</span>
                  <p className="suggestion-description">{suggestion.description}</p>
                  {suggestion.example && (
                    <code className="suggestion-example">{suggestion.example}</code>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Information */}
      {missingInfo.length > 0 && (
        <div className="missing-section">
          <h4>缺失信息</h4>
          <ul className="missing-list">
            {missingInfo.map((missing, idx) => (
              <li key={idx} className={`missing-item missing-item--${missing.importance}`}>
                <span className="missing-domain">{missing.domain}</span>
                <span className="missing-item-name">{missing.item}</span>
                <span className={`missing-importance importance-${missing.importance}`}>
                  {missing.importance === 'high' && '高'}
                  {missing.importance === 'medium' && '中'}
                  {missing.importance === 'low' && '低'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Optimize Button */}
      {onOptimize && (suggestions.length > 0 || missingInfo.length > 0) && (
        <div className="optimize-action">
          <button onClick={onOptimize} className="btn-optimize">
            🚀 一键优化
          </button>
        </div>
      )}
    </div>
  )
}

export default SuggestionList
