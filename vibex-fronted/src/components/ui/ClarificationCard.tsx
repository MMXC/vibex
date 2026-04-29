'use client';

import React, { useState, useEffect } from 'react';
import styles from './ClarificationCard.module.css';

export interface ClarificationQuestion {
  id: string;
  question: string;
  options?: string[];
  type: 'choice' | 'text';
  required?: boolean;
}

export interface ClarificationCardProps {
  /** 问题列表 */
  questions: ClarificationQuestion[];
  /** 确认回调 */
  onConfirm: (answers: Record<string, string>) => void;
  /** 跳过回调 */
  onSkip?: () => void;
  /** 标题 */
  title?: string;
  /** 展示变体：inline 内嵌在对话流中，modal 作为弹窗内容 */
  variant?: 'inline' | 'modal';
  /** 初始答案（可用于回填） */
  initialAnswers?: Record<string, string>;
}

/**
 * ClarificationCard — 澄清问题卡片组件
 *
 * 从 ClarificationDialog 提取的纯卡片 UI，支持 inline/modal 两种 variant。
 * ClarificationDialog 内部可复用此卡片，对话流也可直接内嵌。
 *
 * E2-S1
 */
export function ClarificationCard({
  questions,
  onConfirm,
  onSkip,
  title = '请确认以下信息',
  variant = 'modal',
  initialAnswers = {},
}: ClarificationCardProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // 重置状态（当 questions 变化时）
  useEffect(() => {
    setAnswers(initialAnswers);
    setCurrentIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  if (!questions || questions.length === 0) {
    return (
      <div className={`${styles.card} ${styles[variant]}`}>
        <p className={styles.empty}>暂无需要澄清的问题</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;
  const isLastQuestion = currentIndex === questions.length - 1;
  const canSubmit = questions
    .filter((q) => q.required)
    .every((q) => answers[q.id]);

  const handleOptionSelect = (option: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));
  };

  const handleTextChange = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setIsAnimating(false);
    }, 150);
  };

  const handlePrev = () => {
    if (isAnimating || currentIndex === 0) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => prev - 1);
      setIsAnimating(false);
    }, 150);
  };

  const handleConfirm = () => {
    onConfirm(answers);
  };

  return (
    <div className={`${styles.card} ${styles[variant]}`}>
      {/* 进度指示器 */}
      {questions.length > 1 && (
        <div className={styles.progress}>
          {questions.map((_, index) => (
            <div
              key={index}
              className={`${styles.progressDot} ${
                index < currentIndex
                  ? styles.completed
                  : index === currentIndex
                    ? styles.current
                    : ''
              }`}
            />
          ))}
        </div>
      )}

      {/* 标题 */}
      <h3 className={styles.title}>{title}</h3>

      {/* 问题内容 */}
      <div className={`${styles.content} ${isAnimating ? styles.animating : ''}`}>
        <p className={styles.question}>
          {currentQuestion.question}
          {currentQuestion.required && (
            <span className={styles.required}>*</span>
          )}
        </p>

        {currentQuestion.type === 'choice' && currentQuestion.options && (
          <div className={styles.options}>
            {currentQuestion.options.map((option) => (
              <button
                key={option}
                className={`${styles.option} ${
                  answers[currentQuestion.id] === option ? styles.selected : ''
                }`}
                onClick={() => handleOptionSelect(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {currentQuestion.type === 'text' && (
          <input
            type="text"
            className={styles.textInput}
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="请输入..."
            autoFocus
          />
        )}
      </div>

      {/* 操作按钮 */}
      <div className={styles.actions}>
        <div className={styles.leftActions}>
          {onSkip && (
            <button className={styles.skipButton} onClick={onSkip} type="button">
              跳过
            </button>
          )}
        </div>

        <div className={styles.rightActions}>
          {currentIndex > 0 && (
            <button className={styles.backButton} onClick={handlePrev} type="button">
              上一步
            </button>
          )}

          {isLastQuestion ? (
            <button
              className={styles.confirmButton}
              onClick={handleConfirm}
              disabled={!canSubmit}
              type="button"
            >
              确认
            </button>
          ) : (
            <button
              className={styles.nextButton}
              onClick={handleNext}
              disabled={
                !!(currentQuestion.required && !answers[currentQuestion.id])
              }
              type="button"
            >
              下一步
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
