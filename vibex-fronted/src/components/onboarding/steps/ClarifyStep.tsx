/**
 * ClarifyStep - AI 需求澄清步骤组件
 * 
 * P003 S-P3.2: AI 辅助需求解析
 * 步骤3 (clarify): 调用 AI 解析需求，展示结构化结果
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOnboardingStore } from '@/stores/onboarding';
import styles from './StepContent.module.css';

/** P003: localStorage key for requirement text (written by InputStep) */
const REQUIREMENT_STORAGE_KEY = 'vibex:onboarding:requirement';

export interface StepContentProps {
  onNext: () => void;
  onPrev?: () => void;
  onSkip: () => void;
  isLastStep?: boolean;
}

/** P003: AI 解析结果类型 */
interface ClarifyResult {
  role: string | null;
  goal: string | null;
  constraints: string[];
  raw: string;
  parsed: { role: string; goal: string; constraints: string[] } | null;
  guidance?: string;
}

export function ClarifyStep({ onNext, onPrev, onSkip }: StepContentProps) {
  const setClarifyResult = useOnboardingStore((s) => s.setClarifyResult);
  const storedRequirement = useOnboardingStore((s) => s.requirementText);

  const [requirement, setRequirement] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ClarifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load requirement from store or localStorage
  useEffect(() => {
    const fromStore = storedRequirement;
    if (fromStore) {
      setRequirement(fromStore);
    } else {
      try {
        const fromLs = localStorage.getItem(REQUIREMENT_STORAGE_KEY);
        if (fromLs) setRequirement(fromLs);
      } catch {
        // ignore
      }
    }
  }, [storedRequirement]);

  const handleAnalyze = async () => {
    if (!requirement.trim()) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/ai/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirement }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as ClarifyResult;
      setResult(data);
      setClarifyResult(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知错误';
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleNext = () => {
    if (result) {
      setClarifyResult(result);
    }
    onNext();
  };

  return (
    <div className={styles.container} data-testid="onboarding-step-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.content}
      >
        <div className={styles.icon}>🤖</div>
        <h2 className={styles.title}>AI 智能澄清</h2>
        <p className={styles.subtitle}>
          {requirement
            ? 'AI 将分析你的需求，提取角色、目标和约束'
            : '请先在「描述需求」中输入内容'}
        </p>

        {/* P003: 需求回显 + 编辑 */}
        {requirement && (
          <div className={styles.clarifyRequirement}>
            <span className={styles.clarifyReqLabel}>你的需求：</span>
            <span className={styles.clarifyReqText}>{requirement}</span>
          </div>
        )}

        {/* P003: AI 分析按钮 */}
        {requirement && !result && !analyzing && (
          <button
            className={styles.analyzeBtn}
            onClick={handleAnalyze}
            data-testid="onboarding-ai-analyze-btn"
          >
            ✨ AI 分析需求
          </button>
        )}

        {/* P003: Loading 状态 */}
        {analyzing && (
          <div className={styles.analyzeLoading}>
            <div className={styles.spinner} />
            <span>AI 正在分析中...</span>
          </div>
        )}

        {/* P003: 错误提示 */}
        {error && (
          <div className={styles.clarifyError}>
            <span>⚠️ {error}</span>
            <button className={styles.retryBtn} onClick={handleAnalyze}>
              重试
            </button>
          </div>
        )}

        {/* P003: AI 解析结果展示 */}
        {result && !analyzing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.clarifyResult}
          >
            {/* 引导提示（降级场景） */}
            {result.guidance && (
              <div className={styles.clarifyGuidance}>{result.guidance}</div>
            )}

            {/* 角色 */}
            {result.parsed?.role && (
              <div className={styles.clarifyItem}>
                <span className={styles.clarifyLabel}>👤 角色</span>
                <span className={styles.clarifyValue}>{result.parsed.role}</span>
              </div>
            )}

            {/* 目标 */}
            {result.parsed?.goal && (
              <div className={styles.clarifyItem}>
                <span className={styles.clarifyLabel}>🎯 目标</span>
                <span className={styles.clarifyValue}>{result.parsed.goal}</span>
              </div>
            )}

            {/* 约束条件 */}
            {result.parsed?.constraints && result.parsed.constraints.length > 0 && (
              <div className={styles.clarifyItem}>
                <span className={styles.clarifyLabel}>🔒 约束条件</span>
                <ul className={styles.clarifyConstraints}>
                  {result.parsed.constraints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 降级模式提示 */}
            {!result.parsed && (
              <div className={styles.clarifyFallback}>
                <span>AI 暂未解析，可手动确认后继续</span>
              </div>
            )}

            {/* 重新分析 */}
            <button
              className={styles.reAnalyzeBtn}
              onClick={handleAnalyze}
            >
              重新分析
            </button>
          </motion.div>
        )}

        <div className={styles.actions}>
          <button className={styles.backBtn} onClick={onPrev} data-testid="onboarding-step-2-prev-btn">
            ← 上一步
          </button>
          <div className={styles.rightActions}>
            <button className={styles.skipBtn} onClick={onSkip} data-testid="onboarding-step-2-skip-btn">
              跳过
            </button>
            <button
              className={styles.nextBtn}
              onClick={handleNext}
              data-testid="onboarding-step-2-next-btn"
            >
              下一步 →
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ClarifyStep;
