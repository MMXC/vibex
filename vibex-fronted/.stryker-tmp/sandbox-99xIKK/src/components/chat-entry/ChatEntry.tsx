/**
 * Chat Entry Component
 * 首页对话入口组件
 */
// @ts-nocheck


'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ChatEntry.module.css';

interface ChatEntryProps {
  onSubmit?: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export function ChatEntry({
  onSubmit,
  placeholder = '描述你的需求，例如：创建一个用户管理系统...',
  maxLength = 5000,
}: ChatEntryProps) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    
    // 空输入检查
    if (!trimmed) {
      setError('请输入需求描述');
      return;
    }
    
    // 超长输入检查
    if (trimmed.length > maxLength) {
      setError(`输入内容过长，请限制在 ${maxLength} 字符以内`);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit(trimmed);
      } else {
        // 默认行为：跳转到设计页面
        router.push(`/design?requirement=${encodeURIComponent(trimmed)}`);
      }
    } catch (err) {
      setError('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }, [input, maxLength, onSubmit, router]);

  const handleClear = useCallback(() => {
    setInput('');
    setError(null);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>开始你的项目</h2>
        <p className={styles.subtitle}>
          描述你的需求，AI 将帮助你完成 DDD 建模
        </p>
      </div>

      <div className={styles.inputWrapper}>
        <textarea
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={isSubmitting}
          rows={4}
          aria-label="需求描述"
        />
        
        <div className={styles.actions}>
          <span className={styles.counter}>
            {input.length} / {maxLength}
          </span>
          
          <div className={styles.buttons}>
            {input && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={handleClear}
                disabled={isSubmitting}
              >
                清空
              </button>
            )}
            
            <button
              type="button"
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={isSubmitting || !input.trim()}
            >
              {isSubmitting ? '提交中...' : '开始设计'}
            </button>
          </div>
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>

      <div className={styles.examples}>
        <h3 className={styles.examplesTitle}>示例需求</h3>
        <ul className={styles.examplesList}>
          <li>
            <button
              type="button"
              className={styles.exampleButton}
              onClick={() => setInput('创建一个用户管理系统，包含用户注册、登录、个人资料管理功能')}
            >
              用户管理系统
            </button>
          </li>
          <li>
            <button
              type="button"
              className={styles.exampleButton}
              onClick={() => setInput('开发一个电商平台，支持商品展示、购物车、订单管理、支付功能')}
            >
              电商平台
            </button>
          </li>
          <li>
            <button
              type="button"
              className={styles.exampleButton}
              onClick={() => setInput('设计一个博客系统，支持文章发布、分类、评论、标签功能')}
            >
              博客系统
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default ChatEntry;
