/**
 * RadarChart Component
 * Displays scores in a radar chart format
 * @module components/diagnosis/RadarChart
 */

import React from 'react'

interface RadarChartProps {
  scores: {
    completeness: number
    clarity: number
    consistency: number
    feasibility: number
  }
}

interface AxisData {
  key: 'completeness' | 'clarity' | 'consistency' | 'feasibility'
  label: string
  angle: number
}

const axes: AxisData[] = [
  { key: 'completeness', label: '完整性', angle: 0 },
  { key: 'clarity', label: '清晰度', angle: 90 },
  { key: 'consistency', label: '一致性', angle: 180 },
  { key: 'feasibility', label: '可执行性', angle: 270 },
]

// Use string keys to avoid symbol issues
const axisKeys: string[] = ['completeness', 'clarity', 'consistency', 'feasibility']

const RadarChart: React.FC<RadarChartProps> = ({ scores }) => {
  const size = 200
  const center = size / 2
  const radius = 80

  // Convert score to coordinates
  const getPoint = (score: number, angleDeg: number) => {
    const angleRad = (angleDeg - 90) * (Math.PI / 180)
    const distance = (score / 100) * radius
    return {
      x: center + distance * Math.cos(angleRad),
      y: center + distance * Math.sin(angleRad),
    }
  }

  // Generate polygon points
  const polygonPoints = axes
    .map(axis => {
      const point = getPoint(scores[axis.key], axis.angle)
      return `${point.x},${point.y}`
    })
    .join(' ')

  // Generate grid circles
  const grids = [25, 50, 75, 100].map(percent => {
    const r = (percent / 100) * radius
    return { percent, r }
  })

  return (
    <div className="radar-chart">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid circles */}
        {grids.map(grid => (
          <circle
            key={grid.percent}
            cx={center}
            cy={center}
            r={grid.r}
            fill="none"
            stroke="#e5e7eb"
            strokeDasharray="4,4"
          />
        ))}

        {/* Axis lines */}
        {axes.map((axis, idx) => {
          const endPoint = getPoint(100, axis.angle)
          return (
            <line
              key={`axis-${idx}`}
              x1={center}
              y1={center}
              x2={endPoint.x}
              y2={endPoint.y}
              stroke="#e5e7eb"
            />
          )
        })}

        {/* Data polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(59, 130, 246, 0.3)"
          stroke="#3b82f6"
          strokeWidth="2"
        />

        {/* Data points */}
        {axes.map((axis, idx) => {
          const point = getPoint(scores[axis.key], axis.angle)
          return (
            <circle
              key={`point-${idx}`}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#3b82f6"
            />
          )
        })}

        {/* Labels */}
        {axes.map((axis, idx) => {
          const labelPoint = getPoint(115, axis.angle)
          return (
            <text
              key={`label-${idx}`}
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="radar-label"
            >
              {axis.label}
            </text>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="radar-legend">
        {axes.map((axis, idx) => (
          <div key={`legend-${idx}`} className="legend-item">
            <span className="legend-label">{axis.label}</span>
            <span className="legend-value">{scores[axis.key]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RadarChart
