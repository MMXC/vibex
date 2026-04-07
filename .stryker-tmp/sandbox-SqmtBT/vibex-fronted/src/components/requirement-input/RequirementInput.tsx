/**
 * RequirementInput - 统一需求输入组件
 * 整合主页需求输入框和诊断面板功能
 */
// @ts-nocheck


'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDiagnosis } from '@/hooks/diagnosis';
import styles from './RequirementInput.module.css';

export interface RequirementInputProps {
  /** 初始值 */
  initialValue?: string;
  /** 值变更回调 */
  onValueChange?: (value: string) => void;
  /** 生成回调 */
  onGenerate?: (value: string) => void;
  /** 自定义类名 */
  className?: string;
  /** 禁用诊断功能 */
  disableDiagnosis?: boolean;
  /** 禁用优化功能 */
  disableOptimization?: boolean;
}

/**
 * RequirementInput 组件
 * 统一的需求输入组件，支持：
 * - 需求输入
 * - AI 诊断分析
 * - AI 优化建议
 * - 开始生成
 */
export function RequirementInput({
  initialValue = '',
  onValueChange,
  onGenerate,
  className,
  disableDiagnosis = false,
  disableOptimization = false,
}: RequirementInputProps) {
  const [text, setText] = useState(initialValue);

  // 同步外部 initialValue 变化（示例点击等场景）
  useEffect(() => {
    setText(initialValue);
  }, [initialValue]);

  const {
    diagnosis,
    isAnalyzing,
    optimizedText,
    isOptimizing,
    diagnose: runDiagnosis,
    optimize,
    applyOptimization,
    reset,
  } = useDiagnosis();

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setText(newValue);
    onValueChange?.(newValue);
  }, [onValueChange]);

  const handleDiagnose = useCallback(async () => {
    if (text.trim()) {
      await runDiagnosis(text);
    }
  }, [text, runDiagnosis]);

  const handleOptimize = useCallback(async () => {
    if (text.trim()) {
      await optimize();
    }
  }, [text, optimize]);

  const handleApplyOptimization = useCallback(() => {
    if (optimizedText) {
      setText(optimizedText);
      onValueChange?.(optimizedText);
      applyOptimization();
    }
  }, [optimizedText, applyOptimization, onValueChange]);

  const handleGenerate = useCallback(() => {
    if (text.trim()) {
      onGenerate?.(text);
    }
  }, [text, onGenerate]);

  const handleReset = useCallback(() => {
    setText('');
    reset();
    onValueChange?.('');
  }, [reset, onValueChange]);

  const isLoading = isAnalyzing || isOptimizing;

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <textarea
        className={styles.textarea}
        value={text}
        onChange={handleTextChange}
        placeholder="描述你的产品需求，例如：开发一个电商平台，支持商品管理、订单处理和用户系统..."
        rows={6}
        disabled={isLoading}
      />

      <div className={styles.actions}>
        <button
          className={styles.button}
          onClick={handleGenerate}
          disabled={!text.trim() || isLoading}
        >
          ✨ 开始生成
        </button>

        {!disableDiagnosis && (
          <button
            className={styles.buttonSecondary}
            onClick={handleDiagnose}
            disabled={!text.trim() || isLoading || isAnalyzing}
          >
            {isAnalyzing ? '🔄 分析中...' : '🔍 诊断'}
          </button>
        )}

        {!disableOptimization && (
          <button
            className={styles.buttonSecondary}
            onClick={handleOptimize}
            disabled={!text.trim() || isLoading || isOptimizing}
          >
            {isOptimizing ? '🔄 优化中...' : '⚡ 优化'}
          </button>
        )}

        {text.trim() && (
          <button
            className={styles.buttonGhost}
            onClick={handleReset}
            disabled={isLoading}
          >
            清空
          </button>
        )}
      </div>

      {diagnosis && !disableDiagnosis && (
        <div className={styles.result}>
          <div className={styles.resultHeader}>
            <span className={styles.resultTitle}>📊 诊断结果</span>
            <span className={styles.score}>
              综合评分: {diagnosis.overallScore}/100 ({diagnosis.grade})
            </span>
          </div>
          
          {diagnosis.missingInfo && diagnosis.missingInfo.length > 0 && (
            <div className={styles.issuesSection}>
              <span className={styles.issuesLabel}>⚠️ 缺失信息:</span>
              <ul className={styles.issues}>
                {diagnosis.missingInfo.map((info, idx) => (
                  <li key={idx} className={styles.issue}>
                    [{info.domain}] {info.item}: {info.suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {diagnosis.suggestions && diagnosis.suggestions.length > 0 && (
            <div className={styles.suggestions}>
              <span className={styles.suggestionsLabel}>💡 建议:</span>
              {diagnosis.suggestions.map((suggestion, idx) => (
                <span key={idx} className={styles.suggestion}>
                  {suggestion.description}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {optimizedText && !disableOptimization && (
        <div className={styles.optimized}>
          <div className={styles.optimizedHeader}>
            <span className={styles.resultTitle}>⚡ 优化建议</span>
          </div>
          <pre className={styles.optimizedText}>{optimizedText}</pre>
          <div className={styles.optimizedActions}>
            <button
              className={styles.button}
              onClick={handleApplyOptimization}
            >
              应用优化
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RequirementInput;
