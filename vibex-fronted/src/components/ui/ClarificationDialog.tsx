'use client';

import React, { useState, useEffect } from 'react';
import styles from './ClarificationDialog.module.css';

export interface ClarificationQuestion {
  id: string;
  question: string;
  options?: string[];
  type: 'choice' | 'text';
  required?: boolean;
}

export interface ClarificationDialogProps {
  /** 对话框是否可见 */
  open: boolean;
  /** 澄清问题列表 */
  questions: ClarificationQuestion[];
  /** 确认回调 */
  onConfirm: (answers: Record<string, string>) => void;
  /** 跳过回调 */
  onSkip?: () => void;
  /** 标题 */
  title?: string;
}

export function ClarificationDialog({
  open,
  questions,
  onConfirm,
  onSkip,
  title = '请确认以下信息',
}: ClarificationDialogProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // 重置状态
  useEffect(() => {
    if (open) {
      setAnswers({});
      setCurrentIndex(0);
    }
  }, [open]);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const canSubmit = questions
    .filter(q => q.required)
    .every(q => answers[q.id]);

  const handleOptionSelect = (option: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));
  };

  const handleTextChange = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setIsAnimating(false);
    }, 150);
  };

  const handlePrev = () => {
    if (isAnimating || currentIndex === 0) return;
    setIsAnimating(true);
    
    setTimeout(() => {
      setCurrentIndex(prev => prev - 1);
      setIsAnimating(false);
    }, 150);
  };

  const handleConfirm = () => {
    onConfirm(answers);
  };

  const handleSkip = () => {
    onSkip?.();
  };

  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        {/* 进度指示器 */}
        <div className={styles.progress}>
          {questions.map((_, index) => (
            <div
              key={index}
              className={`${styles.progressDot} ${
                index < currentIndex ? styles.completed :
                index === currentIndex ? styles.current : ''
              }`}
            />
          ))}
        </div>

        {/* 标题 */}
        <h3 className={styles.title}>{title}</h3>

        {/* 问题内容 */}
        <div className={`${styles.content} ${isAnimating ? styles.animating : ''}`}>
          {currentQuestion && (
            <>
              <p className={styles.question}>
                {currentQuestion.question}
                {currentQuestion.required && <span className={styles.required}>*</span>}
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
            </>
          )}
        </div>

        {/* 操作按钮 */}
        <div className={styles.actions}>
          <div className={styles.leftActions}>
            {onSkip && (
              <button
                className={styles.skipButton}
                onClick={handleSkip}
                type="button"
              >
                跳过
              </button>
            )}
          </div>
          
          <div className={styles.rightActions}>
            {currentIndex > 0 && (
              <button
                className={styles.backButton}
                onClick={handlePrev}
                type="button"
              >
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
                disabled={currentQuestion.required && !answers[currentQuestion.id]}
                type="button"
              >
                下一步
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 使用示例的 hooks
export function useClarification() {
  const [isOpen, setIsOpen] = useState(false);
  const [questions, setQuestions] = useState<ClarificationQuestion[]>([]);
  const [resolve, setResolve] = useState<((answers: Record<string, string>) => void) | null>(null);

  const ask = (qs: ClarificationQuestion[]): Promise<Record<string, string>> => {
    return new Promise((resolveFn) => {
      setQuestions(qs);
      setResolve(() => resolveFn);
      setIsOpen(true);
    });
  };

  const handleConfirm = (answers: Record<string, string>) => {
    resolve?.(answers);
    setIsOpen(false);
  };

  const handleSkip = () => {
    resolve?.({});
    setIsOpen(false);
  };

  return {
    isOpen,
    questions,
    ClarificationDialog: () => (
      <ClarificationDialog
        open={isOpen}
        questions={questions}
        onConfirm={handleConfirm}
        onSkip={handleSkip}
      />
    ),
    ask,
  };
}
