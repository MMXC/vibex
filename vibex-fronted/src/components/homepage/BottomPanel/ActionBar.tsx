/**
 * ActionBar - 操作按钮栏
 * 规格: 50px 高度，7个按钮
 */
import React from 'react';
import styles from './ActionBar.module.css';

export interface ActionBarProps {
  /** 是否正在生成 */
  isGenerating?: boolean;
  /** AI 询问回调 */
  onAIAsk?: () => void;
  /** 诊断回调 */
  onDiagnose?: () => void;
  /** 优化回调 */
  onOptimize?: () => void;
  /** 历史记录回调 */
  onHistory?: () => void;
  /** 保存回调 */
  onSave?: () => void;
  /** 重新生成回调 */
  onRegenerate?: () => void;
  /** 创建项目回调 */
  onCreateProject?: () => void;
}

export function ActionBar({
  isGenerating = false,
  onAIAsk,
  onDiagnose,
  onOptimize,
  onHistory,
  onSave,
  onRegenerate,
  onCreateProject,
}: ActionBarProps) {
  return (
    <div
      className={styles.actionBar}
      data-testid="action-bar"
      role="toolbar"
      aria-label="操作工具栏"
    >
      {/* 左侧按钮组 */}
      <div className={styles.buttonGroup}>
        <button
          className={styles.btn}
          onClick={onAIAsk}
          disabled={isGenerating}
          title="AI 询问"
          type="button"
        >
          💬 <span>AI询问</span>
        </button>
        <button
          className={styles.btn}
          onClick={onDiagnose}
          disabled={isGenerating}
          title="智能诊断"
          type="button"
        >
          🔍 <span>诊断</span>
        </button>
        <button
          className={styles.btn}
          onClick={onOptimize}
          disabled={isGenerating}
          title="应用优化"
          type="button"
        >
          ✨ <span>优化</span>
        </button>
        <button
          className={styles.btn}
          onClick={onHistory}
          disabled={isGenerating}
          title="历史记录"
          type="button"
        >
          📜 <span>历史</span>
        </button>
      </div>

      {/* 分隔线 */}
      <div className={styles.divider} aria-hidden="true" />

      {/* 右侧按钮组 */}
      <div className={styles.buttonGroup}>
        <button
          className={styles.btn}
          onClick={onSave}
          disabled={isGenerating}
          title="保存草稿"
          type="button"
        >
          💾 <span>保存</span>
        </button>
        <button
          className={styles.btn}
          onClick={onRegenerate}
          disabled={isGenerating}
          title="重新生成"
          type="button"
        >
          🔄 <span>重新生成</span>
        </button>
        <button
          className={`${styles.btn} ${styles.primary}`}
          onClick={onCreateProject}
          disabled={isGenerating}
          title="创建项目"
          type="button"
        >
          📁 <span>创建项目</span>
        </button>
      </div>
    </div>
  );
}

export default ActionBar;
