/**
 * PlanResult Component
 * Plan 模式结果展示组件
 */
// @ts-nocheck


'use client';

import { useState } from 'react';
import { usePlanBuildStore } from '@/stores/plan-build-store';
import { getComplexityColor, getComplexityLabel } from '@/services/plan/plan-service';
import styles from './PlanResult.module.css';

interface PlanResultProps {
  result: {
    requirementAnalysis: string;
    inferredFeatures: Array<{
      name: string;
      description: string;
      priority: string;
    }>;
    suggestedContexts: Array<{
      name: string;
      description: string;
      priority: string;
    }>;
    risks: string[];
    complexity: 'simple' | 'medium' | 'complex';
    estimatedComplexityScore: number;
  };
  onConfirm?: () => void;
  onAdjust?: () => void;
  className?: string;
}

/**
 * PlanResult 组件
 * 展示 Plan 模式分析结果
 */
export function PlanResult({
  result,
  onConfirm,
  onAdjust,
  className,
}: PlanResultProps) {
  const { isPlanLoading } = usePlanBuildStore();
  const [showDetails, setShowDetails] = useState(false);

  const complexityColor = getComplexityColor(result.complexity);
  const complexityLabel = getComplexityLabel(result.complexity);

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <span className={styles.icon}>📋</span>
        <span className={styles.title}>Plan 模式分析结果</span>
      </div>

      {/* AI 理解展示 */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🤖</span>
          AI 理解
        </div>
        <div className={styles.analysis}>
          {result.requirementAnalysis}
        </div>
      </div>

      {/* 复杂度评分 */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>📊</span>
          复杂度评估
        </div>
        <div className={styles.complexity}>
          <div className={styles.complexityBar}>
            <div 
              className={styles.complexityFill}
              style={{ 
                width: `${result.estimatedComplexityScore}%`,
                backgroundColor: complexityColor,
              }}
            />
          </div>
          <div className={styles.complexityInfo}>
            <span 
              className={styles.complexityScore}
              style={{ color: complexityColor }}
            >
              {result.estimatedComplexityScore}%
            </span>
            <span className={styles.complexityLabel}>
              {complexityLabel}
            </span>
          </div>
        </div>
      </div>

      {/* 推断的功能模块 */}
      {result.inferredFeatures.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>✨</span>
            推断的功能模块
          </div>
          <div className={styles.features}>
            {result.inferredFeatures.map((feature, index) => (
              <div key={index} className={styles.feature}>
                <span className={styles.featureName}>{feature.name}</span>
                <span className={styles.featureDesc}>{feature.description}</span>
                <span className={`${styles.featurePriority} ${styles[`priority${feature.priority.charAt(0).toUpperCase() + feature.priority.slice(1)}`]}`}>
                  {feature.priority === 'high' ? '高' : feature.priority === 'medium' ? '中' : '低'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 风险提示 */}
      {result.risks.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>⚠️</span>
            风险提示
          </div>
          <div className={styles.risks}>
            {result.risks.map((risk, index) => (
              <div key={index} className={styles.risk}>
                {risk}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 建议的限界上下文 */}
      {result.suggestedContexts.length > 0 && (
        <div className={styles.section}>
          <button 
            className={styles.detailsToggle}
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? '▼' : '▶'} 
            查看建议的限界上下文 ({result.suggestedContexts.length})
          </button>
          
          {showDetails && (
            <div className={styles.contexts}>
              {result.suggestedContexts.map((context, index) => (
                <div key={index} className={styles.context}>
                  <span className={styles.contextName}>{context.name}</span>
                  <span className={styles.contextDesc}>{context.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className={styles.actions}>
        <button 
          className={styles.adjustButton}
          onClick={onAdjust}
          disabled={isPlanLoading}
        >
          ✏️ 调整需求
        </button>
        <button 
          className={styles.confirmButton}
          onClick={onConfirm}
          disabled={isPlanLoading}
        >
          ✅ 确认并生成
        </button>
      </div>
    </div>
  );
}

export default PlanResult;
