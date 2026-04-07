/**
 * ScoreDisplay - 评分可视化组件
 */
// @ts-nocheck


import { DiagnosisResult, DIMENSION_LABELS } from '@/services/diagnosis/types';

interface ScoreDisplayProps {
  result: DiagnosisResult;
}

export default function ScoreDisplay({ result }: ScoreDisplayProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return '优秀';
    if (score >= 60) return '良好';
    if (score >= 40) return '待改进';
    return '需优化';
  };

  return (
    <div className="score-display">
      <div className="overall-score">
        <div 
          className="score-circle"
          style={{ borderColor: getScoreColor(result.overallScore) }}
        >
          <span className="score-value">{result.overallScore}</span>
          <span className="score-label">{getScoreLabel(result.overallScore)}</span>
        </div>
        <div className="score-summary">{result.summary}</div>
      </div>

      <div className="dimension-scores">
        {result.dimensions.map((dim) => (
          <div key={dim.name} className="dimension-item">
            <div className="dimension-header">
              <span className="dimension-name">{dim.name}</span>
              <span 
                className="dimension-score"
                style={{ color: getScoreColor(dim.score) }}
              >
                {dim.score}
              </span>
            </div>
            <div className="dimension-bar">
              <div 
                className="dimension-fill"
                style={{ 
                  width: `${dim.score}%`,
                  backgroundColor: getScoreColor(dim.score)
                }}
              />
            </div>
            {dim.issues.length > 0 && (
              <div className="dimension-issues">
                {dim.issues.map((issue, i) => (
                  <span key={i} className="issue-tag">{issue}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .score-display {
          margin-bottom: 1.5rem;
        }

        .overall-score {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .score-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 4px solid;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .score-value {
          font-size: 1.5rem;
          font-weight: bold;
        }

        .score-label {
          font-size: 0.75rem;
          color: #666;
        }

        .score-summary {
          font-size: 1rem;
          color: #333;
        }

        .dimension-scores {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .dimension-item {
          padding: 0.5rem;
          background: #f5f5f5;
          border-radius: 4px;
        }

        .dimension-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.25rem;
        }

        .dimension-name {
          font-weight: 500;
        }

        .dimension-score {
          font-weight: bold;
        }

        .dimension-bar {
          height: 6px;
          background: #e0e0e0;
          border-radius: 3px;
          overflow: hidden;
        }

        .dimension-fill {
          height: 100%;
          transition: width 0.3s;
        }

        .dimension-issues {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          margin-top: 0.5rem;
        }

        .issue-tag {
          font-size: 0.7rem;
          padding: 0.125rem 0.5rem;
          background: #ffcdd2;
          color: #c62828;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
