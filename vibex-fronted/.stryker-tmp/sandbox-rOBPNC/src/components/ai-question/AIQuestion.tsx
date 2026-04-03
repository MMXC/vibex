/**
 * AI Question Component
 * AI 提问组件：显示问题、选项选择、文本输入
 */
// @ts-nocheck


'use client';

import { useState, useCallback } from 'react';
import styles from './AIQuestion.module.css';

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
}

export interface AIQuestionProps {
  question: string;
  options?: QuestionOption[];
  placeholder?: string;
  onAnswer: (answer: string | { optionId: string; text?: string }) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function AIQuestion({
  question,
  options = [],
  placeholder = '请输入你的回答...',
  onAnswer,
  loading = false,
  disabled = false,
}: AIQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOptionSelect = useCallback((optionId: string) => {
    if (disabled || loading) return;
    setSelectedOption(optionId);
  }, [disabled, loading]);

  const handleSubmit = useCallback(async () => {
    if (disabled || loading) return;

    const answer = selectedOption
      ? { optionId: selectedOption, text: textAnswer || undefined }
      : textAnswer;

    if (!answer || (typeof answer === 'string' && !answer.trim())) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onAnswer(answer);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedOption, textAnswer, disabled, loading, onAnswer]);

  const canSubmit = selectedOption || (textAnswer.trim().length > 0);

  return (
    <div className={styles.container}>
      <div className={styles.questionSection}>
        <h3 className={styles.question}>{question}</h3>
      </div>

      {options.length > 0 && (
        <div className={styles.optionsSection}>
          <div className={styles.optionsGrid}>
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`${styles.optionButton} ${
                  selectedOption === option.id ? styles.optionSelected : ''
                }`}
                onClick={() => handleOptionSelect(option.id)}
                disabled={disabled || loading}
              >
                <span className={styles.optionLabel}>{option.label}</span>
                <span className={styles.optionValue}>{option.value}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.inputSection}>
        <textarea
          className={styles.textarea}
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || loading}
          rows={3}
          aria-label="回答输入"
        />
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={!canSubmit || disabled || loading || isSubmitting}
        >
          {loading || isSubmitting ? '提交中...' : '提交回答'}
        </button>
      </div>
    </div>
  );
}

export default AIQuestion;
