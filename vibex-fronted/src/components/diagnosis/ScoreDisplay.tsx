/**
 * ScoreDisplay Component
 * Displays overall score and grade
 * @module components/diagnosis/ScoreDisplay
 */

import React from 'react'

interface ScoreDisplayProps {
  overallScore: number
  grade: 'A' | 'B' | 'C' | 'D'
}

const gradeConfig = {
  A: {
    label: '优秀',
    color: '#10b981', // green
    bgColor: '#d1fae5',
  },
  B: {
    label: '良好',
    color: '#3b82f6', // blue
    bgColor: '#dbeafe',
  },
  C: {
    label: '一般',
    color: '#f59e0b', // amber
    bgColor: '#fef3c7',
  },
  D: {
    label: '需改进',
    color: '#ef4444', // red
    bgColor: '#fee2e2',
  },
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ overallScore, grade }) => {
  const config = gradeConfig[grade]

  return (
    <div className="score-display">
      <div className="score-display__score">
        <span 
          className="score-value"
          style={{ color: config.color }}
        >
          {overallScore}
        </span>
        <span className="score-max">/100</span>
      </div>
      <div 
        className="score-display__grade"
        style={{ 
          backgroundColor: config.bgColor,
          color: config.color,
        }}
      >
        <span className="grade-letter">{grade}</span>
        <span className="grade-label">{config.label}</span>
      </div>
    </div>
  )
}

export default ScoreDisplay
