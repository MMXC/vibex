/**
 * AIDisplay - AI 展示卡片区
 * 规格: 3列网格卡片
 */
// @ts-nocheck

import React from 'react';
import styles from './AIDisplay.module.css';

export interface AIDisplayProps {
  /** 诊断数量 */
  diagnosisCount?: number;
  /** 优化建议数量 */
  optimizeCount?: number;
  /** 对话澄清轮次 */
  clarificationRounds?: number;
  /** 诊断点击 */
  onDiagnose?: () => void;
  /** 优化点击 */
  onOptimize?: () => void;
  /** 对话澄清点击 */
  onClarify?: () => void;
}

export function AIDisplay({
  diagnosisCount = 0,
  optimizeCount = 0,
  clarificationRounds = 0,
  onDiagnose,
  onOptimize,
  onClarify,
}: AIDisplayProps) {
  return (
    <div
      className={styles.display}
      data-testid="ai-display"
    >
      {/* 智能诊断卡片 */}
      <button
        className={styles.card}
        onClick={onDiagnose}
        type="button"
      >
        <span className={styles.icon}>🔍</span>
        <span className={styles.title}>智能诊断</span>
        {diagnosisCount > 0 && (
          <span className={styles.badge}>{diagnosisCount}</span>
        )}
      </button>

      {/* 应用优化卡片 */}
      <button
        className={styles.card}
        onClick={onOptimize}
        type="button"
      >
        <span className={styles.icon}>✨</span>
        <span className={styles.title}>应用优化</span>
        {optimizeCount > 0 && (
          <span className={styles.badge}>{optimizeCount}</span>
        )}
      </button>

      {/* AI对话澄清卡片 */}
      <button
        className={styles.card}
        onClick={onClarify}
        type="button"
      >
        <span className={styles.icon}>💬</span>
        <span className={styles.title}>AI对话澄清</span>
        {clarificationRounds > 0 && (
          <span className={styles.badge}>{clarificationRounds}</span>
        )}
      </button>
    </div>
  );
}

export default AIDisplay;
