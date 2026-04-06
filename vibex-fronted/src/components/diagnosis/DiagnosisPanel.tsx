/**
 * DiagnosisPanel - 诊断面板组件
 */

'use client';

import { useState } from 'react';
import { DiagnosisResult, DIMENSION_LABELS, DimensionName } from '@/services/diagnosis/types';
import ScoreDisplay from './ScoreDisplay';
import SuggestionList from './SuggestionList';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

interface DiagnosisPanelProps {
  onAnalyze?: (text: string) => void;
  onOptimize?: (text: string) => void;
}

export default function DiagnosisPanel({ onAnalyze, onOptimize }: DiagnosisPanelProps) {
  const [requirementText, setRequirementText] = useState('');
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleAnalyze = async () => {
    if (!requirementText.trim()) return;
    
    setIsAnalyzing(true);
    try {
      // 导入本地诊断
      const { diagnoser } = await import('@/services/diagnosis');
      const diagnosis = diagnoser.diagnose(requirementText);
      setResult(diagnosis);
      onAnalyze?.(requirementText);
    } catch (error) {
      canvasLogger.default.error('Diagnosis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOptimize = async () => {
    if (!requirementText.trim()) return;
    
    setIsOptimizing(true);
    try {
      const { optimizer } = await import('@/services/diagnosis');
      const optResult = await optimizer.optimize({ requirementText });
      setRequirementText(optResult.improvedText);
      // 更新诊断结果
      const { diagnoser } = await import('@/services/diagnosis');
      setResult(diagnoser.diagnose(optResult.improvedText));
      onOptimize?.(optResult.improvedText);
    } catch (error) {
      canvasLogger.default.error('Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="diagnosis-panel">
      <h2>智能需求诊断</h2>
      
      <div className="input-section">
        <textarea
          value={requirementText}
          onChange={(e) => setRequirementText(e.target.value)}
          placeholder="请输入需求描述..."
          rows={6}
        />
      </div>

      <div className="actions">
        <button 
          onClick={handleAnalyze}
          disabled={isAnalyzing || !requirementText.trim()}
          className="analyze-btn"
        >
          {isAnalyzing ? '分析中...' : '开始诊断'}
        </button>
        
        <button 
          onClick={handleOptimize}
          disabled={isOptimizing || !requirementText.trim()}
          className="optimize-btn"
        >
          {isOptimizing ? '优化中...' : '一键优化'}
        </button>
      </div>

      {result && (
        <div className="result-section">
          <ScoreDisplay result={result} />
          <SuggestionList suggestions={result.suggestions} />
        </div>
      )}

      <style jsx>{`
        .diagnosis-panel {
          padding: 1rem;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: white;
        }

        h2 {
          margin: 0 0 1rem 0;
          font-size: 1.25rem;
        }

        .input-section textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.9rem;
          resize: vertical;
        }

        .actions {
          display: flex;
          gap: 0.5rem;
          margin: 1rem 0;
        }

        button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .analyze-btn {
          background: #1976d2;
          color: white;
        }

        .optimize-btn {
          background: #4caf50;
          color: white;
        }

        .result-section {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }
      `}</style>
    </div>
  );
}
